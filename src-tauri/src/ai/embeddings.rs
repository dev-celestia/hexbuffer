use rig::client::EmbeddingsClient;
use rig::embeddings::EmbeddingModel as RigEmbeddingModel;
use rig::providers::openai;
use rig::vector_store::in_memory_store::InMemoryVectorStore;
use rig::vector_store::{VectorSearchRequest, VectorStoreIndex};

use super::keyring::read_optional_ai_api_key;
use super::providers::EMBEDDINGS_KEY_PROVIDER;
use super::types::AiSettings;
use crate::db::repository::types::MemoryEntry;

/// Upper bound for a single embeddings endpoint round-trip.
const EMBEDDING_TIMEOUT_SECS: u64 = 60;

/// Minimal cosine similarity for a memory entry to be considered relevant
/// (rig's `top_n` returns cosine similarity scores).
pub const CONTEXT_BANK_SIMILARITY_THRESHOLD: f64 = 0.3;
/// Maximum entries injected into a single chat request.
pub const CONTEXT_BANK_MAX_RETRIEVED: usize = 6;

#[derive(Debug, Clone)]
pub struct EmbeddingsConfig {
    pub base_url: String,
    pub model: String,
    pub api_key: Option<String>,
}

impl AiSettings {
    /// Vector search is enabled only when both the endpoint and the model are set.
    /// The key is optional: local endpoints (Ollama, LM Studio) need none.
    pub fn embeddings_config(&self) -> Option<(String, String)> {
        let base_url = self
            .embeddings_base_url
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())?;
        let model = self
            .embeddings_model
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())?;
        Some((
            base_url.trim_end_matches('/').to_string(),
            model.to_string(),
        ))
    }
}

/// Builds the embeddings config, including the optional keyring key for the
/// `embeddings` pseudo-provider.
pub fn resolve_embeddings_config(
    settings: &AiSettings,
    _app: &tauri::AppHandle,
) -> Result<Option<EmbeddingsConfig>, String> {
    let Some((base_url, model)) = settings.embeddings_config() else {
        return Ok(None);
    };

    let api_key = read_optional_ai_api_key(EMBEDDINGS_KEY_PROVIDER)?;
    Ok(Some(EmbeddingsConfig {
        base_url,
        model,
        api_key,
    }))
}

/// Returns true when the embeddings endpoint may be used for a given request: it is a local
/// endpoint (loopback), or the user has enabled third-party AI sharing. Non-local endpoints
/// require the sharing gate so prompts/notes are never sent off-box without consent.
pub fn embeddings_sharing_allowed(settings: &AiSettings, base_url: &str) -> bool {
    super::providers::is_local_ai_url(Some(base_url)) || settings.allow_third_party_ai_sharing
}

/// Builds a rig embedding model against the configured OpenAI-compatible endpoint.
/// `Client::from_url` posts to `{base_url}/embeddings`, which Ollama, LM Studio,
/// OpenAI, OpenRouter and friends all expose.
pub fn build_embedding_model(config: &EmbeddingsConfig) -> openai::EmbeddingModel {
    let key = config.api_key.as_deref().unwrap_or("");
    let openai_client = openai::Client::builder()
        .api_key(key)
        .base_url(&config.base_url)
        .build()
        .expect("build embedding client");
    let model = if config.model.trim().is_empty() {
        "text-embedding-3-small"
    } else {
        config.model.as_str()
    };
    openai_client.embedding_model(model)
}

pub fn vector_to_bytes(vector: &[f64]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(vector.len() * 8);
    for value in vector {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes
}

pub fn bytes_to_vector(bytes: &[u8]) -> Option<Vec<f64>> {
    if !bytes.len().is_multiple_of(8) {
        return None;
    }
    Some(
        bytes
            .as_chunks::<8>()
            .0
            .iter()
            .map(|chunk| f64::from_le_bytes(*chunk))
            .collect(),
    )
}

/// Embeds a batch of texts through the rig embedding model.
pub async fn embed_texts(
    model: &openai::EmbeddingModel,
    texts: Vec<String>,
) -> Result<Vec<Vec<f64>>, String> {
    let embeddings = tokio::time::timeout(
        std::time::Duration::from_secs(EMBEDDING_TIMEOUT_SECS),
        model.embed_texts(texts),
    )
    .await
    .map_err(|_| "Embeddings request timed out.".to_string())?
    .map_err(|e| e.to_string())?;
    Ok(embeddings
        .into_iter()
        .map(|embedding| embedding.vec)
        .collect())
}

/// Embeds a single text through the rig embedding model.
pub async fn embed_text(model: &openai::EmbeddingModel, text: &str) -> Result<Vec<f64>, String> {
    let embedding = tokio::time::timeout(
        std::time::Duration::from_secs(EMBEDDING_TIMEOUT_SECS),
        model.embed_text(text),
    )
    .await
    .map_err(|_| "Embeddings request timed out.".to_string())?
    .map_err(|e| e.to_string())?;
    Ok(embedding.vec)
}

/// Vector search over memory using rig's `InMemoryVectorStore` +
/// `VectorStoreIndex::top_n_ids`: stored vectors are loaded into an in-memory store,
/// the prompt is embedded, and the top cosine-similar entry ids come back.
pub async fn vector_search_memory(
    model: &openai::EmbeddingModel,
    entries: &[MemoryEntry],
    query: &str,
    limit: usize,
) -> Result<Vec<(String, f64)>, String> {
    if entries.is_empty() {
        return Ok(Vec::new());
    }

    let documents = entries.iter().filter_map(|entry| {
        let vec = entry.embedding.as_ref()?.clone();
        Some((
            entry.id.clone(),
            entry.id.clone(),
            vec![rig::embeddings::Embedding {
                document: format!("{}\n{}", entry.title, entry.content),
                vec,
            }],
        ))
    });

    let store = InMemoryVectorStore::from_documents_with_ids(documents);
    let index = store.index(model.clone());

    let search_req = VectorSearchRequest::builder()
        .query(query)
        .samples(limit as u64)
        .build();

    let results = tokio::time::timeout(
        std::time::Duration::from_secs(EMBEDDING_TIMEOUT_SECS),
        index.top_n_ids(search_req),
    )
    .await
    .map_err(|_| "Embeddings vector search timed out.".to_string())?
    .map_err(|e| e.to_string())?;

    Ok(results.into_iter().map(|(score, id)| (id, score)).collect())
}

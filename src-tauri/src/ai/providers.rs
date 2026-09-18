use rig::client::CompletionClient;

pub(crate) const AI_PROVIDERS: [&str; 4] = [
    "deepseek",
    "openai-compatible",
    "anthropic-compatible",
    "embeddings",
];

pub const OPENAI_COMPATIBLE_PROVIDER: &str = "openai-compatible";
pub const ANTHROPIC_COMPATIBLE_PROVIDER: &str = "anthropic-compatible";
pub const ANTHROPIC_PROVIDER: &str = "anthropic";
/// Keyring-only pseudo provider holding the optional memory embeddings key.
/// Not exposed in the frontend provider selector.
pub const EMBEDDINGS_KEY_PROVIDER: &str = "embeddings";

pub fn api_key_env_name(provider: &str) -> Result<&'static str, String> {
    match provider.trim().to_lowercase().as_str() {
        "deepseek" => Ok("DEEPSEEK_API_KEY"),
        "openai-compatible" => Ok("OPENAI_COMPATIBLE_API_KEY"),
        "anthropic" | "anthropic-compatible" => Ok("ANTHROPIC_API_KEY"),
        "embeddings" => Ok("EMBEDDINGS_API_KEY"),
        _ => Err(format!("Unsupported AI provider: {}", provider)),
    }
}

pub(crate) fn normalize_ai_provider(provider: &str) -> Result<&str, String> {
    let provider = provider.trim();
    if provider.eq_ignore_ascii_case("deepseek") {
        Ok("deepseek")
    } else if provider.eq_ignore_ascii_case(OPENAI_COMPATIBLE_PROVIDER) {
        Ok(OPENAI_COMPATIBLE_PROVIDER)
    } else if provider.eq_ignore_ascii_case(ANTHROPIC_COMPATIBLE_PROVIDER)
        || provider.eq_ignore_ascii_case(ANTHROPIC_PROVIDER)
    {
        // `anthropic` is the legacy id for the same wire format, so both normalise to the
        // canonical `anthropic-compatible`.
        Ok(ANTHROPIC_COMPATIBLE_PROVIDER)
    } else if provider == EMBEDDINGS_KEY_PROVIDER {
        Ok(EMBEDDINGS_KEY_PROVIDER)
    } else {
        Err(format!("Unsupported AI provider: {}", provider))
    }
}

pub(crate) fn is_openai_compatible(provider: &str) -> bool {
    provider
        .trim()
        .eq_ignore_ascii_case(OPENAI_COMPATIBLE_PROVIDER)
}

/// True when the configured provider talks to a loopback endpoint, so traffic never leaves the
/// machine and neither third-party sharing consent nor a real API key is needed.
///
/// Deliberately scoped to OpenAI-compatible providers: the Anthropic-compatible path always
/// requires the sharing policy. `chat.rs` and `auto_mark.rs` must both call this — they had
/// drifted apart (auto_mark exempted both wire formats), and the fix that lets an
/// Anthropic-compatible base URL persist would have made that divergence reachable.
pub(crate) fn is_local_ai_endpoint(settings: &super::types::AiSettings) -> bool {
    is_openai_compatible(&settings.provider) && is_local_ai_url(settings.custom_base_url.as_deref())
}

pub(crate) fn is_anthropic(provider: &str) -> bool {
    let trimmed = provider.trim();
    trimmed.eq_ignore_ascii_case(ANTHROPIC_COMPATIBLE_PROVIDER)
        || trimmed.eq_ignore_ascii_case(ANTHROPIC_PROVIDER)
}

/// True only when `url` resolves to a loopback/unspecified host (localhost, 127.0.0.0/8,
/// ::1, 0.0.0.0). Parsing is exact via the `url` crate — no substring matching — so hosts
/// such as `localhost.attacker.example`, `127.0.0.1.attacker.example`, or query-string
/// tricks are never misclassified as local. Unparseable URLs are treated as non-local
/// (fail closed: they require the third-party sharing gate).
pub fn is_local_ai_url(url: Option<&str>) -> bool {
    let Some(url) = url else { return false };
    let Ok(parsed) = url::Url::parse(url.trim()) else {
        return false;
    };
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return false;
    }
    match parsed.host() {
        Some(url::Host::Domain(domain)) => {
            let lower = domain.to_lowercase();
            lower == "localhost" || lower.ends_with(".localhost")
        }
        Some(url::Host::Ipv4(ip)) => ip.is_loopback() || ip.is_unspecified(),
        Some(url::Host::Ipv6(ip)) => {
            ip.is_loopback()
                || ip.is_unspecified()
                || ip
                    .to_ipv4_mapped()
                    .map(|v4| v4.is_loopback() || v4.is_unspecified())
                    .unwrap_or(false)
        }
        None => false,
    }
}

/// Validates that a user-supplied base URL is a well-formed http(s) URL with a host.
/// Returns a normalized (trailing-slash trimmed) URL string on success.
pub fn validate_http_base_url(raw: &str) -> Result<String, String> {
    let trimmed = raw.trim().trim_end_matches('/');
    let parsed = url::Url::parse(trimmed).map_err(|_| {
        "Base URL must be a valid URL (e.g. https://api.openai.com/v1).".to_string()
    })?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("Base URL must use http:// or https://.".to_string());
    }
    if parsed
        .host_str()
        .map(str::trim)
        .unwrap_or_default()
        .is_empty()
    {
        return Err("Base URL must include a host (e.g. https://api.openai.com/v1).".to_string());
    }
    Ok(trimmed.to_string())
}

pub fn create_openai_client(
    config: &super::types::AiConfig,
) -> Result<rig::providers::openai::CompletionsClient, String> {
    let api_key = config
        .api_key
        .clone()
        .or_else(|| std::env::var(api_key_env_name(&config.provider).unwrap_or("")).ok())
        .ok_or_else(|| format!("Missing API key for provider {}", config.provider))?;

    let base_url = if config.provider.to_lowercase() == "deepseek" {
        config
            .base_url
            .clone()
            .unwrap_or_else(|| "https://api.deepseek.com/v1".to_string())
    } else if let Some(ref url) = config.base_url {
        url.clone()
    } else {
        "https://api.openai.com/v1".to_string()
    };

    rig::providers::openai::Client::builder()
        .api_key(&api_key)
        .base_url(&base_url)
        .build()
        .map(|client| client.completions_api())
        .map_err(|e| e.to_string())
}

pub fn create_anthropic_client(
    config: &super::types::AiConfig,
) -> Result<rig::providers::anthropic::Client, String> {
    let api_key = config
        .api_key
        .clone()
        .or_else(|| std::env::var(api_key_env_name(&config.provider).unwrap_or("")).ok())
        .ok_or_else(|| format!("Missing API key for provider {}", config.provider))?;

    let base_url = if let Some(ref url) = config.base_url {
        let trimmed = url.trim();
        if trimmed.is_empty() {
            "https://api.anthropic.com".to_string()
        } else {
            trimmed.to_string()
        }
    } else {
        "https://api.anthropic.com".to_string()
    };

    rig::providers::anthropic::Client::builder()
        .api_key(&api_key)
        .base_url(&base_url)
        .build()
        .map_err(|e| e.to_string())
}

#[derive(Clone)]
pub enum AnyCompletionModel {
    OpenAi(rig::providers::openai::completion::CompletionModel),
    Anthropic(rig::providers::anthropic::completion::CompletionModel),
}

impl rig::completion::CompletionModel for AnyCompletionModel {
    async fn completion(
        &self,
        request: rig::completion::CompletionRequest,
    ) -> Result<rig::completion::CompletionResponse, rig::completion::CompletionError> {
        match self {
            AnyCompletionModel::OpenAi(m) => m.completion(request).await,
            AnyCompletionModel::Anthropic(m) => m.completion(request).await,
        }
    }

    async fn stream(
        &self,
        request: rig::completion::CompletionRequest,
    ) -> Result<rig::streaming::StreamingCompletionResponse, rig::completion::CompletionError> {
        match self {
            AnyCompletionModel::OpenAi(m) => m.stream(request).await,
            AnyCompletionModel::Anthropic(m) => m.stream(request).await,
        }
    }

    fn capabilities(&self) -> rig::completion::ProviderCapabilities {
        match self {
            AnyCompletionModel::OpenAi(m) => m.capabilities(),
            AnyCompletionModel::Anthropic(m) => m.capabilities(),
        }
    }
}

pub fn create_completion_model(
    config: &super::types::AiConfig,
) -> Result<AnyCompletionModel, String> {
    if is_anthropic(&config.provider) {
        let client = create_anthropic_client(config)?;
        Ok(AnyCompletionModel::Anthropic(
            client.completion_model(&config.model),
        ))
    } else {
        let client = create_openai_client(config)?;
        Ok(AnyCompletionModel::OpenAi(
            client.completion_model(&config.model),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_key_env_name_deepseek() {
        assert_eq!(api_key_env_name("deepseek").unwrap(), "DEEPSEEK_API_KEY");
    }

    #[test]
    fn test_api_key_env_name_openai_compatible() {
        assert_eq!(
            api_key_env_name("openai-compatible").unwrap(),
            "OPENAI_COMPATIBLE_API_KEY"
        );
    }

    #[test]
    fn test_api_key_env_name_anthropic() {
        assert_eq!(api_key_env_name("anthropic").unwrap(), "ANTHROPIC_API_KEY");
        assert_eq!(
            api_key_env_name("anthropic-compatible").unwrap(),
            "ANTHROPIC_API_KEY"
        );
    }

    #[test]
    fn test_api_key_env_name_rejects_unknown_providers() {
        let err = api_key_env_name("not-a-provider").unwrap_err();
        assert!(err.contains("not-a-provider"));
        assert!(err.contains("Unsupported AI provider"));
    }

    #[test]
    fn test_normalize_ai_provider_trims_and_matches() {
        assert_eq!(normalize_ai_provider("  deepseek  ").unwrap(), "deepseek");
        assert_eq!(
            normalize_ai_provider(" openai-compatible ").unwrap(),
            "openai-compatible"
        );
        assert_eq!(
            normalize_ai_provider(" anthropic-compatible ").unwrap(),
            "anthropic-compatible"
        );
        assert_eq!(
            normalize_ai_provider(" anthropic ").unwrap(),
            "anthropic-compatible"
        );
        assert!(normalize_ai_provider("").is_err());
        assert!(normalize_ai_provider("gpt").is_err());
    }

    #[test]
    fn test_is_local_ai_url_accepts_loopback_hosts() {
        assert!(is_local_ai_url(Some("http://localhost:11434/v1")));
        assert!(is_local_ai_url(Some("https://localhost/v1")));
        assert!(is_local_ai_url(Some("http://LOCALHOST:11434")));
        assert!(is_local_ai_url(Some("http://127.0.0.1:8080/v1")));
        assert!(is_local_ai_url(Some("http://127.0.0.1")));
        assert!(is_local_ai_url(Some("http://0.0.0.0:11434")));
        assert!(is_local_ai_url(Some("http://[::1]:11434/v1")));
    }

    /// Pins the Rust half of the IPv4-mapped IPv6 rule. The frontend's `isLocalAiEndpoint` mirrors
    /// this branch, so if one side changes the other must too — otherwise the settings gate demands
    /// sharing consent the backend does not require.
    #[test]
    fn test_is_local_ai_url_unwraps_ipv4_mapped_ipv6() {
        assert!(is_local_ai_url(Some("http://[::ffff:127.0.0.1]:11434/v1")));
        assert!(is_local_ai_url(Some("http://[::ffff:127.9.9.9]/v1")));
        // Mapped unspecified.
        assert!(is_local_ai_url(Some("http://[::ffff:0.0.0.0]/v1")));
        // The unwrap must not become a blanket yes for anything mapped.
        assert!(!is_local_ai_url(Some("http://[::ffff:8.8.8.8]/v1")));
        assert!(!is_local_ai_url(Some("http://[::ffff:192.168.1.50]/v1")));
    }

    #[test]
    fn test_is_local_ai_url_rejects_disguised_external_hosts() {
        // Substring/prefix tricks must NOT be treated as local.
        assert!(!is_local_ai_url(Some(
            "https://localhost.attacker.example/v1"
        )));
        assert!(!is_local_ai_url(Some(
            "https://attacker.example/v1?x=localhost"
        )));
        assert!(!is_local_ai_url(Some("https://127.0.0.1.attacker.example")));
        assert!(!is_local_ai_url(Some("https://127.0.0.1.evil.com")));
        assert!(!is_local_ai_url(Some("https://example.com")));
        assert!(!is_local_ai_url(Some("https://127.0.0.1@example.com")));
        assert!(!is_local_ai_url(Some("http://localhost.evil.com")));
    }

    #[test]
    fn test_is_local_ai_url_rejects_invalid_and_non_http() {
        assert!(!is_local_ai_url(Some("not a url")));
        assert!(!is_local_ai_url(Some("ftp://localhost/v1")));
        assert!(!is_local_ai_url(Some("file:///etc/passwd")));
        assert!(!is_local_ai_url(Some("")));
        assert!(!is_local_ai_url(None));
    }

    #[test]
    fn test_is_local_ai_endpoint_is_scoped_to_openai_compatible() {
        let mut settings = crate::ai::types::AiSettings {
            provider: OPENAI_COMPATIBLE_PROVIDER.to_string(),
            custom_base_url: Some("http://localhost:11434/v1".to_string()),
            ..Default::default()
        };
        assert!(is_local_ai_endpoint(&settings));

        // The same loopback URL on the Anthropic-compatible wire format stays gated.
        settings.provider = ANTHROPIC_COMPATIBLE_PROVIDER.to_string();
        assert!(!is_local_ai_endpoint(&settings));

        // A remote endpoint stays gated.
        settings.provider = OPENAI_COMPATIBLE_PROVIDER.to_string();
        settings.custom_base_url = Some("https://api.openai.com/v1".to_string());
        assert!(!is_local_ai_endpoint(&settings));

        // No endpoint configured stays gated.
        settings.custom_base_url = None;
        assert!(!is_local_ai_endpoint(&settings));
    }

    #[test]
    fn test_validate_http_base_url() {
        assert_eq!(
            validate_http_base_url("https://api.openai.com/v1/").unwrap(),
            "https://api.openai.com/v1"
        );
        assert!(validate_http_base_url("https://api.openai.com/v1").is_ok());
        assert!(validate_http_base_url("ftp://api.openai.com/v1").is_err());
        assert!(validate_http_base_url("not a url").is_err());
        assert!(validate_http_base_url("https://").is_err());
    }
}

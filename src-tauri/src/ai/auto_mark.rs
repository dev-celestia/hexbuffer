use tauri::AppHandle;

use super::chat::ensure_third_party_ai_sharing_allowed;
use super::keyring::read_required_ai_api_key;
use super::settings::read_ai_settings;
use super::types::{
    InvokerMarkerSuggestion, InvokerMarkerSuggestionRequest, InvokerMarkerSuggestionResponse,
};

pub async fn suggest_invoker_markers_impl(
    app: AppHandle,
    request: InvokerMarkerSuggestionRequest,
) -> Result<InvokerMarkerSuggestionResponse, String> {
    if request.raw_request.trim().is_empty() {
        return Err("Raw request is empty".to_string());
    }

    let settings = read_ai_settings(&app)?;
    ensure_third_party_ai_sharing_allowed(&settings)?;
    let api_key = read_required_ai_api_key(&settings.provider)?;

    if api_key.trim().is_empty() {
        return Err(format!("No {} API key provided", settings.provider));
    }

    let config = super::chat::build_ai_config(&settings, &api_key);
    let client = super::providers::create_openai_client(&config)?;

    let mut builder = client
        .agent(&config.model)
        .preamble(
            "You are an expert web security payload marker insertion tool for security scanners. Analyze the raw HTTP request and insert marker symbols ($target$) around injection points for security testing.",
        );

    if let Some(temp) = config.temperature {
        builder = builder.temperature(temp);
    }
    if let Some(tokens) = config.max_tokens {
        builder = builder.max_tokens(tokens);
    }

    let agent = builder.build();

    let prompt = format!(
        "Analyze this raw HTTP request and identify high-value parameter injection points for fuzzing or vulnerability testing.\n\nRAW REQUEST:\n{}\n\nReturn JSON output matching exact format:\n{{\n  \"marked_request\": \"...\",\n  \"parameters\": [\"...\"],\n  \"explanation\": \"...\"\n}}",
        request.raw_request
    );

    use rig::completion::Prompt;
    let response = agent
        .prompt(&prompt)
        .await
        .map_err(|error| format!("Completion error: {error}"))?;

    let clean_json = if response.contains("```json") {
        response
            .split("```json")
            .nth(1)
            .unwrap_or("")
            .split("```")
            .next()
            .unwrap_or("")
            .trim()
    } else if response.contains("```") {
        response
            .split("```")
            .nth(1)
            .unwrap_or("")
            .split("```")
            .next()
            .unwrap_or("")
            .trim()
    } else {
        response.trim()
    };

    #[derive(serde::Deserialize, Default)]
    struct ParsedSuggestion {
        #[serde(default)]
        parameters: Vec<String>,
        #[serde(default)]
        explanation: String,
    }

    let result: ParsedSuggestion = serde_json::from_str(clean_json).unwrap_or_default();

    let mut suggestions = Vec::new();
    let mut candidate_count = 0;

    for (idx, param) in result.parameters.iter().enumerate() {
        candidate_count += 1;
        if let Some(pos) = request.raw_request.find(param) {
            suggestions.push(InvokerMarkerSuggestion {
                id: format!("marker-{}", idx + 1),
                start: pos,
                end: pos + param.len(),
                value: param.clone(),
                category: "parameter".to_string(),
                location: "body/query".to_string(),
                confidence: 0.9,
                reason: result.explanation.clone(),
            });
        }
    }

    Ok(InvokerMarkerSuggestionResponse {
        provider: settings.provider,
        model: settings.model,
        suggestions,
        candidate_count,
    })
}

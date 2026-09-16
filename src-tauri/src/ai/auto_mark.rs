use tauri::AppHandle;

use super::chat::ensure_third_party_ai_sharing_allowed;
use super::keyring::read_optional_ai_api_key;
use super::providers::is_openai_compatible;
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
    // Mirror the chat path: a loopback endpoint stays on-box, so it needs neither the
    let is_compat = is_openai_compatible(&settings.provider)
        || super::providers::is_anthropic(&settings.provider);
    let is_local = is_compat
        && super::providers::is_local_ai_url(settings.custom_base_url.as_deref());
    if !is_local {
        ensure_third_party_ai_sharing_allowed(&settings)?;
    }
    let api_key = match read_optional_ai_api_key(&settings.provider)? {
        Some(key) if !key.trim().is_empty() => key,
        _ if is_openai_compatible(&settings.provider) => "ollama".to_string(),
        _ => return Err(format!("No {} API key provided", settings.provider)),
    };

    let config = super::chat::build_ai_config(&settings, &api_key);
    let model = super::providers::create_completion_model(&config)?;

    let prompt = format!(
        "Analyze this raw HTTP request and identify high-value parameter injection points for fuzzing or vulnerability testing.\n\nRAW REQUEST:\n{}\n\nReturn JSON output matching exact format:\n{{\n  \"marked_request\": \"...\",\n  \"parameters\": [\"...\"],\n  \"explanation\": \"...\"\n}}",
        request.raw_request
    );

    let mut req_builder = model
        .completion_request(prompt)
        .preamble(
            "You are an expert web security payload marker insertion tool for security scanners. Analyze the raw HTTP request and insert marker symbols ($target$) around injection points for security testing.".to_string(),
        );

    if let Some(temp) = config.temperature {
        req_builder = req_builder.temperature(temp);
    }
    if let Some(tokens) = config.max_tokens {
        req_builder = req_builder.max_tokens(tokens);
    }

    use rig::completion::CompletionModel as _;
    let completion = model
        .completion(req_builder.build())
        .await
        .map_err(|error| format!("Completion error: {error}"))?;

    let mut response = String::new();
    for item in completion.choice {
        if let rig::completion::AssistantContent::Text(t) = item {
            response.push_str(&t.text);
        }
    }

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

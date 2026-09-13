pub(crate) const AI_PROVIDERS: [&str; 3] = ["deepseek", "openai-compatible", "embeddings"];

pub const OPENAI_COMPATIBLE_PROVIDER: &str = "openai-compatible";
/// Keyring-only pseudo provider holding the optional context-bank embeddings key.
/// Not exposed in the frontend provider selector.
pub const EMBEDDINGS_KEY_PROVIDER: &str = "embeddings";

pub fn api_key_env_name(provider: &str) -> Result<&'static str, String> {
    match provider {
        "deepseek" => Ok("DEEPSEEK_API_KEY"),
        "openai-compatible" => Ok("OPENAI_COMPATIBLE_API_KEY"),
        "embeddings" => Ok("EMBEDDINGS_API_KEY"),
        _ => Err(format!("Unsupported AI provider: {}", provider)),
    }
}

pub(crate) fn normalize_ai_provider(provider: &str) -> Result<&str, String> {
    let provider = provider.trim();
    match provider {
        "deepseek" => Ok(provider),
        OPENAI_COMPATIBLE_PROVIDER => Ok(provider),
        EMBEDDINGS_KEY_PROVIDER => Ok(provider),
        _ => Err(format!("Unsupported AI provider: {}", provider)),
    }
}

pub(crate) fn is_openai_compatible(provider: &str) -> bool {
    provider
        .trim()
        .eq_ignore_ascii_case(OPENAI_COMPATIBLE_PROVIDER)
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
        assert!(normalize_ai_provider("").is_err());
        assert!(normalize_ai_provider("gpt").is_err());
    }
}

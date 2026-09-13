pub(crate) const AI_PROVIDERS: [&str; 1] = ["deepseek"];

pub fn api_key_env_name(provider: &str) -> Result<&'static str, String> {
    match provider {
        "deepseek" => Ok("DEEPSEEK_API_KEY"),
        _ => Err(format!("Unsupported AI provider: {}", provider)),
    }
}

pub(crate) fn normalize_ai_provider(provider: &str) -> Result<&str, String> {
    let provider = provider.trim();
    match provider {
        "deepseek" => Ok(provider),
        _ => Err(format!("Unsupported AI provider: {}", provider)),
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
    fn test_api_key_env_name_rejects_unknown_providers() {
        let err = api_key_env_name("openai").unwrap_err();
        assert!(err.contains("openai"));
        assert!(err.contains("Unsupported AI provider"));
    }

    #[test]
    fn test_normalize_ai_provider_trims_and_matches() {
        assert_eq!(normalize_ai_provider("  deepseek  ").unwrap(), "deepseek");
        assert!(normalize_ai_provider("").is_err());
        assert!(normalize_ai_provider("gpt").is_err());
    }
}

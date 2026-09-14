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
                || ip.to_ipv4_mapped()
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
    let parsed = url::Url::parse(trimmed)
        .map_err(|_| "Base URL must be a valid URL (e.g. https://api.openai.com/v1).".to_string())?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("Base URL must use http:// or https://.".to_string());
    }
    if parsed.host_str().map(str::trim).unwrap_or_default().is_empty() {
        return Err("Base URL must include a host (e.g. https://api.openai.com/v1).".to_string());
    }
    Ok(trimmed.to_string())
}

pub fn create_openai_client(
    config: &super::types::AiConfig,
) -> Result<rig::providers::openai::Client, String> {
    let api_key = config
        .api_key
        .clone()
        .or_else(|| std::env::var(api_key_env_name(&config.provider).unwrap_or("")).ok())
        .ok_or_else(|| format!("Missing API key for provider {}", config.provider))?;

    if config.provider.to_lowercase() == "deepseek" {
        let base_url = config
            .base_url
            .clone()
            .unwrap_or_else(|| "https://api.deepseek.com/v1".to_string());
        Ok(rig::providers::openai::Client::from_url(&api_key, &base_url))
    } else if let Some(ref base_url) = config.base_url {
        Ok(rig::providers::openai::Client::from_url(&api_key, base_url))
    } else {
        Ok(rig::providers::openai::Client::new(&api_key))
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

    #[test]
    fn test_is_local_ai_url_rejects_disguised_external_hosts() {
        // Substring/prefix tricks must NOT be treated as local.
        assert!(!is_local_ai_url(Some("https://localhost.attacker.example/v1")));
        assert!(!is_local_ai_url(Some("https://attacker.example/v1?x=localhost")));
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

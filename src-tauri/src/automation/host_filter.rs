/// Normalizes a user-supplied host pattern into a bare hostname by stripping
/// wildcard prefixes, scheme, path, and port.
pub(crate) fn normalize_host_pattern(value: &str) -> String {
    let trimmed = value.trim().trim_start_matches("*.").to_ascii_lowercase();
    if trimmed.is_empty() {
        return String::new();
    }
    let candidate = if trimmed.contains("://") {
        url::Url::parse(&trimmed)
            .ok()
            .and_then(|url| url.host_str().map(str::to_string))
            .unwrap_or(trimmed)
    } else {
        trimmed
    };
    let host_part = candidate.split('/').next().unwrap_or_default();
    strip_port_and_brackets(host_part)
}

/// Strips brackets from IPv6 literals and a `:port` suffix from single-colon
/// (hostname / IPv4) inputs. Bare IPv6 (multiple colons) is kept verbatim so
/// its colons are not mistaken for a port separator.
fn strip_port_and_brackets(host: &str) -> String {
    let host = host.trim();
    if let Some(rest) = host.strip_prefix('[') {
        if let Some(end) = rest.find(']') {
            return rest[..end].to_string();
        }
    }
    if host.matches(':').count() > 1 {
        return host.to_string();
    }
    host.split(':')
        .next()
        .unwrap_or_default()
        .trim()
        .to_string()
}

/// Matches `host` against a comma/whitespace-separated filter list.
/// An empty filter matches every host.
pub(crate) fn matches_host_filter(host: &str, filter: &str) -> bool {
    host_matches_patterns(host, filter, true)
}

/// Like [`matches_host_filter`], but an empty filter matches nothing
/// (websocket triggers require an explicit host filter).
pub(crate) fn matches_host_filter_strict(host: &str, filter: &str) -> bool {
    host_matches_patterns(host, filter, false)
}

fn host_matches_patterns(host: &str, filter: &str, empty_filter_matches: bool) -> bool {
    let patterns = filter
        .split([',', ';', ' ', '\n', '\t'])
        .map(normalize_host_pattern)
        .filter(|pattern| !pattern.is_empty())
        .collect::<Vec<_>>();
    if patterns.is_empty() {
        return empty_filter_matches;
    }

    let host = normalize_host_pattern(host);
    patterns
        .iter()
        .any(|pattern| host == *pattern || host.ends_with(&format!(".{}", pattern)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_host_pattern_strips_scheme_port_path_and_wildcard() {
        assert_eq!(normalize_host_pattern("example.com"), "example.com");
        assert_eq!(normalize_host_pattern("*.example.com"), "example.com");
        assert_eq!(
            normalize_host_pattern("https://api.example.com/v1/users"),
            "api.example.com"
        );
        assert_eq!(normalize_host_pattern("example.com:8080"), "example.com");
        assert_eq!(
            normalize_host_pattern("HTTP://Example.COM:8443/path"),
            "example.com"
        );
        assert_eq!(normalize_host_pattern("  Example.COM  "), "example.com");
    }

    #[test]
    fn test_normalize_host_pattern_edge_cases() {
        assert_eq!(normalize_host_pattern(""), "");
        assert_eq!(normalize_host_pattern("   "), "");
        assert_eq!(normalize_host_pattern("*."), "");
        // Malformed scheme input falls back to the raw string, which has an
        // empty host segment.
        assert_eq!(normalize_host_pattern("://bad"), "");
    }

    #[test]
    fn test_normalize_host_pattern_keeps_ipv6_literals() {
        assert_eq!(normalize_host_pattern("[2001:db8::1]"), "2001:db8::1");
        assert_eq!(normalize_host_pattern("::1"), "::1");
        assert_eq!(
            normalize_host_pattern("http://[2001:db8::1]:8080/x"),
            "2001:db8::1"
        );
    }

    #[test]
    fn test_matches_host_filter_ipv6() {
        assert!(matches_host_filter("[2001:db8::1]", "2001:db8::1"));
        assert!(matches_host_filter("2001:db8::1", "2001:db8::1"));
        assert!(!matches_host_filter("2001:db8::2", "2001:db8::1"));
    }

    #[test]
    fn test_matches_host_filter_empty_filter_matches_everything() {
        assert!(matches_host_filter("anything.com", ""));
        assert!(matches_host_filter("anything.com", "   "));
        assert!(matches_host_filter("anything.com", ", ,"));
    }

    #[test]
    fn test_matches_host_filter_exact_and_subdomain() {
        let filter = "example.com";
        assert!(matches_host_filter("example.com", filter));
        assert!(matches_host_filter("EXAMPLE.com", filter));
        assert!(matches_host_filter("api.example.com", filter));
        assert!(matches_host_filter("deep.api.example.com", filter));
        assert!(!matches_host_filter("notexample.com", filter));
        assert!(!matches_host_filter("example.org", filter));
    }

    #[test]
    fn test_matches_host_filter_wildcard_pattern() {
        let filter = "*.example.com";
        assert!(matches_host_filter("api.example.com", filter));
        // A wildcard pattern also matches the bare domain after normalization.
        assert!(matches_host_filter("example.com", filter));
        assert!(!matches_host_filter("notexample.com", filter));
    }

    #[test]
    fn test_matches_host_filter_multiple_separators() {
        let filter = "example.com, api.test.org; second.test.net\nthird.test.io";
        assert!(matches_host_filter("example.com", filter));
        assert!(matches_host_filter("api.test.org", filter));
        assert!(matches_host_filter("a.second.test.net", filter));
        assert!(matches_host_filter("third.test.io", filter));
        assert!(!matches_host_filter("other.com", filter));
    }

    #[test]
    fn test_matches_host_filter_normalizes_host_input() {
        assert!(matches_host_filter(
            "https://API.Example.com:443/x",
            "example.com"
        ));
    }

    #[test]
    fn test_matches_host_filter_strict_empty_matches_nothing() {
        assert!(!matches_host_filter_strict("anything.com", ""));
        assert!(!matches_host_filter_strict("anything.com", "   "));
        assert!(!matches_host_filter_strict("anything.com", ",,"));
    }

    #[test]
    fn test_matches_host_filter_strict_matches_when_configured() {
        let filter = "example.com";
        assert!(matches_host_filter_strict("example.com", filter));
        assert!(matches_host_filter_strict("sub.example.com", filter));
        assert!(!matches_host_filter_strict("example.org", filter));
    }
}

use rand::seq::SliceRandom;
use std::collections::BTreeSet;

pub fn shuffle_ports(mut ports: Vec<u16>) -> Vec<u16> {
    let mut rng = rand::thread_rng();
    ports.shuffle(&mut rng);
    ports
}

pub fn expand_targets(input: &str) -> Result<Vec<String>, String> {
    let trimmed = input.trim();
    if !trimmed.contains("://") {
        if let Some((base, prefix)) = trimmed.split_once('/') {
            let base = normalize_scan_host(base)?;
            return expand_ipv4_cidr(&base, prefix);
        }
    }

    let target = normalize_scan_host(input)?;
    Ok(vec![target])
}

pub fn normalize_scan_ports(ports: Vec<u16>) -> Result<Vec<u16>, String> {
    let ports = ports.into_iter().collect::<BTreeSet<_>>();
    if ports.is_empty() {
        return Err("At least one port is required".to_string());
    }
    Ok(ports.into_iter().collect())
}

fn normalize_scan_host(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Host is required".to_string());
    }

    let parsed = if trimmed.contains("://") {
        url::Url::parse(trimmed)
            .ok()
            .and_then(|url| url.host_str().map(|host| host.to_string()))
    } else {
        Some(trimmed.split('/').next().unwrap_or_default().trim().to_string())
    };

    let after_userinfo = parsed
        .unwrap_or_default()
        .split('@')
        .next_back()
        .unwrap_or_default()
        .to_string();

    let host = strip_port_and_brackets(&after_userinfo);

    if host.is_empty() {
        return Err("Host is required".to_string());
    }

    Ok(host)
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

fn expand_ipv4_cidr(base: &str, prefix: &str) -> Result<Vec<String>, String> {
    let prefix = prefix
        .parse::<u32>()
        .map_err(|_| "CIDR prefix must be a number".to_string())?;
    if prefix > 32 {
        return Err("CIDR prefix must be between 0 and 32".to_string());
    }

    let ip = parse_ipv4(base)?;
    let mask = if prefix == 0 {
        0
    } else {
        u32::MAX << (32 - prefix)
    };
    let network = ip & mask;
    let broadcast = network | !mask;
    let first = if prefix < 31 { network + 1 } else { network };
    let last = if prefix < 31 {
        broadcast - 1
    } else {
        broadcast
    };

    if last < first {
        return Err("CIDR range does not contain scan targets".to_string());
    }

    let count = (last - first + 1) as usize;
    if count > 4096 {
        return Err("CIDR scans are limited to 4,096 hosts".to_string());
    }

    Ok((first..=last).map(format_ipv4).collect())
}

fn parse_ipv4(input: &str) -> Result<u32, String> {
    let octets = input
        .split('.')
        .map(|part| part.parse::<u8>())
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| "CIDR scanning currently supports IPv4 targets only".to_string())?;
    if octets.len() != 4 {
        return Err("CIDR scanning currently supports IPv4 targets only".to_string());
    }

    Ok(((octets[0] as u32) << 24)
        | ((octets[1] as u32) << 16)
        | ((octets[2] as u32) << 8)
        | octets[3] as u32)
}

fn format_ipv4(ip: u32) -> String {
    format!(
        "{}.{}.{}.{}",
        (ip >> 24) & 0xff,
        (ip >> 16) & 0xff,
        (ip >> 8) & 0xff,
        ip & 0xff
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expand_targets_plain_host() {
        assert_eq!(expand_targets("example.com").unwrap(), vec!["example.com"]);
        assert_eq!(
            expand_targets("  scan.internal.local  ").unwrap(),
            vec!["scan.internal.local"]
        );
    }

    #[test]
    fn test_expand_targets_strips_scheme_port_path_and_userinfo() {
        assert_eq!(
            expand_targets("https://example.com:8443/admin").unwrap(),
            vec!["example.com"]
        );
        assert_eq!(
            expand_targets("http://user:pass@example.com/path").unwrap(),
            vec!["example.com"]
        );
    }

    #[test]
    fn test_expand_targets_cidr_excludes_network_and_broadcast() {
        // /30: usable hosts are .1 and .2
        assert_eq!(
            expand_targets("192.168.1.0/30").unwrap(),
            vec!["192.168.1.1", "192.168.1.2"]
        );
    }

    #[test]
    fn test_expand_targets_cidr_point_to_point_and_host_prefixes() {
        // /31 keeps both addresses
        assert_eq!(
            expand_targets("10.0.0.0/31").unwrap(),
            vec!["10.0.0.0", "10.0.0.1"]
        );
        // /32 keeps the single address
        assert_eq!(expand_targets("10.1.2.3/32").unwrap(), vec!["10.1.2.3"]);
        assert_eq!(expand_targets("10.1.2.3/24").unwrap().len(), 254);
    }

    #[test]
    fn test_expand_targets_ipv6_literals() {
        assert_eq!(expand_targets("[2001:db8::1]").unwrap(), vec!["2001:db8::1"]);
        assert_eq!(expand_targets("[::1]").unwrap(), vec!["::1"]);
        assert_eq!(
            expand_targets("http://[2001:db8::1]:8080/x").unwrap(),
            vec!["2001:db8::1"]
        );
    }

    #[test]
    fn test_expand_targets_rejects_invalid_input() {
        assert!(expand_targets("").is_err());
        assert!(expand_targets("   ").is_err());
        assert!(expand_targets("example.com/abc").is_err());
        assert!(expand_targets("example.com/24").is_err());
        assert!(expand_targets("2001:db8::/64").is_err());
        assert!(expand_targets("10.0.0.0/33").is_err());
        assert!(expand_targets("10.0.0.0/19").is_err());
    }

    #[test]
    fn test_normalize_scan_ports_dedupes_and_sorts() {
        assert_eq!(
            normalize_scan_ports(vec![8080, 80, 443, 80]).unwrap(),
            vec![80, 443, 8080]
        );
        assert!(normalize_scan_ports(vec![]).is_err());
    }

    #[test]
    fn test_shuffle_ports_keeps_all_ports() {
        let ports = vec![80u16, 443, 8080, 22, 21];
        let shuffled = shuffle_ports(ports.clone());
        let mut sorted = shuffled.clone();
        sorted.sort_unstable();
        let mut expected = ports;
        expected.sort_unstable();
        assert_eq!(sorted, expected);
    }
}

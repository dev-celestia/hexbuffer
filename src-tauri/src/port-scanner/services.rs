pub fn service_name(port: u16) -> &'static str {
    match port {
        20 => "ftp-data",
        21 => "ftp",
        22 => "ssh",
        23 => "telnet",
        25 => "smtp",
        53 => "dns",
        67 => "dhcp",
        68 => "dhcp",
        69 => "tftp",
        80 => "http",
        110 => "pop3",
        111 => "rpcbind",
        119 => "nntp",
        123 => "ntp",
        135 => "msrpc",
        137 => "netbios-ns",
        138 => "netbios-dgm",
        139 => "netbios-ssn",
        143 => "imap",
        161 => "snmp",
        162 => "snmptrap",
        389 => "ldap",
        443 => "https",
        445 => "microsoft-ds",
        465 => "smtps",
        514 => "syslog",
        587 => "submission",
        631 => "ipp",
        636 => "ldaps",
        873 => "rsync",
        993 => "imaps",
        995 => "pop3s",
        1433 => "mssql",
        1521 => "oracle",
        1723 => "pptp",
        2049 => "nfs",
        2375 => "docker",
        2376 => "docker-tls",
        3000 => "dev-http",
        3306 => "mysql",
        3389 => "rdp",
        5000 => "upnp",
        5432 => "postgresql",
        5601 => "kibana",
        5900 => "vnc",
        5985 => "winrm",
        5986 => "winrm-https",
        6379 => "redis",
        8000 => "http-alt",
        8080 => "http-proxy",
        8443 => "https-alt",
        8888 => "http-alt",
        9000 => "cslistener",
        9200 => "elasticsearch",
        9300 => "elasticsearch",
        11211 => "memcached",
        27017 => "mongodb",
        _ => "unknown",
    }
}

pub fn detect_service(port: u16, banner: Option<&str>) -> &'static str {
    let Some(banner) = banner.map(|value| value.to_ascii_lowercase()) else {
        return service_name(port);
    };

    if banner.contains("ssh-") {
        "ssh"
    } else if banner.contains("http/") || banner.contains("<html") {
        if port == 443 || port == 8443 {
            "https"
        } else {
            "http"
        }
    } else if banner.contains("smtp") || banner.contains("esmtp") {
        "smtp"
    } else if banner.contains("mysql") {
        "mysql"
    } else if banner.contains("postgresql") {
        "postgresql"
    } else if banner.contains("redis") {
        "redis"
    } else if banner.contains("mongodb") {
        "mongodb"
    } else if banner.contains("ftp") {
        "ftp"
    } else {
        service_name(port)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_name_known_ports() {
        assert_eq!(service_name(22), "ssh");
        assert_eq!(service_name(80), "http");
        assert_eq!(service_name(443), "https");
        assert_eq!(service_name(3306), "mysql");
        assert_eq!(service_name(6379), "redis");
        assert_eq!(service_name(27017), "mongodb");
    }

    #[test]
    fn test_service_name_unknown_ports() {
        assert_eq!(service_name(1), "unknown");
        assert_eq!(service_name(65535), "unknown");
    }

    #[test]
    fn test_detect_service_without_banner_falls_back_to_port() {
        assert_eq!(detect_service(80, None), "http");
        assert_eq!(detect_service(12345, None), "unknown");
    }

    #[test]
    fn test_detect_service_banner_overrides_port() {
        assert_eq!(detect_service(2222, Some("SSH-2.0-OpenSSH_9.6")), "ssh");
        assert_eq!(detect_service(9999, Some("220 smtp.example.com ESMTP")), "smtp");
        assert_eq!(detect_service(9999, Some("redis_version:7.0")), "redis");
        assert_eq!(detect_service(9999, Some("MySQL server error")), "mysql");
    }

    #[test]
    fn test_detect_service_http_banner_respects_tls_ports() {
        assert_eq!(detect_service(8080, Some("HTTP/1.1 200 OK")), "http");
        assert_eq!(detect_service(80, Some("<html><body>hi</body></html>")), "http");
        assert_eq!(detect_service(443, Some("HTTP/1.1 200 OK")), "https");
        assert_eq!(detect_service(8443, Some("HTTP/1.1 404 Not Found")), "https");
    }

    #[test]
    fn test_detect_service_unrecognized_banner_falls_back_to_port() {
        assert_eq!(detect_service(22, Some("garbage noise")), "ssh");
    }
}

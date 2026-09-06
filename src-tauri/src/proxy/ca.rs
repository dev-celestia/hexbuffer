// ponytail: simplified from https/ subfolder with mod.rs and cert.rs into a single file

use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;

use hexbuffer_proxy::ca::CertificationAuthority;

static CA_ROOT: OnceLock<PathBuf> = OnceLock::new();

pub fn init_ca_dir(app_data_dir: PathBuf) {
    CA_ROOT.get_or_init(|| app_data_dir.join(".hexbuffer"));
}

fn get_ca_dir() -> PathBuf {
    CA_ROOT.get().cloned().unwrap_or_else(|| {
        crate::paths::get_shared_app_dir().join(".hexbuffer")
    })
}

fn get_ca_cert_path() -> PathBuf {
    get_ca_dir().join("ca.pem")
}

fn get_ca_key_path() -> PathBuf {
    get_ca_dir().join("ca-key.pem")
}

pub fn create_proxy_authority(
) -> Result<CertificationAuthority, Box<dyn std::error::Error>> {
    let ca_dir = get_ca_dir();
    fs::create_dir_all(&ca_dir)?;
    let ca = CertificationAuthority::new_in(&ca_dir);
    Ok(ca)
}

pub fn export_ca_cert_pem() -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    Ok(fs::read(get_ca_cert_path())?)
}

pub fn get_ca_cert_pem() -> Result<String, Box<dyn std::error::Error>> {
    Ok(fs::read_to_string(get_ca_cert_path())?)
}

pub fn regenerate_ca() -> Result<(), Box<dyn std::error::Error>> {
    let ca_dir = get_ca_dir();
    fs::remove_file(get_ca_cert_path()).ok();
    fs::remove_file(get_ca_key_path()).ok();

    let ca = CertificationAuthority::new_in(&ca_dir);
    let shared_ca_path = crate::paths::get_shared_app_dir().join("hexbuffer-ca.pem");
    let _ = fs::write(&shared_ca_path, ca.ca_cert_pem());
    Ok(())
}

fn is_ca_cert_valid(cert_pem: &str) -> bool {
    if !cert_pem.contains("BEGIN CERTIFICATE") {
        return false;
    }

    if cert_pem.contains("Hexbuffer Proxy CA") {
        return true;
    }

    use base64::{engine::general_purpose, Engine};
    let b64: String = cert_pem
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty() && !line.starts_with("-----"))
        .collect();

    if let Ok(der) = general_purpose::STANDARD.decode(b64.as_bytes()) {
        let needle = b"Hexbuffer Proxy CA";
        der.windows(needle.len()).any(|window| window == needle)
    } else {
        false
    }
}

pub fn ensure_ca_exists() {
    let cert_path = get_ca_cert_path();
    let key_path = get_ca_key_path();

    let cert_valid = if let Ok(cert_content) = fs::read_to_string(&cert_path) {
        is_ca_cert_valid(&cert_content)
    } else {
        false
    };

    let key_valid = if let Ok(key_content) = fs::read_to_string(&key_path) {
        key_content.contains("PRIVATE KEY")
    } else {
        false
    };

    let needs_regen = !cert_valid || !key_valid;

    if needs_regen {
        eprintln!("[ca] CA files missing or outdated, regenerating...");
        if let Err(e) = regenerate_ca() {
            eprintln!("[ca] Failed to regenerate CA: {}", e);
        } else {
            eprintln!("[ca] CA regenerated successfully");
        }
    } else {
        // Ensure shared hexbuffer-ca.pem is also kept in sync if missing
        let shared_ca_path = crate::paths::get_shared_app_dir().join("hexbuffer-ca.pem");
        if !shared_ca_path.exists() {
            if let Ok(cert_bytes) = fs::read(&cert_path) {
                let _ = fs::write(&shared_ca_path, cert_bytes);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_proxy_authority_uses_ca_dir() {
        let temp_dir = std::env::temp_dir().join("hexbuffer_ca_test");
        let _ = fs::remove_dir_all(&temp_dir);

        init_ca_dir(temp_dir.clone());
        let auth = create_proxy_authority();
        assert!(auth.is_ok(), "CA authority creation should succeed");

        let cert_pem = get_ca_cert_pem();
        assert!(cert_pem.is_ok(), "CA cert PEM read should succeed");
        let pem_str = cert_pem.unwrap();
        assert!(pem_str.contains("BEGIN CERTIFICATE"));
        assert!(is_ca_cert_valid(&pem_str), "CA certificate should be recognized as valid");

        // Simulating second startup / ensure_ca_exists call
        ensure_ca_exists();
        let cert_pem_after = get_ca_cert_pem().unwrap();
        assert_eq!(
            pem_str, cert_pem_after,
            "CA certificate must NOT be regenerated when valid"
        );

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_is_ca_cert_valid() {
        assert!(!is_ca_cert_valid(""));
        assert!(!is_ca_cert_valid("not a cert"));
        assert!(!is_ca_cert_valid("-----BEGIN CERTIFICATE-----\nSGVsbG8gV29ybGQ=\n-----END CERTIFICATE-----"));
    }
}

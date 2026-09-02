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

pub fn ensure_ca_exists() {
    let cert_path = get_ca_cert_path();
    let key_path = get_ca_key_path();

    let needs_regen = if !cert_path.exists() || !key_path.exists() {
        true
    } else if let Ok(cert_content) = fs::read_to_string(&cert_path) {
        // If certificate is using a legacy subject that does not match the proxy CA,
        // regenerate it so leaf certificates forged by hexbuffer-proxy match the root.
        !cert_content.contains("Hexbuffer Proxy CA")
    } else {
        true
    };

    if needs_regen {
        eprintln!("[ca] CA files missing or outdated, regenerating...");
        if let Err(e) = regenerate_ca() {
            eprintln!("[ca] Failed to regenerate CA: {}", e);
        } else {
            eprintln!("[ca] CA regenerated successfully");
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
        assert!(cert_pem.unwrap().contains("BEGIN CERTIFICATE"));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}

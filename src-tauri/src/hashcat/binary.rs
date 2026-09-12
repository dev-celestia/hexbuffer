//! Locates the external hashcat binary.

use std::path::PathBuf;
use std::process::Command;

/// Resolve the hashcat binary. Prefers an explicit `HEXBUFFER_HASHCAT_PATH`
/// override, otherwise falls back to `which hashcat` on PATH.
pub fn resolve_hashcat_binary() -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("HEXBUFFER_HASHCAT_PATH") {
        let path = PathBuf::from(p);
        if path.is_file() {
            return Ok(path);
        }
        return Err(format!(
            "HEXBUFFER_HASHCAT_PATH is set but the file does not exist: {}",
            path.display()
        ));
    }

    let output = Command::new("which")
        .arg("hashcat")
        .output()
        .map_err(|e| format!("Failed to run `which hashcat`: {e}"))?;

    let bin = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if output.status.success() && !bin.is_empty() {
        Ok(PathBuf::from(bin))
    } else {
        Err("hashcat binary not found on PATH. Install it with `brew install hashcat` (or point HEXBUFFER_HASHCAT_PATH at an existing binary), then try again.".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_missing_override_fails() {
        // SAFETY: tests run single-threaded via `cargo test -- --test-threads=1`
        unsafe { std::env::set_var("HEXBUFFER_HASHCAT_PATH", "/nonexistent/hashcat") };
        let result = resolve_hashcat_binary();
        unsafe { std::env::remove_var("HEXBUFFER_HASHCAT_PATH") };
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("HEXBUFFER_HASHCAT_PATH"));
    }
}

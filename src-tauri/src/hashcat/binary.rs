//! Locates the external hashcat binary.

use std::path::PathBuf;
use std::process::Command;

#[cfg(target_os = "windows")]
const LOCATE_CMD: &str = "where";
#[cfg(not(target_os = "windows"))]
const LOCATE_CMD: &str = "which";

#[cfg(target_os = "windows")]
const INSTALL_HINT: &str = "Install it with `choco install hashcat` or download it from hashcat.net";
#[cfg(not(target_os = "windows"))]
const INSTALL_HINT: &str = "Install it with `brew install hashcat`";

/// Resolve the hashcat binary. Prefers an explicit `HEXBUFFER_HASHCAT_PATH`
/// override, otherwise falls back to `which`/`where` on PATH.
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

    let output = Command::new(LOCATE_CMD)
        .arg("hashcat")
        .output()
        .map_err(|e| format!("Failed to run `{LOCATE_CMD} hashcat`: {e}"))?;

    let bin = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if output.status.success() && !bin.is_empty() {
        // `where` on Windows can return multiple lines; take the first.
        let first_line = bin.lines().next().unwrap_or_default().trim().to_string();
        if first_line.is_empty() {
            return Err(not_found_error());
        }
        Ok(PathBuf::from(first_line))
    } else {
        Err(not_found_error())
    }
}

/// Probes `hashcat --version` and returns the version string, e.g. "v7.1.2".
pub fn probe_hashcat_version(binary: &PathBuf) -> Option<String> {
    let output = Command::new(binary)
        .arg("--version")
        .output()
        .ok()?;
    let first_line = String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()?
        .trim()
        .to_string();
    if first_line.is_empty() {
        None
    } else {
        Some(first_line)
    }
}

fn not_found_error() -> String {
    format!("hashcat binary not found on PATH. {INSTALL_HINT} (or point HEXBUFFER_HASHCAT_PATH at an existing binary), then try again.")
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

    #[test]
    fn test_probe_version_parses_first_line() {
        // `/bin/echo --version` deterministically prints "--version" on Unix.
        #[cfg(unix)]
        {
            let result = probe_hashcat_version(&PathBuf::from("/bin/echo"));
            assert_eq!(result.as_deref(), Some("--version"));
        }
    }

    #[test]
    fn test_probe_version_missing_binary_is_none() {
        assert!(probe_hashcat_version(&PathBuf::from("/nonexistent/hashcat")).is_none());
    }
}

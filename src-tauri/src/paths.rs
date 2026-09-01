use std::path::PathBuf;

/// Returns the centralized, shared Hexbuffer data directory used across
/// both the full suite and all standalone tool targets.
///
/// macOS: ~/Library/Application Support/com.hexbuffer
/// Windows: %APPDATA%/Hexbuffer
/// Linux: ~/.local/share/hexbuffer (or $XDG_DATA_HOME/hexbuffer)
pub fn get_shared_app_dir() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            let path = PathBuf::from(home).join("Library/Application Support/com.hexbuffer");
            let _ = std::fs::create_dir_all(&path);
            return path;
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            let path = PathBuf::from(appdata).join("Hexbuffer");
            let _ = std::fs::create_dir_all(&path);
            return path;
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(xdg) = std::env::var("XDG_DATA_HOME") {
            let path = PathBuf::from(xdg).join("hexbuffer");
            let _ = std::fs::create_dir_all(&path);
            return path;
        }
        if let Ok(home) = std::env::var("HOME") {
            let path = PathBuf::from(home).join(".local/share/hexbuffer");
            let _ = std::fs::create_dir_all(&path);
            return path;
        }
    }

    let fallback = PathBuf::from(".hexbuffer");
    let _ = std::fs::create_dir_all(&fallback);
    fallback
}

/// Returns the centralized database file path `hexbuffer.db`.
pub fn get_shared_db_path() -> PathBuf {
    let db_path = get_shared_app_dir().join("hexbuffer.db");

    // Seamless migration: If centralized DB doesn't exist yet, check if there is an
    // existing database from the legacy com.hexbuffer.security or com.hexbuffer.http-history dir.
    if !db_path.exists() {
        #[cfg(target_os = "macos")]
        if let Ok(home) = std::env::var("HOME") {
            let candidates = [
                PathBuf::from(&home).join("Library/Application Support/com.hexbuffer.security/hexbuffer.db"),
                PathBuf::from(&home).join("Library/Application Support/com.hexbuffer.http-history/hexbuffer.db"),
            ];
            for candidate in candidates {
                if candidate.exists() {
                    let _ = std::fs::copy(&candidate, &db_path);
                    let _ = std::fs::copy(candidate.with_extension("db-wal"), db_path.with_extension("db-wal"));
                    let _ = std::fs::copy(candidate.with_extension("db-shm"), db_path.with_extension("db-shm"));
                    break;
                }
            }
        }
    }

    db_path
}

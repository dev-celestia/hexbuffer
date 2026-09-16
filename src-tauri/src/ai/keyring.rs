use keyring::{Entry, Error as KeyringError};
use parking_lot::Mutex;
use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::OnceLock;

use super::providers::{api_key_env_name, normalize_ai_provider};

const AI_KEYRING_SERVICE: &str = "hexbuffer.ai";
const CREDENTIALS_FILE_NAME: &str = "ai-credentials.json";
static AI_API_KEY_CACHE: OnceLock<Mutex<BTreeMap<String, String>>> = OnceLock::new();

fn credentials_file_path() -> PathBuf {
    crate::paths::get_shared_app_dir().join(CREDENTIALS_FILE_NAME)
}

fn read_credentials_file() -> BTreeMap<String, String> {
    let path = credentials_file_path();
    if !path.exists() {
        return BTreeMap::new();
    }
    match std::fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => BTreeMap::new(),
    }
}

fn write_credentials_file(creds: &BTreeMap<String, String>) -> Result<(), String> {
    let path = credentials_file_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let content = serde_json::to_string_pretty(creds).map_err(|e| e.to_string())?;

    let temp_path = path.with_extension("json.tmp");
    std::fs::write(&temp_path, &content).map_err(|e| e.to_string())?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&temp_path, std::fs::Permissions::from_mode(0o600));
    }

    std::fs::rename(&temp_path, &path).map_err(|e| e.to_string())?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600));
    }

    Ok(())
}

fn read_file_ai_api_key(provider: &str) -> Option<String> {
    let creds = read_credentials_file();
    creds.get(provider).cloned().filter(|k| !k.trim().is_empty())
}

fn save_file_ai_api_key(provider: &str, api_key: &str) -> Result<(), String> {
    let mut creds = read_credentials_file();
    creds.insert(provider.to_string(), api_key.to_string());
    write_credentials_file(&creds)
}

fn delete_file_ai_api_key(provider: &str) -> Result<(), String> {
    let mut creds = read_credentials_file();
    if creds.remove(provider).is_some() {
        write_credentials_file(&creds)?;
    }
    Ok(())
}

pub fn read_optional_ai_api_key(provider: &str) -> Result<Option<String>, String> {
    let provider = normalize_ai_provider(provider)?;

    // 1. In-memory cache
    if let Some(key) = cached_ai_api_key(provider)? {
        return Ok(Some(key));
    }

    // 2. Environment variable check (DEEPSEEK_API_KEY, OPENAI_COMPATIBLE_API_KEY, EMBEDDINGS_API_KEY)
    if let Ok(env_name) = api_key_env_name(provider) {
        if let Ok(env_val) = std::env::var(env_name) {
            let trimmed = env_val.trim();
            if !trimmed.is_empty() {
                cache_ai_api_key(provider, Some(trimmed.to_string()))?;
                return Ok(Some(trimmed.to_string()));
            }
        }
    }

    // 3. Persistent local credentials file (0600 permissions, never prompts macOS Keychain)
    if let Some(key) = read_file_ai_api_key(provider) {
        cache_ai_api_key(provider, Some(key.clone()))?;
        return Ok(Some(key));
    }

    // 4. Fallback to OS Keychain (only reached if never saved locally yet).
    // If found, auto-migrate to local store so subsequent app restarts never prompt again!
    match keyring_entry(provider)?.get_password() {
        Ok(key) if key.trim().is_empty() => Ok(None),
        Ok(key) => {
            let key = key.trim().to_string();
            let _ = save_file_ai_api_key(provider, &key);
            cache_ai_api_key(provider, Some(key.clone()))?;
            Ok(Some(key))
        }
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => {
            eprintln!("[keyring] OS credential store check for {provider}: {error}");
            Ok(None)
        }
    }
}

pub fn read_required_ai_api_key(provider: &str) -> Result<String, String> {
    read_optional_ai_api_key(provider)?
        .ok_or_else(|| format!("No {} API key saved in credential store", provider))
}

pub(crate) fn set_ai_api_key(provider: &str, api_key: &str) -> Result<String, String> {
    let provider = normalize_ai_provider(provider)?;
    let api_key = api_key.trim();

    // 1. Save to local protected credentials file (0600 permissions)
    save_file_ai_api_key(provider, api_key)?;

    // 2. Cache in memory
    cache_ai_api_key(provider, Some(api_key.to_string()))?;

    // 3. Best-effort update OS Keychain (if accessible; don't fail if Keychain is locked/refused)
    if let Ok(entry) = keyring_entry(provider) {
        let _ = entry.set_password(api_key);
    }

    Ok(api_key.to_string())
}

pub(crate) fn clear_ai_api_key(provider: &str) -> Result<(), String> {
    let provider = normalize_ai_provider(provider)?;

    // 1. Delete from local credentials file
    delete_file_ai_api_key(provider)?;

    // 2. Clear in-memory cache
    cache_ai_api_key(provider, None)?;

    // 3. Best-effort delete from OS Keychain
    if let Ok(entry) = keyring_entry(provider) {
        let _ = entry.delete_credential();
    }

    Ok(())
}

fn keyring_entry(provider: &str) -> Result<Entry, String> {
    Entry::new(AI_KEYRING_SERVICE, provider).map_err(keyring_error)
}

fn ai_api_key_cache() -> &'static Mutex<BTreeMap<String, String>> {
    AI_API_KEY_CACHE.get_or_init(|| Mutex::new(BTreeMap::new()))
}

fn cached_ai_api_key(provider: &str) -> Result<Option<String>, String> {
    Ok(ai_api_key_cache()
        .lock()
        .get(provider)
        .cloned()
        .filter(|key| !key.trim().is_empty()))
}

fn cache_ai_api_key(provider: &str, api_key: Option<String>) -> Result<(), String> {
    let mut cache = ai_api_key_cache().lock();

    if let Some(api_key) = api_key.filter(|key| !key.trim().is_empty()) {
        cache.insert(provider.to_string(), api_key);
    } else {
        cache.remove(provider);
    }

    Ok(())
}

pub(crate) fn keyring_error(error: KeyringError) -> String {
    let message = error.to_string();
    if message.contains("Platform secure storage failure") {
        return format!(
            "OS credential store error: {}. Unlock Keychain Access and re-save the API key. If it keeps failing, delete the stale hexbuffer.ai item for this provider from Keychain Access, then save the key again.",
            message
        );
    }

    format!("OS credential store error: {}", message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_ai_credentials_lifecycle() {
        let provider = "deepseek";
        let test_key = "sk-test-key-12345";

        assert!(save_file_ai_api_key(provider, test_key).is_ok());
        assert_eq!(read_file_ai_api_key(provider), Some(test_key.to_string()));

        assert!(delete_file_ai_api_key(provider).is_ok());
        assert_eq!(read_file_ai_api_key(provider), None);
    }
}

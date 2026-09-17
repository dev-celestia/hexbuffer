use std::collections::BTreeMap;
use std::path::PathBuf;
use tauri::AppHandle;

use super::providers::AI_PROVIDERS;
use super::types::{AiProviderProfile, AiSettings};

pub fn read_ai_settings(app: &AppHandle) -> Result<AiSettings, String> {
    let path = ai_settings_path(app)?;
    let mut settings = if path.exists() {
        let content = std::fs::read_to_string(path).map_err(|error| error.to_string())?;
        serde_json::from_str(&content).map_err(|error| error.to_string())?
    } else {
        AiSettings::default()
    };

    settings.api_key.clear();
    seed_active_provider_profile(&mut settings);
    let legacy_has_api_key = settings.has_api_key;
    let had_provider_status = !settings.provider_key_status.is_empty();
    settings.provider_key_status = normalized_ai_key_status(settings.provider_key_status);
    if !had_provider_status && legacy_has_api_key {
        settings
            .provider_key_status
            .insert(settings.provider.trim().to_string(), true);
    }
    settings.has_api_key = settings
        .provider_key_status
        .get(settings.provider.trim())
        .copied()
        .unwrap_or(false);
    Ok(settings)
}

/// Settings files written before `provider_profiles` existed carry only the active provider's
/// model / base URL, at the top level. Seed that provider's profile from them so the first
/// provider switch after upgrading does not silently drop a configuration the user already had.
///
/// In-memory only: `save_ai_settings` merges this into the persisted map on the next write.
fn seed_active_provider_profile(settings: &mut AiSettings) {
    let provider = settings.provider.trim().to_string();
    if provider.is_empty() || settings.provider_profiles.contains_key(&provider) {
        return;
    }
    if settings.model.trim().is_empty() && settings.custom_base_url.is_none() {
        return;
    }

    settings.provider_profiles.insert(
        provider,
        AiProviderProfile {
            model: settings.model.clone(),
            custom_base_url: settings.custom_base_url.clone(),
        },
    );
}

pub(crate) fn write_ai_settings(app: &AppHandle, settings: &AiSettings) -> Result<(), String> {
    let path = ai_settings_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let mut settings_to_write = settings.clone();
    settings_to_write.api_key.clear();
    let content =
        serde_json::to_string_pretty(&settings_to_write).map_err(|error| error.to_string())?;

    // Write to a temp file in the same directory, then atomically rename, so concurrent
    // readers never observe a partially written settings file and writers never corrupt it.
    let temp_path = path.with_extension("json.tmp");
    std::fs::write(&temp_path, content).map_err(|error| error.to_string())?;
    std::fs::rename(&temp_path, path).map_err(|error| error.to_string())
}

fn ai_settings_path(_app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = crate::paths::get_shared_app_dir();
    Ok(app_dir.join("ai-settings.json"))
}

pub(crate) fn write_ai_key_status(
    app: &AppHandle,
    provider: &str,
    has_key: bool,
) -> Result<BTreeMap<String, bool>, String> {
    let mut settings = read_ai_settings(app)?;
    settings
        .provider_key_status
        .insert(provider.to_string(), has_key);
    settings.has_api_key = settings
        .provider_key_status
        .get(settings.provider.trim())
        .copied()
        .unwrap_or(false);
    write_ai_settings(app, &settings)?;
    Ok(settings.provider_key_status)
}

/// Merge the active provider's configuration into the remembered per-provider map.
///
/// The map is rebuilt from what is already on disk (`persisted`) rather than from the incoming
/// payload: callers such as the assistant's quick picker send only the active selection, so
/// trusting the payload would wipe every other provider's entry. The caller is expected to have
/// already normalised `provider` and validated `custom_base_url`.
pub(crate) fn upsert_active_provider_profile(
    persisted: &BTreeMap<String, AiProviderProfile>,
    provider: &str,
    model: &str,
    custom_base_url: Option<&str>,
) -> BTreeMap<String, AiProviderProfile> {
    let mut profiles = persisted.clone();
    profiles.insert(
        provider.to_string(),
        AiProviderProfile {
            model: model.to_string(),
            custom_base_url: custom_base_url.map(str::to_string),
        },
    );
    profiles
}

pub(crate) fn normalized_ai_key_status(
    mut status: BTreeMap<String, bool>,
) -> BTreeMap<String, bool> {
    for provider in AI_PROVIDERS {
        status.entry(provider.to_string()).or_insert(false);
    }
    status
}

#[cfg(test)]
mod tests {
    use super::*;

    fn legacy_settings() -> AiSettings {
        AiSettings {
            provider: "openai-compatible".to_string(),
            model: "llama3.1".to_string(),
            custom_base_url: Some("http://localhost:11434/v1".to_string()),
            ..AiSettings::default()
        }
    }

    #[test]
    fn test_seed_active_provider_profile_migrates_legacy_top_level_config() {
        let mut settings = legacy_settings();
        assert!(settings.provider_profiles.is_empty());

        seed_active_provider_profile(&mut settings);

        let profile = settings
            .provider_profiles
            .get("openai-compatible")
            .expect("the active provider's profile should be seeded from the legacy fields");
        assert_eq!(profile.model, "llama3.1");
        assert_eq!(
            profile.custom_base_url.as_deref(),
            Some("http://localhost:11434/v1")
        );
    }

    #[test]
    fn test_seed_active_provider_profile_never_overwrites_an_existing_entry() {
        let mut settings = legacy_settings();
        settings.provider_profiles.insert(
            "openai-compatible".to_string(),
            AiProviderProfile {
                model: "already-remembered".to_string(),
                custom_base_url: None,
            },
        );

        seed_active_provider_profile(&mut settings);

        assert_eq!(
            settings
                .provider_profiles
                .get("openai-compatible")
                .map(|profile| profile.model.as_str()),
            Some("already-remembered")
        );
    }

    #[test]
    fn test_seed_active_provider_profile_skips_a_default_install() {
        // Nothing to migrate: a fresh install must not gain a bogus profile entry, or the first
        // provider switch would restore an empty model over the user's choice.
        let mut settings = AiSettings::default();
        settings.model = String::new();
        settings.custom_base_url = None;

        seed_active_provider_profile(&mut settings);

        assert!(settings.provider_profiles.is_empty());
    }

    fn profile(model: &str, base_url: Option<&str>) -> AiProviderProfile {
        AiProviderProfile {
            model: model.to_string(),
            custom_base_url: base_url.map(str::to_string),
        }
    }

    #[test]
    fn test_upsert_active_provider_profile_records_the_active_provider() {
        let profiles = upsert_active_provider_profile(
            &BTreeMap::new(),
            "openai-compatible",
            "llama3.1",
            Some("http://localhost:11434/v1"),
        );

        let stored = profiles
            .get("openai-compatible")
            .expect("profile should be recorded");
        assert_eq!(stored.model, "llama3.1");
        assert_eq!(
            stored.custom_base_url.as_deref(),
            Some("http://localhost:11434/v1")
        );
    }

    #[test]
    fn test_upsert_active_provider_profile_preserves_other_providers() {
        // The regression this guards: the assistant's quick picker saves only the active
        // selection, so merging from the payload instead of disk would wipe every other provider
        // and silently destroy configuration the user had already set up.
        let mut persisted = BTreeMap::new();
        persisted.insert("deepseek".to_string(), profile("deepseek-v4-pro", None));
        persisted.insert(
            "anthropic-compatible".to_string(),
            profile(
                "claude-3-7-sonnet-latest",
                Some("https://gateway.example/v1"),
            ),
        );

        let profiles = upsert_active_provider_profile(
            &persisted,
            "openai-compatible",
            "llama3.1",
            Some("http://localhost:11434/v1"),
        );

        assert_eq!(profiles.len(), 3);
        assert_eq!(
            profiles.get("deepseek").map(|p| p.model.as_str()),
            Some("deepseek-v4-pro")
        );
        assert_eq!(
            profiles
                .get("anthropic-compatible")
                .and_then(|p| p.custom_base_url.as_deref()),
            Some("https://gateway.example/v1")
        );
    }

    #[test]
    fn test_upsert_active_provider_profile_replaces_the_same_provider() {
        let mut persisted = BTreeMap::new();
        persisted.insert("deepseek".to_string(), profile("deepseek-v3", None));

        let profiles =
            upsert_active_provider_profile(&persisted, "deepseek", "deepseek-v4-pro", None);

        assert_eq!(profiles.len(), 1);
        assert_eq!(
            profiles.get("deepseek").map(|p| p.model.as_str()),
            Some("deepseek-v4-pro")
        );
    }

    #[test]
    fn test_upsert_active_provider_profile_clears_a_removed_base_url() {
        // Switching a provider back to its fixed endpoint must clear the remembered URL, not
        // leave a stale gateway behind.
        let mut persisted = BTreeMap::new();
        persisted.insert(
            "anthropic-compatible".to_string(),
            profile(
                "claude-3-7-sonnet-latest",
                Some("https://gateway.example/v1"),
            ),
        );

        let profiles = upsert_active_provider_profile(
            &persisted,
            "anthropic-compatible",
            "claude-3-7-sonnet-latest",
            None,
        );

        assert_eq!(
            profiles
                .get("anthropic-compatible")
                .and_then(|p| p.custom_base_url.as_deref()),
            None
        );
    }

    #[test]
    fn test_upsert_active_provider_profile_returns_a_copy() {
        // The caller assigns the result over the whole map, so the input must not be aliased.
        let persisted: BTreeMap<String, AiProviderProfile> = BTreeMap::new();

        let profiles =
            upsert_active_provider_profile(&persisted, "deepseek", "deepseek-v4-pro", None);

        assert!(persisted.is_empty(), "input map must not be mutated");
        assert_eq!(profiles.len(), 1);
    }
}

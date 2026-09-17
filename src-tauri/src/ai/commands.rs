use std::collections::BTreeMap;
use tauri::AppHandle;

use super::keyring::{clear_ai_api_key as keyring_clear, set_ai_api_key as keyring_set};
use super::providers::normalize_ai_provider;
use super::settings::{read_ai_settings, write_ai_key_status, write_ai_settings};
use super::types::AiSettings;

pub(crate) fn get_ai_settings_impl(app: AppHandle) -> Result<AiSettings, String> {
    read_ai_settings(&app)
}

pub(crate) fn get_ai_key_status_impl(app: AppHandle) -> Result<BTreeMap<String, bool>, String> {
    Ok(read_ai_settings(&app)?.provider_key_status)
}

pub(crate) fn set_ai_api_key_impl(
    app: AppHandle,
    provider: String,
    api_key: String,
) -> Result<BTreeMap<String, bool>, String> {
    let provider = normalize_ai_provider(&provider)?;
    let api_key = api_key.trim();
    if api_key.is_empty() {
        return Err(format!("No {} API key provided", provider));
    }

    keyring_set(provider, api_key)?;
    write_ai_key_status(&app, provider, true)
}

pub(crate) fn clear_ai_api_key_impl(
    app: AppHandle,
    provider: String,
) -> Result<BTreeMap<String, bool>, String> {
    let provider = normalize_ai_provider(&provider)?;
    keyring_clear(provider)?;
    write_ai_key_status(&app, provider, false)
}

pub(crate) fn save_ai_settings_impl(
    app: AppHandle,
    settings: AiSettings,
) -> Result<AiSettings, String> {
    let mut settings = settings;
    settings.provider = super::providers::normalize_ai_provider(&settings.provider)?.to_string();
    settings.model = settings.model.trim().to_string();
    if settings.model.is_empty() {
        return Err("No model configured. Select or enter a model before saving.".to_string());
    }
    // Both compatible wire formats accept a custom endpoint (`build_ai_config` passes it through
    // for each), so it is validated and kept for both. Only the fixed-endpoint providers drop it.
    if super::providers::is_openai_compatible(&settings.provider)
        || super::providers::is_anthropic(&settings.provider)
    {
        let base_url = settings.custom_base_url.as_deref().unwrap_or_default();
        settings.custom_base_url = if base_url.trim().is_empty() {
            None
        } else {
            Some(super::providers::validate_http_base_url(base_url)?)
        };
    } else {
        settings.custom_base_url = None;
    }
    // API keys are managed by the OS credential store.
    settings.api_key.clear();
    let persisted = read_ai_settings(&app)?;
    settings.provider_key_status = persisted.provider_key_status;
    // Remember this provider's config so switching back restores it, without disturbing the
    // providers that are already remembered.
    settings.provider_profiles = super::settings::upsert_active_provider_profile(
        &persisted.provider_profiles,
        &settings.provider,
        &settings.model,
        settings.custom_base_url.as_deref(),
    );
    write_ai_settings(&app, &settings)?;
    read_ai_settings(&app)
}

pub(crate) fn abort_ai_chat_message_impl(
    app: &AppHandle,
    window_label: &str,
    request_id: &str,
) -> Result<bool, String> {
    super::chat::abort_ai_chat_message_impl(app, window_label, request_id)
}

pub(crate) fn pause_ai_chat_message_impl(
    app: &AppHandle,
    window_label: &str,
    request_id: &str,
) -> Result<bool, String> {
    super::chat::pause_ai_chat_message_impl(app, window_label, request_id)
}

pub(crate) fn resume_ai_chat_message_impl(
    app: &AppHandle,
    window_label: &str,
    request_id: &str,
) -> Result<bool, String> {
    super::chat::resume_ai_chat_message_impl(app, window_label, request_id)
}

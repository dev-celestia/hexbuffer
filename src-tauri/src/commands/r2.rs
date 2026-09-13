use aws_sdk_s3::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

fn log(msg: &str) {
    let ts = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let line = format!("[{ts}] {msg}");
    eprintln!("{line}");
    let _ = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("/tmp/hexbuffer.log")
        .and_then(|mut f| std::io::Write::write_all(&mut f, format!("{line}\n").as_bytes()));
}

const R2_KEYRING_SERVICE: &str = "hexbuffer.r2";
const R2_KEYRING_USER: &str = "default_secret";
const MULTIPART_CHUNK_SIZE: usize = 5 * 1024 * 1024; // 5MB minimum S3 chunk size
const MULTIPART_THRESHOLD: usize = 50 * 1024 * 1024; // 50MB
const UPLOAD_PART_CONCURRENCY: usize = 3;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct R2Settings {
    pub account_id: String,
    pub access_key_id: String,
    pub custom_endpoint_url: Option<String>,
}

fn keyring_entry() -> Result<Entry, String> {
    Entry::new(R2_KEYRING_SERVICE, R2_KEYRING_USER).map_err(|e| e.to_string())
}

fn r2_settings_path() -> Result<PathBuf, String> {
    let app_dir = crate::paths::get_shared_app_dir();
    Ok(app_dir.join("r2-settings.json"))
}

/// Strips empty, ".", and ".." segments so remote-provided keys/bucket names
/// can never escape the intended directory when they touch the filesystem.
fn sanitize_key_segments(input: &str) -> Vec<String> {
    input
        .split(['/', '\\'])
        .filter(|s| !s.is_empty() && *s != "." && *s != "..")
        .map(|s| s.to_string())
        .collect()
}

fn read_settings() -> Result<R2Settings, String> {
    let path = r2_settings_path()?;
    if !path.exists() {
        return Err("R2 credentials are not configured".to_string());
    }
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

/// Builds an S3 client from the saved settings + OS keychain secret.
/// The secret access key never leaves this process.
fn load_r2_client() -> Result<Client, String> {
    let settings = read_settings()?;
    let secret_access_key = match keyring_entry()?.get_password() {
        Ok(pw) => pw,
        Err(KeyringError::NoEntry) => {
            return Err("R2 secret access key is not configured".to_string())
        }
        Err(error) => return Err(format!("OS Keychain error: {}", error)),
    };

    let endpoint = match settings.custom_endpoint_url.as_deref().map(str::trim) {
        Some(endpoint) if !endpoint.is_empty() => endpoint.to_string(),
        _ => format!(
            "https://{}.r2.cloudflarestorage.com",
            settings.account_id.trim()
        ),
    };

    let config = aws_sdk_s3::Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .region(Region::new("auto"))
        .endpoint_url(endpoint)
        .force_path_style(true)
        .credentials(Credentials::new(
            settings.access_key_id.trim(),
            secret_access_key,
            None,
            None,
            "R2",
        ))
        .build();

    Ok(Client::from_conf(config))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct R2CredentialsStatus {
    pub account_id: String,
    pub access_key_id: String,
    pub custom_endpoint_url: Option<String>,
    pub has_secret: bool,
}

/// Replaces the old get_r2_settings: reports configuration state without
/// ever sending the secret access key to the webview.
#[tauri::command]
pub async fn r2_credentials_status() -> Result<Option<R2CredentialsStatus>, String> {
    let path = r2_settings_path()?;
    if !path.exists() {
        return Ok(None);
    }

    let settings = read_settings()?;
    let has_secret = match keyring_entry()?.get_password() {
        Ok(pw) => !pw.is_empty(),
        Err(KeyringError::NoEntry) => false,
        Err(error) => return Err(format!("OS Keychain error: {}", error)),
    };

    Ok(Some(R2CredentialsStatus {
        account_id: settings.account_id,
        access_key_id: settings.access_key_id,
        custom_endpoint_url: settings.custom_endpoint_url,
        has_secret,
    }))
}

#[tauri::command]
pub async fn save_r2_credentials(
    account_id: String,
    access_key_id: String,
    secret_access_key: Option<String>,
    custom_endpoint_url: Option<String>,
) -> Result<(), String> {
    let account_id = account_id.trim();
    let access_key_id = access_key_id.trim();

    if account_id.is_empty() || access_key_id.is_empty() {
        return Err("Account ID and Access Key ID must not be empty".to_string());
    }

    // An empty/absent secret keeps the existing keychain entry so the
    // settings UI can save metadata changes without re-entering the secret.
    match secret_access_key.as_deref().map(str::trim) {
        Some(secret) if !secret.is_empty() => {
            keyring_entry()?
                .set_password(secret)
                .map_err(|e| format!("Failed to save secret in OS Keychain: {}", e))?;
        }
        _ => {
            match keyring_entry()?.get_password() {
                Ok(pw) if !pw.is_empty() => {}
                _ => {
                    return Err(
                        "Secret Access Key must not be empty on first setup".to_string()
                    )
                }
            }
        }
    }

    // Save metadata to cleartext JSON config file
    let settings = R2Settings {
        account_id: account_id.to_string(),
        access_key_id: access_key_id.to_string(),
        custom_endpoint_url: if let Some(ref url) = custom_endpoint_url {
            let trimmed = url.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        } else {
            None
        },
    };

    let path = r2_settings_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let content = serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn clear_r2_credentials() -> Result<(), String> {
    // Delete config file
    let path = r2_settings_path()?;
    if path.exists() {
        let _ = fs::remove_file(path);
    }

    // Delete password from OS Keychain
    match keyring_entry()?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => {}
        Err(error) => return Err(format!("Failed to delete from OS Keychain: {}", error)),
    }

    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct R2FolderEntry {
    pub prefix: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct R2FileEntry {
    pub name: String,
    pub key: String,
    pub size: Option<i64>,
    pub last_modified_ms: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct R2Listing {
    pub folders: Vec<R2FolderEntry>,
    pub files: Vec<R2FileEntry>,
}

#[tauri::command]
pub async fn r2_list_buckets() -> Result<Vec<String>, String> {
    let client = load_r2_client()?;
    let res = client.list_buckets().send().await.map_err(|e| e.to_string())?;
    let names = res
        .buckets()
        .iter()
        .filter_map(|b| b.name().map(|n| n.to_string()))
        .collect();
    Ok(names)
}

#[tauri::command]
pub async fn r2_list_objects(bucket: String, prefix: String) -> Result<R2Listing, String> {
    let client = load_r2_client()?;
    let res = client
        .list_objects_v2()
        .bucket(&bucket)
        .prefix(&prefix)
        .delimiter("/")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let folders = res
        .common_prefixes()
        .iter()
        .filter_map(|p| {
            let prefix = p.prefix()?;
            let name = prefix.trim_end_matches('/').rsplit('/').next()?.to_string();
            Some(R2FolderEntry {
                prefix: prefix.to_string(),
                name,
            })
        })
        .collect();

    let files = res
        .contents()
        .iter()
        .filter_map(|c| {
            let key = c.key()?;
            let name = key.rsplit('/').next()?.to_string();
            if name.is_empty() {
                return None;
            }
            Some(R2FileEntry {
                name,
                key: key.to_string(),
                size: c.size(),
                last_modified_ms: c.last_modified().map(|dt| {
                    dt.epoch().saturating_mul(1000) + (dt.subsec_nanos() / 1_000_000)
                }),
            })
        })
        .filter(|f| f.key != prefix)
        .collect();

    Ok(R2Listing { folders, files })
}

#[tauri::command]
pub async fn r2_put_object_empty(bucket: String, key: String) -> Result<(), String> {
    let client = load_r2_client()?;
    client
        .put_object()
        .bucket(&bucket)
        .key(&key)
        .body(ByteStream::from(Vec::new()))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn r2_delete_object(bucket: String, key: String) -> Result<(), String> {
    let client = load_r2_client()?;
    client
        .delete_object()
        .bucket(&bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn r2_create_bucket(name: String) -> Result<(), String> {
    let client = load_r2_client()?;
    client
        .create_bucket()
        .bucket(&name)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn r2_delete_bucket(name: String) -> Result<(), String> {
    let client = load_r2_client()?;
    client
        .delete_bucket()
        .bucket(&name)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct R2UploadProgress {
    pub file_name: String,
    pub progress: u32,
}

fn emit_upload_progress(app: &AppHandle, file_name: &str, progress: u32) {
    let payload = R2UploadProgress {
        file_name: file_name.to_string(),
        progress,
    };
    if let Err(err) = app.emit("r2-upload-progress", payload) {
        log(&format!("[r2_upload_file] Emit progress failed: {}", err));
    }
}

struct UploadPartTask {
    number: i32,
    body: Vec<u8>,
}

#[tauri::command]
pub async fn r2_upload_file(
    app: AppHandle,
    bucket: String,
    key: String,
    source_path: String,
    content_type: Option<String>,
) -> Result<(), String> {
    let client = load_r2_client()?;

    // The key arrives composed by the renderer (prefix + file name); enforce
    // the same sanitization here so a compromised webview cannot write
    // outside the intended prefix.
    let safe_key = sanitize_key_segments(&key).join("/");
    if safe_key.is_empty() {
        return Err("Invalid object key".to_string());
    }

    let file_name = safe_key.rsplit('/').next().unwrap_or("file").to_string();
    let file_bytes = tokio::fs::read(&source_path)
        .await
        .map_err(|e| format!("Failed to read source file: {}", e))?;

    if file_bytes.len() <= MULTIPART_THRESHOLD {
        emit_upload_progress(&app, &file_name, 10);
        client
            .put_object()
            .bucket(&bucket)
            .key(&safe_key)
            .content_type(content_type.unwrap_or_else(|| "application/octet-stream".to_string()))
            .body(ByteStream::from(file_bytes))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        emit_upload_progress(&app, &file_name, 100);
    } else {
        let init = client
            .create_multipart_upload()
            .bucket(&bucket)
            .key(&safe_key)
            .content_type(content_type.unwrap_or_else(|| "application/octet-stream".to_string()))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let upload_id = init
            .upload_id()
            .ok_or_else(|| "Multipart upload failed to initialize".to_string())?
            .to_string();

        let total_size = file_bytes.len();
        let num_parts = total_size.div_ceil(MULTIPART_CHUNK_SIZE);
        let mut tasks = Vec::with_capacity(num_parts);
        for i in 0..num_parts {
            let start = i * MULTIPART_CHUNK_SIZE;
            let end = std::cmp::min(start + MULTIPART_CHUNK_SIZE, total_size);
            tasks.push(UploadPartTask {
                number: (i + 1) as i32,
                body: file_bytes[start..end].to_vec(),
            });
        }

        let mut uploaded_parts: Vec<(i32, String)> = Vec::with_capacity(num_parts);

        for batch in tasks.chunks(UPLOAD_PART_CONCURRENCY) {
            let mut handles = Vec::with_capacity(batch.len());
            for task in batch {
                let client = client.clone();
                let bucket = bucket.clone();
                let key = safe_key.clone();
                let upload_id = upload_id.clone();
                let body = std::mem::take(&mut task.body);
                let number = task.number;
                handles.push(tokio::spawn(async move {
                    let out = client
                        .upload_part()
                        .bucket(&bucket)
                        .key(&key)
                        .upload_id(&upload_id)
                        .part_number(number)
                        .body(ByteStream::from(body))
                        .send()
                        .await
                        .map_err(|e| e.to_string())?;
                    let etag = out
                        .e_tag()
                        .ok_or_else(|| format!("Part {} returned no ETag", number))?
                        .to_string();
                    Ok::<(i32, String), String>((number, etag))
                }));
            }

            for handle in handles {
                let result = handle
                    .await
                    .map_err(|e| format!("Upload part task failed: {}", e))?;
                uploaded_parts.push(result?);
            }

            emit_upload_progress(
                &app,
                &file_name,
                (uploaded_parts.len() * 100 / num_parts) as u32,
            );
        }

        uploaded_parts.sort_by_key(|(number, _)| *number);
        let parts: Vec<aws_sdk_s3::types::CompletedPart> = uploaded_parts
            .into_iter()
            .map(|(number, etag)| {
                aws_sdk_s3::types::CompletedPart::builder()
                    .part_number(number)
                    .e_tag(etag)
                    .build()
            })
            .collect();

        client
            .complete_multipart_upload()
            .bucket(&bucket)
            .key(&safe_key)
            .upload_id(&upload_id)
            .multipart_upload(
                aws_sdk_s3::types::CompletedMultipartUpload::builder()
                    .set_parts(Some(parts))
                    .build(),
            )
            .send()
            .await
            .map_err(|e| e.to_string())?;

        emit_upload_progress(&app, &file_name, 100);
    }

    Ok(())
}

/// Streams the object into the local cache (app data / r2_cache) and returns
/// the cached file path. Cached files are returned as-is.
#[tauri::command]
pub async fn r2_download_object(
    app: AppHandle,
    bucket: String,
    key: String,
) -> Result<String, String> {
    let client = load_r2_client()?;

    let mut segments = sanitize_key_segments(&bucket);
    segments.extend(sanitize_key_segments(&key));
    if segments.is_empty() {
        return Err("Invalid object key".to_string());
    }

    let cache_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let mut local_path = cache_dir.join("r2_cache");
    for segment in &segments {
        local_path.push(segment);
    }

    if tokio::fs::try_exists(&local_path)
        .await
        .map_err(|e| e.to_string())?
    {
        return Ok(local_path.to_string_lossy().to_string());
    }

    let output = client
        .get_object()
        .bucket(&bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let bytes = output
        .body
        .collect()
        .await
        .map_err(|e| e.to_string())?
        .into_vec();

    if let Some(parent) = local_path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }
    tokio::fs::write(&local_path, bytes)
        .await
        .map_err(|e| e.to_string())?;

    Ok(local_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn r2_presign_url(
    bucket: String,
    key: String,
    expires_seconds: u64,
) -> Result<String, String> {
    let client = load_r2_client()?;
    let presigning = PresigningConfig::with_expiry(Duration::from_secs(expires_seconds))
        .map_err(|e| e.to_string())?;
    let presigned = client
        .get_object()
        .bucket(&bucket)
        .key(&key)
        .presigned(presigning)
        .await
        .map_err(|e| e.to_string())?;
    Ok(presigned.uri().to_string())
}

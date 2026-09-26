use std::path::{Path, PathBuf};
use std::time::Duration;

#[cfg(any(target_os = "macos", target_os = "ios"))]
pub const ORT_LIB_NAME: &str = "libonnxruntime.dylib";

#[cfg(any(target_os = "linux", target_os = "android"))]
pub const ORT_LIB_NAME: &str = "libonnxruntime.so";

#[cfg(target_os = "windows")]
pub const ORT_LIB_NAME: &str = "onnxruntime.dll";

/// Checks whether the ONNX Runtime dynamic library exists anywhere on the machine
/// and sets `ORT_LIB_PATH` if found.
pub fn detect_existing_ort_runtime() -> Option<PathBuf> {
    // 1. Explicit env var override
    if let Ok(env_path) = std::env::var("ORT_LIB_PATH") {
        let p = PathBuf::from(env_path);
        if p.is_file() {
            return Some(p);
        }
    }

    // 2. Hexbuffer managed directory: ~/.hexbuffer/ort/<ORT_LIB_NAME>
    let managed_path = crate::paths::get_shared_app_dir()
        .join("ort")
        .join(ORT_LIB_NAME);
    if managed_path.is_file() {
        std::env::set_var("ORT_LIB_PATH", &managed_path);
        return Some(managed_path);
    }

    // 3. Next to running executable
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            let exe_lib = parent.join(ORT_LIB_NAME);
            if exe_lib.is_file() {
                std::env::set_var("ORT_LIB_PATH", &exe_lib);
                return Some(exe_lib);
            }
        }
    }

    // 4. Common system paths (including Apple Silicon Homebrew)
    let candidate_system_dirs: &[&str] = &[
        "/opt/homebrew/lib",
        "/usr/local/lib",
        "/usr/lib",
        "/lib",
        "/usr/lib/x86_64-linux-gnu",
        "/usr/lib/aarch64-linux-gnu",
    ];

    for dir in candidate_system_dirs {
        let p = Path::new(dir).join(ORT_LIB_NAME);
        if p.is_file() {
            std::env::set_var("ORT_LIB_PATH", &p);
            return Some(p);
        }
    }

    // 5. Python site-packages & conda installations
    if let Some(path) = search_python_or_cache_dirs() {
        std::env::set_var("ORT_LIB_PATH", &path);
        return Some(path);
    }

    None
}

/// Recursively looks for an existing ONNX Runtime shared library in Python site-packages
/// or pyke cache directories.
fn search_python_or_cache_dirs() -> Option<PathBuf> {
    let home = std::env::var("HOME").ok().map(PathBuf::from)?;

    let mut candidate_dirs: Vec<PathBuf> = Vec::new();

    // macOS pip user: ~/Library/Python/<ver>/lib/python/site-packages/onnxruntime/capi
    let mac_py_base = home.join("Library/Python");
    if let Ok(entries) = std::fs::read_dir(&mac_py_base) {
        for entry in entries.flatten() {
            let capi = entry.path().join("lib/python/site-packages/onnxruntime/capi");
            if capi.is_dir() {
                candidate_dirs.push(capi);
            }
        }
    }

    // Linux pip user: ~/.local/lib/python*/site-packages/onnxruntime/capi
    let linux_py_base = home.join(".local/lib");
    if let Ok(entries) = std::fs::read_dir(&linux_py_base) {
        for entry in entries.flatten() {
            let capi = entry.path().join("site-packages/onnxruntime/capi");
            if capi.is_dir() {
                candidate_dirs.push(capi);
            }
        }
    }

    // Pyke cache: ~/.cache/ort.pyke.io/
    let pyke_base = home.join(".cache/ort.pyke.io");
    if pyke_base.is_dir() {
        collect_subdirs(&pyke_base, &mut candidate_dirs, 0, 4);
    }

    // Conda dirs
    for conda in ["miniconda3", "anaconda3", "miniforge3"] {
        candidate_dirs.push(home.join(conda).join("lib"));
    }

    for dir in candidate_dirs {
        if !dir.is_dir() {
            continue;
        }
        let exact = dir.join(ORT_LIB_NAME);
        if exact.is_file() {
            return Some(exact);
        }
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let name = entry.file_name();
                let name_str = name.to_string_lossy();
                if name_str.starts_with("libonnxruntime") && entry.path().is_file() {
                    return Some(entry.path());
                }
            }
        }
    }

    None
}

fn collect_subdirs(dir: &Path, out: &mut Vec<PathBuf>, depth: usize, max_depth: usize) {
    if depth >= max_depth {
        return;
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                out.push(p.clone());
                collect_subdirs(&p, out, depth + 1, max_depth);
            }
        }
    }
}

/// Download metadata for the current platform and architecture.
fn get_release_url() -> Result<(&'static str, &'static str), String> {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        Ok((
            "https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/onnxruntime-osx-arm64-1.20.1.tgz",
            "tgz",
        ))
    }
    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    {
        Ok((
            "https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/onnxruntime-osx-x86_64-1.20.1.tgz",
            "tgz",
        ))
    }
    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    {
        Ok((
            "https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/onnxruntime-linux-x64-1.20.1.tgz",
            "tgz",
        ))
    }
    #[cfg(all(target_os = "linux", target_arch = "aarch64"))]
    {
        Ok((
            "https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/onnxruntime-linux-aarch64-1.20.1.tgz",
            "tgz",
        ))
    }
    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    {
        Ok((
            "https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/onnxruntime-win-x64-1.20.1.zip",
            "zip",
        ))
    }
    #[cfg(not(any(
        all(target_os = "macos", any(target_arch = "aarch64", target_arch = "x86_64")),
        all(target_os = "linux", any(target_arch = "x86_64", target_arch = "aarch64")),
        all(target_os = "windows", target_arch = "x86_64")
    )))]
    {
        Err(format!(
            "Unsupported platform for automatic ONNX Runtime download: {} {}",
            std::env::consts::OS,
            std::env::consts::ARCH
        ))
    }
}

/// Ensures the ONNX Runtime dynamic library is available on disk and sets `ORT_LIB_PATH`.
/// If not present, downloads the official prebuilt binary archive for the current platform.
pub async fn ensure_ort_runtime() -> Result<PathBuf, String> {
    if let Some(existing) = detect_existing_ort_runtime() {
        return Ok(existing);
    }

    let ort_dir = crate::paths::get_shared_app_dir().join("ort");
    std::fs::create_dir_all(&ort_dir)
        .map_err(|e| format!("Failed to create ORT directory {}: {e}", ort_dir.display()))?;

    let dest_file = ort_dir.join(ORT_LIB_NAME);
    if dest_file.is_file() {
        std::env::set_var("ORT_LIB_PATH", &dest_file);
        return Ok(dest_file);
    }

    let (url, format) = get_release_url()?;
    eprintln!(
        "[uteke] Downloading ONNX Runtime v1.20.1 from {url}..."
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {e}"))?;

    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to ONNX Runtime release download: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!(
            "Failed to download ONNX Runtime archive: HTTP {}",
            resp.status()
        ));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to download ONNX Runtime payload: {e}"))?;

    eprintln!(
        "[uteke] Extracting ONNX Runtime library to {}...",
        dest_file.display()
    );

    let mut extracted = false;

    if format == "tgz" {
        let gz = flate2::read::GzDecoder::new(bytes.as_ref());
        let mut archive = tar::Archive::new(gz);
        let entries = archive
            .entries()
            .map_err(|e| format!("Failed to read tar archive: {e}"))?;

        for entry_res in entries {
            let mut entry = match entry_res {
                Ok(e) => e,
                Err(_) => continue,
            };

            let path = match entry.path() {
                Ok(p) => p.to_path_buf(),
                Err(_) => continue,
            };

            let filename = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            // Match exact name or versioned dynamic library (e.g. libonnxruntime.1.20.1.dylib)
            // Skip symlinks — we extract the regular file so it is self-contained.
            let is_match = filename == ORT_LIB_NAME
                || filename.starts_with(&format!("{ORT_LIB_NAME}."))
                || filename.starts_with("libonnxruntime.1.")
                || filename.starts_with("libonnxruntime.so.1.");

            if is_match && entry.header().entry_type().is_file() {
                let mut out = std::fs::File::create(&dest_file).map_err(|e| {
                    format!("Failed to create library file {}: {e}", dest_file.display())
                })?;
                std::io::copy(&mut entry, &mut out).map_err(|e| {
                    format!("Failed to extract library file {}: {e}", dest_file.display())
                })?;
                extracted = true;
                break;
            }
        }
    } else if format == "zip" {
        let cursor = std::io::Cursor::new(bytes);
        let mut archive = zip::ZipArchive::new(cursor)
            .map_err(|e| format!("Failed to parse zip archive: {e}"))?;

        for i in 0..archive.len() {
            let mut file = match archive.by_index(i) {
                Ok(f) => f,
                Err(_) => continue,
            };

            if file.name().ends_with(ORT_LIB_NAME) && file.is_file() {
                let mut out = std::fs::File::create(&dest_file).map_err(|e| {
                    format!("Failed to create library file {}: {e}", dest_file.display())
                })?;
                std::io::copy(&mut file, &mut out).map_err(|e| {
                    format!("Failed to extract library file {}: {e}", dest_file.display())
                })?;
                extracted = true;
                break;
            }
        }
    }

    if !extracted || !dest_file.is_file() {
        return Err(format!(
            "Could not find {} inside the downloaded ONNX Runtime archive.",
            ORT_LIB_NAME
        ));
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&dest_file, std::fs::Permissions::from_mode(0o755));
    }

    std::env::set_var("ORT_LIB_PATH", &dest_file);
    eprintln!(
        "[uteke] ONNX Runtime successfully installed at {}",
        dest_file.display()
    );

    Ok(dest_file)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ort_lib_name() {
        assert!(!ORT_LIB_NAME.is_empty());
        #[cfg(target_os = "macos")]
        assert_eq!(ORT_LIB_NAME, "libonnxruntime.dylib");
        #[cfg(target_os = "linux")]
        assert_eq!(ORT_LIB_NAME, "libonnxruntime.so");
        #[cfg(target_os = "windows")]
        assert_eq!(ORT_LIB_NAME, "onnxruntime.dll");
    }

    #[test]
    fn test_release_url() {
        let res = get_release_url();
        assert!(res.is_ok());
        let (url, format) = res.unwrap();
        assert!(url.starts_with("https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/"));
        assert!(format == "tgz" || format == "zip");
    }

    #[test]
    fn test_env_var_override() {
        // When ORT_LIB_PATH points to an existing file, detect_existing_ort_runtime returns it
        let temp = tempfile::NamedTempFile::new().unwrap();
        let path = temp.path().to_path_buf();
        std::env::set_var("ORT_LIB_PATH", &path);

        let detected = detect_existing_ort_runtime();
        assert_eq!(detected, Some(path));

        std::env::remove_var("ORT_LIB_PATH");
    }

    #[tokio::test]
    async fn test_ensure_ort_runtime_download_or_detect() {
        let result = ensure_ort_runtime().await;
        assert!(result.is_ok(), "ensure_ort_runtime failed: {:?}", result.err());
        let path = result.unwrap();
        assert!(path.is_file());
        assert_eq!(std::env::var("ORT_LIB_PATH").ok(), Some(path.to_string_lossy().to_string()));
    }
}

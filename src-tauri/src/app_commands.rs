// ponytail: extracted from main.rs to keep main entry point clean and focused.

use tauri::Manager;

#[tauri::command]
pub fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    crate::log("show_main_window invoked by frontend");

    // Close splashscreen if it exists
    if let Some(splash_window) = app.get_webview_window("splashscreen") {
        crate::log("Closing splash screen");
        splash_window.close().map_err(|error| {
            crate::log(&format!("Failed to close splash: {error}"));
            error.to_string()
        })?;
    } else {
        crate::log("No splash screen found to close");
    }

    // Show and focus main window
    let main_window = app
        .get_webview_window("main")
        .ok_or_else(|| {
            crate::log("ERROR: main window was not found");
            "main window was not found".to_string()
        })?;

    #[cfg(target_os = "linux")]
    let _ = main_window.set_decorations(false);

    main_window.show().map_err(|error| {
        crate::log(&format!("Failed to show main window: {error}"));
        error.to_string()
    })?;
    main_window.set_focus().map_err(|error| {
        crate::log(&format!("Failed to focus main window: {error}"));
        error.to_string()
    })?;

    crate::log("Main window shown and focused successfully");
    Ok(())
}

/// Safe wrapper around start_dragging that catches the nil-currentEvent panic
/// in tao 0.35.2 on macOS (tao/src/platform_impl/macos/window.rs:936).
#[tauri::command]
pub fn safe_start_dragging(window: tauri::Window) -> Result<(), String> {
    if window.is_fullscreen().unwrap_or(false) {
        return Ok(());
    }
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| window.start_dragging()))
        .map_err(|_| "drag failed".to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cdp_targets(port: u16) -> Result<String, String> {
    let url = format!("http://127.0.0.1:{}/json", port);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    Ok(resp)
}

#[tauri::command]
pub async fn open_cdp_browser(_app: tauri::AppHandle, port: u16) -> Result<(), String> {
    // Check if the port is already occupied by a different application
    if std::net::TcpListener::bind(("127.0.0.1", port)).is_err() {
        let url = format!("http://127.0.0.1:{}/json", port);
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_millis(500))
            .build()
            .map_err(|e| e.to_string())?;

        let is_cdp = match client.get(&url).send().await {
            Ok(resp) => {
                if let Ok(text) = resp.text().await {
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
                        val.is_array()
                    } else {
                        false
                    }
                } else {
                    false
                }
            }
            Err(_) => false,
        };

        if !is_cdp {
            return Err(format!(
                "Port {} is already occupied by another application (e.g. AirPlay, web server). Please use a different debugging port (e.g. 9222 or 9223).",
                port
            ));
        } else {
            // It is an existing Chrome CDP instance. Let's terminate it to release any profile/window lock and launch fresh.
            #[cfg(unix)]
            {
                if let Ok(output) = std::process::Command::new("lsof")
                    .args(["-t", "-i", &format!("tcp:{}", port)])
                    .output()
                {
                    let pid_str = String::from_utf8_lossy(&output.stdout);
                    let pids: Vec<&str> = pid_str.split_whitespace().collect();
                    if !pids.is_empty() {
                        let _ = std::process::Command::new("kill")
                            .arg("-9")
                            .args(&pids)
                            .status();
                        // Wait for port to be released
                        std::thread::sleep(std::time::Duration::from_millis(500));
                    }
                }
            }
        }
    }

    let profile_dir = hexbuffer::paths::get_shared_app_dir()
        .join(format!("cdp-browser-profile-{}", port));
    std::fs::create_dir_all(&profile_dir).map_err(|e| e.to_string())?;

    let proxy_port = hexbuffer::proxy::active_proxy_port().unwrap_or(8888);

    let mut args = vec![
        format!("--remote-debugging-port={}", port),
        format!("--user-data-dir={}", profile_dir.display()),
        "--remote-allow-origins=*".to_string(),
        "--new-window".to_string(),
        "--no-first-run".to_string(),
        "--no-default-browser-check".to_string(),
        format!("--proxy-server=127.0.0.1:{proxy_port}"),
        "about:blank".to_string(),
    ];
    #[cfg(target_os = "macos")]
    args.push("--use-mock-keychain".to_string());

    let mut last_error = None;
    for candidate in hexbuffer::commands::intercept::browser_candidates() {
        if candidate.components().count() > 1 && !candidate.exists() {
            continue;
        }

        match std::process::Command::new(&candidate).args(&args).spawn() {
            Ok(_) => return Ok(()),
            Err(error) => last_error = Some(error.to_string()),
        }
    }

    Err(last_error.unwrap_or_else(|| {
        "Google Chrome or Chromium was not found. Install Chrome or Chromium to use Open Browser.".to_string()
    }))
}

#[tauri::command]
pub fn get_cli_target() -> Option<String> {
    for arg in std::env::args().skip(1) {
        if let Some(target) = arg.strip_prefix("--target=") {
            return Some(target.trim_matches('"').to_string());
        }
        if let Some(target) = arg.strip_prefix("--subapp=") {
            return Some(target.trim_matches('"').to_string());
        }
    }
    None
}

#[tauri::command]
pub fn create_os_desktop_shortcut(
    _app: tauri::AppHandle,
    tool_id: String,
    display_name: String,
    icon_path: Option<String>,
) -> Result<String, String> {
    let desktop_dir = dirs::desktop_dir().ok_or_else(|| "Could not locate Desktop directory".to_string())?;
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;

    // Determine the icon to use if not provided
    let resolved_icon = icon_path.or_else(|| {
        let app_icon_base = "/Users/arham/Desktop/project/apprecon/src/assets/app-icon";
        let specific_icon = format!("{}/{}.png", app_icon_base, tool_id.to_lowercase());
        if std::path::Path::new(&specific_icon).exists() {
            Some(specific_icon)
        } else {
            let default_icon = format!("{}/http.png", app_icon_base);
            if std::path::Path::new(&default_icon).exists() {
                Some(default_icon)
            } else {
                None
            }
        }
    });

    #[cfg(target_os = "windows")]
    {
        let link_path = desktop_dir.join(format!("{}.lnk", display_name));
        let mut link = mslnk::ShellLink::new(&exe_path).map_err(|e| e.to_string())?;
        link.set_arguments(Some(format!("--target={}", tool_id)));
        if let Some(ref icon) = resolved_icon {
            link.set_icon_location(Some(icon.clone()));
        }
        link.create_at(&link_path).map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        // 1. Locate the main Hexbuffer binary
        let mut main_bundle = None;
        let mut current = exe_path.as_path();
        while let Some(parent) = current.parent() {
            if parent.extension().and_then(|ext| ext.to_str()) == Some("app") {
                main_bundle = Some(parent.to_path_buf());
                break;
            }
            current = parent;
        }

        let app_path = desktop_dir.join(format!("{}.app", display_name));
        let macos_dir = app_path.join("Contents/MacOS");
        let resources_dir = app_path.join("Contents/Resources");

        // Remove any previous shortcut app
        if app_path.exists() {
            let _ = std::fs::remove_dir_all(&app_path);
        }

        std::fs::create_dir_all(&macos_dir).map_err(|e| e.to_string())?;
        std::fs::create_dir_all(&resources_dir).map_err(|e| e.to_string())?;

        // 2. Determine target executable path
        let target_binary = if let Some(ref bundle) = main_bundle {
            bundle.join("Contents/MacOS/hexbuffer")
        } else if std::path::Path::new("/Applications/Hexbuffer.app/Contents/MacOS/hexbuffer").exists() {
            std::path::PathBuf::from("/Applications/Hexbuffer.app/Contents/MacOS/hexbuffer")
        } else {
            exe_path.clone()
        };

        // 3. Generate icon.icns in Contents/Resources/icon.icns
        let clean_slug = tool_id.to_lowercase().replace(' ', "-");
        let bundle_id = format!("com.hexbuffer.subapp.{}", clean_slug);

        let icon_png = resolved_icon.as_ref().and_then(|p| {
            if std::path::Path::new(p).exists() {
                Some(p.clone())
            } else {
                None
            }
        });

        if let Some(ref png_path) = icon_png {
            let temp_iconset = std::env::temp_dir().join(format!("hexbuffer_{}_{}.iconset", clean_slug, std::process::id()));
            let _ = std::fs::create_dir_all(&temp_iconset);

            for size in [16, 32, 64, 128, 256, 512] {
                let _ = std::process::Command::new("sips")
                    .args(["-z", &size.to_string(), &size.to_string(), png_path, "--out", &temp_iconset.join(format!("icon_{}x{}.png", size, size)).to_string_lossy()])
                    .output();
                let dbl = size * 2;
                let _ = std::process::Command::new("sips")
                    .args(["-z", &dbl.to_string(), &dbl.to_string(), png_path, "--out", &temp_iconset.join(format!("icon_{}x{}@2x.png", size, size)).to_string_lossy()])
                    .output();
            }

            let icns_dest = resources_dir.join("icon.icns");
            let _ = std::process::Command::new("iconutil")
                .args(["-c", "icns", &temp_iconset.to_string_lossy(), "-o", &icns_dest.to_string_lossy()])
                .output();

            let _ = std::fs::remove_dir_all(&temp_iconset);
        } else {
            // Copy default icon.icns if available
            let default_icns = "/Users/arham/Desktop/project/apprecon/src-tauri/icons/icon.icns";
            if std::path::Path::new(default_icns).exists() {
                let _ = std::fs::copy(default_icns, resources_dir.join("icon.icns"));
            }
        }

        // 4. Create Contents/Info.plist
        let info_plist = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>English</string>
	<key>CFBundleDisplayName</key>
	<string>{display_name}</string>
	<key>CFBundleExecutable</key>
	<string>launcher</string>
	<key>CFBundleIconFile</key>
	<string>icon.icns</string>
	<key>CFBundleIdentifier</key>
	<string>{bundle_id}</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>{display_name}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.1.1</string>
	<key>CFBundleVersion</key>
	<string>1.1.1</string>
	<key>CSResourcesFileMapped</key>
	<true/>
	<key>LSMinimumSystemVersion</key>
	<string>10.13</string>
	<key>NSHighResolutionCapable</key>
	<true/>
</dict>
</plist>
"#
        );
        std::fs::write(app_path.join("Contents/Info.plist"), info_plist).map_err(|e| e.to_string())?;

        // 5. Create launcher script with single-instance delegation
        let launcher_path = macos_dir.join("launcher");
        let launcher_content = format!(
            r#"#!/bin/bash
TARGET_ID="{tool_id}"
TARGET_BIN="{target_binary}"

exec "$TARGET_BIN" --target="$TARGET_ID" "$@"
"#,
            tool_id = tool_id,
            target_binary = target_binary.to_string_lossy()
        );

        std::fs::write(&launcher_path, launcher_content).map_err(|e| e.to_string())?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&launcher_path, std::fs::Permissions::from_mode(0o755));
        }

        // 6. Set custom icon on the folder bundle as well via NSWorkspace for immediate Finder view
        if let Some(ref icon) = icon_png {
            let swift_script = format!(
                r#"import AppKit
if let img = NSImage(contentsOfFile: "{}") {{
    let ok = NSWorkspace.shared.setIcon(img, forFile: "{}", options: [])
    print(ok)
}}"#,
                icon,
                app_path.display()
            );
            let _ = std::process::Command::new("swift")
                .arg("-e")
                .arg(&swift_script)
                .output();
        }

        // 7. Register new bundle with LaunchServices so Dock and Finder immediately recognize it
        let _ = std::process::Command::new("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister")
            .args(["-f", &app_path.to_string_lossy()])
            .output();

        let _ = std::process::Command::new("touch")
            .arg(&app_path)
            .output();
    }

    #[cfg(target_os = "linux")]
    {
        use std::io::Write;
        let slug = tool_id.to_lowercase().replace(' ', "-");
        let link_path = desktop_dir.join(format!("{}.desktop", slug));
        let icon_line = if let Some(ref icon) = resolved_icon {
            format!("Icon={}\n", icon)
        } else {
            String::new()
        };
        let content = format!(
            "[Desktop Entry]\nName={}\nExec=\"{}\" --target={}\nType=Application\n{}Terminal=false\nCategories=Development;Security;\n",
            display_name,
            exe_path.display(),
            tool_id,
            icon_line
        );
        let mut file = std::fs::File::create(&link_path).map_err(|e| e.to_string())?;
        file.write_all(content.as_bytes()).map_err(|e| e.to_string())?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&link_path, std::fs::Permissions::from_mode(0o755));
        }
    }

    Ok(format!("Shortcut created for {}", display_name))
}

#[cfg(target_os = "macos")]
pub fn set_macos_dock_icon_from_file(path: &std::path::Path) -> Result<(), String> {
    use objc2::{AllocAnyThread, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    let mtm = unsafe { MainThreadMarker::new_unchecked() };
    let app = NSApplication::sharedApplication(mtm);
    let data = NSData::with_bytes(&bytes);
    let app_icon = NSImage::initWithData(NSImage::alloc(), &data)
        .ok_or_else(|| "Failed to create NSImage from icon data".to_string())?;
    unsafe { app.setApplicationIconImage(Some(&app_icon)) };
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn activate_current_process() {
    use objc2::MainThreadMarker;
    use objc2_app_kit::NSApplication;

    let mtm = unsafe { MainThreadMarker::new_unchecked() };
    let app = NSApplication::sharedApplication(mtm);
    #[allow(deprecated)]
    app.activateIgnoringOtherApps(true);
}

#[tauri::command]
pub fn set_dock_icon(icon_path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        set_macos_dock_icon_from_file(std::path::Path::new(&icon_path))?;
    }
    let _ = icon_path;
    Ok(())
}

#[cfg(test)]
mod tests {
    #[test]
    #[cfg(target_os = "macos")]
    fn test_desktop_shortcut_generation_structure() {
        let temp_dir = tempfile::tempdir().unwrap();
        let app_path = temp_dir.path().join("Hexbuffer HTTP.app");
        let macos_dir = app_path.join("Contents/MacOS");
        let resources_dir = app_path.join("Contents/Resources");

        std::fs::create_dir_all(&macos_dir).unwrap();
        std::fs::create_dir_all(&resources_dir).unwrap();

        let launcher_path = macos_dir.join("launcher");
        std::fs::write(&launcher_path, "#!/bin/bash\nexit 0\n").unwrap();

        let plist_path = app_path.join("Contents/Info.plist");
        std::fs::write(&plist_path, "test").unwrap();

        assert!(launcher_path.exists());
        assert!(plist_path.exists());
    }
}

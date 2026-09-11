use tauri::{AppHandle, Emitter, Manager};
use hexbuffer::commands::invoker::InvokerState;
use hexbuffer::{
    AiBrowserState, BrowserProcessState, CollaboratorPollingState, HashEngineState, HistoryBridge,
    PortScanState, ProxyState, SqliScanState,
};

pub fn init(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(desktop)]
    app.handle()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .expect("Failed to initialize updater plugin");

    #[cfg(target_os = "macos")]
    setup_macos_menu(app)?;

    crate::log("Initializing database...");
    let app_dir = hexbuffer::paths::get_shared_app_dir();
    std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    hexbuffer::proxy::ca::init_ca_dir(app_dir.clone());

    let db_path = hexbuffer::paths::get_shared_db_path();
    crate::log(&format!("Opening database at {:?}", db_path));
    let database = hexbuffer::db::repository::Database::new(db_path)
        .expect("Failed to initialize database");
    if let Err(e) = database.init() {
        crate::log(&format!("FATAL: Failed to initialize database schema: {}", e));
        panic!("Failed to initialize database schema: {}", e);
    }

    let sessions_dir = app_dir.join("sessions");
    std::fs::create_dir_all(&sessions_dir).expect("Failed to create sessions directory");
    let payload_store = hexbuffer::db::PayloadStore::new(sessions_dir);

    let history = HistoryBridge::from_database_and_payload_store(database.clone(), payload_store.clone());
    crate::log("History bridge initialized with PayloadStore");

    hexbuffer::proxy::completion::init_proxy_log_worker(app.handle().clone());

    app.manage(ProxyState::new());
    app.manage(InvokerState::default());
    app.manage(PortScanState::default());
    app.manage(BrowserProcessState::default());
    app.manage(AiBrowserState::default());
    app.manage(SqliScanState::new());
    app.manage(CollaboratorPollingState::default());
    app.manage(hexbuffer::automation::AutomationRuntimeState::default());
    app.manage(payload_store);
    app.manage(database);
    app.manage(history);
    app.manage(hexbuffer::commands::vpn::VpnState::default());
    app.manage(HashEngineState::default());
    app.manage(hexbuffer::commands::nuclei::NucleiScanState::default());

    // ponytail: manage MockForgeState
    let mock_forge = hexbuffer::commands::mock_forge::MockForgeState::new();
    let db_ref = app.state::<hexbuffer::db::repository::Database>();
    if let Err(e) = hexbuffer::commands::mock_forge::load_mock_forge_from_db(&mock_forge, &db_ref) {
        eprintln!("[mock-forge] failed to load from db: {}", e);
    }
    app.manage(mock_forge);

    crate::log("Building Tauri app...");

    // Check if cold-started with a specific target tool (e.g. from desktop shortcut
    // or an apprecon:// deep link with optional query params)
    let mut initial_target: Option<(String, Option<String>)> = None;
    for arg in std::env::args().skip(1) {
        if let Some(target) = arg.strip_prefix("--target=").or_else(|| arg.strip_prefix("--subapp=")) {
            initial_target = Some((target.trim_matches('"').to_lowercase(), None));
            break;
        }
        if let Some(rest) = arg.trim_matches('"').strip_prefix("apprecon://") {
            let (target, query) = match rest.split_once('?') {
                Some((t, q)) => (t.to_lowercase(), Some(q.to_string())),
                None => (rest.to_lowercase(), None),
            };
            if !target.is_empty() {
                initial_target = Some((target, query));
                break;
            }
        }
    }

    #[cfg(target_os = "linux")]
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.set_decorations(false);
        crate::log("Linux window decorations disabled");
    }

    if let Some((ref clean_target, ref query)) = initial_target {
        crate::log(&format!("Cold-start requested for sub-app: {}", clean_target));
        // Dismiss splash screen immediately
        if let Some(splash) = app.get_webview_window("splashscreen") {
            let _ = splash.close();
        }
        open_or_focus_subapp_window_with_query(&app.handle(), clean_target, query.as_deref());
    }

    #[cfg(desktop)]
    {
        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = check_for_updates(handle).await {
                crate::log(&format!("[updater] startup check failed: {e}"));
            }
        });
    }

    // Fallback: if React fails to mount and call show_main_window,
    // auto-dismiss the splash after 10 seconds to prevent the app from
    // getting stuck on the splash screen in production builds.
    // Only run this fallback if NOT running as a dedicated subapp.
    if initial_target.is_none() && app.get_webview_window("main").is_some() {
        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_secs(10)).await;
            // If splash is still open, dismiss it and show main
            if let Some(splash) = handle.get_webview_window("splashscreen") {
                crate::log("Splash fallback timer fired — closing splash");
                let _ = splash.close();
                if let Some(main_window) = handle.get_webview_window("main") {
                    let _ = main_window.show();
                    let _ = main_window.set_focus();
                    crate::log("Splash fallback: main window shown");
                }
            }
        });
    }

    crate::log("Tauri setup complete");
    Ok(())
}

/// Build a custom macOS app menu that mirrors the default Tauri menu but
/// omits the native "Select All" item: its Cmd+A accelerator is consumed at
/// the AppKit level before the webview sees the keydown, which breaks
/// select-all inside Monaco editors. With no menu item claiming Cmd+A, the
/// key falls through to the webview where Monaco handles it natively.
#[cfg(target_os = "macos")]
fn setup_macos_menu(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, SubmenuBuilder};

    let app_menu = SubmenuBuilder::new(app, "Hexbuffer")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .separator()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &edit_menu, &window_menu])
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

#[cfg(desktop)]
async fn check_for_updates(app: AppHandle) -> tauri_plugin_updater::Result<()> {
    use tauri_plugin_updater::UpdaterExt;

    if let Some(update) = app.updater()?.check().await? {
        crate::log(&format!(
            "[updater] update {} available (current: {}) — user will be prompted via UI",
            update.version, update.current_version
        ));
    } else {
        crate::log("[updater] no update available");
    }

    Ok(())
}

/// Event sent to an already-open sub-app window carrying the deep-link query
/// params (e.g. raw/endpointId for the Repeater) so it can load the new data
/// without being closed and reopened. Mirrored by the frontend listener in
/// src/routes/page-resolver.tsx.
pub const SUBAPP_PARAMS_EVENT: &str = "hexbuffer:subapp-params";

pub fn open_or_focus_subapp_window_with_query(
    app: &AppHandle,
    clean_target: &str,
    query: Option<&str>,
) {
    let subapp_label = format!("subapp-{}", clean_target);

    // If window already exists, unminimize, show and focus it
    if let Some(win) = app.get_webview_window(&subapp_label) {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        #[cfg(target_os = "macos")]
        crate::app_commands::activate_current_process();

        // Forward the deep-link payload to the live window so it can react
        // (focus alone would silently drop the new request).
        if let Some(query) = query {
            match app.emit_to(subapp_label.as_str(), SUBAPP_PARAMS_EVENT, query.to_string()) {
                Ok(_) => {
                    crate::log(&format!(
                        "Forwarded deep-link params to existing window [{}]: {}",
                        subapp_label, query
                    ));
                }
                Err(e) => {
                    crate::log(&format!(
                        "Failed to forward deep-link params to [{}]: {}",
                        subapp_label, e
                    ));
                }
            }
        } else {
            crate::log(&format!("Existing sub-app window [{}] brought to front", subapp_label));
        }
        return;
    }

    // Otherwise create the sub-app window
    let subapp_url = match query {
        Some(query) if !query.is_empty() => {
            format!("index.html?target={}&{}", clean_target, query)
        }
        _ => format!("index.html?target={}", clean_target),
    };
    let subapp_builder = tauri::WebviewWindowBuilder::new(
        app,
        &subapp_label,
        tauri::WebviewUrl::App(subapp_url.into()),
    )
    .title("Hexbuffer")
    .inner_size(1200.0, 800.0)
    .min_inner_size(750.0, 520.0)
    .decorations(true)
    .transparent(true);

    #[cfg(target_os = "macos")]
    let subapp_builder = subapp_builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .traffic_light_position(tauri::LogicalPosition::new(20.0, 20.0));

    match subapp_builder.build() {
        Ok(subapp_win) => {
            let _ = subapp_win.unminimize();
            let _ = subapp_win.show();
            let _ = subapp_win.set_focus();
            #[cfg(target_os = "macos")]
            crate::app_commands::activate_current_process();
            crate::log(&format!("Sub-app window [{}] opened and brought to front successfully", subapp_label));
        }
        Err(e) => {
            crate::log(&format!("Failed to open sub-app window [{}]: {}", subapp_label, e));
        }
    }
}

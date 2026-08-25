use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use local_ip_address::list_afinet_netifas;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use tokio::net::UdpSocket;
use tokio::sync::{oneshot, RwLock};
use tower_http::cors::{Any, CorsLayer};

pub const DISCOVERY_UDP_PORT: u16 = 9878;
pub const DEFAULT_SYNC_HTTP_PORT: u16 = 9879;
pub const PEER_TTL_SECONDS: u64 = 10;
pub const BEACON_INTERVAL_SECONDS: u64 = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub id: String,
    pub name: String,
    pub os: String,
    pub ip: String,
    pub sync_port: u16,
    pub app_version: String,
    pub capabilities: Vec<String>,
    pub last_seen: u64,
    pub is_self: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyPeerInfo {
    pub id: String,
    pub name: String,
    pub os: String,
    pub ip: String,
    pub sync_port: u16,
    pub is_broadcasting: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharedDataPayload {
    pub id: String,
    pub sender_id: String,
    pub sender_name: String,
    pub sender_os: String,
    pub sender_ip: String,
    pub share_type: String, // "dev_server_url", "repeater_tab", "raw_text", "http_request", "custom"
    pub title: String,
    pub payload: serde_json::Value,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeaconMessage {
    pub id: String,
    pub name: String,
    pub os: String,
    pub sync_port: u16,
    pub app_version: String,
    pub capabilities: Vec<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResponse {
    pub status: String,
    pub id: String,
    pub name: String,
    pub os: String,
    pub app_version: String,
}

struct PeerSyncState {
    my_id: String,
    my_name: String,
    os: String,
    sync_port: u16,
    is_broadcasting: AtomicBool,
    is_initialized: bool,
    peers: Arc<RwLock<HashMap<String, PeerInfo>>>,
    app_handle: Option<AppHandle>,
    server_shutdown_tx: Option<oneshot::Sender<()>>,
}

static PEER_SYNC_STATE: std::sync::LazyLock<Arc<RwLock<PeerSyncState>>> =
    std::sync::LazyLock::new(|| {
        let os = match std::env::consts::OS {
            "macos" => "macos".to_string(),
            "windows" => "windows".to_string(),
            "linux" => "linux".to_string(),
            other => other.to_string(),
        };

        let user = std::env::var("USER")
            .or_else(|_| std::env::var("USERNAME"))
            .unwrap_or_else(|_| "Hexbuffer User".to_string());

        let os_display = match os.as_str() {
            "macos" => "Mac",
            "windows" => "PC",
            "linux" => "Linux",
            _ => "Device",
        };

        let my_name = format!("{}'s {}", user, os_display);
        let my_id = format!("hex-{}", &uuid::Uuid::new_v4().to_string()[..8]);

        Arc::new(RwLock::new(PeerSyncState {
            my_id,
            my_name,
            os,
            sync_port: DEFAULT_SYNC_HTTP_PORT,
            is_broadcasting: AtomicBool::new(false),
            is_initialized: false,
            peers: Arc::new(RwLock::new(HashMap::new())),
            app_handle: None,
            server_shutdown_tx: None,
        }))
    });

fn get_now_epoch_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn get_now_iso_string() -> String {
    chrono::Utc::now().to_rfc3339()
}

/// Helper to get preferred local LAN IPv4 address
pub fn get_primary_lan_ip() -> String {
    if let Ok(interfaces) = list_afinet_netifas() {
        for (name, ip) in interfaces {
            if let std::net::IpAddr::V4(ipv4) = ip {
                if !ipv4.is_loopback() && !ipv4.is_link_local() {
                    let s = ipv4.to_string();
                    if s.starts_with("192.168.")
                        || s.starts_with("10.")
                        || (s.starts_with("172.") && !name.contains("bridge"))
                    {
                        return s;
                    }
                }
            }
        }
    }
    "127.0.0.1".to_string()
}

/// Initialize the peer discovery and sync server on-demand
#[tauri::command]
pub async fn init_peer_sync(app: AppHandle) -> Result<(), String> {
    {
        let mut state = PEER_SYNC_STATE.write().await;
        if state.is_initialized {
            return Ok(());
        }
        state.is_initialized = true;
        state.is_broadcasting.store(true, Ordering::Relaxed);
        state.app_handle = Some(app.clone());
    }

    // 1. Start HTTP Sync Server (Axum)
    let sync_port = start_sync_http_server(app.clone()).await?;
    {
        let mut state = PEER_SYNC_STATE.write().await;
        state.sync_port = sync_port;
    }

    // 2. Start UDP Beacon Broadcaster
    start_udp_beacon_broadcaster().await;

    // 3. Start UDP Discovery Listener
    start_udp_discovery_listener(app.clone()).await;

    // 4. Start Peer Pruning Watcher
    start_peer_pruning_watcher(app).await;

    Ok(())
}

/// Start Axum HTTP receiver on sync port
async fn start_sync_http_server(app: AppHandle) -> Result<u16, String> {
    let mut bound_port = DEFAULT_SYNC_HTTP_PORT;
    let mut listener = None;

    // Try default port, fallback to sequential ports if already in use
    for port in DEFAULT_SYNC_HTTP_PORT..(DEFAULT_SYNC_HTTP_PORT + 20) {
        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        match tokio::net::TcpListener::bind(addr).await {
            Ok(l) => {
                bound_port = port;
                listener = Some(l);
                break;
            }
            Err(_) => continue,
        }
    }

    let tcp_listener = listener.ok_or_else(|| "Failed to bind sync HTTP server on ports 9879..9899".to_string())?;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();

    let app_clone = app.clone();
    let router = Router::new()
        .route("/api/v1/peer/ping", get(handle_ping_peer))
        .route(
            "/api/v1/peer/share",
            post({
                let handle = app_clone.clone();
                move |body: Json<SharedDataPayload>| handle_incoming_share(handle, body)
            }),
        )
        .layer(cors);

    {
        let mut state = PEER_SYNC_STATE.write().await;
        state.server_shutdown_tx = Some(shutdown_tx);
    }

    tauri::async_runtime::spawn(async move {
        axum::serve(tcp_listener, router)
            .with_graceful_shutdown(async move {
                let _ = shutdown_rx.await;
            })
            .await
            .unwrap_or_else(|e| eprintln!("[peer-sync] HTTP server error: {}", e));
    });

    println!("[peer-sync] Sync HTTP server listening on port {}", bound_port);
    Ok(bound_port)
}

async fn handle_ping_peer() -> impl IntoResponse {
    let state = PEER_SYNC_STATE.read().await;
    Json(PingResponse {
        status: "ok".to_string(),
        id: state.my_id.clone(),
        name: state.my_name.clone(),
        os: state.os.clone(),
        app_version: "0.1.0".to_string(),
    })
}

async fn handle_incoming_share(
    app: AppHandle,
    Json(mut payload): Json<SharedDataPayload>,
) -> impl IntoResponse {
    if payload.id.is_empty() {
        payload.id = format!("share-{}", &uuid::Uuid::new_v4().to_string()[..8]);
    }
    if payload.timestamp.is_empty() {
        payload.timestamp = get_now_iso_string();
    }

    println!(
        "[peer-sync] Received data share '{}' ({}) from {}",
        payload.title, payload.share_type, payload.sender_name
    );

    // Emit event to frontend
    let _ = app.emit("peer-sync:data-received", &payload);

    (
        StatusCode::OK,
        Json(ShareResponse {
            success: true,
            message: format!("Payload '{}' accepted", payload.title),
        }),
    )
}

/// UDP Beacon Transmitter (Broadcasts presence to LAN)
async fn start_udp_beacon_broadcaster() {
    tauri::async_runtime::spawn(async move {
        // Bind to ephemeral port
        let socket = match UdpSocket::bind("0.0.0.0:0").await {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[peer-sync] Failed to bind beacon broadcaster socket: {}", e);
                return;
            }
        };

        if let Err(e) = socket.set_broadcast(true) {
            eprintln!("[peer-sync] Failed to enable broadcast on socket: {}", e);
        }

        let broadcast_addr: SocketAddr = format!("255.255.255.255:{}", DISCOVERY_UDP_PORT)
            .parse()
            .unwrap();

        loop {
            tokio::time::sleep(Duration::from_secs(BEACON_INTERVAL_SECONDS)).await;

            let (is_broadcasting, beacon) = {
                let state = PEER_SYNC_STATE.read().await;
                let is_b = state.is_broadcasting.load(Ordering::Relaxed);
                let b = BeaconMessage {
                    id: state.my_id.clone(),
                    name: state.my_name.clone(),
                    os: state.os.clone(),
                    sync_port: state.sync_port,
                    app_version: "0.1.0".to_string(),
                    capabilities: vec![
                        "dev_server".to_string(),
                        "repeater".to_string(),
                        "history".to_string(),
                        "raw_text".to_string(),
                    ],
                    timestamp: get_now_epoch_secs(),
                };
                (is_b, b)
            };

            if !is_broadcasting {
                continue;
            }

            if let Ok(bytes) = serde_json::to_vec(&beacon) {
                let _ = socket.send_to(&bytes, broadcast_addr).await;
            }
        }
    });
}

/// UDP Discovery Listener (Receives beacons from other peers on LAN)
async fn start_udp_discovery_listener(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Try to bind port
        let addr = SocketAddr::from(([0, 0, 0, 0], DISCOVERY_UDP_PORT));
        let socket = match UdpSocket::bind(addr).await {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[peer-sync] Failed to bind discovery UDP listener on {}: {}", addr, e);
                return;
            }
        };

        let mut buf = [0u8; 4096];

        loop {
            match socket.recv_from(&mut buf).await {
                Ok((len, peer_addr)) => {
                    let data = &buf[..len];
                    if let Ok(beacon) = serde_json::from_slice::<BeaconMessage>(data) {
                        let my_id = {
                            let state = PEER_SYNC_STATE.read().await;
                            state.my_id.clone()
                        };

                        // Ignore our own broadcast
                        if beacon.id == my_id {
                            continue;
                        }

                        let sender_ip = peer_addr.ip().to_string();
                        let peer_info = PeerInfo {
                            id: beacon.id.clone(),
                            name: beacon.name,
                            os: beacon.os,
                            ip: sender_ip,
                            sync_port: beacon.sync_port,
                            app_version: beacon.app_version,
                            capabilities: beacon.capabilities,
                            last_seen: get_now_epoch_secs(),
                            is_self: false,
                        };

                        let should_emit = {
                            let state = PEER_SYNC_STATE.read().await;
                            let mut peers = state.peers.write().await;
                            let prev = peers.insert(beacon.id, peer_info);
                            prev.is_none() // New peer joined
                        };

                        if should_emit {
                            emit_peers_updated(&app).await;
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[peer-sync] UDP recv error: {}", e);
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }
            }
        }
    });
}

/// Watcher that removes inactive peers after TTL expiry
async fn start_peer_pruning_watcher(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(2)).await;

            let now = get_now_epoch_secs();
            let mut removed_any = false;

            {
                let state = PEER_SYNC_STATE.read().await;
                let mut peers = state.peers.write().await;
                let initial_len = peers.len();
                peers.retain(|_, peer| now.saturating_sub(peer.last_seen) < PEER_TTL_SECONDS);
                if peers.len() != initial_len {
                    removed_any = true;
                }
            }

            if removed_any {
                emit_peers_updated(&app).await;
            }
        }
    });
}

async fn emit_peers_updated(app: &AppHandle) {
    let peer_list = get_discovered_peers_internal().await;
    let _ = app.emit("peer-discovery:peers-updated", &peer_list);
}

async fn get_discovered_peers_internal() -> Vec<PeerInfo> {
    let state = PEER_SYNC_STATE.read().await;
    let peers = state.peers.read().await;
    let mut list: Vec<PeerInfo> = peers.values().cloned().collect();
    list.sort_by(|a, b| a.name.cmp(&b.name));
    list
}

// ── TAURI COMMANDS ──

#[tauri::command]
pub async fn get_discovered_peers() -> Result<Vec<PeerInfo>, String> {
    Ok(get_discovered_peers_internal().await)
}

#[tauri::command]
pub async fn get_my_peer_info() -> Result<MyPeerInfo, String> {
    let state = PEER_SYNC_STATE.read().await;
    Ok(MyPeerInfo {
        id: state.my_id.clone(),
        name: state.my_name.clone(),
        os: state.os.clone(),
        ip: get_primary_lan_ip(),
        sync_port: state.sync_port,
        is_broadcasting: state.is_broadcasting.load(Ordering::Relaxed),
    })
}

#[tauri::command]
pub async fn set_peer_broadcast(enabled: bool) -> Result<bool, String> {
    let state = PEER_SYNC_STATE.read().await;
    state.is_broadcasting.store(enabled, Ordering::Relaxed);
    Ok(enabled)
}

#[tauri::command]
pub async fn set_device_name(app: AppHandle, name: String) -> Result<String, String> {
    let trimmed = name.trim().to_string();
    if trimmed.is_empty() {
        return Err("Device name cannot be empty".to_string());
    }

    {
        let mut state = PEER_SYNC_STATE.write().await;
        state.my_name = trimmed.clone();
    }

    emit_peers_updated(&app).await;
    Ok(trimmed)
}

#[tauri::command]
pub async fn share_data_to_peer(
    target_ip: String,
    target_port: u16,
    share_type: String,
    title: String,
    payload: serde_json::Value,
) -> Result<bool, String> {
    let (my_id, my_name, my_os) = {
        let state = PEER_SYNC_STATE.read().await;
        (state.my_id.clone(), state.my_name.clone(), state.os.clone())
    };

    let body = SharedDataPayload {
        id: format!("share-{}", &uuid::Uuid::new_v4().to_string()[..8]),
        sender_id: my_id,
        sender_name: my_name,
        sender_os: my_os,
        sender_ip: get_primary_lan_ip(),
        share_type,
        title,
        payload,
        timestamp: get_now_iso_string(),
    };

    let url = format!("http://{}:{}/api/v1/peer/share", target_ip, target_port);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to send data to peer: {}", e))?;

    if res.status().is_success() {
        Ok(true)
    } else {
        Err(format!("Peer returned status: {}", res.status()))
    }
}

#[tauri::command]
pub async fn ping_peer(target_ip: String, target_port: u16) -> Result<u64, String> {
    let url = format!("http://{}:{}/api/v1/peer/ping", target_ip, target_port);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    let start = Instant::now();
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Ping failed: {}", e))?;

    if res.status().is_success() {
        let duration = start.elapsed().as_millis() as u64;
        Ok(duration)
    } else {
        Err(format!("Peer returned ping error {}", res.status()))
    }
}

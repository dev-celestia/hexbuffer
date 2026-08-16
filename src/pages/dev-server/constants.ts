export const DEFAULT_DEV_SERVER_PORT = 8080;

export const PORT_PRESETS = [8080, 5173, 3000, 1420, 1212, 8000, 4173] as const;

export const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export const SCRIPT_PRESETS = [
  { label: 'Tauri Desktop (pnpm tauri dev)', command: 'pnpm tauri dev', port: 1420 },
  { label: 'Next.js Web (Celestia)', command: 'pnpm dev --filter=web', port: 1212 },
  { label: 'Full Monorepo Dev', command: 'pnpm dev', port: 1212 },
  { label: 'Vite / React', command: 'pnpm dev', port: 5173 },
  { label: 'API Server', command: 'pnpm dev --filter=@workspace/api', port: 3000 },
  { label: 'npm run dev', command: 'npm run dev', port: 3000 },
  { label: 'Tauri Android', command: 'pnpm tauri android dev', port: 1420 },
  { label: 'Tauri iOS', command: 'pnpm tauri ios dev', port: 1420 },
  { label: 'Rust Backend (cargo run)', command: 'cd src-tauri && cargo run', port: 1420 },
] as const;

export const HOTSPOT_TIPS = [
  {
    title: 'USB Tethering',
    desc: 'Connect phone via USB and enable USB Tethering in mobile settings. Lowest latency connection.',
    badge: 'Fastest',
  },
  {
    title: 'Personal Hotspot',
    desc: 'Turn on Wi-Fi Hotspot on phone and connect this computer. Scan the QR code to open.',
    badge: 'Wireless',
  },
  {
    title: 'Local Wi-Fi Network',
    desc: 'Ensure both computer and mobile devices are connected to the same Wi-Fi router subnet.',
    badge: 'Standard',
  },
] as const;

export const PEER_SHARE_TYPES = [
  { id: 'dev_server_url', label: 'Dev Server URL', desc: 'Share live preview URL directly to peer' },
  { id: 'raw_text', label: 'Text / Note', desc: 'Send text, curl command, or snippet' },
  { id: 'http_request', label: 'HTTP Request', desc: 'Share proxy request with headers & body' },
  { id: 'repeater_tab', label: 'Repeater Tab', desc: 'Send active repeater tab configuration' },
] as const;

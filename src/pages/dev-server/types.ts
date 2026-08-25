export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  interface_type: string;
  is_recommended: boolean;
}

export interface DevProcessStatus {
  is_running: boolean;
  pid: number | null;
  cwd: string;
  command: string;
  port: number | null;
  started_at?: string | null;
}

export interface ProcessOutputLine {
  id: string;
  timestamp: string;
  stream: 'stdout' | 'stderr' | 'system';
  line: string;
}

export type SharePayloadType =
  | 'dev_server_url'
  | 'raw_text'
  | 'http_request'
  | 'repeater_tab'
  | (string & {});

export interface PeerDevice {
  id: string;
  name: string;
  os: string;
  ip: string;
  sync_port: number;
  app_version: string;
  capabilities: string[];
  last_seen: number;
  is_self: boolean;
}

export interface MyPeerInfo {
  id: string;
  name: string;
  os: string;
  ip: string;
  sync_port: number;
  is_broadcasting: boolean;
}

export interface SharedDataPayload {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_os: string;
  sender_ip: string;
  share_type: string;
  title: string;
  payload: any;
  timestamp: string;
}

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

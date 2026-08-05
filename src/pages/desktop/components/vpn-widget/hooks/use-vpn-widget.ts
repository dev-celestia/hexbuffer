import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';

export type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Must match CONNECT_TIMEOUT_SECS in vpn.rs */
export const CONNECT_TIMEOUT_SECS = 60;

export interface UseVpnWidgetReturn {
  // State
  status: VpnStatus;
  configPath: string | null;
  protocol: string;
  username: string;
  password: string;
  logs: string[];
  showLogs: boolean;
  showSettings: boolean;
  logContainerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  connectingFor: number;

  // Setters
  setProtocol: (val: string) => void;
  setUsername: (val: string) => void;
  setPassword: (val: string) => void;
  setShowLogs: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
  clearLogs: () => void;

  // Handlers
  handleSelectFile: () => Promise<void>;
  handleConnectToggle: () => Promise<void>;
  handleRequestPermissions: () => Promise<void>;
  getFilename: (path: string | null) => string;
}

const STORAGE_KEYS = {
  CONFIG_PATH: 'vpn_config_path',
  PROTOCOL: 'vpn_protocol',
  USERNAME: 'vpn_username',
};

export function useVpnWidget(): UseVpnWidgetReturn {
  const [status, setStatus] = React.useState<VpnStatus>('disconnected');
  const [configPath, setConfigPathState] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.CONFIG_PATH);
    }
    return null;
  });
  const [protocol, setProtocolState] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.PROTOCOL) || 'udp';
    }
    return 'udp';
  });
  const [port, setPort] = React.useState(1337);
  const [username, setUsernameState] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.USERNAME) || '';
    }
    return '';
  });
  const [password, setPassword] = React.useState('');
  const [logs, setLogs] = React.useState<string[]>([]);
  const [showLogs, setShowLogs] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [connectingFor, setConnectingFor] = React.useState(0);

  const logContainerRef = React.useRef<HTMLDivElement>(null);

  const isActive = status === 'connecting' || status === 'connected';

  const setConfigPath = (path: string | null) => {
    setConfigPathState(path);
    if (typeof window !== 'undefined') {
      if (path) {
        localStorage.setItem(STORAGE_KEYS.CONFIG_PATH, path);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CONFIG_PATH);
      }
    }
  };

  const handleProtocolChange = (val: string) => {
    setProtocolState(val);
    setPort(val === 'udp' ? 1337 : 443);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.PROTOCOL, val);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsernameState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERNAME, val);
    }
  };

  // Init Tauri listeners + fetch initial status
  React.useEffect(() => {
    let unlistenLog: UnlistenFn | null = null;
    let unlistenStatus: UnlistenFn | null = null;

    const init = async () => {
      try {
        const res = await invoke<{ status: VpnStatus; logs: string[]; config_path?: string | null }>('get_vpn_status');
        setStatus(res.status);
        if (res.logs && res.logs.length > 0) {
          setLogs(res.logs);
        }
        if (res.config_path) {
          setConfigPath(res.config_path);
        } else if (typeof window !== 'undefined') {
          const savedPath = localStorage.getItem(STORAGE_KEYS.CONFIG_PATH);
          if (savedPath) {
            setConfigPathState(savedPath);
          }
        }
      } catch (e) {
        console.error('Failed to fetch VPN status', e);
      }

      unlistenLog = await listen<string>('vpn:log', (event) => {
        setLogs((prev) => [...prev, event.payload]);
      });

      unlistenStatus = await listen<{ status: VpnStatus; error: string | null }>('vpn:status', (event) => {
        setStatus(event.payload.status);
        if (event.payload.status === 'connected') {
          toast.success('VPN connected successfully');
        } else if (event.payload.status === 'error') {
          const isTimeout = event.payload.error?.toLowerCase().includes('timed out');
          if (isTimeout) {
            toast.error('Connection timed out', {
              description: `OpenVPN did not connect within ${CONNECT_TIMEOUT_SECS}s. Check your config or server.`,
              duration: 6000,
            });
          } else {
            toast.error(event.payload.error || 'VPN connection failed');
          }
        } else if (event.payload.status === 'disconnected') {
          toast.info('VPN disconnected');
        }
      });
    };

    init();

    return () => {
      unlistenLog?.();
      unlistenStatus?.();
    };
  }, []);

  // Elapsed counter: counts up every second while connecting, resets otherwise.
  React.useEffect(() => {
    if (status !== 'connecting') {
      setConnectingFor(0);
      return;
    }
    const interval = setInterval(() => {
      setConnectingFor((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-scroll logs to bottom on new entry
  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSelectFile = async () => {
    try {
      const selected = await openDialog({
        title: 'Select OpenVPN configuration (.ovpn)',
        filters: [{ name: 'OpenVPN config', extensions: ['ovpn', 'conf'] }],
      });
      if (selected && typeof selected === 'string') {
        setConfigPath(selected);
      }
    } catch (e) {
      console.error('File selection canceled or failed', e);
    }
  };

  const handleConnectToggle = async () => {
    if (isActive) {
      try {
        await invoke('stop_vpn');
        setLogs([]);
      } catch (e: any) {
        console.error(e);
        toast.error(e.toString() || 'Failed to stop VPN');
      }
      return;
    }

    if (!configPath) {
      toast.error('Please select an OpenVPN configuration file first.');
      return;
    }

    setStatus('connecting');
    setLogs([]);

    try {
      await invoke('start_vpn', {
        configPath,
        server: null,
        port: port || null,
        protocol: protocol || null,
        access: null,
        username: username || null,
        password: password || null,
      });
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      toast.error(e.toString() || 'Failed to start VPN');
    } finally {
      // Clear sensitive password from frontend React state
      setPassword('');
    }
  };

  const handleRequestPermissions = async () => {
    try {
      toast.info('Prompting for macOS administrator authorization...');
      await invoke('request_vpn_permissions');
      toast.success('Root permissions granted successfully!');
    } catch (e: any) {
      console.error(e);
    }
  };

  const getFilename = (path: string | null) => {
    if (!path) return 'No config selected';
    return path.split('/').pop() || path;
  };

  return {
    status,
    configPath,
    protocol,
    username,
    password,
    logs,
    showLogs,
    showSettings,
    logContainerRef,
    isActive,
    connectingFor,
    setProtocol: handleProtocolChange,
    setUsername: handleUsernameChange,
    setPassword,
    setShowLogs,
    setShowSettings,
    clearLogs: () => setLogs([]),
    handleSelectFile,
    handleConnectToggle,
    handleRequestPermissions,
    getFilename,
  };
}

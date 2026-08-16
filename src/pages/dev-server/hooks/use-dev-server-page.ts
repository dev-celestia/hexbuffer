import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import type { PageTabItem } from '@/components/tabs-layout/types';
import type {
  NetworkInterfaceInfo,
  DevProcessStatus,
  ProcessOutputLine,
} from '../types';
import { SCRIPT_PRESETS } from '../constants';
import { usePeerDiscovery } from './use-peer-discovery';

const DEFAULT_PROJECT_PATH = '/Users/arham/Desktop/project/celestia-starter';

export function useDevServerPage() {
  // ── Active Tab ──
  const [activeTabId, setActiveTabId] = useState<string>('process');

  // ── Network Discovery ──
  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('127.0.0.1');
  const [isLoadingIps, setIsLoadingIps] = useState<boolean>(false);

  // ── Process Manager State ──
  const [port, setPort] = useState<number>(1212);
  const [projectCwd, setProjectCwd] = useState<string>(DEFAULT_PROJECT_PATH);
  const [customCommand, setCustomCommand] = useState<string>('pnpm dev --filter=web');
  const [processStatus, setProcessStatus] = useState<DevProcessStatus>({
    is_running: false,
    pid: null,
    cwd: DEFAULT_PROJECT_PATH,
    command: 'pnpm dev --filter=web',
    port: 1212,
    started_at: null,
  });
  const [processLogs, setProcessLogs] = useState<ProcessOutputLine[]>([]);
  const [isStartingProcess, setIsStartingProcess] = useState<boolean>(false);
  const [processLogSearch, setProcessLogSearch] = useState<string>('');

  // ── QR Code View ──
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // ── Tabs Definition ──
  const tabs: PageTabItem[] = useMemo(
    () => [
      {
        id: 'process',
        name: 'Live Dev Process',
        status: processStatus.is_running
          ? { kind: 'running', label: `Port ${processStatus.port || port}` }
          : undefined,
      },
      {
        id: 'network',
        name: 'Network Diagnostics',
      },
      {
        id: 'peers',
        name: 'LAN Peers & Sync',
      },
    ],
    [processStatus.is_running, processStatus.port, port]
  );

  // ── Discover Network IPs ──
  const refreshIps = useCallback(async () => {
    setIsLoadingIps(true);
    try {
      const ips = await invoke<NetworkInterfaceInfo[]>('get_available_ips');
      setInterfaces(ips);
      if (ips.length > 0) {
        const best = ips.find((i) => i.is_recommended) || ips[0];
        setSelectedIp((prev) => (ips.some((i) => i.ip === prev) ? prev : best.ip));
      }
    } catch (err) {
      console.error('Failed to get network interfaces:', err);
      toast.error('Failed to discover network interfaces');
    } finally {
      setIsLoadingIps(false);
    }
  }, []);

  // ── Check Initial Status ──
  const checkStatus = useCallback(async () => {
    try {
      const procState = await invoke<DevProcessStatus>('get_dev_process_status');
      setProcessStatus(procState);

      if (procState.is_running) {
        setProjectCwd(procState.cwd);
        setCustomCommand(procState.command);
        if (procState.port) setPort(procState.port);
      }
    } catch (err) {
      console.error('Failed to get initial status:', err);
    }
  }, []);

  useEffect(() => {
    refreshIps();
    checkStatus();
  }, [refreshIps, checkStatus]);

  // ── Event Listeners ──
  useEffect(() => {
    let unlistenProcessOut: UnlistenFn | undefined;
    let unlistenPort: UnlistenFn | undefined;
    let unlistenStop: UnlistenFn | undefined;

    const setupListeners = async () => {
      try {
        unlistenProcessOut = await listen<ProcessOutputLine>('dev-server:process-output', (event) => {
          setProcessLogs((prev) => [...prev.slice(-1000), event.payload]);
        });

        unlistenPort = await listen<number>('dev-server:port-detected', (event) => {
          const detected = event.payload;
          setPort(detected);
          setProcessStatus((prev) => ({ ...prev, port: detected }));
          toast.success(`Port ${detected} detected!`, {
            description: `QR Code updated to http://${selectedIp}:${detected}`,
          });
        });

        unlistenStop = await listen('dev-server:process-stopped', () => {
          setProcessStatus((prev) => ({
            ...prev,
            is_running: false,
            pid: null,
          }));
        });
      } catch (err) {
        console.error('Failed to setup listeners:', err);
      }
    };

    setupListeners();

    return () => {
      if (unlistenProcessOut) unlistenProcessOut();
      if (unlistenPort) unlistenPort();
      if (unlistenStop) unlistenStop();
    };
  }, [selectedIp]);

  // ── Active Host URL ──
  const activePort = useMemo(() => {
    return processStatus.port || port;
  }, [processStatus.port, port]);

  const hostUrl = useMemo(() => {
    const activeIp = selectedIp || '127.0.0.1';
    return `http://${activeIp}:${activePort}`;
  }, [selectedIp, activePort]);

  // ── Peer Discovery Hook ──
  const peerDiscovery = usePeerDiscovery({
    activePort,
    isProcessRunning: processStatus.is_running,
    hostUrl,
  });

  // ── Regenerate QR Code ──
  useEffect(() => {
    let isMounted = true;
    const fetchQr = async () => {
      try {
        const svg = await invoke<string>('generate_qr_svg', { url: hostUrl });
        if (isMounted) {
          setQrSvg(svg);
        }
      } catch (err) {
        console.error('Failed to generate QR:', err);
      }
    };

    fetchQr();

    return () => {
      isMounted = false;
    };
  }, [hostUrl]);

  // ── Project Directory Dialog ──
  const handleSelectProjectDir = useCallback(async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Select Project Directory',
        defaultPath: projectCwd,
      });

      if (selected && typeof selected === 'string') {
        setProjectCwd(selected);
        toast.success('Project folder selected', {
          description: selected,
        });
      }
    } catch (err) {
      console.error('Failed to open directory dialog:', err);
      toast.error('Could not select project folder');
    }
  }, [projectCwd]);

  // ── Process Manager Actions ──
  const handleStartProcess = useCallback(async () => {
    if (!projectCwd.trim()) {
      toast.error('Please select a project directory');
      return;
    }
    if (!customCommand.trim()) {
      toast.error('Please specify a command to execute');
      return;
    }

    setIsStartingProcess(true);
    setProcessLogs([]);
    try {
      const newStatus = await invoke<DevProcessStatus>('start_dev_process', {
        cwd: projectCwd.trim(),
        command: customCommand.trim(),
        defaultPort: port,
      });
      setProcessStatus(newStatus);
      toast.success(`Process launched (PID: ${newStatus.pid})`, {
        description: `Running '${customCommand}' in ${projectCwd}`,
      });
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : 'Failed to launch process';
      toast.error('Failed to launch process', {
        description: msg,
      });
    } finally {
      setIsStartingProcess(false);
    }
  }, [projectCwd, customCommand, port]);

  const handleStopProcess = useCallback(async () => {
    try {
      await invoke('stop_dev_process');
      setProcessStatus((prev) => ({
        ...prev,
        is_running: false,
        pid: null,
      }));
      toast.success('Process terminated');
    } catch (err) {
      console.error('Failed to stop process:', err);
      toast.error('Failed to terminate process');
    }
  }, []);

  const handleApplyScriptPreset = useCallback((preset: typeof SCRIPT_PRESETS[number]) => {
    setCustomCommand(preset.command);
    if (preset.port) {
      setPort(preset.port);
    }
    toast.info(`Preset applied: ${preset.label}`);
  }, []);

  const handleClearProcessLogs = useCallback(() => {
    setProcessLogs([]);
    toast.success('Console logs cleared');
  }, []);

  // ── Kill Port Action ──
  const [isKillingPort, setIsKillingPort] = useState<boolean>(false);

  const handleKillPort = useCallback(async (targetPort?: number) => {
    const p = targetPort || (processStatus.port || port);
    if (!p || p < 1 || p > 65535) {
      toast.error('Invalid port', {
        description: 'Please specify a valid port number (1 - 65535) to free.',
      });
      return;
    }

    setIsKillingPort(true);
    try {
      const msg = await invoke<string>('kill_port', { port: p });
      toast.success(`Port ${p} freed`, {
        description: msg,
      });
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : 'Failed to free port';
      toast.error(`Could not free port ${p}`, {
        description: msg,
      });
    } finally {
      setIsKillingPort(false);
    }
  }, [processStatus.port, port]);

  // ── Filtered Logs ──
  const filteredProcessLogs = useMemo(() => {
    if (!processLogSearch.trim()) return processLogs;
    const query = processLogSearch.toLowerCase();
    return processLogs.filter((p) => p.line.toLowerCase().includes(query));
  }, [processLogs, processLogSearch]);

  const isCurrentlyRunning = processStatus.is_running;

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    interfaces,
    selectedIp,
    setSelectedIp,
    port,
    setPort,
    // Process State
    projectCwd,
    setProjectCwd,
    customCommand,
    setCustomCommand,
    processStatus,
    processLogs: filteredProcessLogs,
    rawProcessLogsCount: processLogs.length,
    isStartingProcess,
    processLogSearch,
    setProcessLogSearch,
    // Kill Port
    isKillingPort,
    handleKillPort,
    // Peer Discovery
    peerDiscovery,
    // Unified Status
    isCurrentlyRunning,
    qrSvg,
    isQrModalOpen,
    setIsQrModalOpen,
    isLoadingIps,
    hostUrl,
    refreshIps,
    handleSelectProjectDir,
    handleStartProcess,
    handleStopProcess,
    handleApplyScriptPreset,
    handleClearProcessLogs,
  };
}

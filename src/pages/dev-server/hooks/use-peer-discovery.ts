import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from 'sonner';
import type { PeerDevice, MyPeerInfo, SharedDataPayload, SharePayloadType } from '../types';

export interface UsePeerDiscoveryOptions {
  activePort?: number;
  isProcessRunning?: boolean;
  hostUrl?: string;
}

export function usePeerDiscovery(_options?: UsePeerDiscoveryOptions) {
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [myInfo, setMyInfo] = useState<MyPeerInfo | null>(null);
  const [isLoadingPeers, setIsLoadingPeers] = useState<boolean>(false);
  const [receivedItems, setReceivedItems] = useState<SharedDataPayload[]>([]);
  
  // Dialog / Modal State
  const [selectedPeer, setSelectedPeer] = useState<PeerDevice | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState<boolean>(false);
  const [customDeviceName, setCustomDeviceName] = useState<string>('');
  
  // Custom Share Form State
  const [shareType, setShareType] = useState<SharePayloadType>('dev_server_url');
  const [shareTitle, setShareTitle] = useState<string>('');
  const [shareContent, setShareContent] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [pingLatencies, setPingLatencies] = useState<Record<string, number>>({});
  const [isPinging, setIsPinging] = useState<Record<string, boolean>>({});

  // ── Fetch Initial Data ──
  const fetchMyInfo = useCallback(async () => {
    try {
      await invoke('init_peer_sync');
      const info = await invoke<MyPeerInfo>('get_my_peer_info');
      setMyInfo(info);
      setCustomDeviceName(info.name);
    } catch (err) {
      console.error('Failed to get my peer info:', err);
    }
  }, []);

  const refreshPeers = useCallback(async () => {
    setIsLoadingPeers(true);
    try {
      const list = await invoke<PeerDevice[]>('get_discovered_peers');
      setPeers(list);
    } catch (err) {
      console.error('Failed to get discovered peers:', err);
    } finally {
      setIsLoadingPeers(false);
    }
  }, []);

  useEffect(() => {
    fetchMyInfo();
    refreshPeers();
  }, [fetchMyInfo, refreshPeers]);

  // ── Listen for Peer Discovery and Inbound Data ──
  useEffect(() => {
    let unlistenPeers: UnlistenFn | undefined;
    let unlistenData: UnlistenFn | undefined;

    const setupListeners = async () => {
      try {
        unlistenPeers = await listen<PeerDevice[]>('peer-discovery:peers-updated', (event) => {
          setPeers(event.payload || []);
        });

        unlistenData = await listen<SharedDataPayload>('peer-sync:data-received', (event) => {
          const payload = event.payload;
          setReceivedItems((prev) => [payload, ...prev]);

          toast.success(`Received from ${payload.sender_name}`, {
            description: `${payload.title} (${payload.share_type})`,
            duration: 6000,
          });
        });
      } catch (err) {
        console.error('Failed to setup peer listeners:', err);
      }
    };

    setupListeners();

    return () => {
      if (unlistenPeers) unlistenPeers();
      if (unlistenData) unlistenData();
    };
  }, []);

  // ── Toggle Broadcast Visibility ──
  const handleToggleBroadcast = useCallback(async (enabled: boolean) => {
    try {
      if (enabled) {
        await invoke('init_peer_sync');
      }
      await invoke('set_peer_broadcast', { enabled });
      setMyInfo((prev) => (prev ? { ...prev, is_broadcasting: enabled } : null));
      toast.success(enabled ? 'Discovery broadcasting enabled' : 'Stealth mode: discovery disabled');
    } catch (err) {
      console.error('Failed to toggle broadcast:', err);
      toast.error('Failed to update broadcast mode');
    }
  }, []);

  // ── Update Device Name ──
  const handleUpdateDeviceName = useCallback(async () => {
    if (!customDeviceName.trim()) {
      toast.error('Device name cannot be empty');
      return;
    }
    try {
      const updated = await invoke<string>('set_device_name', { name: customDeviceName.trim() });
      setMyInfo((prev) => (prev ? { ...prev, name: updated } : null));
      setIsEditNameModalOpen(false);
      toast.success(`Device name updated to "${updated}"`);
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : 'Failed to update device name';
      toast.error(msg);
    }
  }, [customDeviceName]);

  // ── Ping Peer ──
  const handlePingPeer = useCallback(async (peer: PeerDevice) => {
    setIsPinging((prev) => ({ ...prev, [peer.id]: true }));
    try {
      const latencyMs = await invoke<number>('ping_peer', {
        targetIp: peer.ip,
        targetPort: peer.sync_port,
      });
      setPingLatencies((prev) => ({ ...prev, [peer.id]: latencyMs }));
      toast.success(`Ping response from ${peer.name}: ${latencyMs}ms`);
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : 'Peer unreachable';
      toast.error(`Ping failed for ${peer.name}`, { description: msg });
    } finally {
      setIsPinging((prev) => ({ ...prev, [peer.id]: false }));
    }
  }, []);

  // ── Share Active Dev Server URL ──
  const handleShareActiveDevServer = useCallback(
    async (peer: PeerDevice, hostUrl: string) => {
      try {
        await invoke('share_data_to_peer', {
          targetIp: peer.ip,
          targetPort: peer.sync_port,
          shareType: 'dev_server_url',
          title: 'Live Dev Server Link',
          payload: { url: hostUrl },
        });
        toast.success(`Dev Server URL sent to ${peer.name}!`);
      } catch (err: unknown) {
        const msg = typeof err === 'string' ? err : 'Failed to send URL';
        toast.error(`Failed to send URL to ${peer.name}`, { description: msg });
      }
    },
    []
  );

  // ── Share Custom Payload Dialog ──
  const openShareModal = useCallback((peer: PeerDevice, defaultUrl?: string) => {
    setSelectedPeer(peer);
    if (defaultUrl) {
      setShareType('dev_server_url');
      setShareTitle('Live Dev Server Link');
      setShareContent(defaultUrl);
    } else {
      setShareType('raw_text');
      setShareTitle('Shared Note');
      setShareContent('');
    }
    setIsShareModalOpen(true);
  }, []);

  const handleSendCustomShare = useCallback(async () => {
    if (!selectedPeer) return;
    if (!shareTitle.trim()) {
      toast.error('Please provide a title');
      return;
    }
    if (!shareContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setIsSending(true);
    try {
      let parsedPayload: any = shareContent;
      if (shareType === 'dev_server_url') {
        parsedPayload = { url: shareContent.trim() };
      } else {
        try {
          parsedPayload = JSON.parse(shareContent);
        } catch {
          parsedPayload = { text: shareContent };
        }
      }

      await invoke('share_data_to_peer', {
        targetIp: selectedPeer.ip,
        targetPort: selectedPeer.sync_port,
        shareType,
        title: shareTitle.trim(),
        payload: parsedPayload,
      });

      toast.success(`Sent to ${selectedPeer.name}!`);
      setIsShareModalOpen(false);
    } catch (err: unknown) {
      const msg = typeof err === 'string' ? err : 'Send failed';
      toast.error(`Failed to send to ${selectedPeer.name}`, { description: msg });
    } finally {
      setIsSending(false);
    }
  }, [selectedPeer, shareTitle, shareContent, shareType]);

  const handleClearReceivedItems = useCallback(() => {
    setReceivedItems([]);
    toast.success('Received shares inbox cleared');
  }, []);

  return {
    peers,
    myInfo,
    isLoadingPeers,
    receivedItems,
    selectedPeer,
    isShareModalOpen,
    setIsShareModalOpen,
    isEditNameModalOpen,
    setIsEditNameModalOpen,
    customDeviceName,
    setCustomDeviceName,
    shareType,
    setShareType,
    shareTitle,
    setShareTitle,
    shareContent,
    setShareContent,
    isSending,
    pingLatencies,
    isPinging,
    refreshPeers,
    handleToggleBroadcast,
    handleUpdateDeviceName,
    handlePingPeer,
    handleShareActiveDevServer,
    openShareModal,
    handleSendCustomShare,
    handleClearReceivedItems,
  };
}

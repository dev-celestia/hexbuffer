import React, { useState } from 'react';
import {
  Button,
  Input,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@celestia-project/ui';
import {
  BroadcastIcon,
  DevicesIcon,
  DesktopIcon,
  DeviceMobileIcon,
  PaperPlaneRightIcon,
  ArrowsClockwiseIcon,
  PencilSimpleIcon,
  LightningIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  ShareNetworkIcon,
  WifiHighIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { PEER_SHARE_TYPES } from '../constants';
import type { PeerDevice, MyPeerInfo, SharedDataPayload, SharePayloadType } from '../types';

interface DevServerPeersPaneProps {
  peers: PeerDevice[];
  myInfo: MyPeerInfo | null;
  isLoadingPeers: boolean;
  receivedItems: SharedDataPayload[];
  selectedPeer: PeerDevice | null;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isEditNameModalOpen: boolean;
  setIsEditNameModalOpen: (open: boolean) => void;
  customDeviceName: string;
  setCustomDeviceName: (name: string) => void;
  shareType: SharePayloadType;
  setShareType: (type: SharePayloadType) => void;
  shareTitle: string;
  setShareTitle: (title: string) => void;
  shareContent: string;
  setShareContent: (content: string) => void;
  isSending: boolean;
  pingLatencies: Record<string, number>;
  isPinging: Record<string, boolean>;
  hostUrl: string;
  onRefreshPeers: () => void;
  onToggleBroadcast: (enabled: boolean) => void;
  onUpdateDeviceName: () => void;
  onPingPeer: (peer: PeerDevice) => void;
  onShareActiveDevServer: (peer: PeerDevice, hostUrl: string) => void;
  onOpenShareModal: (peer: PeerDevice, defaultUrl?: string) => void;
  onSendCustomShare: () => void;
  onClearReceivedItems: () => void;
}

export function DevServerPeersPane({
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
  hostUrl,
  onRefreshPeers,
  onToggleBroadcast,
  onUpdateDeviceName,
  onPingPeer,
  onShareActiveDevServer,
  onOpenShareModal,
  onSendCustomShare,
  onClearReceivedItems,
}: DevServerPeersPaneProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getOsIcon = (os: string) => {
    const o = os.toLowerCase();
    if (o.includes('mac') || o.includes('darwin')) {
      return <DesktopIcon size={18} className="text-blue-500" />;
    }
    if (o.includes('win')) {
      return <DesktopIcon size={18} className="text-cyan-500" />;
    }
    if (o.includes('ios') || o.includes('android') || o.includes('mobile')) {
      return <DeviceMobileIcon size={18} className="text-emerald-500" />;
    }
    return <DesktopIcon size={18} className="text-purple-500" />;
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div
      className={
        // Layout & Positioning
        'flex flex-col gap-6 ' +
        // Sizing & Spacing
        'w-full'
      }
    >
      {/* ── Top Bar: Local Identity & Discovery Control ── */}
      <div
        className={
          // Layout & Positioning
          'flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ' +
          // Sizing & Spacing
          'p-4 rounded-xl ' +
          // Backgrounds & Borders
          'bg-card border border-border/70 shadow-xs'
        }
      >
        <div
          className={
            // Layout & Positioning
            'flex items-center gap-3.5'
          }
        >
          <div
            className={
              // Layout & Positioning
              'flex items-center justify-center ' +
              // Sizing & Spacing
              'w-10 h-10 rounded-xl ' +
              // Backgrounds & Borders
              'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }
          >
            <BroadcastIcon size={22} className={myInfo?.is_broadcasting ? 'animate-pulse' : 'opacity-40'} />
          </div>
          <div>
            <div
              className={
                // Layout & Positioning
                'flex items-center gap-2'
              }
            >
              <h2
                className={
                  // Typography
                  'text-sm font-semibold text-foreground'
                }
              >
                {myInfo?.name || 'Local Device'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditNameModalOpen(true)}
                className={
                  // Layout & Positioning
                  'flex items-center justify-center ' +
                  // Sizing & Spacing
                  'p-1 rounded-md ' +
                  // Backgrounds & Borders
                  'hover:bg-muted text-muted-foreground hover:text-foreground ' +
                  // Interactive & States
                  'transition-colors'
                }
                title="Edit Device Name"
              >
                <PencilSimpleIcon size={13} />
              </button>
              <Badge
                variant="outline"
                className={
                  // Sizing & Spacing
                  'text-[10px] px-1.5 py-0 ' +
                  // Backgrounds & Borders
                  (myInfo?.is_broadcasting
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-muted text-muted-foreground border-border')
                }
              >
                {myInfo?.is_broadcasting ? 'Broadcasting on LAN' : 'Stealth / Hidden'}
              </Badge>
            </div>
            <div
              className={
                // Sizing & Spacing
                'mt-0.5 ' +
                // Typography
                'text-xs font-mono text-muted-foreground'
              }
            >
              IP: <span className="text-foreground font-medium">{myInfo?.ip || '127.0.0.1'}</span> • Sync Port:{' '}
              <span className="text-foreground font-medium">{myInfo?.sync_port || 9879}</span>
            </div>
          </div>
        </div>

        <div
          className={
            // Layout & Positioning
            'flex items-center gap-2 w-full md:w-auto justify-end'
          }
        >
          <Button
            variant="outline"
            size="xs"
            onClick={() => onToggleBroadcast(!myInfo?.is_broadcasting)}
            className={
              // Layout & Positioning
              'flex items-center gap-1.5 ' +
              // Sizing & Spacing
              'text-xs'
            }
          >
            {myInfo?.is_broadcasting ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
            {myInfo?.is_broadcasting ? 'Hide Device' : 'Broadcast Device'}
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={onRefreshPeers}
            disabled={isLoadingPeers}
            className={
              // Layout & Positioning
              'flex items-center gap-1.5 ' +
              // Sizing & Spacing
              'text-xs'
            }
          >
            <ArrowsClockwiseIcon size={14} className={isLoadingPeers ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Section: Discovered Peers & Inbound Shares Grid ── */}
      <div
        className={
          // Layout & Positioning
          'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'
        }
      >
        {/* Left Column: Discovered Peer Devices (7 cols) */}
        <div
          className={
            // Layout & Positioning
            'lg:col-span-7 flex flex-col gap-4'
          }
        >
          <div
            className={
              // Layout & Positioning
              'flex items-center justify-between'
            }
          >
            <div
              className={
                // Layout & Positioning
                'flex items-center gap-2'
              }
            >
              <DevicesIcon size={18} className="text-emerald-500" />
              <h3
                className={
                  // Typography
                  'text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                }
              >
                Discovered Hexbuffer Peers ({peers.length})
              </h3>
            </div>
            <span
              className={
                // Typography
                'text-[11px] text-muted-foreground'
              }
            >
              Auto-discovers instances on same LAN / Wi-Fi
            </span>
          </div>

          {peers.length === 0 ? (
            <div
              className={
                // Layout & Positioning
                'flex flex-col items-center justify-center text-center ' +
                // Sizing & Spacing
                'p-8 rounded-xl min-h-[220px] ' +
                // Backgrounds & Borders
                'bg-card border border-dashed border-border/80'
              }
            >
              <div
                className={
                  // Layout & Positioning
                  'flex items-center justify-center ' +
                  // Sizing & Spacing
                  'w-12 h-12 rounded-full mb-3 ' +
                  // Backgrounds & Borders
                  'bg-muted/40 text-muted-foreground/60'
                }
              >
                <WifiHighIcon size={24} />
              </div>
              <h4
                className={
                  // Typography
                  'text-sm font-semibold text-foreground'
                }
              >
                Searching for Peers on Network...
              </h4>
              <p
                className={
                  // Sizing & Spacing
                  'mt-1 max-w-sm ' +
                  // Typography
                  'text-xs text-muted-foreground leading-relaxed'
                }
              >
                Open Hexbuffer on another computer or device connected to the same Wi-Fi subnet. They will appear here automatically.
              </p>
            </div>
          ) : (
            <div
              className={
                // Layout & Positioning
                'grid grid-cols-1 gap-3'
              }
            >
              {peers.map((peer) => {
                const latency = pingLatencies[peer.id];
                const isPeerPinging = isPinging[peer.id];

                return (
                  <div
                    key={peer.id}
                    className={
                      // Layout & Positioning
                      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 ' +
                      // Sizing & Spacing
                      'p-4 rounded-xl ' +
                      // Backgrounds & Borders
                      'bg-card border border-border/70 hover:border-emerald-500/40 ' +
                      // Interactive & States
                      'transition-all shadow-xs'
                    }
                  >
                    <div
                      className={
                        // Layout & Positioning
                        'flex items-center gap-3.5'
                      }
                    >
                      <div
                        className={
                          // Layout & Positioning
                          'flex items-center justify-center ' +
                          // Sizing & Spacing
                          'w-10 h-10 rounded-lg ' +
                          // Backgrounds & Borders
                          'bg-background border border-border/70 shadow-xs shrink-0'
                        }
                      >
                        {getOsIcon(peer.os)}
                      </div>
                      <div>
                        <div
                          className={
                            // Layout & Positioning
                            'flex items-center gap-2'
                          }
                        >
                          <span
                            className={
                              // Typography
                              'text-xs font-semibold text-foreground'
                            }
                          >
                            {peer.name}
                          </span>
                          <Badge
                            className={
                              // Sizing & Spacing
                              'text-[10px] px-1.5 py-0 ' +
                              // Backgrounds & Borders
                              'bg-emerald-600 text-white font-mono'
                            }
                          >
                            Online
                          </Badge>
                          {latency !== undefined && (
                            <span
                              className={
                                // Typography
                                'text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium'
                              }
                            >
                              {latency}ms
                            </span>
                          )}
                        </div>
                        <div
                          className={
                            // Sizing & Spacing
                            'mt-0.5 ' +
                            // Typography
                            'text-xs font-mono text-muted-foreground'
                          }
                        >
                          {peer.ip}:{peer.sync_port} • OS: {peer.os} • v{peer.app_version}
                        </div>
                      </div>
                    </div>

                    <div
                      className={
                        // Layout & Positioning
                        'flex items-center gap-2 shrink-0 self-end sm:self-center'
                      }
                    >
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onPingPeer(peer)}
                        disabled={isPeerPinging}
                        className={
                          // Layout & Positioning
                          'flex items-center gap-1 ' +
                          // Sizing & Spacing
                          'text-xs h-8 px-2'
                        }
                        title="Ping Peer"
                      >
                        <LightningIcon
                          size={14}
                          className={isPeerPinging ? 'animate-bounce text-amber-500' : 'text-amber-500'}
                        />
                        Ping
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onShareActiveDevServer(peer, hostUrl)}
                        className={
                          // Layout & Positioning
                          'flex items-center gap-1 ' +
                          // Sizing & Spacing
                          'text-xs h-8 px-2.5 ' +
                          // Backgrounds & Borders
                          'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                        }
                      >
                        <ShareNetworkIcon size={14} />
                        Share URL
                      </Button>

                      <Button
                        size="xs"
                        onClick={() => onOpenShareModal(peer, hostUrl)}
                        className={
                          // Layout & Positioning
                          'flex items-center gap-1.5 ' +
                          // Sizing & Spacing
                          'text-xs h-8 px-3'
                        }
                      >
                        <PaperPlaneRightIcon size={14} />
                        Share Data
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Inbound Shared Data Inbox (5 cols) */}
        <div
          className={
            // Layout & Positioning
            'lg:col-span-5 flex flex-col gap-4'
          }
        >
          <div
            className={
              // Layout & Positioning
              'flex items-center justify-between'
            }
          >
            <div
              className={
                // Layout & Positioning
                'flex items-center gap-2'
              }
            >
              <ShareNetworkIcon size={18} className="text-emerald-500" />
              <h3
                className={
                  // Typography
                  'text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                }
              >
                Received from Peers ({receivedItems.length})
              </h3>
            </div>
            {receivedItems.length > 0 && (
              <button
                type="button"
                onClick={onClearReceivedItems}
                className={
                  // Layout & Positioning
                  'flex items-center gap-1 ' +
                  // Typography
                  'text-xs text-muted-foreground hover:text-red-500 transition-colors'
                }
              >
                <TrashIcon size={13} />
                Clear
              </button>
            )}
          </div>

          {receivedItems.length === 0 ? (
            <div
              className={
                // Layout & Positioning
                'flex flex-col items-center justify-center text-center ' +
                // Sizing & Spacing
                'p-6 rounded-xl min-h-[220px] ' +
                // Backgrounds & Borders
                'bg-card border border-border/70 shadow-xs'
              }
            >
              <PaperPlaneRightIcon size={24} className="text-muted-foreground/40 mb-2" />
              <div
                className={
                  // Typography
                  'text-xs font-medium text-muted-foreground'
                }
              >
                No shared data received yet
              </div>
              <p
                className={
                  // Sizing & Spacing
                  'mt-1 max-w-xs ' +
                  // Typography
                  'text-[11px] text-muted-foreground/70'
                }
              >
                When another device shares a Dev Server link, HTTP request, or note, it will appear here in real time.
              </p>
            </div>
          ) : (
            <div
              className={
                // Layout & Positioning
                'flex flex-col gap-3 max-h-[520px] overflow-y-auto'
              }
            >
              {receivedItems.map((item) => {
                const isCopied = copiedId === item.id;
                const displayPayload =
                  typeof item.payload === 'string'
                    ? item.payload
                    : item.payload?.url || item.payload?.text || JSON.stringify(item.payload, null, 2);

                return (
                  <div
                    key={item.id}
                    className={
                      // Layout & Positioning
                      'flex flex-col gap-2.5 ' +
                      // Sizing & Spacing
                      'p-3.5 rounded-xl ' +
                      // Backgrounds & Borders
                      'bg-card border border-border/70 shadow-xs'
                    }
                  >
                    <div
                      className={
                        // Layout & Positioning
                        'flex items-center justify-between'
                      }
                    >
                      <div
                        className={
                          // Layout & Positioning
                          'flex items-center gap-2'
                        }
                      >
                        <span
                          className={
                            // Typography
                            'text-xs font-semibold text-foreground'
                          }
                        >
                          {item.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            // Sizing & Spacing
                            'text-[10px] px-1.5 py-0 ' +
                            // Backgrounds & Borders
                            'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono'
                          }
                        >
                          {item.share_type}
                        </Badge>
                      </div>

                      <span
                        className={
                          // Typography
                          'text-[10px] text-muted-foreground font-mono'
                        }
                      >
                        {item.sender_name}
                      </span>
                    </div>

                    <div
                      className={
                        // Sizing & Spacing
                        'p-2.5 rounded-lg ' +
                        // Backgrounds & Borders
                        'bg-muted/30 border border-border/50 font-mono text-[11px] text-foreground/90 break-all max-h-28 overflow-y-auto'
                      }
                    >
                      {displayPayload}
                    </div>

                    <div
                      className={
                        // Layout & Positioning
                        'flex items-center justify-between pt-1'
                      }
                    >
                      <span
                        className={
                          // Typography
                          'text-[10px] text-muted-foreground'
                        }
                      >
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>

                      <div
                        className={
                          // Layout & Positioning
                          'flex items-center gap-1.5'
                        }
                      >
                        {item.payload?.url && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => window.open(item.payload.url, '_blank')}
                            className={
                              // Sizing & Spacing
                              'h-7 text-[11px] px-2'
                            }
                          >
                            Open Link
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleCopyText(item.id, displayPayload)}
                          className={
                            // Layout & Positioning
                            'flex items-center gap-1 ' +
                            // Sizing & Spacing
                            'h-7 text-[11px] px-2'
                          }
                        >
                          {isCopied ? <CheckIcon size={12} className="text-emerald-500" /> : <CopyIcon size={12} />}
                          {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog 1: Share Data to Peer Modal ── */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <PaperPlaneRightIcon size={18} className="text-emerald-500" />
              Share Data to {selectedPeer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Share Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payload Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PEER_SHARE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShareType(t.id as SharePayloadType);
                      setShareTitle(t.label);
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      shareType === t.id
                        ? 'border-emerald-500 bg-emerald-500/10 font-medium text-foreground'
                        : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className="font-semibold text-foreground">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Title / Subject</label>
              <Input
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="e.g. Live Dev Server Link"
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Content Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Content / Payload</label>
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Enter URL, text snippet, or JSON payload to send..."
                rows={4}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsShareModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={onSendCustomShare}
                disabled={isSending || !shareTitle.trim() || !shareContent.trim()}
                className="text-xs flex items-center gap-1.5"
              >
                <PaperPlaneRightIcon size={14} className={isSending ? 'animate-spin' : ''} />
                {isSending ? 'Sending...' : 'Send to Peer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Edit Device Name Modal ── */}
      <Dialog open={isEditNameModalOpen} onOpenChange={setIsEditNameModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <PencilSimpleIcon size={18} className="text-emerald-500" />
              Change Broadcasting Name
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Device Broadcast Name</label>
              <Input
                value={customDeviceName}
                onChange={(e) => setCustomDeviceName(e.target.value)}
                placeholder="e.g. Arham's MacBook Pro"
                className="h-8 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">
                This name is broadcasted to other Hexbuffer apps on your local Wi-Fi / network.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsEditNameModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button size="xs" onClick={onUpdateDeviceName} className="text-xs">
                Save Name
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

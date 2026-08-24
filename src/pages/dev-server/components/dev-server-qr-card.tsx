import React from 'react';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@celestia-project/ui';
import {
  CopyIcon,
  CheckIcon,
  QrCodeIcon,
  DeviceMobileCameraIcon,
  MagnifyingGlassPlusIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { HOTSPOT_TIPS } from '../constants';
import type { NetworkInterfaceInfo } from '../types';
import { DevServerInterfaceSelector } from './dev-server-interface-selector';

interface DevServerQrCardProps {
  hostUrl: string;
  qrSvg: string;
  isRunning?: boolean;
  isQrModalOpen: boolean;
  setIsQrModalOpen: (open: boolean) => void;
  interfaces?: NetworkInterfaceInfo[];
  selectedIp?: string;
  onSelectIp?: (ip: string) => void;
  isLoadingIps?: boolean;
  onRefreshIps?: () => void;
  showTips?: boolean;
}

export function DevServerQrCard({
  hostUrl,
  qrSvg,
  isRunning = false,
  isQrModalOpen,
  setIsQrModalOpen,
  interfaces,
  selectedIp,
  onSelectIp,
  isLoadingIps,
  onRefreshIps,
  showTips = true,
}: DevServerQrCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hostUrl);
      setCopied(true);
      toast.success('URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div
      className={
        // Layout & Positioning
        'flex flex-col gap-4 ' +
        // Sizing & Spacing
        'p-4 rounded-xl ' +
        // Backgrounds & Borders
        'bg-card border border-border/70 shadow-xs'
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCodeIcon size={18} className="text-emerald-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mobile Connect & QR Share
          </h2>
        </div>

        {isRunning && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          >
            Live Broadcast
          </Badge>
        )}
      </div>

      {/* ── Scannable URL Banner ── */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/60">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <DeviceMobileCameraIcon size={16} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-mono font-medium text-foreground truncate select-all">
            {hostUrl}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2.5 text-xs flex items-center gap-1.5 shrink-0 transition-transform duration-150 active:scale-[0.97]"
        >
          {copied ? <CheckIcon size={13} className="text-emerald-500" /> : <CopyIcon size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* ── Compact Network Interface Selector ── */}
      {interfaces && selectedIp && onSelectIp && (
        <DevServerInterfaceSelector
          interfaces={interfaces}
          selectedIp={selectedIp}
          onSelectIp={onSelectIp}
          isLoadingIps={isLoadingIps}
          onRefreshIps={onRefreshIps}
          variant="compact"
        />
      )}

      {/* ── QR Code View ── */}
      <div className="flex flex-col items-center justify-center py-3 px-4 rounded-lg bg-muted/20 border border-border/40">
        {qrSvg ? (
          <div
            className="group relative flex flex-col items-center cursor-pointer"
            onClick={() => setIsQrModalOpen(true)}
          >
            <div
              className="overflow-hidden p-2.5 rounded-lg bg-zinc-900 border border-border/60 transition-transform duration-200 group-hover:scale-[1.02]"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2 group-hover:text-foreground transition-colors">
              <MagnifyingGlassPlusIcon size={13} />
              Click to enlarge QR
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-36 text-center text-xs text-muted-foreground">
            <QrCodeIcon size={32} className="opacity-30 mb-2" />
            Generating QR code…
          </div>
        )}
      </div>

      {/* ── Connection Tips ── */}
      {showTips && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <InfoIcon size={13} />
            Quick Connection Guide
          </div>
          <div className="flex flex-col gap-1.5">
            {HOTSPOT_TIPS.map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/15 border border-border/30 text-[11px]"
              >
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1 py-0 shrink-0 font-medium"
                >
                  {tip.badge}
                </Badge>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">{tip.title}: </span>
                  {tip.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fullscreen Enlarge QR Dialog ── */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md flex flex-col items-center text-center">
          <DialogHeader className="items-center">
            <DialogTitle className="text-sm font-semibold">Scan with Mobile Device</DialogTitle>
          </DialogHeader>
          <div
            className="flex flex-col items-center p-4 rounded-xl my-2 bg-zinc-900 border border-border/80"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="font-mono text-xs text-muted-foreground select-all">
            {hostUrl}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

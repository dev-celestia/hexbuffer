import React from 'react';
import { cn } from '@/lib/utils';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { useDevServerPage } from './hooks/use-dev-server-page';
import { DevServerHeader } from './components/dev-server-header';
import { DevServerProcessPane } from './components/dev-server-process-pane';
import { DevServerQrCard } from './components/dev-server-qr-card';
import { DevServerPeersPane } from './components/dev-server-peers-pane';
import { DevServerInterfaceSelector } from './components/dev-server-interface-selector';
import { HOTSPOT_TIPS } from './constants';
import { DeviceMobile, Question, ShieldCheck } from '@phosphor-icons/react';
import { Badge } from '@celestia-project/ui';

export function DevServerPage() {
  const page = useDevServerPage();

  return (
    <TabbedPageLayout
      tabs={page.tabs}
      activeTabId={page.activeTabId}
      onTabChange={page.setActiveTabId}
      className={cn(
        // Layout & Positioning
        'flex flex-col min-h-0',
        // Sizing & Spacing
        'h-full',
        // Backgrounds & Borders
        'bg-background'
      )}
      contentClassName={cn(
        // Layout & Positioning
        'flex-1 min-h-0 overflow-y-auto flex flex-col',
        // Sizing & Spacing
        'm-2',
        // Backgrounds & Borders
        'border rounded-md bg-card'
      )}
    >
      <DevServerHeader
        activeTabId={page.activeTabId}
        processStatus={page.processStatus}
        hostUrl={page.hostUrl}
        port={page.port}
        isStartingProcess={page.isStartingProcess}
        isKillingPort={page.isKillingPort}
        onStartProcess={page.handleStartProcess}
        onStopProcess={page.handleStopProcess}
        onKillPort={page.handleKillPort}
      />

      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0",

          // Sizing & Spacing
          "p-4 lg:p-6"
        )}
      >
        {/* ── Tab 1: Live Dev Process (Primary view with QR Code) ── */}
        {page.activeTabId === 'process' && (
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-1 lg:grid-cols-12 items-start",

              // Sizing & Spacing
              "gap-5"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "lg:col-span-7 flex flex-col",

                // Sizing & Spacing
                "gap-5"
              )}
            >
              <DevServerProcessPane
                projectCwd={page.projectCwd}
                onChangeProjectCwd={page.setProjectCwd}
                onBrowseProjectDir={page.handleSelectProjectDir}
                customCommand={page.customCommand}
                onChangeCommand={page.setCustomCommand}
                processStatus={page.processStatus}
                processLogs={page.processLogs}
                rawProcessLogsCount={page.rawProcessLogsCount}
                isStartingProcess={page.isStartingProcess}
                processLogSearch={page.processLogSearch}
                onSearchChange={page.setProcessLogSearch}
                onStartProcess={page.handleStartProcess}
                onStopProcess={page.handleStopProcess}
                onApplyPreset={page.handleApplyScriptPreset}
                onClearLogs={page.handleClearProcessLogs}
                isKillingPort={page.isKillingPort}
                onKillPort={page.handleKillPort}
              />
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "lg:col-span-5 flex flex-col",

                // Sizing & Spacing
                "gap-5"
              )}
            >
              <DevServerQrCard
                hostUrl={page.hostUrl}
                qrSvg={page.qrSvg}
                isRunning={page.processStatus.is_running}
                isQrModalOpen={page.isQrModalOpen}
                setIsQrModalOpen={page.setIsQrModalOpen}
                interfaces={page.interfaces}
                selectedIp={page.selectedIp}
                onSelectIp={page.setSelectedIp}
                isLoadingIps={page.isLoadingIps}
                onRefreshIps={page.refreshIps}
              />
            </div>
          </div>
        )}

        {/* ── Tab 2: Network Diagnostics (No duplicate QR Code) ── */}
        {page.activeTabId === 'network' && (
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-1 lg:grid-cols-12 items-start",

              // Sizing & Spacing
              "gap-5"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "lg:col-span-6 flex flex-col",

                // Sizing & Spacing
                "gap-5"
              )}
            >
              {/* Detailed Network Adapters List */}
              <DevServerInterfaceSelector
                interfaces={page.interfaces}
                selectedIp={page.selectedIp}
                onSelectIp={page.setSelectedIp}
                isLoadingIps={page.isLoadingIps}
                onRefreshIps={page.refreshIps}
                variant="detailed"
                port={page.processStatus.port || page.port}
              />
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "lg:col-span-6 flex flex-col",

                // Sizing & Spacing
                "gap-5"
              )}
            >
              {/* Mobile Setup Guidance */}
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col",

                  // Sizing & Spacing
                  "p-5 gap-3",

                  // Backgrounds & Borders
                  "rounded-xl bg-card border border-border/70 shadow-xs"
                )}
              >
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center",

                    // Sizing & Spacing
                    "gap-2"
                  )}
                >
                  <DeviceMobile size={18} className="text-emerald-500" />
                  <h3
                    className={cn(
                      // Typography
                      "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    )}
                  >
                    Tethering & Connection Modes
                  </h3>
                </div>

                <div
                  className={cn(
                    // Layout & Positioning
                    "grid grid-cols-1",

                    // Sizing & Spacing
                    "gap-3"
                  )}
                >
                  {HOTSPOT_TIPS.map((tip) => (
                    <div
                      key={tip.title}
                      className={cn(
                        // Layout & Positioning
                        "flex flex-col justify-between",

                        // Sizing & Spacing
                        "p-3",

                        // Backgrounds & Borders
                        "rounded-lg border border-border/60 bg-muted/20"
                      )}
                    >
                      <div>
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-center justify-between",

                            // Sizing & Spacing
                            "mb-1"
                          )}
                        >
                          <span
                            className={cn(
                              // Typography
                              "text-xs font-semibold text-foreground"
                            )}
                          >
                            {tip.title}
                          </span>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 font-medium">
                            {tip.badge}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            // Typography
                            "text-[11px] text-muted-foreground leading-relaxed"
                          )}
                        >
                          {tip.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-start",

                    // Sizing & Spacing
                    "p-3 gap-2.5 mt-2",

                    // Typography
                    "text-xs text-emerald-600 dark:text-emerald-400",

                    // Backgrounds & Borders
                    "rounded-lg border border-emerald-500/30 bg-emerald-500/5"
                  )}
                >
                  <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Next.js Origin Security Handled:</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      When connecting mobile devices to Next.js dev servers, Next.js requires origin verification. Hexbuffer automatically injects <code>allowedDevOrigins</code> with active tethering IPs directly into your <code>next.config</code> when starting dev servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: LAN Peers & Sync ── */}
        {page.activeTabId === 'peers' && (
          <DevServerPeersPane
            peers={page.peerDiscovery.peers}
            myInfo={page.peerDiscovery.myInfo}
            isLoadingPeers={page.peerDiscovery.isLoadingPeers}
            receivedItems={page.peerDiscovery.receivedItems}
            selectedPeer={page.peerDiscovery.selectedPeer}
            isShareModalOpen={page.peerDiscovery.isShareModalOpen}
            setIsShareModalOpen={page.peerDiscovery.setIsShareModalOpen}
            isEditNameModalOpen={page.peerDiscovery.isEditNameModalOpen}
            setIsEditNameModalOpen={page.peerDiscovery.setIsEditNameModalOpen}
            customDeviceName={page.peerDiscovery.customDeviceName}
            setCustomDeviceName={page.peerDiscovery.setCustomDeviceName}
            shareType={page.peerDiscovery.shareType}
            setShareType={page.peerDiscovery.setShareType}
            shareTitle={page.peerDiscovery.shareTitle}
            setShareTitle={page.peerDiscovery.setShareTitle}
            shareContent={page.peerDiscovery.shareContent}
            setShareContent={page.peerDiscovery.setShareContent}
            isSending={page.peerDiscovery.isSending}
            pingLatencies={page.peerDiscovery.pingLatencies}
            isPinging={page.peerDiscovery.isPinging}
            hostUrl={page.hostUrl}
            onRefreshPeers={page.peerDiscovery.refreshPeers}
            onToggleBroadcast={page.peerDiscovery.handleToggleBroadcast}
            onUpdateDeviceName={page.peerDiscovery.handleUpdateDeviceName}
            onPingPeer={page.peerDiscovery.handlePingPeer}
            onShareActiveDevServer={page.peerDiscovery.handleShareActiveDevServer}
            onOpenShareModal={page.peerDiscovery.openShareModal}
            onSendCustomShare={page.peerDiscovery.handleSendCustomShare}
            onClearReceivedItems={page.peerDiscovery.handleClearReceivedItems}
          />
        )}
      </div>
    </TabbedPageLayout>
  );
}

export default DevServerPage;

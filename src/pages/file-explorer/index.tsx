import {
  Button,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@celestia-project/ui';
import * as React from 'react';
import {
  HardDriveIcon,
  GearSixIcon,
  ShieldWarningIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  CopyIcon,
  LinkSimpleIcon,
  UploadSimpleIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';
import { useFileExplorerPage } from './hooks/use-file-explorer-page';
import { ExplorerSidebar } from './components/explorer-sidebar';
import { ExplorerDetailsPane } from './components/explorer-details-pane';
import { FileGrid } from './components/file-grid';
import { FileToolbar } from './components/file-toolbar';
import { WordlistsTab } from './components/wordlists/wordlists-tab';

export function FileExplorerPage() {
  const page = useFileExplorerPage();
  const { explorer, local } = page;

  // Render Onboarding state if R2 credentials are not configured and on R2 tab
  if (!explorer.loading && !explorer.credentials && page.activeTab === 'r2') {
    return (
      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTab}
        onTabChange={page.setActiveTab}
        contentClassName={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-lg"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-1 items-center justify-center select-none",

            // Sizing & Spacing
            "h-full p-6",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center max-w-md text-center",

              // Sizing & Spacing
              "p-6 rounded-lg border gap-3",

              // Backgrounds & Borders
              "border-border bg-muted/10 backdrop-blur-sm"
            )}
          >
            <HardDriveIcon className="size-10 text-primary animate-pulse" />
            <h2
              className={cn(
                // Typography
                "text-sm font-semibold text-foreground"
              )}
            >
              Cloudflare R2 Storage Not Configured
            </h2>
            <p
              className={cn(
                // Typography
                "text-xs text-muted-foreground leading-relaxed"
              )}
            >
              R2 offers S3-compatible object storage with zero egress fees. To browse your buckets
              and manage remote files, configure your account credentials in Settings.
            </p>
            <div
              className={cn(
                // Layout & Positioning
                "flex justify-center pt-2"
              )}
            >
              <Button
                size="sm"
                variant="default"
                onClick={() => page.navigate('/settings?tab=r2')}
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "h-7 px-3 gap-1.5",

                  // Typography
                  "text-xs font-semibold"
                )}
              >
                <GearSixIcon className="size-3.5" />
                <span>Configure Credentials</span>
              </Button>
            </div>
          </div>
        </div>
      </TabbedPageLayout>
    );
  }

  const renderTabContent = () => {
    switch (page.activeTab) {
      case 'r2':
        return (
          /* Cloudflare R2 Workspace */
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col flex-1 min-w-0 min-h-0"
            )}
          >
            <FileToolbar
              breadcrumbs={page.r2Breadcrumbs}
              isAtRoot={!explorer.currentPrefix}
              onNavigateUp={explorer.navigateUp}
              onNavigateTo={explorer.navigateToFolder}
              onCreateFolder={explorer.handleCreateFolder}
              actionLabel="Upload"
              actionIcon={<UploadSimpleIcon className="size-3.5" />}
              onActionClick={explorer.handleUploadFile}
              actionDisabled={!explorer.currentBucket}
              searchQuery={explorer.searchQuery}
              onSearchChange={explorer.setSearchQuery}
              onRefresh={explorer.refreshList}
              viewMode={page.viewMode}
              onViewModeChange={page.handleViewModeChange}
              loading={explorer.loading}
            />

            <div
              className={cn(
                // Layout & Positioning
                "flex-1 min-h-0 min-w-0"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex min-h-0",

                  // Sizing & Spacing
                  "h-full gap-3"
                )}
              >
                {/* Left Buckets Sidebar */}
                <div
                  className={cn(
                    // Layout & Positioning
                    "shrink-0",

                    // Sizing & Spacing
                    "w-56 h-full"
                  )}
                >
                  <ExplorerSidebar
                    buckets={explorer.buckets}
                    currentBucket={explorer.currentBucket}
                    onSelectBucket={(b) => {
                      explorer.setCurrentBucket(b);
                      explorer.setSelectedItem(null);
                    }}
                    onAddCustomBucket={explorer.handleAddCustomBucket}
                    onRemoveBucket={explorer.handleRemoveBucket}
                    loading={explorer.loading}
                  />
                </div>

                {/* Center File Grid Area */}
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-w-0 min-h-0",

                    // Sizing & Spacing
                    "h-full"
                  )}
                >
                  <FileGrid
                    items={explorer.items.map((item) => ({ ...item, id: item.key }))}
                    selectedItem={
                      explorer.selectedItem
                        ? { ...explorer.selectedItem, id: explorer.selectedItem.key }
                        : null
                    }
                    loading={explorer.loading}
                    deletingId={explorer.deletingKey}
                    onSelectItem={(item) =>
                      explorer.setSelectedItem(explorer.items.find((i) => i.key === item.id) ?? null)
                    }
                    onDoubleClickItem={(item) => {
                      const orig = explorer.items.find((i) => i.key === item.id);
                      if (orig) {
                        if (orig.type === 'folder') {
                          explorer.navigateToFolder(orig.key);
                        } else {
                          void explorer.handleOpenFile(orig);
                        }
                      }
                    }}
                    onDeleteItem={(item) => {
                      const orig = explorer.items.find((i) => i.key === item.id);
                      if (orig) void explorer.handleDeleteItem(orig);
                    }}
                    viewMode={page.viewMode}
                    emptyMessage="This folder contains no files or sub-directories."
                    renderGridStatusOverlay={(item) => {
                      const cached = explorer.cacheStatus[item.id]?.isCached;
                      if (item.type === 'folder') return null;
                      return (
                        <span className="absolute right-0 bottom-1">
                          <span
                            className={cn(
                              "block size-1.5 rounded-full",
                              cached ? "bg-emerald-500" : "bg-muted-foreground/40"
                            )}
                            title={cached ? 'Local Cached' : 'R2 Remote'}
                          />
                        </span>
                      );
                    }}
                    renderSyncStatus={(item) => {
                      const cached = explorer.cacheStatus[item.id]?.isCached;
                      if (item.type === 'folder') return '—';
                      return cached ? (
                        <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-sans gap-1 px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 font-semibold">
                          <CheckCircleIcon className="size-3" /> Local
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-muted-foreground font-sans gap-1 px-1.5 py-0.5 rounded border border-muted-foreground/10 bg-muted font-semibold">
                          <CloudArrowDownIcon className="size-3" /> R2
                        </span>
                      );
                    }}
                    renderExtraContextMenuItems={(item) => {
                      const orig = explorer.items.find((i) => i.key === item.id);
                      if (item.type !== 'file' || !orig) return null;
                      return (
                        <>
                          <ContextMenuSeparator />
                          {explorer.handleCopyPublicUrl && (
                            <ContextMenuItem onClick={() => explorer.handleCopyPublicUrl(orig)}>
                              <CopyIcon className="mr-2 size-3.5" />
                              <span>Copy Public URL</span>
                            </ContextMenuItem>
                          )}
                          {explorer.handleCopyPresignedUrl && (
                            <ContextMenuItem
                              onClick={() => explorer.handleCopyPresignedUrl(orig, 3600)}
                            >
                              <LinkSimpleIcon className="mr-2 size-3.5" />
                              <span>Copy Presigned URL</span>
                            </ContextMenuItem>
                          )}
                        </>
                      );
                    }}
                  />
                </div>

                {/* Right Details Pane */}
                {explorer.selectedItem && (
                  <div
                    className={cn(
                      // Layout & Positioning
                      "shrink-0",

                      // Sizing & Spacing
                      "w-72 h-full"
                    )}
                  >
                    <ExplorerDetailsPane
                      item={explorer.selectedItem}
                      cacheStatus={explorer.cacheStatus}
                      onOpenFile={explorer.handleOpenFile}
                      onCopyPublicUrl={explorer.handleCopyPublicUrl}
                      onCopyPresignedUrl={explorer.handleCopyPresignedUrl}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'local':
        return (
          /* Local Storage Workspace */
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col flex-1 min-w-0 min-h-0"
            )}
          >
            <FileToolbar
              breadcrumbs={page.localBreadcrumbs}
              isAtRoot={local.isAtRoot}
              onNavigateUp={local.navigateUp}
              onNavigateTo={local.navigateInto}
              onCreateFolder={local.handleCreateFolder}
              actionLabel="Import"
              actionIcon={<DownloadSimpleIcon className="size-3.5" />}
              onActionClick={local.handleImportFile}
              searchQuery={local.searchQuery}
              onSearchChange={local.setSearchQuery}
              onRefresh={local.refresh}
              viewMode={page.viewMode}
              onViewModeChange={page.handleViewModeChange}
              loading={local.loading}
            />
            <div
              className={cn(
                // Layout & Positioning
                "flex-1 min-h-0 min-w-0"
              )}
            >
              <FileGrid
                items={local.items.map((item) => ({ ...item, id: item.path }))}
                selectedItem={
                  local.selectedItem
                    ? { ...local.selectedItem, id: local.selectedItem.path }
                    : null
                }
                loading={local.loading}
                deletingId={local.deletingPath}
                onSelectItem={(item) =>
                  local.setSelectedItem(local.items.find((i) => i.path === item.id) ?? null)
                }
                onDoubleClickItem={(item) => {
                  const orig = local.items.find((i) => i.path === item.id);
                  if (orig) void local.handleOpenFile(orig);
                }}
                onDeleteItem={(item) => {
                  const orig = local.items.find((i) => i.path === item.id);
                  if (orig) void local.handleDeleteItem(orig);
                }}
                viewMode={page.viewMode}
                emptyMessage="Import files or create a sub-folder to get started."
                renamingId={page.localRenamingPath}
                renameValue={page.localRenameValue}
                onRenameStart={page.localStartRename}
                onRenameChange={page.setLocalRenameValue}
                onRenameCommit={page.localCommitRename}
                onRenameCancel={page.localCancelRename}
                renameInputRef={page.localRenameInputRef}
              />
            </div>
          </div>
        );
      default:
        return (
          /* Wordlists On-Demand Hub */
          <WordlistsTab />
        );
    }
  };

  return (
    <TabbedPageLayout
      tabs={page.tabs}
      activeTabId={page.activeTab}
      onTabChange={page.setActiveTab}
      contentClassName={cn(
        // Layout & Positioning
        "flex-1 min-h-0 overflow-hidden",

        // Backgrounds & Borders
        "border rounded-lg"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "relative flex flex-col flex-1 min-h-0",

          // Sizing & Spacing
          "h-full"
        )}
      >
        {renderTabContent()}

        {/* Floating concurrent upload progress card */}
        {explorer.uploadProgress && page.activeTab === 'r2' && (
          <div
            className={cn(
              // Layout & Positioning
              "absolute bottom-4 right-4 z-50",

              // Sizing & Spacing
              "w-80 p-3 rounded-lg border shadow-lg gap-2",

              // Backgrounds & Borders
              "bg-background/95 border-border backdrop-blur-md",

              // Interactive & States
              "animate-in fade-in slide-in-from-bottom-3 duration-200"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between mb-1.5",

                // Typography
                "text-xs font-medium"
              )}
            >
              <span className="truncate pr-3 text-foreground">
                {explorer.uploadProgress.fileName}
              </span>
              <span className="shrink-0 text-primary font-mono text-[11px]">
                {explorer.uploadProgress.progress}%
              </span>
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "overflow-hidden w-full",

                // Sizing & Spacing
                "h-1.5 rounded-full",

                // Backgrounds & Borders
                "bg-muted"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "h-full rounded-full",

                  // Backgrounds & Borders
                  "bg-primary",

                  // Interactive & States
                  "transition-all duration-300 ease-out"
                )}
                style={{ width: `${explorer.uploadProgress.progress}%` }}
              />
            </div>

            <p
              className={cn(
                // Layout & Positioning
                "flex items-center mt-2",

                // Sizing & Spacing
                "gap-1.5",

                // Typography
                "text-[10px] text-muted-foreground"
              )}
            >
              <ShieldWarningIcon className="size-3.5 text-primary shrink-0" />
              <span>Uploading to R2 Storage bucket…</span>
            </p>
          </div>
        )}
      </div>
    </TabbedPageLayout>
  );
}

export default FileExplorerPage;

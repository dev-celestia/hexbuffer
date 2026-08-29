import * as React from "react";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@celestia-project/ui';
import { TabbedPageLayout } from "@/layout/tabs-layout/tabbed-page-layout";

import { TargetSelectorDialog } from "@/pages/live-traffic/components/target-selector";
import { useWebSocketHistoryPage } from "./hooks/use-websocket-history-page";
import { useWebSocketHistoryQueryStore } from "@/stores/history";
import { clearWebSocketAll } from "./api";
import { toast } from "sonner";
import {
  TrashIcon,
  PlayIcon,
  PauseIcon,
  TargetIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';

import { SessionSelector } from "@/pages/live-traffic/http-history/components/session";
import { openTargetSelector } from "@/triggers";
import { cn } from "@/lib/utils";

export function WebSocketHistoryPage() {
  const page = useWebSocketHistoryPage();
  const isWsPaused = useWebSocketHistoryQueryStore((s) => s.isStreamManuallyPaused);
  const search = useWebSocketHistoryQueryStore((s) => s.filter.search);
  const setSearch = useWebSocketHistoryQueryStore((s) => s.setSearch);

  const [localSearch, setLocalSearch] = React.useState(search || '');
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
    }, 200);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch('');
  };

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const togglePause = () => {
    const store = useWebSocketHistoryQueryStore.getState();
    const wasPaused = store.isStreamManuallyPaused;
    store.setStreamManuallyPaused(!wasPaused);
    if (wasPaused) store.triggerRefresh();
  };

  const handleConfirmClearAll = async () => {
    setIsClearing(true);
    try {
      await clearWebSocketAll();
      useWebSocketHistoryQueryStore.getState().triggerRefresh();
      useWebSocketHistoryQueryStore.getState().setSelectedConnectionId(null);
      toast.success("WebSocket history cleared");
      setClearDialogOpen(false);
    } catch (err) {
      toast.error("Failed to clear WebSocket history");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTabId}
        onTabChange={page.setActiveTabId}
        onTabClose={page.removeTab}
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0",

          // Sizing & Spacing
          "h-full"
        )}
        contentClassName={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 overflow-hidden",

          // Sizing & Spacing
          "m-2",

          // Backgrounds & Borders
          "border rounded-lg bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0",

            // Sizing & Spacing
            "p-1 px-2 gap-2",

            // Backgrounds & Borders
            "border-b bg-muted/20"
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
            {/* Active Session Switcher Capsule */}
            <SessionSelector />

            {/* Modern Search InputGroup */}
            <InputGroup
              className={cn(
                // Sizing & Spacing
                "w-48",

                // Interactive & States
                "transition-all duration-150 focus-within:w-64"
              )}
            >
              <InputGroupAddon align="inline-start">
                <MagnifyingGlassIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3.5",

                    // Typography
                    "text-muted-foreground"
                  )}
                />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search URL, host, path…"
                className={cn(
                  // Sizing & Spacing
                  "h-7 text-xs"
                )}
              />
              {localSearch && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    <XIcon className="size-3" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "h-7 text-xs gap-1.5"
              )}
              onClick={togglePause}
            >
              {isWsPaused ? (
                <>
                  <PlayIcon className="size-3.5 text-amber-500" /> Resume
                </>
              ) : (
                <>
                  <PauseIcon className="size-3.5 text-muted-foreground" /> Pause
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "h-7 text-xs gap-1.5"
              )}
              onClick={openTargetSelector}
            >
              <TargetIcon className="size-3.5 text-muted-foreground" />
              Target
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "h-7 text-xs gap-1.5",

                // Typography
                "text-destructive hover:text-destructive hover:bg-destructive/10"
              )}
            >
              <TrashIcon className="size-3.5" />
              Clear All
            </Button>
          </div>
        </div>

        <Card
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 overflow-hidden",

            // Sizing & Spacing
            "!py-0",

            // Backgrounds & Borders
            "rounded-none border-0 shadow-none"
          )}
        >
          {page.websocketView}
        </Card>
      </TabbedPageLayout>

      <TargetSelectorDialog
        externalOpen={page.isTargetSelectorOpen}
        onExternalOpenChange={(open) => {
          if (!open) page.closeTargetSelector();
        }}
      />

      {/* Modern Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Clear WebSocket History</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete all captured WebSocket connections and messages?
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-1.5 p-3 my-1",

              // Typography
              "text-xs leading-relaxed",

              // Backgrounds & Borders
              "rounded-md border border-destructive/20 bg-destructive/5 text-muted-foreground"
            )}
          >
            All connection handshakes and recorded frame payloads will be purged.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmClearAll}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing…' : 'Clear All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

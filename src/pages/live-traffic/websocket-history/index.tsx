import { TabbedPageLayout } from "@/components/tabs-layout/tabbed-page-layout";
import { Card } from "@/components/ui/card";
import { TargetSelectorDialog } from "@/pages/live-traffic/components/target-selector";
import { useWebSocketHistoryPage } from "./hooks/use-websocket-history-page";
import { useWebSocketHistoryQueryStore } from "@/stores/history";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { TrashIcon, PlayIcon, PauseIcon, TargetIcon } from '@phosphor-icons/react';
import { Button } from "@/components/ui/button";
import { openTargetSelector } from "@/triggers";

import { cn } from "@/lib/utils";

export function WebSocketHistoryPage() {
  const page = useWebSocketHistoryPage();
  const isWsPaused = useWebSocketHistoryQueryStore((s) => s.isStreamManuallyPaused);

  const togglePause = () => {
    const store = useWebSocketHistoryQueryStore.getState();
    const wasPaused = store.isStreamManuallyPaused;
    store.setStreamManuallyPaused(!wasPaused);
    if (wasPaused) store.triggerRefresh();
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all WebSocket connection history?")) {
      try {
        await invoke("clear_websocket_all");
        useWebSocketHistoryQueryStore.getState().triggerRefresh();
        useWebSocketHistoryQueryStore.getState().setSelectedConnectionId(null);
        toast.success("WebSocket history cleared");
      } catch (err) {
        toast.error("Failed to clear WebSocket history");
      }
    }
  };

  return (
    <>
      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTabId}
        onTabChange={page.setActiveTabId}
        onTabClose={page.removeTab}
        contentClassName={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-lg bg-background"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between",

            // Sizing & Spacing
            "p-1 px-2",

            // Backgrounds & Borders
            "bg-muted border-b"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-1"
            )}
          >
            WebSocket
          </span>
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
                "h-6",

                // Typography
                "text-xs"
              )}
              onClick={togglePause}
            >
              {isWsPaused ? <><PlayIcon className="size-3" /> Resume</> : <><PauseIcon className="size-3" /> Pause</>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "h-6",

                // Typography
                "text-xs"
              )}
              onClick={openTargetSelector}
            >
              <TargetIcon className="size-3" />
              Target
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "h-6",

                // Typography
                "text-xs",

                // Visuals & Colors
                "!text-red-500"
              )}
            >
              <TrashIcon className="size-3 mr-1" />
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
            "rounded-none"
          )}
        >
          {page.websocketView}
        </Card>
      </TabbedPageLayout>
      <TargetSelectorDialog
        externalOpen={page.isTargetSelectorOpen}
        onExternalOpenChange={(open) => { if (!open) page.closeTargetSelector(); }}
      />
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Input } from '@celestia-project/ui';
import { TabbedPageLayout } from "@/layout/tabs-layout/tabbed-page-layout";

import { TargetSelectorDialog } from "@/pages/live-traffic/components/target-selector";
import { useWebSocketHistoryPage } from "./hooks/use-websocket-history-page";
import { useWebSocketHistoryQueryStore } from "@/stores/history";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { TrashIcon, PlayIcon, PauseIcon, TargetIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';

import { openTargetSelector } from "@/triggers";

import { cn } from "@/lib/utils";

export function WebSocketHistoryPage() {
  const page = useWebSocketHistoryPage();
  const isWsPaused = useWebSocketHistoryQueryStore((s) => s.isStreamManuallyPaused);
  const search = useWebSocketHistoryQueryStore((s) => s.filter.search);
  const setSearch = useWebSocketHistoryQueryStore((s) => s.setSearch);

  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(search);
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

  useEffect(() => {
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
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
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
                "relative flex items-center"
              )}
            >
              <MagnifyingGlassIcon
                className={cn(
                  // Layout & Positioning
                  "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",

                  // Sizing & Spacing
                  "size-3.5",

                  // Typography
                  "text-muted-foreground"
                )}
              />
              <Input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search URL, host, path…"
                className={cn(
                  // Sizing & Spacing
                  "h-7 w-44 pl-7 pr-7 text-xs bg-background",

                  // Backgrounds & Borders
                  "border-input",

                  // Interactive & States
                  "focus:w-56 transition-all duration-150"
                )}
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={cn(
                    // Layout & Positioning
                    "absolute right-2 top-1/2 -translate-y-1/2",

                    // Typography
                    "text-muted-foreground",

                    // Interactive & States
                    "hover:text-foreground"
                  )}
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
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

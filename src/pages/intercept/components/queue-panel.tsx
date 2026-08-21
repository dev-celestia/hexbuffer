import { Badge, Button, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@celestia-project/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  PlusIcon,
  ShieldSlashIcon,
  PaperPlaneTiltIcon,
  TrashIcon,
  PauseIcon,
} from "@phosphor-icons/react";

import { getMethodBadgeColor } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import { formatRequestTime } from "../lib";
import { useQueuePanel } from "./hooks/use-queue-panel";

export function InterceptQueuePanel() {
  const {
    isEnabled,
    activeTab,
    activeRequests,
    selectedRequestId,
    removingIds,
    setSelectedRequestId,
    getRequestMeta,
    handleForwardRequest,
    handleInterceptResponse,
    handleDrop,
    handleDontCapture,
    handleAddCaptureHost,
  } = useQueuePanel();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0",

          // Sizing & Spacing
          "p-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 overflow-auto",

            // Backgrounds & Borders
            "rounded-md border bg-background"
          )}
        >
          {activeRequests.length === 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center text-center",

                // Sizing & Spacing
                "h-full p-6",

                // Typography
                "text-sm text-muted-foreground"
              )}
            >
              {isEnabled && activeTab?.captureHosts.length
                ? "Waiting for matching hosts in this tab..."
                : "Add a capture host to this tab to pause live requests."}
            </div>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "divide-y"
              )}
            >
              {activeRequests.map((request) => {
                const isSelected = request.id === selectedRequestId;
                const isRemoving = removingIds.has(request.id);
                const { direction, host, path } = getRequestMeta(request);

                return (
                  <ContextMenu key={request.id}>
                    <ContextMenuTrigger>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRequestId(request.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedRequestId(request.id);
                          }
                        }}
                        className={cn(
                          // Layout & Positioning
                          "group relative flex flex-col items-start justify-between outline-none",

                          // Sizing & Spacing
                          "w-full p-2 gap-2",

                          // Typography
                          "text-sm",

                          // Interactive & States
                          "cursor-pointer transition-colors hover:bg-muted focus-visible:bg-muted",
                          isSelected && "bg-muted",
                          isRemoving &&
                            "pointer-events-none animate-slide-out-right"
                        )}
                        title={`${host}${path}`}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex flex-1 min-w-0 w-full",

                            // Sizing & Spacing
                            "gap-2 mb-2"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                // Layout & Positioning
                                "flex flex-col items-start w-full",

                                // Sizing & Spacing
                                "gap-1"
                              )}
                            >
                              <div
                                className={cn(
                                  // Layout & Positioning
                                  "flex items-center justify-between w-full"
                                )}
                              >
                                <div
                                  className={cn(
                                    // Layout & Positioning
                                    "flex w-full",

                                    // Sizing & Spacing
                                    "gap-2 mb-1"
                                  )}
                                >
                                  {direction === "response" ? (
                                    <span
                                      className={cn(
                                        // Layout & Positioning
                                        "inline-flex shrink-0",

                                        // Sizing & Spacing
                                        "px-1.5 py-0.5",

                                        // Typography
                                        "text-[11px] font-semibold",

                                        // Backgrounds & Borders
                                        "rounded border"
                                      )}
                                    >
                                      {request.response?.status_code ?? "RES"}
                                    </span>
                                  ) : (
                                    <Badge
                                      className={cn(
                                        // Layout & Positioning
                                        "shrink-0",

                                        // Sizing & Spacing
                                        "px-1 py-0.5",

                                        // Typography
                                        "text-[10px] font-mono font-semibold uppercase",

                                        // Backgrounds & Borders
                                        "rounded shadow-none border",

                                        getMethodBadgeColor(request.request.method)
                                      )}
                                    >
                                      {request.request.method.toUpperCase()}
                                    </Badge>
                                  )}
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={cn(
                                        // Layout & Positioning
                                        "block",

                                        // Typography
                                        "text-xs font-medium"
                                      )}
                                    >
                                      {host}
                                    </span>
                                  </span>
                                </div>
                                <div>
                                  {direction === "response" ? (
                                    <ArrowLeftIcon className="size-4 text-green-500" />
                                  ) : (
                                    <ArrowRightIcon className="size-4 text-blue-500" />
                                  )}
                                </div>
                              </div>

                              <span
                                className={cn(
                                  // Layout & Positioning
                                  "block w-full",

                                  // Typography
                                  "font-mono text-xs text-muted-foreground"
                                )}
                              >
                                {path}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            // Layout & Positioning
                            "relative flex flex-col items-end justify-center self-stretch shrink-0",

                            // Sizing & Spacing
                            "gap-1.5 min-w-[160px]"
                          )}
                        >
                          {/* Normal state: time */}
                          <span
                            className={cn(
                              // Sizing & Spacing
                              "pt-1",

                              // Typography
                              "text-[11px] text-muted-foreground",

                              // Interactive & States
                              "group-hover:opacity-0 transition-opacity duration-150"
                            )}
                          >
                            {formatRequestTime(request.timestamp)}
                          </span>

                          {/* Hover state: actions */}
                          <div
                            className={cn(
                              // Layout & Positioning
                              "absolute right-0 top-1/2 -translate-y-1/2 flex items-center",

                              // Sizing & Spacing
                              "gap-1.5",

                              // Interactive & States
                              "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150"
                            )}
                          >
                            {direction === "request" && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInterceptResponse(request);
                                }}
                                title="Intercept Response"
                              >
                                <PauseIcon className="size-4" />
                                Intercept
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleForwardRequest(request);
                              }}
                              title="Forward"
                            >
                              <PaperPlaneTiltIcon className="size-3" />
                              Forward
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                      <ContextMenuItem
                        onClick={() => handleAddCaptureHost(host)}
                        className="text-xs"
                      >
                        <PlusIcon className="size-3.5" />
                        Capture this host
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      {direction === "request" && (
                        <>
                          <ContextMenuItem
                            onClick={() => handleInterceptResponse(request)}
                            className="text-xs"
                          >
                            <FlagIcon className="size-3.5" />
                            Intercept response
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                        </>
                      )}
                      <ContextMenuItem
                        onClick={() => handleDrop(request)}
                        variant="destructive"
                        className="text-xs"
                      >
                        <TrashIcon className="size-3.5" />
                        Drop
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDontCapture(request)}
                        className="text-xs"
                      >
                        <ShieldSlashIcon className="size-3.5" />
                        Don't capture this host
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


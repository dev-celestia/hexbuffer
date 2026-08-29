import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyTitle,
  Label,
  TextEditor,
} from '@celestia-project/ui';
import {
  FileTextIcon,
  TableIcon,
  DotsThreeVerticalIcon,
  CrosshairIcon,
  XIcon,
  ArrowsOutIcon,
} from "@phosphor-icons/react";

import { useLogEntryView } from "./hooks/use-log-entry-view";
import { isJsonContent } from "../utils";
import { formatJsonBody } from "@/lib/http-message";

import { InspectorSection } from "@/pages/live-traffic/components/inspector";
import { CollectionPickerSubmenu } from "@/triggers/repeater/collection-picker-submenu";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function LogDetailView() {
  const {
    selectedCallId,
    call,
    isLoading,
    loadError,
    viewMode,
    toggleViewMode,
    isExpanded,
    setIsExpanded,
    toggleExpanded,
    closeDetailView,
    handleSendToCollection,
    handleSendToInvoker,
    rawRequest,
    rawResponse,
    requestHeaders,
    requestCookies,
    requestParams,
    responseHeaders,
    responseCookies,
  } = useLogEntryView();
  const { theme } = useTheme();

  if (!selectedCallId) {
    return (
      <Empty>
        <EmptyTitle>No request selected</EmptyTitle>
        <EmptyDescription>
          Select a request from the table to view its details.
        </EmptyDescription>
      </Empty>
    );
  }

  if (isLoading) {
    return (
      <Empty>
        <EmptyTitle>Loading...</EmptyTitle>
      </Empty>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          // Sizing & Spacing
          "p-4"
        )}
      >
        <Alert variant="destructive">
          <AlertTitle>Failed to load request details</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!call) {
    return (
      <Empty>
        <EmptyTitle>Request not found</EmptyTitle>
        <EmptyDescription>
          The selected request could not be found.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <>
      <div
        className={cn(
          // Layout & Positioning
          "flex min-h-0",

          // Sizing & Spacing
          "h-full",

          // Backgrounds & Borders
          "bg-muted"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 flex flex-col",

            // Sizing & Spacing
            "h-full",

            // Backgrounds & Borders
            "bg-background border-r"
          )}
        >
          {viewMode === "text" ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex min-h-0 flex-col",

                // Sizing & Spacing
                "h-full p-2 mt-3"
              )}
            >
              <Label
                className={cn(
                  // Layout & Positioning
                  "block",

                  // Sizing & Spacing
                  "mb-1",

                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                Raw Request
              </Label>
              <div
                className={cn(
                  // Layout & Positioning
                  "min-h-0 flex-1 overflow-hidden",

                  // Backgrounds & Borders
                  "rounded-md border"
                )}
              >
                <TextEditor value={rawRequest} theme={theme} disableValidation />
              </div>
            </div>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "min-h-0 flex-1 overflow-auto",

                // Sizing & Spacing
                "p-2"
              )}
            >
              <InspectorSection
                title="Headers"
                items={requestHeaders}
                defaultView="table"
              />
              <InspectorSection
                title="Cookies"
                items={requestCookies.map((cookie) => ({
                  name: cookie.name,
                  value: cookie.value,
                }))}
                defaultView="table"
              />
              {requestParams.length > 0 && (
                <InspectorSection
                  title="Params"
                  items={requestParams}
                  defaultView="table"
                />
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex-1 flex flex-col",

            // Sizing & Spacing
            "h-full",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex justify-end",

              // Sizing & Spacing
              "w-full pr-2 pt-2"
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
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                title="Expand to fullscreen"
              >
                <ArrowsOutIcon className="size-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon">
                    <DotsThreeVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={toggleExpanded}
                    className="text-xs"
                  >
                    <ArrowsOutIcon className="mr-2 size-4" /> Expand Editor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={toggleViewMode}
                    className="text-xs"
                  >
                    {viewMode === "table" ? (
                      <>
                        <FileTextIcon className="mr-2 size-4" /> Toggle Text
                      </>
                    ) : (
                      <>
                        <TableIcon className="mr-2 size-4" /> Toggle Table
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <CollectionPickerSubmenu
                    variant="dropdown"
                    onSelect={handleSendToCollection}
                  />
                  <DropdownMenuItem
                    onClick={handleSendToInvoker}
                    className="text-xs"
                  >
                    <CrosshairIcon className="mr-2 size-4" /> Send to Intruder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDetailView}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {viewMode === "text" ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex min-h-0 flex-col",

                // Sizing & Spacing
                "h-full p-2 -mt-1"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "min-h-0 flex-1 overflow-hidden",

                  // Backgrounds & Borders
                  "rounded-md border"
                )}
              >
                <TextEditor value={rawResponse} theme={theme} disableValidation />
              </div>
            </div>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "min-h-0 flex-1 overflow-auto",

                // Sizing & Spacing
                "p-2"
              )}
            >
              <InspectorSection
                title="Headers"
                items={responseHeaders}
                defaultOpen={false}
                defaultView="table"
              />
              {responseCookies.length > 0 && (
                <InspectorSection
                  title="Cookies"
                  items={responseCookies.map((cookie) => ({
                    name: cookie.name,
                    value: cookie.value,
                  }))}
                  defaultOpen={false}
                  defaultView="table"
                />
              )}
              <InspectorSection
                title="Body"
                items={[
                  {
                    name: "Response Body",
                    value: isJsonContent(
                      call.response_headers,
                      call.response_body,
                    )
                      ? formatJsonBody(call.response_body ?? "")
                      : (call.response_body ?? ""),
                  },
                ]}
                defaultView="text"
              />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "sm:max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] p-4"
          )}
        >
          <DialogHeader
            className={cn(
              // Layout & Positioning
              "flex flex-row items-center justify-between shrink-0",

              // Sizing & Spacing
              "pb-2",

              // Backgrounds & Borders
              "border-b"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center min-w-0",

                // Sizing & Spacing
                "gap-2.5"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                )}
              >
                {call.method}
              </span>
              <DialogTitle
                className={cn(
                  // Layout & Positioning
                  "truncate",

                  // Typography
                  "font-mono text-sm"
                )}
              >
                {call.url || call.path}
              </DialogTitle>
              {call.response_status && (
                <span
                  className={cn(
                    // Layout & Positioning
                    "inline-flex items-center",

                    // Sizing & Spacing
                    "px-1.5 py-0.5",

                    // Typography
                    "font-mono text-[10px] font-semibold",

                    // Backgrounds & Borders
                    "rounded border",

                    // Interactive & States
                    call.response_status >= 200 && call.response_status < 300
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : call.response_status >= 300 && call.response_status < 400
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                      : call.response_status >= 400 && call.response_status < 500
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-red-500/10 text-red-500 border-red-500/30"
                  )}
                >
                  {call.response_status} {call.response_status_text || ""}
                </span>
              )}
            </div>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-2 mr-6"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon">
                    <DotsThreeVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={toggleViewMode}
                    className="text-xs"
                  >
                    {viewMode === "table" ? (
                      <>
                        <FileTextIcon className="mr-2 size-4" /> Toggle Text
                      </>
                    ) : (
                      <>
                        <TableIcon className="mr-2 size-4" /> Toggle Table
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <CollectionPickerSubmenu
                    variant="dropdown"
                    onSelect={handleSendToCollection}
                  />
                  <DropdownMenuItem
                    onClick={handleSendToInvoker}
                    className="text-xs"
                  >
                    <CrosshairIcon className="mr-2 size-4" /> Send to Intruder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <div
            className={cn(
              // Layout & Positioning
              "flex-1 min-h-0 grid grid-cols-2",

              // Sizing & Spacing
              "gap-3 pt-2"
            )}
          >
            {/* Request Panel */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",

                // Backgrounds & Borders
                "rounded-md border bg-background"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between shrink-0",

                  // Sizing & Spacing
                  "px-3 py-1.5",

                  // Backgrounds & Borders
                  "border-b bg-muted/40"
                )}
              >
                <Label
                  className={cn(
                    // Typography
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  )}
                >
                  Request
                </Label>
              </div>
              {viewMode === "text" ? (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-h-0 overflow-hidden",

                    // Sizing & Spacing
                    "p-2"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "h-full w-full overflow-hidden",

                      // Backgrounds & Borders
                      "rounded-md border"
                    )}
                  >
                    <TextEditor value={rawRequest} theme={theme} disableValidation />
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-h-0 overflow-auto",

                    // Sizing & Spacing
                    "p-2"
                  )}
                >
                  <InspectorSection
                    title="Headers"
                    items={requestHeaders}
                    defaultView="table"
                  />
                  <InspectorSection
                    title="Cookies"
                    items={requestCookies.map((cookie) => ({
                      name: cookie.name,
                      value: cookie.value,
                    }))}
                    defaultView="table"
                  />
                  {requestParams.length > 0 && (
                    <InspectorSection
                      title="Params"
                      items={requestParams}
                      defaultView="table"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Response Panel */}
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col min-h-0",

                // Backgrounds & Borders
                "rounded-md border bg-background"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-between shrink-0",

                  // Sizing & Spacing
                  "px-3 py-1.5",

                  // Backgrounds & Borders
                  "border-b bg-muted/40"
                )}
              >
                <Label
                  className={cn(
                    // Typography
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  )}
                >
                  Response
                </Label>
              </div>
              {viewMode === "text" ? (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-h-0 overflow-hidden",

                    // Sizing & Spacing
                    "p-2"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "h-full w-full overflow-hidden",

                      // Backgrounds & Borders
                      "rounded-md border"
                    )}
                  >
                    <TextEditor value={rawResponse} theme={theme} disableValidation />
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex-1 min-h-0 overflow-auto",

                    // Sizing & Spacing
                    "p-2"
                  )}
                >
                  <InspectorSection
                    title="Headers"
                    items={responseHeaders}
                    defaultOpen={false}
                    defaultView="table"
                  />
                  {responseCookies.length > 0 && (
                    <InspectorSection
                      title="Cookies"
                      items={responseCookies.map((cookie) => ({
                        name: cookie.name,
                        value: cookie.value,
                      }))}
                      defaultOpen={false}
                      defaultView="table"
                    />
                  )}
                  <InspectorSection
                    title="Body"
                    items={[
                      {
                        name: "Response Body",
                        value: isJsonContent(
                          call.response_headers,
                          call.response_body,
                        )
                          ? formatJsonBody(call.response_body ?? "")
                          : (call.response_body ?? ""),
                      },
                    ]}
                    defaultView="text"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

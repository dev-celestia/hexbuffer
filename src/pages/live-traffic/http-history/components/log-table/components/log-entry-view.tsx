import { Alert, AlertDescription, AlertTitle, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Empty, EmptyDescription, EmptyTitle, Label, TextEditor } from 'hexbuffer-ui';
import {
  FileTextIcon,
  TableIcon,
  DotsThreeVerticalIcon,
  CrosshairIcon,
  XIcon,
} from "@phosphor-icons/react";

import { useLogEntryView } from "./hooks/use-log-entry-view";
import { isJsonContent } from "../utils";
import { formatJsonBody } from "@/lib/http-message";

import { InspectorSection } from "@/pages/live-traffic/components/inspector";
import { CollectionPickerSubmenu } from "@/triggers/repeater/collection-picker-submenu";
import { cn } from "@/lib/utils";

export function LogEntryBurpView() {
  const {
    selectedCallId,
    call,
    isLoading,
    loadError,
    viewMode,
    toggleViewMode,
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
              <TextEditor value={rawRequest} />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
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
                  <CrosshairIcon className="mr-2 size-4" /> Send to Invoker
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
              <TextEditor value={rawResponse} />
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
  );
}

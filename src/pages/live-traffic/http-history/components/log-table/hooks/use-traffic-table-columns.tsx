import { useMemo } from "react";
import {
  WarningCircleIcon,
  PushPinSimpleIcon,
  LockIcon,
  LockOpenIcon,
} from "@phosphor-icons/react";
import { Badge } from "@celestia-project/ui";
import { HighlightedText } from "@/components/highlighted-text";
import { getMethodBadgeColor, getStatusColor } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { ApiCall } from "@/types";
import type { GroupDefinition } from "@/stores/history";
import { formatTimestamp, formatBytes, getCallHost } from "../utils";
import { ColoredUrl } from "../components/colored-url";
import { BrowserIcon } from "../components/browser-icon";
import { CallActionCell } from "../components/call-action-cell";


export interface TrafficTableColumn {
  id: string;
  header: string;
  size: number;
  cell: (call: ApiCall, searchQuery?: string) => React.ReactNode;
}

interface UseTrafficTableColumnsOptions {
  pinnedSet: Set<string>;
  getGroupsForRequest: (id: string) => GroupDefinition[];
  getHighlightColor: (host: string, path: string) => string | undefined;
  highlightedHosts: Record<string, string>;
  handleNewGroup: (call: ApiCall) => void;
}

export function useTrafficTableColumns({
  pinnedSet,
  getGroupsForRequest,
  getHighlightColor,
  highlightedHosts,
  handleNewGroup,
}: UseTrafficTableColumnsOptions) {
  return useMemo<TrafficTableColumn[]>(
    () => [
      {
        id: "timestamp",
        header: "Time",
        size: 80,
        cell: (call) => (
          <span className="text-xs font-mono text-muted-foreground">
            {formatTimestamp(call.timestamp)}
          </span>
        ),
      },
      {
        id: "method",
        header: "Method",
        size: 105,
        cell: (call) => (
          <div className="flex items-center gap-1.5 shrink-0">
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

                getMethodBadgeColor(call.method)
              )}
            >
              {call.method.toUpperCase()}
            </Badge>
            {call.response_status ? (
              <Badge
                className={cn(
                  // Sizing & Spacing
                  "px-1 py-0.5",

                  // Typography
                  "text-[10px] font-mono font-semibold text-white",

                  // Backgrounds & Borders
                  "rounded shadow-none border-none",

                  getStatusColor(call.response_status)
                )}
              >
                {call.response_status}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
            {call.content_decoded && (
              <span title="Request body was decoded from gzip/br/deflate">
                <WarningCircleIcon className="h-3 w-3 text-yellow-500 shrink-0" />
              </span>
            )}
          </div>
        ),
      },
      {
        id: "host",
        header: "Host",
        size: 140,
        cell: (call, searchQuery = "") => {
          const host = getCallHost(call);
          const hostColor = getHighlightColor(host, call.path);
          return (
            <span
              className="truncate block min-w-0 font-mono text-xs"
              style={{ color: hostColor || undefined }}
            >
              <HighlightedText text={host} query={searchQuery} />
            </span>
          );
        },
      },
      {
        id: "url",
        header: "URL",
        size: 300,
        cell: (call, searchQuery = "") => {
          const requestGroups = getGroupsForRequest(call.id);
          const displayUrl = call.display_url || call.url;
          const isSecured =
            call.url.startsWith("https://") ||
            call.url.startsWith("wss://") ||
            call.security_state === "secure";

          const host = getCallHost(call);

          return (
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              {pinnedSet.has(call.id) && (
                <PushPinSimpleIcon className="size-3 text-amber-500 shrink-0" />
              )}
              {requestGroups.map((g: GroupDefinition) => (
                <span
                  key={g.id}
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: g.color }}
                  title={g.name}
                />
              ))}
              {isSecured ? (
                <span title="HTTPS (Secured)">
                  <LockIcon className="size-3 text-emerald-500 shrink-0" />
                </span>
              ) : (
                <span title="HTTP (Not Secured)">
                  <LockOpenIcon className="size-3 text-amber-500 shrink-0" />
                </span>
              )}
              <BrowserIcon userAgent={call.user_agent} />
              <span
                dir="rtl"
                className="truncate min-w-0 text-left block"
                style={{
                  color:
                    getHighlightColor(host, call.path) ||
                    undefined,
                }}
              >
                <ColoredUrl url={displayUrl} searchQuery={searchQuery} />
              </span>
            </div>
          );
        },
      },
      {
        id: "response_body_size",
        header: "Size",
        size: 70,
        cell: (call) => (
          <span className="text-xs text-muted-foreground text-right block truncate">
            {formatBytes(call.response_body_size)}
          </span>
        ),
      },
      {
        id: "request_body_size",
        header: "Length",
        size: 70,
        cell: (call) => (
          <span className="text-xs text-muted-foreground text-right block truncate">
            {formatBytes(call.request_body_size)}
          </span>
        ),
      },
      {
        id: "response_content_type",
        header: "MIME Type",
        size: 120,
        cell: (call, searchQuery = "") => (
          <span className="text-xs text-muted-foreground truncate block min-w-0">
            <HighlightedText
              text={call.response_content_type || "-"}
              query={searchQuery}
            />
          </span>
        ),
      },
      {
        id: "action",
        header: "",
        size: 36,
        cell: (call) => (
          <CallActionCell call={call} onNewGroup={handleNewGroup} />
        ),
      },
    ],
    [
      pinnedSet,
      getGroupsForRequest,
      handleNewGroup,
      highlightedHosts,
      getHighlightColor,
    ]
  );
}

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ApiCall } from "@/types";
import { LogEntryContextMenu } from "./log-context-menu";
import type { TrafficTableColumn } from "../hooks/use-traffic-table-columns";
import { getCallHost } from "../utils";

interface TrafficTableRowProps {
  call: ApiCall;
  isSelected: boolean;
  isPinned: boolean;
  isGroupTabActive: boolean;
  searchQuery: string;
  columns: TrafficTableColumn[];
  onRowClick: (id: string) => void;
  onDelete: (id: string) => void;
  onContextMenuOpenChange: (open: boolean) => void;
  onNewGroup: (call: ApiCall) => void;
}

export const TrafficTableRow = memo(function TrafficTableRow({
  call,
  isSelected,
  isPinned,
  isGroupTabActive,
  searchQuery,
  columns,
  onRowClick,
  onDelete,
  onContextMenuOpenChange,
  onNewGroup,
}: TrafficTableRowProps) {
  return (
    <LogEntryContextMenu
      key={call.id}
      call={call}
      onDelete={onDelete}
      onOpenChange={onContextMenuOpenChange}
      onNewGroup={onNewGroup}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        className={cn(
          // Layout & Positioning
          "flex items-center text-left border-b",

          // Sizing & Spacing
          "w-full h-8",

          // Typography
          "font-mono text-xs",

          // Backgrounds & Borders
          isPinned && "bg-amber-500/10 dark:bg-amber-800/20",
          isGroupTabActive && "bg-sky-500/5 dark:bg-sky-950/20",
          isSelected
            ? "hover:!bg-muted bg-muted"
            : "hover:bg-muted/50",

          // Interactive & States
          "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
        onClick={() => onRowClick(call.id)}
      >
        {columns.map((col) => {
          const isRightAligned =
            col.id === "response_body_size" ||
            col.id === "request_body_size";
          const isCentered = col.id === "action";
          const isUrl = col.id === "url";

          let cellTitle: string | undefined;
          if (col.id === "url") {
            cellTitle = call.url;
          } else if (col.id === "host") {
            cellTitle = getCallHost(call);
          } else if (col.id === "response_content_type") {
            cellTitle = call.response_content_type ?? undefined;
          }

          return (
            <div
              key={col.id}
              className={cn(
                // Layout & Positioning
                "truncate min-w-0",

                // Sizing & Spacing
                "px-3 py-1",

                // Typography
                "text-xs text-muted-foreground",

                // Interactive & States
                isRightAligned && "text-right",
                isCentered && "text-center"
              )}
              title={cellTitle}
              style={{
                width: isUrl ? undefined : col.size,
                minWidth: isUrl ? 180 : col.size,
                flex: isUrl ? "1 1 auto" : "0 0 auto",
              }}
            >
              {col.cell(call, searchQuery)}
            </div>
          );
        })}
      </button>
    </LogEntryContextMenu>
  );
});

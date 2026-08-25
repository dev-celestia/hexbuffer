import {
  Badge,
  Button,
  ButtonGroup,
  DropdownMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  CheckIcon,
  FunnelIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import type { HttpSessionSummary } from '@/types';
import { formatBytes } from '../log-table/utils';
import { cn } from '@/lib/utils';

export interface SessionItemRowProps {
  session: HttpSessionSummary;
  isActive: boolean;
  onSelect: () => void;
  onConfigure: () => void;
  onDelete: () => void;
}

export function SessionItemRow({
  session,
  isActive,
  onSelect,
  onConfigure,
  onDelete,
}: SessionItemRowProps) {
  const mode = session.capture_mode ?? 'all';
  let customHostsList: string[] = [];
  if (mode === 'custom' && session.capture_filter) {
    try {
      const parsed = JSON.parse(session.capture_filter);
      if (Array.isArray(parsed)) customHostsList = parsed;
    } catch {}
  }

  return (
    <DropdownMenuItem
      onClick={onSelect}
      className={cn(
        // Layout & Positioning
        "flex flex-col items-stretch",

        // Sizing & Spacing
        "gap-1 p-2 min-w-[360px] sm:min-w-[380px]"
      )}
    >
      {/* Header Row: Status, Name, Actions */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0 flex-1",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "size-3.5 shrink-0"
            )}
          >
            {isActive ? (
              <CheckIcon className="size-3.5 text-primary" />
            ) : (
              <span
                className={cn(
                  // Sizing & Spacing
                  "size-1.5",

                  // Backgrounds & Borders
                  "rounded-full bg-muted-foreground/30"
                )}
              />
            )}
          </div>

          <span
            className={cn(
              // Typography
              "truncate text-xs",
              isActive ? "font-semibold text-foreground" : "font-medium text-foreground/90"
            )}
          >
            {session.name}
          </span>
        </div>

        {/* Quick action buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            // Layout & Positioning
            "shrink-0"
          )}
        >
          <ButtonGroup>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              title="Configure Session"
            >
              <SlidersHorizontalIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Session"
            >
              <TrashIcon className="size-4" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Bottom Meta & Badges Row */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center flex-wrap",

          // Sizing & Spacing
          "gap-1.5 pl-5 pt-0.5"
        )}
      >
        {mode === 'target_scope' && (
          <Badge variant="secondary" className="h-4 px-1 text-[9px]">
            <TargetIcon className="size-2.5 mr-0.5" />
            Scope
          </Badge>
        )}

        {mode === 'custom' && (
          <Badge variant="secondary" className="h-4 px-1 text-[9px]">
            <FunnelIcon className="size-2.5 mr-0.5" />
            Custom ({customHostsList.length})
          </Badge>
        )}

        {mode === 'all' && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                  <WarningCircleIcon className="size-2.5 mr-0.5 text-amber-500" weight="fill" />
                  All Traffic
                </Badge>
              }
            />
            <TooltipContent side="top" sideOffset={4}>
              <span>All traffic recorded • Host filtering recommended</span>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Detailed Usage Stats */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1.5",

            // Typography
            "text-[10px] text-muted-foreground font-mono"
          )}
        >
          <span>{session.request_count} reqs</span>
          <span>·</span>
          <span>{formatBytes(session.total_size_bytes)}</span>
          {session.created_at && (
            <>
              <span>·</span>
              <span
                className={cn(
                  // Typography
                  "font-sans text-muted-foreground/70"
                )}
              >
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filter Context / Description */}
      {mode === 'custom' && customHostsList.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1 pl-5 pt-0.5",

            // Typography
            "text-[10px] text-muted-foreground/80 font-mono truncate"
          )}
        >
          <span>Whitelist:</span>
          <span
            className={cn(
              // Typography
              "truncate text-foreground/80"
            )}
          >
            {customHostsList.slice(0, 3).join(', ')}
            {customHostsList.length > 3 ? ` (+${customHostsList.length - 3})` : ''}
          </span>
        </div>
      )}

      {session.description && (
        <div
          className={cn(
            // Sizing & Spacing
            "pl-5 pt-0.5",

            // Typography
            "text-[10px] text-muted-foreground/70 italic truncate"
          )}
        >
          {session.description}
        </div>
      )}
    </DropdownMenuItem>
  );
}

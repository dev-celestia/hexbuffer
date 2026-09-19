import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@celestia-project/ui';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  PaperPlaneTiltIcon,
  PauseIcon,
  ShieldSlashIcon,
  TrashIcon,
} from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { formatRequestTime, getPausedDirection, getRequestHost, getRequestPath } from '../lib';
import { getDirectionTreatment, getMethodTone, getStatusTone } from '../lib/request-styles';
import type { PausedRequest } from '../types';

interface QueueRowProps {
  request: PausedRequest;
  isSelected: boolean;
  /** Mid-removal: the slide-out animation is running, so the row stops taking input. */
  isRemoving: boolean;
  onSelect: () => void;
  onForward: () => void;
  onInterceptResponse: () => void;
  onDrop: () => void;
  onDontCapture: () => void;
  onSendToRepeater: () => void;
}

/**
 * One paused request: a method-or-status badge, the host and path, and the time that swaps for the
 * row's actions on hover.
 *
 * **The layout is the fix here.** The row used to be `flex-col`, so its second child — the block
 * holding the timestamp and the hover actions — landed *below* the path instead of beside the host,
 * and `min-w-[160px] self-stretch` was papering over that in a column container. Every row was
 * therefore three lines tall with the timestamp floating under the path. It is a `flex-row` now,
 * with the right-hand block pinned to the top so the timestamp sits on the host's line and the
 * absolutely-positioned actions centre on it.
 *
 * The markup also went from six nested wrappers to three: `flex flex-1 min-w-0 w-full gap-2 mb-2`
 * and `min-w-0 flex-1` around the content did nothing, and `gap-2` + `mb-2` + `mb-1` fought over the
 * same spacing.
 *
 * Colours come from `lib/request-styles`, so the badge and the direction arrow cannot drift — and
 * so the arrow is no longer a bare `text-green-500` / `text-blue-500`, which measured 2.4:1 on a
 * light surface.
 */
export function QueueRow({
  request,
  isSelected,
  isRemoving,
  onSelect,
  onForward,
  onInterceptResponse,
  onDrop,
  onDontCapture,
  onSendToRepeater,
}: Readonly<QueueRowProps>) {
  const direction = getPausedDirection(request);
  const host = getRequestHost(request);
  const path = getRequestPath(request);
  const isResponse = direction === 'response';

  const badgeTone = isResponse ? getStatusTone(request.response?.status_code) : getMethodTone(request.request.method);
  const badgeLabel = isResponse
    ? String(request.response?.status_code ?? 'RES')
    : request.request.method.toUpperCase();
  const directionTreatment = getDirectionTreatment(direction);
  const DirectionIcon = isResponse ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="button"
          tabIndex={0}
          data-slot="queue-row"
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect();
            }
          }}
          className={cn(
            // Layout & Positioning
            'group relative flex items-start outline-none',

            // Sizing & Spacing
            'w-full px-2.5 py-2 gap-2',

            // Typography
            'text-sm',

            // Interactive & States
            'cursor-pointer transition-colors hover:bg-muted focus-visible:bg-muted',
            isSelected && 'bg-muted',
            isRemoving && 'pointer-events-none animate-slide-out-right'
          )}
          title={`${host}${path}`}
        >
          <span
            data-slot="queue-row-badge"
            className={cn(
              // Layout & Positioning
              'inline-flex shrink-0 items-center',

              // Sizing & Spacing
              'h-5 px-1.5',

              // Typography
              'text-[10px] font-mono font-semibold',

              // Backgrounds & Borders
              'rounded border',
              badgeTone.pill,

              // Interactive & States
              !isResponse && 'uppercase'
            )}
          >
            {badgeLabel}
          </span>

          <div
            className={cn(
              // Layout & Positioning
              'flex min-w-0 flex-1 flex-col',

              // Sizing & Spacing
              'gap-0.5'
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                'flex min-w-0 items-center',

                // Sizing & Spacing
                'gap-1.5'
              )}
            >
              <span
                data-slot="queue-row-host"
                className={cn(
                  // Typography
                  'truncate text-xs font-medium'
                )}
              >
                {host}
              </span>
              <DirectionIcon
                data-slot="queue-row-direction"
                role="img"
                aria-label={directionTreatment.label}
                className={cn(
                  // Layout & Positioning
                  'shrink-0',

                  // Sizing & Spacing
                  'size-3',

                  // Backgrounds & Borders
                  directionTreatment.text
                )}
              />
            </div>
            <span
              data-slot="queue-row-path"
              className={cn(
                // Typography
                'truncate font-mono text-[11px] text-muted-foreground'
              )}
            >
              {path}
            </span>
          </div>

          {/*
            Pinned to the top so the timestamp shares the host's line. `min-w` reserves the actions'
            width, which is why the timestamp does not shift when they fade in on hover.
          */}
          <div
            className={cn(
              // Layout & Positioning
              'relative flex shrink-0 items-center justify-end',

              // Sizing & Spacing
              'h-5 min-w-[172px]'
            )}
          >
            <span
              data-slot="queue-row-time"
              className={cn(
                // Typography
                'text-[11px] text-muted-foreground',

                // Interactive & States
                'transition-opacity duration-150 group-hover:opacity-0'
              )}
            >
              {formatRequestTime(request.timestamp)}
            </span>

            <div
              className={cn(
                // Layout & Positioning
                'absolute right-0 top-1/2 flex -translate-y-1/2 items-center',

                // Sizing & Spacing
                'gap-1.5',

                // Interactive & States
                'pointer-events-none opacity-0 transition-opacity duration-150',
                'group-hover:pointer-events-auto group-hover:opacity-100',
                'group-focus-within:pointer-events-auto group-focus-within:opacity-100'
              )}
            >
              {!isResponse && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInterceptResponse();
                  }}
                  title="Intercept the response to this request too"
                >
                  <PauseIcon className="size-4" />
                  Intercept
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onForward();
                }}
                title="Forward this request"
              >
                <PaperPlaneTiltIcon className="size-3" />
                Forward
              </Button>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={onSendToRepeater} className="text-xs">
          <PaperPlaneTiltIcon className="size-3.5" />
          Send to Repeater
        </ContextMenuItem>
        <ContextMenuSeparator />
        {!isResponse && (
          <>
            <ContextMenuItem onClick={onInterceptResponse} className="text-xs">
              <FlagIcon className="size-3.5" />
              Intercept response
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={onDrop} variant="destructive" className="text-xs">
          <TrashIcon className="size-3.5" />
          Drop
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDontCapture} className="text-xs">
          <ShieldSlashIcon className="size-3.5" />
          Don't capture this host
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

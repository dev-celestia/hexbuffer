import * as React from 'react';
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  ScrollArea,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  BellIcon,
  BellRingingIcon,
  CheckCircleIcon,
  ChecksIcon,
  InfoIcon,
  TrashSimpleIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import type { AlertType, AppAlert } from '@/stores/notifications';
import { formatRelativeTime, useNotificationAlerts } from '../hooks/use-notification-alerts';

function getAlertIcon(type: AlertType) {
  switch (type) {
    case 'error':
      return <XCircleIcon className="size-4 shrink-0 text-destructive" weight="fill" />;
    case 'warning':
      return <WarningCircleIcon className="size-4 shrink-0 text-amber-500" weight="fill" />;
    case 'success':
      return <CheckCircleIcon className="size-4 shrink-0 text-emerald-500" weight="fill" />;
    case 'info':
    default:
      return <InfoIcon className="size-4 shrink-0 text-primary" weight="fill" />;
  }
}

export function NotificationAlert() {
  const {
    open,
    setOpen,
    alerts,
    totalCount,
    unreadCount,
    hasUnread,
    handleMarkAllRead,
    handleClearAll,
    handleRemoveAlert,
    handleItemClick,
  } = useNotificationAlerts();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              type="button"
              className={cn(
                // Layout & Positioning
                'relative flex items-center justify-center shrink-0 cursor-pointer select-none',
                // Sizing & Spacing
                'size-7 rounded-sm',
                // Backgrounds & Borders
                'transition-all duration-150',
                // Interactive & States
                'hover:bg-muted/80 hover:scale-105 active:scale-95',
                // Typography
                hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
              aria-label="System alerts"
            />
          }
        >
          {hasUnread ? (
            <BellRingingIcon className="size-4" />
          ) : (
            <BellIcon className="size-4" />
          )}
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="top" sideOffset={12}>
            {hasUnread
              ? `Alerts (${unreadCount} unread)`
              : 'Alerts & Notifications'}
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className={cn(
          // Layout & Positioning
          'flex flex-col z-50',
          // Sizing & Spacing
          'w-88 max-w-[calc(100vw-1rem)] p-0 gap-0',
          // Backgrounds & Borders
          'bg-popover border border-border rounded-lg shadow-xl'
        )}
      >
        {/* Header */}
        <PopoverHeader className={cn('p-3 pb-2 flex flex-col gap-1.5')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <PopoverTitle className="text-xs font-semibold text-foreground tracking-tight">
                Alerts & Notifications
              </PopoverTitle>
              {unreadCount > 0 ? (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px] font-semibold">
                  {unreadCount} new
                </Badge>
              ) : totalCount > 0 ? (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {totalCount}
                </Badge>
              ) : null}
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {hasUnread && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleMarkAllRead}
                        aria-label="Mark all as read"
                      />
                    }
                  >
                    <ChecksIcon className="size-3 text-muted-foreground hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    Mark all read
                  </TooltipContent>
                </Tooltip>
              )}

              {totalCount > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleClearAll}
                        aria-label="Clear all alerts"
                      />
                    }
                  >
                    <TrashSimpleIcon className="size-3 text-muted-foreground hover:text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    Clear all
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </PopoverHeader>

        <Separator className="opacity-50" />

        {/* Content list */}
        {alerts.length === 0 ? (
          <div className="p-4 py-8">
            <Empty className="p-0 gap-2">
              <EmptyMedia variant="icon" className="mb-0">
                <BellIcon className="size-4 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-xs font-medium">No alerts</EmptyTitle>
              <EmptyDescription className="text-[11px] max-w-[200px]">
                You are all caught up. New notifications and events will appear here.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <ScrollArea className="max-h-72 overflow-y-auto">
            <div className="flex flex-col divide-y divide-border/30">
              {alerts.map((alert: AppAlert) => {
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleItemClick(alert)}
                    className={cn(
                      // Layout & Positioning
                      'group relative flex items-start gap-2.5 px-3 py-2.5 transition-colors cursor-pointer text-left',
                      // Backgrounds & Borders
                      alert.read ? 'bg-transparent hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/50'
                    )}
                  >
                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {getAlertIcon(alert.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={cn(
                            // Typography
                            'text-xs font-medium truncate',
                            alert.read ? 'text-muted-foreground' : 'text-foreground font-semibold'
                          )}
                        >
                          {alert.title}
                        </span>

                        {alert.source && (
                          <Badge variant="outline" className="h-3.5 px-1 text-[9px] font-normal shrink-0">
                            {alert.source}
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground/90 leading-snug break-words">
                        {alert.message}
                      </p>

                      <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>

                    {/* Unread indicator / remove button */}
                    <div className="absolute right-2 top-2.5 flex items-center gap-1">
                      {!alert.read && (
                        <span className="size-1.5 rounded-full bg-primary shrink-0 group-hover:hidden" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveAlert(alert.id, e)}
                        className="hidden group-hover:flex size-5 items-center justify-center rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Remove alert"
                      >
                        <TrashSimpleIcon className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

import * as React from 'react';
import { useNotificationStore, type AppAlert } from '@/stores/notifications';

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}

export function useNotificationAlerts() {
  const [open, setOpen] = React.useState(false);

  const alerts = useNotificationStore((state) => state.alerts);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeAlert = useNotificationStore((state) => state.removeAlert);
  const clearAll = useNotificationStore((state) => state.clearAll);

  const sortedAlerts = React.useMemo(() => {
    return [...alerts].sort((a, b) => b.timestamp - a.timestamp);
  }, [alerts]);

  const unreadCount = React.useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  const hasUnread = unreadCount > 0;

  const handleMarkAllRead = React.useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = React.useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleRemoveAlert = React.useCallback(
    (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      removeAlert(id);
    },
    [removeAlert]
  );

  const handleItemClick = React.useCallback(
    (alert: AppAlert) => {
      if (!alert.read) {
        markAsRead(alert.id);
      }
    },
    [markAsRead]
  );

  return {
    open,
    setOpen,
    alerts: sortedAlerts,
    totalCount: alerts.length,
    unreadCount,
    hasUnread,
    handleMarkAllRead,
    handleClearAll,
    handleRemoveAlert,
    handleItemClick,
  };
}

import { useEffect, useRef } from 'react';
import { STATUS_ACTIVITY, type StatusActivityValue } from '@/components/status-badge';
import type { ActionLogEntry } from '@/stores/browser-automation';

function mapTypeToActivity(type: ActionLogEntry['type']): StatusActivityValue {
  switch (type) {
    case 'command': return STATUS_ACTIVITY.session;
    case 'result':  return STATUS_ACTIVITY.extraction;
    case 'error':   return STATUS_ACTIVITY.error;
    case 'ai':      return STATUS_ACTIVITY.ai;
    default:        return STATUS_ACTIVITY.queue;
  }
}

interface UseActionLogPanelProps {
  actions: ActionLogEntry[];
}

export function useActionLogPanel({ actions }: UseActionLogPanelProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const reversed = [...actions].reverse();

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actions]);

  return {
    topRef,
    reversed,
    hasActions: actions.length > 0,
    mapTypeToActivity,
  };
}

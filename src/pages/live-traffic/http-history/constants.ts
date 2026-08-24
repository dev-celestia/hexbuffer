export type DateRangeId = 'today' | 'week' | 'month' | 'custom' | 'all';

export interface DateDeleteOption {
  readonly id: DateRangeId;
  readonly label: string;
  readonly description: string;
}

export const DATE_DELETE_OPTIONS: readonly DateDeleteOption[] = [
  {
    id: 'today',
    label: 'Keep Today',
    description: "Delete logs recorded before today (keep today's traffic).",
  },
  {
    id: 'week',
    label: 'Keep This Week',
    description: "Delete logs older than 7 days (keep this week's traffic).",
  },
  {
    id: 'month',
    label: 'Keep This Month',
    description: "Delete logs older than 30 days (keep this month's traffic).",
  },
  {
    id: 'custom',
    label: 'Choose Date Cutoff',
    description: 'Delete all logs recorded before a selected date.',
  },
  {
    id: 'all',
    label: 'Delete All History',
    description: 'Permanently erase all HTTP and WebSocket logs.',
  },
] as const;

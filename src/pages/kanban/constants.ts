import type { Priority, KanbanCard, KanbanColumn, GroupBy } from './types';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-500', dot: 'bg-red-500' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
  medium:   { label: 'Medium',   color: 'text-yellow-400', dot: 'bg-yellow-400' },
  low:      { label: 'Low',      color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const STATUS_COLUMNS: KanbanColumn[] = [
  { id: 'todo',        title: 'To Do',        wipLimit: undefined, color: 'oklch(0.6 0.04 240)' },
  { id: 'in-progress', title: 'In Progress',  wipLimit: 3,         color: 'oklch(0.72 0.15 200)' },
  { id: 'review',      title: 'In Review',    wipLimit: 2,         color: 'oklch(0.72 0.15 280)' },
  { id: 'done',        title: 'Done',         wipLimit: undefined, color: 'oklch(0.65 0.18 145)' },
];

export const PRIORITY_COLUMNS: KanbanColumn[] = [
  { id: 'critical', title: 'Critical', color: 'oklch(0.6 0.2 20)' },
  { id: 'high',     title: 'High',     color: 'oklch(0.65 0.18 55)' },
  { id: 'medium',   title: 'Medium',   color: 'oklch(0.72 0.15 90)' },
  { id: 'low',      title: 'Low',      color: 'oklch(0.6 0.04 240)' },
];

export const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'status',   label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
];

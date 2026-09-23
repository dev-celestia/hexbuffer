import type { SqliTechnique } from './types';

export const TECHNIQUE_LABELS: Record<SqliTechnique, string> = {
  boolean_blind: 'Boolean Blind',
  time_based: 'Time-Based',
  union: 'UNION-Based',
  error_based: 'Error-Based',
};

export const SEVERITY_COLORS = {
  critical: 'border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/5',
  high: 'border-orange-500/20 text-orange-600 dark:text-orange-400 bg-orange-500/5',
  medium: 'border-yellow-500/20 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5',
  low: 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5',
} as const;

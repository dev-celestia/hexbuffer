export const STARTER_YAML = `# Regression script: each YAML document (---) is one condition.
# A matcher hit against the target means the condition PASSED.

id: page-reachable
info:
  name: Page reachable
  severity: info
http:
  - method: GET
    path: "{{BaseURL}}"
    matchers:
      - type: status
        status:
          - 200
`;

/**
 * Severity palette — **categorical**: five distinguishable rungs. The design system's four
 * status tokens cannot express an ordered five-step ladder without collapsing `medium` into
 * `high`, so these keep explicit hues and pair every light step with a `dark:` one. See the
 * semantic/categorical split documented in `src/lib/status-colors.ts`.
 */
export const SEVERITY_CLASS: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
  info: 'text-muted-foreground bg-muted/40 border-border',
};

export const CONDITION_STATUS_META: Record<
  string,
  { label: string; text: string }
> = {
  passed: { label: 'PASS', text: 'text-success' },
  failed: { label: 'FAIL', text: 'text-destructive' },
  pending: { label: 'WAIT', text: 'text-muted-foreground' },
};

export const RUN_STATUS_META: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  running: {
    label: 'Running',
    dotClass: 'bg-warning animate-pulse motion-reduce:animate-none',
    textClass: 'text-warning',
  },
  completed: {
    label: 'Completed',
    dotClass: 'bg-success',
    textClass: 'text-success',
  },
  failed: {
    label: 'Failed',
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
  },
  aborted: {
    label: 'Aborted',
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
  },
};

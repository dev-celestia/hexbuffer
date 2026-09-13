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

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;

export const SEVERITY_CLASS: Record<string, string> = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/30',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  low: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
  info: 'text-muted-foreground bg-muted/40 border-border',
};

export const CONDITION_STATUS_META: Record<
  string,
  { label: string; iconClass: string; text: string }
> = {
  passed: { label: 'PASS', iconClass: 'text-emerald-500', text: 'text-emerald-500' },
  failed: { label: 'FAIL', iconClass: 'text-red-500', text: 'text-red-500' },
  pending: { label: 'WAIT', iconClass: 'text-muted-foreground', text: 'text-muted-foreground' },
};

export const RUN_STATUS_META: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  running: { label: 'Running', dotClass: 'bg-amber-500 animate-pulse', textClass: 'text-amber-500' },
  completed: { label: 'Completed', dotClass: 'bg-emerald-500', textClass: 'text-emerald-500' },
  failed: { label: 'Failed', dotClass: 'bg-red-500', textClass: 'text-red-500' },
  aborted: { label: 'Aborted', dotClass: 'bg-muted-foreground', textClass: 'text-muted-foreground' },
};

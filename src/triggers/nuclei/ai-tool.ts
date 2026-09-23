import {
  startNucleiScan,
  stopNucleiScan,
  getNucleiStatus,
  subscribeNucleiEvents,
  type UiScanConfig,
  type RustFindingPayload,
} from '@/pages/nuclei-run/lib/nuclei-ipc';
import { assertHostInScope } from '@/triggers/scope';
import { toErrorMessage } from '@/lib/ipc';

export const TRIGGER_NUCLEI_SCAN_AI_TOOL_DEFINITION = {
  name: 'trigger_nuclei_scan',
  description:
    'Launch a Nuclei vulnerability scan against a single target URL. Requires confirmation. The scan runs in the background; poll get_nuclei_status for the engine state and get_nuclei_findings for results.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Target URL to scan, e.g. "https://example.com". Must be in the authorized scope.',
      },
      severity: {
        type: 'string',
        description: 'Optional severity filter for templates, e.g. "critical", "high", "medium", "low", "info".',
      },
      concurrency: {
        type: 'number',
        description: 'Concurrent requests (default 10).',
      },
      rateLimit: {
        type: 'number',
        description: 'Requests per second cap (default 150).',
      },
      timeout: {
        type: 'number',
        description: 'Per-request timeout in seconds (default 10).',
      },
    },
    required: ['url'],
  },
};

export const STOP_NUCLEI_SCAN_AI_TOOL_DEFINITION = {
  name: 'stop_nuclei_scan',
  description: 'Stop the active Nuclei scan session.',
  parameters: { type: 'object', properties: {}, required: [] },
};

export const GET_NUCLEI_STATUS_AI_TOOL_DEFINITION = {
  name: 'get_nuclei_status',
  description: 'Return whether a Nuclei scan is currently active or idle.',
  parameters: { type: 'object', properties: {}, required: [] },
};

export const GET_NUCLEI_FINDINGS_AI_TOOL_DEFINITION = {
  name: 'get_nuclei_findings',
  description:
    'Return Nuclei findings collected during the current session (bounded). Findings are cleared when a new scan starts. Use this to summarize what a scan discovered.',
  parameters: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max findings to return (default 50).' },
    },
    required: [],
  },
};

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function toNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.floor(value), max));
}

// Findings accumulated from the engine's event bus, cleared when a new scan starts.
const MAX_FINDINGS = 200;
let recentFindings: RustFindingPayload[] = [];
let findingsReady = false;

function ensureFindingsListener() {
  if (findingsReady) return;
  findingsReady = true;
  void subscribeNucleiEvents({
    onFinding: (finding) => {
      recentFindings = [...recentFindings, finding].slice(-MAX_FINDINGS);
    },
    onScanStarted: () => {
      recentFindings = [];
    },
  }).catch(() => {
    // Event subscription may be unavailable (e.g. not in the desktop shell); findings
    // simply won't accumulate, and the read tool reports that clearly.
  });
}

export async function executeTriggerNucleiScanAiTool(args: Record<string, any>): Promise<string> {
  const url = typeof args.url === 'string' ? args.url.trim() : '';
  if (!url || !isHttpUrl(url)) {
    throw new Error(
      `Invalid scan target: "${url || '(empty)'}" is not an absolute http(s) URL. Provide the full target origin, e.g. "https://example.com".`,
    );
  }
  assertHostInScope(url, 'launch a Nuclei scan against');

  const config: UiScanConfig = {
    targets: [url],
    concurrency: toNumber(args.concurrency, 10, 1, 100),
    rate_limit_rps: toNumber(args.rateLimit ?? args.rate_limit_rps, 150, 1, 5000),
    timeout_seconds: toNumber(args.timeout ?? args.timeout_seconds, 10, 1, 300),
  };

  try {
    await startNucleiScan(config);
  } catch (error) {
    throw new Error(`Failed to launch Nuclei scan: ${toErrorMessage(error, 'Unknown error')}`);
  }
  ensureFindingsListener();
  return `Nuclei scan launched against ${url}. Poll get_nuclei_status for the engine state and get_nuclei_findings for results.`;
}

export async function executeStopNucleiScanAiTool(): Promise<string> {
  try {
    await stopNucleiScan();
  } catch (error) {
    throw new Error(`Failed to stop Nuclei scan: ${toErrorMessage(error, 'Unknown error')}`);
  }
  return 'Stopped the active Nuclei scan.';
}

export async function executeGetNucleiStatusAiTool(): Promise<string> {
  try {
    const status = await getNucleiStatus();
    return `Nuclei scan status: ${status}.`;
  } catch (error) {
    return `Could not read Nuclei status: ${toErrorMessage(error, 'Unknown error')}`;
  }
}

export async function executeGetNucleiFindingsAiTool(args: Record<string, any>): Promise<string> {
  const limit = toNumber(args.limit, 50, 1, MAX_FINDINGS);
  if (recentFindings.length === 0) {
    return findingsReady
      ? 'No Nuclei findings have been collected this session. Launch a scan with trigger_nuclei_scan, then check again.'
      : 'The Nuclei findings listener is not available (event subscription failed). Results may still be visible on the Nuclei page.';
  }
  const slice = recentFindings.slice(-limit);
  const lines = slice.map(
    (f) => `[${f.severity}] ${f.template_id} — ${f.matched_url} (${f.template_name})`,
  );
  return `Nuclei findings (${slice.length}/${recentFindings.length} shown):\n${lines.join('\n')}`;
}

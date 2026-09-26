import { useSyncExternalStore } from 'react';

export interface TrackedAction {
  id: string;
  action: string;
  label: string;
  detail?: string;
  status: 'in_progress' | 'completed' | 'error';
  timestamp: number;
}

const actionLabels: Record<string, string> = {
  send_to_repeater: 'Sending request to Repeater',
  send_repeater_request: 'Executing Repeater request',
  create_collection: 'Creating Repeater collection',
  create_folder: 'Creating folder in collection',
  create_endpoint: 'Adding request to collection',
  start_invoker_attack: 'Launching fuzzing attack',
  stop_invoker_attack: 'Stopping fuzzing attack',
  send_to_intruder: 'Loading request into Intruder',
  toggle_intercept: 'Toggling proxy interception',
  forward_paused_request: 'Forwarding paused request',
  drop_paused_request: 'Dropping paused request',
  trigger_scan: 'Launching browser scan',
  toggle_browser_crawl: 'Toggling browser crawl',
  stop_browser_crawl: 'Stopping browser crawl',
  navigate_to_app: 'Navigating to view',
  add_scope_target: 'Adding target to scope',
  remove_scope_target: 'Removing target from scope',
  list_jobs: 'Listing background jobs',
  get_job_status: 'Checking job status',
  cancel_job: 'Cancelling background job',
  query_http_history: 'Querying HTTP history',
  get_http_request_detail: 'Getting HTTP request detail',
  trigger_nuclei_scan: 'Launching Nuclei scan',
  stop_nuclei_scan: 'Stopping Nuclei scan',
  get_nuclei_status: 'Checking Nuclei status',
  get_nuclei_findings: 'Fetching Nuclei findings',
};

function formatActionLabel(action: string, args?: Record<string, any>): { label: string; detail?: string } {
  const baseLabel = actionLabels[action] ?? action;
  if (!args) {
    return { label: baseLabel };
  }

  let detail: string | undefined;
  if (action === 'send_to_repeater') {
    const target = args.url || args.path || args.raw_request;
    if (target) {
      const displayTarget = String(target).split('\n')[0].trim();
      detail = displayTarget.length > 50 ? `${displayTarget.slice(0, 47)}...` : displayTarget;
    }
  } else if (action === 'send_to_intruder') {
    const target = args.logId || args.rawRequest;
    if (target) {
      const displayTarget = String(target).split('\n')[0].trim();
      detail = displayTarget.length > 50 ? `${displayTarget.slice(0, 47)}...` : displayTarget;
    }
  } else if (action === 'trigger_scan') {
    if (args.url) {
      detail = String(args.url);
    }
  } else if (action === 'add_scope_target' || action === 'remove_scope_target') {
    if (args.target || args.host) {
      detail = String(args.target || args.host);
    }
  } else if (action === 'trigger_nuclei_scan') {
    if (args.target) {
      detail = String(args.target);
    }
  } else if (action === 'create_collection' || action === 'create_folder' || action === 'create_endpoint') {
    if (args.name) {
      detail = `"${args.name}"`;
    }
  }

  const label = detail ? `${baseLabel}: ${detail}` : baseLabel;
  return { label, detail };
}

let trackedActions: readonly TrackedAction[] = [];
const actionListeners: Set<() => void> = new Set();
let actionCounter = 0;

function notifyActionListeners() {
  actionListeners.forEach((fn) => fn());
}

export function addTrackedAction(action: string, args?: Record<string, any>, explicitLabel?: string): string {
  const id = `ta-${++actionCounter}`;
  const { label, detail } = formatActionLabel(action, args);
  const finalLabel = explicitLabel ?? label;
  trackedActions = [
    ...trackedActions,
    {
      id,
      action,
      label: finalLabel,
      detail,
      status: 'in_progress' as const,
      timestamp: Date.now(),
    },
  ];
  notifyActionListeners();
  return id;
}

export function completeTrackedAction(id: string, error = false) {
  trackedActions = trackedActions.map((a) =>
    a.id === id ? { ...a, status: error ? ('error' as const) : ('completed' as const) } : a
  );
  notifyActionListeners();
}

export function getTrackedActions(): readonly TrackedAction[] {
  return trackedActions;
}

export function clearTrackedActions() {
  trackedActions = [];
  notifyActionListeners();
}

function subscribeTrackedActions(listener: () => void) {
  actionListeners.add(listener);
  return () => {
    actionListeners.delete(listener);
  };
}

function getTrackedActionsSnapshot(): readonly TrackedAction[] {
  return trackedActions;
}

export function useTrackedActions(): readonly TrackedAction[] {
  return useSyncExternalStore(subscribeTrackedActions, getTrackedActionsSnapshot, getTrackedActionsSnapshot);
}

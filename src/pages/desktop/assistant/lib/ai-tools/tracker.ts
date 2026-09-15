import { useEffect, useState } from 'react';

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
  create_collection: 'Creating Repeater collection',
  create_folder: 'Creating folder in collection',
  create_endpoint: 'Adding request to collection',
  start_intruder_attack: 'Launching fuzzing attack',
  start_invoker_attack: 'Launching fuzzing attack',
  toggle_intercept: 'Toggling proxy interception',
  trigger_scan: 'Launching browser scan',
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
  } else if (action === 'trigger_scan') {
    if (args.url) {
      detail = String(args.url);
    }
  } else if (action === 'create_collection' || action === 'create_folder' || action === 'create_endpoint') {
    if (args.name) {
      detail = `"${args.name}"`;
    }
  }

  const label = detail ? `${baseLabel}: ${detail}` : baseLabel;
  return { label, detail };
}

let trackedActions: TrackedAction[] = [];
const actionListeners: Set<() => void> = new Set();
let actionCounter = 0;

function notifyActionListeners() {
  actionListeners.forEach((fn) => fn());
}

export function addTrackedAction(action: string, args?: Record<string, any>): string {
  const id = `ta-${++actionCounter}`;
  const { label, detail } = formatActionLabel(action, args);
  trackedActions = [
    ...trackedActions,
    {
      id,
      action,
      label,
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

export function useTrackedActions() {
  const [actions, setActions] = useState<TrackedAction[]>(() => trackedActions);

  useEffect(() => {
    // Sync in case state changed between render and effect
    setActions(trackedActions);

    const update = () => setActions([...trackedActions]);
    actionListeners.add(update);
    return () => {
      actionListeners.delete(update);
    };
  }, []);

  return actions;
}

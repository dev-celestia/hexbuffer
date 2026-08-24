import { useEffect, useState } from 'react';

export interface TrackedAction {
  id: string;
  action: string;
  label: string;
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
  run_terminal_command: 'Executing terminal command',
};


let trackedActions: TrackedAction[] = [];
const actionListeners: Set<() => void> = new Set();
let actionCounter = 0;

function notifyActionListeners() {
  actionListeners.forEach((fn) => fn());
}

export function addTrackedAction(action: string): string {
  const id = `ta-${++actionCounter}`;
  trackedActions = [
    ...trackedActions,
    {
      id,
      action,
      label: actionLabels[action] ?? action,
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

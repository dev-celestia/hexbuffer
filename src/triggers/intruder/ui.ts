import { useIntruderStore } from '@/stores/intruder';

export async function startIntruderAttack(): Promise<void> {
  const store = useIntruderStore.getState();
  const tabId = store.activeTabId;
  const tab = store.tabs.find((t) => t.id === tabId);
  if (!tab || tab.isRunning) {
    return;
  }
  await store.startAttack();
  const after = useIntruderStore.getState().tabs.find((t) => t.id === tabId);
  if (after?.startError) {
    throw new Error(after.startError);
  }
}

export async function stopIntruderAttack(): Promise<void> {
  const store = useIntruderStore.getState();
  const tab = store.tabs.find((t) => t.id === store.activeTabId);
  if (!tab?.attackId) {
    return;
  }
  await store.stopAttack();
}

export const startInvokerAttack = startIntruderAttack;
export const stopInvokerAttack = stopIntruderAttack;
export const stopInvokerUiAttack = stopIntruderAttack;
export const stopIntruderUiAttack = stopIntruderAttack;

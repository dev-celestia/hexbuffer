import { useInterceptStore } from '@/pages/intercept/state/intercept-store';

export function toggleInterceptEnabled(): void {
  const store = useInterceptStore.getState();
  const newEnabled = store.status?.mode !== 'Enabled';
  void store.toggleIntercept(newEnabled);
}

export async function forwardPaused(): Promise<boolean> {
  const store = useInterceptStore.getState();
  if (store.requests.length === 0) return false;
  await store.forwardSelectedRequest();
  return true;
}

export async function dropPaused(): Promise<boolean> {
  const store = useInterceptStore.getState();
  const request =
    store.requests.find((r) => r.id === store.selectedRequestId) ||
    store.requests[0];
  if (!request) return false;
  await store.dropRequest(request);
  return true;
}

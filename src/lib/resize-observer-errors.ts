const BENIGN_ERROR_MESSAGES = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded',
  'Canceled',
  'listeners[eventId]',
];

function isBenignErrorMessage(message: unknown): boolean {
  if (typeof message !== 'string') return false;
  return BENIGN_ERROR_MESSAGES.some((knownMessage) => message.includes(knownMessage));
}

function isBenignReason(reason: unknown): boolean {
  if (!reason) return false;
  if (typeof reason === 'string') {
    return isBenignErrorMessage(reason);
  }
  if (reason instanceof Error) {
    if (reason.name === 'Canceled' || reason.message === 'Canceled') return true;
    return isBenignErrorMessage(reason.message);
  }
  if (typeof reason === 'object' && reason !== null) {
    const obj = reason as Record<string, unknown>;
    if (obj.name === 'Canceled' || obj.message === 'Canceled') return true;
    if (typeof obj.message === 'string') return isBenignErrorMessage(obj.message);
  }
  return false;
}

export function suppressResizeObserverLoopErrors(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener(
    'error',
    (event) => {
      if (!isBenignErrorMessage(event.message)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (!isBenignReason(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
}

import { toErrorMessage } from '@/lib/ipc';

const UNKNOWN_ERROR_MESSAGE =
  'An unexpected error stopped this screen from rendering. Reloading usually clears it.';

export interface ErrorDescription {
  message: string;
  details: string | null;
}

/**
 * Split an unknown throw into a short message plus optional technical detail.
 *
 * Non-`Error` throws are real here, not hypothetical: the IPC transport can reject with an
 * `ArrayBuffer`, and interpolating that renders the useless `[object ArrayBuffer]`. `toErrorMessage`
 * decodes the body instead, so the panel names the actual cause.
 *
 * Kept free of component imports so it stays testable in the plain node environment.
 */
export function describeError(error: unknown): ErrorDescription {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || UNKNOWN_ERROR_MESSAGE,
      details: error.stack ?? null,
    };
  }

  return { message: toErrorMessage(error, UNKNOWN_ERROR_MESSAGE), details: null };
}

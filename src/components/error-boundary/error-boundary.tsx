import * as React from 'react';
import { ErrorFallback } from './error-fallback';
import { describeError } from './describe-error';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Recovery action. Defaults to a full window reload.
   *
   * Injectable because `window.location.reload` is a non-configurable own property of jsdom's
   * `Location`, so it cannot be spied on — without this seam the only way to prove the button works
   * would be to assert on jsdom's "Not implemented: navigation" log text.
   */
  onReload?: () => void;
}

interface AppErrorBoundaryState {
  error: unknown;
  hasError: boolean;
}

/**
 * Last-resort boundary around the whole application.
 *
 * Without one, a single unguarded failure — a missing Tauri bridge call, an unhandled command
 * rejection — unmounts from the root down and leaves an empty window with no way back. This keeps a
 * working reload affordance on screen and prints the reason, so the failure is diagnosable instead
 * of silent.
 *
 * It deliberately sits outside `ThemeProvider`: it has to survive a crash in any provider, and the
 * theme class lives on `<html>` so the fallback is still themed correctly.
 */
export class AppErrorBoundary extends React.Component<
  Readonly<AppErrorBoundaryProps>,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null, hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('Unhandled error reached the app root:', error, info.componentStack);
  }

  private readonly handleReload = (): void => {
    if (this.props.onReload) {
      this.props.onReload();
      return;
    }

    window.location.reload();
  };

  render(): React.ReactNode {
    const { error, hasError } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    const { message, details } = describeError(error);

    return <ErrorFallback message={message} details={details} onReload={this.handleReload} />;
  }
}

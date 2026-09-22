/**
 * TEMPORARY visual-verification harness for the new `@celestia-project/ui` layout components.
 *
 * Renders the *real* layout components (AuthShell / SignInPage / SignUpPage / ForgotPasswordPage /
 * ResetPasswordPage / TwoFactorPage / PageShell / NotFoundPage) with the real Tailwind classes, so
 * they can be opened in a plain browser without booting Tauri.
 *
 * Served by the normal dev server: http://localhost:1420/auth-layouts-preview.html
 *
 * Delete this file and `auth-layouts-preview.html` once the visuals are signed off.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import {
  Button,
  ForgotPasswordPage,
  NotFoundPage,
  PageShell,
  ResetPasswordPage,
  SignInPage,
  SignUpPage,
  TwoFactorPage,
} from '@celestia-project/ui';

class PreviewBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[auth-layouts-preview] render failed', error);
  }

  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            margin: 0,
            padding: 24,
            font: '12px/1.5 ui-monospace, monospace',
            whiteSpace: 'pre-wrap',
            color: '#fca5a5',
            background: '#1c1917',
          }}
        >
          {'PREVIEW RENDER FAILED\n\n'}
          {String(this.state.error.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

const Logo = () => (
  <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg font-bold">
    C
  </div>
);

const SCENES = [
  'sign-in',
  'sign-up',
  'forgot-password',
  'reset-password',
  'two-factor',
  'page-shell',
  'not-found',
] as const;

type Scene = (typeof SCENES)[number];

const noop = () => {};

function SceneSwitcher({
  scene,
  onChange,
}: {
  scene: Scene;
  onChange: (s: Scene) => void;
}) {
  return (
    <div className="bg-muted/60 border-border fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full border p-1 shadow-lg backdrop-blur">
      {SCENES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={
            s === scene
              ? 'bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium'
              : 'text-muted-foreground hover:text-foreground rounded-full px-3 py-1 text-xs transition-colors'
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function Preview() {
  const initial = (() => {
    const q = new URLSearchParams(window.location.search).get('scene');
    return (SCENES as readonly string[]).includes(q ?? '') ? (q as Scene) : 'sign-in';
  })();
  const [scene, setScene] = React.useState<Scene>(initial);

  return (
    <PreviewBoundary>
      <ThemeProvider defaultTheme="dark" defaultPrimaryColor="purple">
        <MemoryRouter initialEntries={[{ pathname: '/' }]}>
          <div className="bg-background text-foreground min-h-svh">
            {scene === 'sign-in' && (
              <SignInPage
                logo={<Logo />}
                onSubmit={(d) => console.log('sign-in', d)}
                onForgotPassword={() => setScene('forgot-password')}
                onSignUp={() => setScene('sign-up')}
                socialProviders={[
                  { id: 'google', label: 'Google' },
                  { id: 'github', label: 'GitHub' },
                ]}
              />
            )}
            {scene === 'sign-up' && (
              <SignUpPage
                logo={<Logo />}
                onSubmit={(d) => console.log('sign-up', d)}
                onSignIn={() => setScene('sign-in')}
                termsLabel={
                  <>
                    I agree to the <span className="text-primary underline">Terms</span> and{' '}
                    <span className="text-primary underline">Privacy Policy</span>
                  </>
                }
              />
            )}
            {scene === 'forgot-password' && (
              <ForgotPasswordPage
                logo={<Logo />}
                onSubmit={(d) => console.log('forgot', d)}
                onBack={() => setScene('sign-in')}
              />
            )}
            {scene === 'reset-password' && (
              <ResetPasswordPage
                logo={<Logo />}
                onSubmit={(d) => console.log('reset', d)}
              />
            )}
            {scene === 'two-factor' && (
              <TwoFactorPage
                logo={<Logo />}
                onSubmit={(d) => console.log('2fa', d)}
                onResend={noop}
                onBack={() => setScene('sign-in')}
              />
            )}
            {scene === 'page-shell' && (
              <PageShell
                title="API Mock"
                description="Serve mock endpoints from local fixtures."
                width="lg"
                actions={
                  <>
                    <Button variant="outline" size="sm">
                      Import
                    </Button>
                    <Button size="sm">New route</Button>
                  </>
                }
              >
                <div className="border-border text-muted-foreground flex h-48 items-center justify-center rounded-lg border border-dashed text-sm">
                  Page content goes here
                </div>
              </PageShell>
            )}
            {scene === 'not-found' && (
              <NotFoundPage
                onAction={() => setScene('sign-in')}
                secondaryLabel="Contact support"
                onSecondaryAction={noop}
              />
            )}
            <SceneSwitcher scene={scene} onChange={setScene} />
          </div>
        </MemoryRouter>
      </ThemeProvider>
    </PreviewBoundary>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from auth-layouts-preview.html');
createRoot(container).render(<Preview />);
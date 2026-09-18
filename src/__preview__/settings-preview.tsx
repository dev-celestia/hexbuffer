/**
 * TEMPORARY visual-verification harness for the settings page polish pass.
 *
 * Renders the *real* `SettingsLayout` — and therefore the real `SettingsGroup` / `SettingsRow`
 * primitives and the real Tailwind classes — against a hand-built `SettingsPageState`, so the page
 * can be opened in a plain browser without booting Tauri.
 *
 * Served by the normal dev server: http://localhost:1420/settings-preview.html?tab=general
 *
 * Delete this directory and `settings-preview.html` once the visuals are signed off.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SettingsLayout } from '@/pages/settings/components/settings-layout';
import { ALL_CATEGORIES, SETTINGS_STATE } from './settings-state';

/**
 * Renders the failure text on the page itself. A blank page is ambiguous — this makes a render
 * error legible.
 */
class PreviewBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[settings-preview] render failed', error);
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

function Preview() {
  return (
    <PreviewBoundary>
      <ThemeProvider defaultTheme="dark" defaultPrimaryColor="purple">
        <MemoryRouter initialEntries={[{ pathname: '/', search: window.location.search }]}>
          <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
            <SettingsLayout settings={SETTINGS_STATE} categories={ALL_CATEGORIES} />
          </div>
        </MemoryRouter>
      </ThemeProvider>
    </PreviewBoundary>
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from settings-preview.html');
createRoot(container).render(<Preview />);

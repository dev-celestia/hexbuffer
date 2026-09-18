import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SettingsPageState } from '../hooks/use-settings-page';
import { SettingsSidebar, type SettingsCategory } from './settings-sidebar';
import { SettingsSearchInput } from './settings-search-input';
import { SettingsSearchProvider } from './settings-search';
import { GeneralSettingsTab } from './general-settings-tab';
import { CaCertificateSettingsTab } from './ca-certificate-settings-tab';
import { AiSettingsTab } from './ai-settings-tab';
import { AutomationSettingsTab } from './automation-settings-tab';
import { AppearanceSettingsTab } from './appearance-settings-tab';
import { R2SettingsTab } from './r2-settings-tab';

interface SettingsLayoutProps {
  settings: SettingsPageState;
  categories?: SettingsCategory[];
}

interface CategoryContentProps {
  settings: SettingsPageState;
  active: SettingsCategory;
  query: string;
}

/** Title + one-line orientation for each section, shown in the page header. */
const CATEGORY_META: Record<SettingsCategory, { label: string; description: string }> = {
  general: {
    label: 'General',
    description: 'Proxy listener, updates, and local storage.',
  },
  'ca-cert': {
    label: 'CA Certificate',
    description: 'The certificate that lets the proxy decrypt HTTPS traffic.',
  },
  ai: {
    label: 'AI',
    description: 'Bring your own key, pick a model, and control what leaves your machine.',
  },
  r2: {
    label: 'R2 Storage',
    description: 'Cloudflare R2 credentials for S3-compatible uploads.',
  },
  automation: {
    label: 'Automation',
    description: 'Scheduling limits for live-traffic workflows.',
  },
  appearance: {
    label: 'Appearance',
    description: 'Theme, accent colour, background, and workspace widgets.',
  },
};

function CategoryContent({ settings, active, query }: Readonly<CategoryContentProps>) {
  const meta = CATEGORY_META[active];

  return (
    <div
      data-settings-pane
      className={cn(
        // Layout & Positioning
        'mx-auto w-full max-w-3xl',

        // Sizing & Spacing
        'px-6 py-6 lg:px-10 lg:py-8'
      )}
    >
      <div
        className={cn(
          // Sizing & Spacing
          'space-y-6'
        )}
      >
        {active === 'general' && <GeneralSettingsTab settings={settings} />}
        {active === 'ca-cert' && <CaCertificateSettingsTab settings={settings} />}
        {active === 'ai' && <AiSettingsTab settings={settings} />}
        {active === 'automation' && <AutomationSettingsTab />}
        {active === 'appearance' && <AppearanceSettingsTab />}
        {active === 'r2' && <R2SettingsTab settings={settings} />}
      </div>

      {/*
        Rendered always, revealed by the stylesheet only when a query is active and no row in this
        pane matched. Doing it in CSS rather than React means the pane does not have to count its
        own matches and re-render — which loops once the empty groups unmount.
      */}
      <p
        data-settings-empty
        className={cn(
          // Sizing & Spacing
          'px-1 py-12 text-center',

          // Typography
          'text-sm text-muted-foreground'
        )}
      >
        Nothing in {meta.label} matches “{query}”. Try another section from the list.
      </p>
    </div>
  );
}

const DEFAULT_TABS: SettingsCategory[] = ['general', 'ca-cert', 'ai', 'appearance'];

export function SettingsLayout({ settings, categories }: Readonly<SettingsLayoutProps>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = categories || DEFAULT_TABS;
  const tabParam = searchParams.get('tab') as SettingsCategory | null;
  const initialTab: SettingsCategory =
    tabParam && validTabs.includes(tabParam)
      ? tabParam
      : validTabs[0] || 'general';

  const [active, setActive] = React.useState<SettingsCategory>(initialTab);
  const [contentKey, setContentKey] = React.useState(0);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== active) {
      setActive(tabParam);
      setContentKey((k) => k + 1);
    }
  }, [tabParam, validTabs, active]);

  React.useEffect(() => {
    if (categories && !categories.includes(active)) {
      setActive(categories[0] || 'general');
    }
  }, [categories, active]);

  const handleSelect = React.useCallback((category: SettingsCategory) => {
    setActive(category);
    setContentKey((k) => k + 1);
    // The search is scoped to one section, so carrying it across a section change would filter a
    // tab the user never searched and look like the tab is empty.
    setQuery('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', category);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const meta = CATEGORY_META[active];
  const searching = query.trim().length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex overflow-hidden',

        // Sizing & Spacing
        'h-full'
      )}
    >
      <SettingsSidebar active={active} onSelect={handleSelect} categories={categories} />

      <div
        className={cn(
          // Layout & Positioning
          'flex min-w-0 flex-1 flex-col overflow-hidden'
        )}
      >
        <header
          className={cn(
            // Layout & Positioning
            'flex shrink-0 flex-wrap items-center justify-between gap-3',

            // Sizing & Spacing
            'px-6 py-4 lg:px-10',

            // Backgrounds & Borders
            'border-b bg-background/80 backdrop-blur-sm'
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              'min-w-0'
            )}
          >
            <h1
              className={cn(
                // Typography
                'truncate text-lg font-semibold tracking-tight'
              )}
            >
              {meta.label}
            </h1>
            <p
              className={cn(
                // Typography
                'truncate text-xs text-muted-foreground'
              )}
            >
              {meta.description}
            </p>
          </div>
          <SettingsSearchInput value={query} onChange={setQuery} scopeLabel={meta.label} />
        </header>

        {/*
          `data-settings-search` is what the stylesheet keys on to hide groups with no match and to
          reveal the empty state. Remounting on `contentKey` replays the entrance animation and
          resets the scroll position when the section changes.
        */}
        <div
          key={contentKey}
          data-settings-search={searching ? 'active' : undefined}
          className={cn(
            // Layout & Positioning
            'flex-1 overflow-auto',

            // Interactive & States
            'animate-settings-panel motion-reduce:animate-none'
          )}
        >
          <SettingsSearchProvider value={query}>
            <CategoryContent settings={settings} active={active} query={query} />
          </SettingsSearchProvider>
        </div>
      </div>
    </div>
  );
}

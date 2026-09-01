import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SettingsPageState } from '../hooks/use-settings-page';
import { SettingsSidebar, type SettingsCategory } from './settings-sidebar';
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
}

const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  general: 'General',
  'ca-cert': 'CA Certificate',
  ai: 'AI',
  r2: 'R2 Storage',
  automation: 'Automation',
  appearance: 'Appearance',
};

function CategoryContent({ settings, active }: CategoryContentProps) {
  const title = CATEGORY_LABELS[active];

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex-1 overflow-auto"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "mx-auto w-full max-w-2xl",

          // Sizing & Spacing
          "px-8 py-8"
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            "mb-6"
          )}
        >
          <h1
            className={cn(
              // Typography
              "text-xl font-semibold tracking-tight"
            )}
          >
            {title}
          </h1>
        </div>

        <div
          className={cn(
            // Sizing & Spacing
            "space-y-6"
          )}
        >
          {active === 'general' && <GeneralSettingsTab settings={settings} />}
          {active === 'ca-cert' && <CaCertificateSettingsTab settings={settings} />}
          {active === 'ai' && <AiSettingsTab settings={settings} />}
          {active === 'automation' && <AutomationSettingsTab />}
          {active === 'appearance' && <AppearanceSettingsTab />}
          {active === 'r2' && <R2SettingsTab settings={settings} />}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TABS: SettingsCategory[] = ['general', 'ca-cert', 'ai', 'appearance'];

export function SettingsLayout({ settings, categories }: SettingsLayoutProps) {
  const [searchParams] = useSearchParams();
  const validTabs = categories || DEFAULT_TABS;
  const tabParam = searchParams.get('tab') as SettingsCategory | null;
  const initialTab: SettingsCategory =
    tabParam && validTabs.includes(tabParam)
      ? tabParam
      : validTabs[0] || 'general';

  const [active, setActive] = React.useState<SettingsCategory>(initialTab);
  const [contentKey, setContentKey] = React.useState(0);

  React.useEffect(() => {
    if (categories && !categories.includes(active)) {
      setActive(categories[0] || 'general');
    }
  }, [categories, active]);

  const handleSelect = React.useCallback((category: SettingsCategory) => {
    setActive(category);
    setContentKey((k) => k + 1);
  }, []);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex overflow-hidden",

        // Sizing & Spacing
        "h-full"
      )}
    >
      <SettingsSidebar active={active} onSelect={handleSelect} categories={categories} />

      <div
        key={contentKey}
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 overflow-hidden",

          // Interactive & States
          "animate-in fade-in slide-in-from-right-4 duration-200"
        )}
      >
        <CategoryContent settings={settings} active={active} />
      </div>
    </div>
  );
}

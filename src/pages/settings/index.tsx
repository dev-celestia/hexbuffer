import { SettingsLayout } from './components/settings-layout';
import { useSettingsPage } from './hooks/use-settings-page';
import type { SettingsCategory } from './components/settings-sidebar';

export interface SettingsProps {
  categories?: SettingsCategory[];
}

export function Settings({ categories }: SettingsProps) {
  const settings = useSettingsPage();

  return <SettingsLayout settings={settings} categories={categories} />;
}

export type { SettingsCategory };

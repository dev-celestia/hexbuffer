/**
 * TEMPORARY. A hand-built `SettingsPageState` so the settings page can be rendered outside Tauri
 * — by the browser preview (`settings-preview.html`) and by `layout-probe.test.tsx`.
 *
 * Every key of `useSettingsPage()`'s return is present on purpose: a missing one would surface as
 * `undefined` and could be mistaken for a layout bug.
 */
import type { SettingsCategory } from '@/pages/settings/components/settings-sidebar';
import type { SettingsPageState } from '@/pages/settings/hooks/use-settings-page';
import { buildAiProviderKeyEntries } from '@/pages/settings/lib/ai-providers';

const noop = () => {};

const AI_SETTINGS = {
  provider: 'deepseek',
  model: 'deepseek-v4-pro',
  apiKey: '',
  hasApiKey: true,
  allowThirdPartyAiSharing: false,
  customBaseUrl: null,
};

const PROVIDER_KEY_STATUS: Record<string, boolean> = {
  deepseek: true,
  openai: false,
  anthropic: false,
  'lm-studio': true,
};

/** Built by the real pure function, so the key rows match production output exactly. */
const AI_PROVIDER_KEY_ENTRIES = buildAiProviderKeyEntries({
  keyStatus: PROVIDER_KEY_STATUS,
  activeProvider: AI_SETTINGS.provider,
  activeBaseUrl: AI_SETTINGS.customBaseUrl,
  embeddingsBaseUrl: null,
  profiles: undefined,
  allowThirdPartyAiSharing: AI_SETTINGS.allowThirdPartyAiSharing,
});

export const SETTINGS_STATE = {
  isMac: true,
  aiSettings: AI_SETTINGS,
  aiSettingsLoading: false,
  aiSettingsSaving: false,
  currentVersion: '1.4.2',
  proxyDefaultPort: 8080,
  proxyFactoryDefaultPort: 8080,
  proxyPort: 8080,
  proxyPortDraft: '8080',
  proxyStatus: 'connected',
  deletingAllData: false,
  deletingArtifact: null,
  handleDeleteArtifact: noop,
  downloading: false,
  installingCa: false,
  regeneratingCa: false,
  handleDownloadCert: noop,
  handleInstallMacCert: noop,
  handleRegenerateCert: noop,
  handleClearProviderKey: noop,
  handleSaveProviderKey: noop,
  handleDeleteAllData: noop,
  handleResetProxyDefaultPort: noop,
  handleSaveProxyDefaultPort: noop,
  handleSaveAiSettings: noop,
  handleToggleThirdPartyAiSharing: noop,
  setProxyPortDraft: noop,
  storageInfo: {
    appDataDir: '/Users/dev/Library/Application Support/com.hexbuffer.app',
    databasePath: '~/Library/Application Support/com.hexbuffer.app/hexbuffer.db',
    browserArtifactsPath: '~/Library/Application Support/com.hexbuffer.app/browser',
    databaseSizeBytes: 148_897_792,
    browserArtifactsSizeBytes: 21_233_664,
    regressionArtifactsSizeBytes: 3_145_728,
    logFileSizeBytes: 812_032,
  },
  providerKeyStatus: PROVIDER_KEY_STATUS,
  aiProviderKeyEntries: AI_PROVIDER_KEY_ENTRIES,
  keyActionProvider: null,
  savedAiSettings: AI_SETTINGS,
  updateAiProvider: noop,
  updateAiSettings: noop,
  updateAvailable: false,
  updateChecking: false,
  updateDownloading: false,
  updateError: null,
  updateInstalled: false,
  updateMessage: null,
  updateVersion: null,
  handleCheckForUpdates: noop,
  handleInstallUpdate: noop,
  handleRestartApp: noop,
  r2AccountId: 'a1b2c3d4e5f6',
  setR2AccountId: noop,
  r2AccessKeyId: 'AKIAEXAMPLEKEYID',
  setR2AccessKeyId: noop,
  r2SecretAccessKey: '',
  setR2SecretAccessKey: noop,
  r2CustomEndpointUrl: '',
  setR2CustomEndpointUrl: noop,
  r2HasSecretKey: true,
  r2Saving: false,
  r2Loading: false,
  handleSaveR2Settings: noop,
  handleClearR2Credentials: noop,
} as unknown as SettingsPageState;

/** All six destinations, so the sidebar's section grouping is exercised end to end. */
export const ALL_CATEGORIES: SettingsCategory[] = [
  'general',
  'appearance',
  'ca-cert',
  'ai',
  'r2',
  'automation',
];

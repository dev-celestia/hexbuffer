import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'sonner';
import { toErrorMessage } from '@/lib/ipc';
import { getCaCert, regenerateCaCert, saveCaCert, trustInterceptCa } from '@/pages/live-traffic/http-history/api';
import { useUpdater } from '@/hooks/use-updater';
import { useIsMac } from '@/hooks/use-platform';
import { DEFAULT_PROXY_PORT, MAX_PROXY_PORT, MIN_PROXY_PORT, isValidProxyPort, useAppStore } from '@/stores/app';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import { AI_KEY_PROVIDER_OPTIONS } from '../constants';
import {
  buildAiProviderKeyEntries,
  canSaveProviderKey,
  keyGateBaseUrl,
  switchAiProvider,
  type AiProviderProfile,
} from '../lib/ai-providers';

export interface AiSettings {
  provider: string;
  model: string;
  apiKey: string;
  hasApiKey: boolean;
  allowThirdPartyAiSharing: boolean;
  customBaseUrl?: string | null;
  /**
   * Model + base URL remembered per provider, keyed by provider id. Read-only from the UI's point
   * of view — the backend rebuilds it from the active selection on every save, so switching back
   * to a provider restores the configuration it had.
   */
  providerProfiles?: Record<string, AiProviderProfile>;
  embeddingsBaseUrl?: string | null;
  embeddingsModel?: string | null;
}

export interface StorageInfo {
  appDataDir: string;
  databasePath: string;
  browserArtifactsPath: string;
  databaseSizeBytes: number;
  browserArtifactsSizeBytes: number;
  regressionArtifactsSizeBytes: number;
  logFileSizeBytes: number;
}

type AiKeyStatus = Record<string, boolean>;

const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: 'deepseek',
  model: 'deepseek-v4-pro',
  apiKey: '',
  hasApiKey: false,
  allowThirdPartyAiSharing: false,
};

const LEGACY_AI_KEY_MIGRATION_ATTEMPTED_KEY = 'hexbuffer-ai-keys-migration-attempted';

export function useSettingsPage() {
  const [downloading, setDownloading] = React.useState(false);
  const [installingCa, setInstallingCa] = React.useState(false);
  const [regeneratingCa, setRegeneratingCa] = React.useState(false);
  const [aiSettings, setAiSettings] = React.useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [aiSettingsLoading, setAiSettingsLoading] = React.useState(true);
  const [aiSettingsSaving, setAiSettingsSaving] = React.useState(false);
  const [providerKeyStatus, setProviderKeyStatus] = React.useState<AiKeyStatus>({});
  /** Provider whose key is currently being saved or cleared, so only that row shows a pending state. */
  const [keyActionProvider, setKeyActionProvider] = React.useState<string | null>(null);
  /**
   * Last settings the backend confirmed. The sharing policy is persisted on its own (see
   * `handleToggleThirdPartyAiSharing`) and is rebuilt from this snapshot rather than the draft,
   * so an unsaved provider/model edit can never be dragged into that write.
   */
  const [savedAiSettings, setSavedAiSettings] = React.useState<AiSettings | null>(null);
  const [storageInfo, setStorageInfo] = React.useState<StorageInfo | null>(null);
  const [deletingAllData, setDeletingAllData] = React.useState(false);
  const [deletingArtifact, setDeletingArtifact] = React.useState<string | null>(null);
  const proxyDefaultPort = useAppStore((state) => state.proxyDefaultPort);
  const proxyPort = useAppStore((state) => state.proxyPort);
  const proxyStatus = useAppStore((state) => state.proxyStatus);
  const saveProxyDefaultPort = useAppStore((state) => state.saveProxyDefaultPort);
  const checkProxyStatus = useAppStore((state) => state.checkProxyStatus);
  const [proxyPortDraft, setProxyPortDraft] = React.useState(String(proxyDefaultPort));

  const clearBrowserAutomationArtifactPaths = useBrowserAutomationStore((state) => state.clearArtifactPaths);

  const [r2AccountId, setR2AccountId] = React.useState('');
  const [r2AccessKeyId, setR2AccessKeyId] = React.useState('');
  const [r2SecretAccessKey, setR2SecretAccessKey] = React.useState('');
  const [r2CustomEndpointUrl, setR2CustomEndpointUrl] = React.useState('');
  const [r2HasSecretKey, setR2HasSecretKey] = React.useState(false);
  const [r2Saving, setR2Saving] = React.useState(false);
  const [r2Loading, setR2Loading] = React.useState(true);

  const {
    currentVersion,
    checking: updateChecking,
    downloading: updateDownloading,
    downloadError: updateError,
    downloadMessage: updateMessage,
    updateInstalled,
    updateAvailable,
    updateVersion,
    checkForUpdates,
    installUpdate,
  } = useUpdater();

  const handleRestartApp = React.useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error('Failed to restart app:', err);
      toast.error('Failed to restart automatically. Please restart the app manually.');
    }
  }, []);

  const handleInstallUpdate = React.useCallback(async () => {
    const targetVersion = updateVersion;
    const toastId = toast.loading(`Installing v${targetVersion ?? ''}...`);
    const result = await installUpdate();
    if (result.ok) {
      toast.success(`Updated to v${targetVersion ?? ''}`, {
        id: toastId,
        description: 'Restarting app to finish applying the update...',
      });
      window.setTimeout(async () => {
        try {
          await relaunch();
        } catch (err) {
          console.error('Failed to restart app automatically:', err);
          toast.error('Could not restart automatically. Please restart the app manually.');
        }
      }, 1000);
    } else {
      const err = result.error || updateError || 'Update failed.';
      toast.error('Update failed', {
        id: toastId,
        description: err.toLowerCase().includes('signature') ? 'Release signature mismatch.' : err,
      });
    }
  }, [installUpdate, updateVersion, updateError]);

  const refreshAiKeyStatus = React.useCallback(async () => {
    const status = await invoke<AiKeyStatus>('get_ai_key_status');
    setProviderKeyStatus(status);
    return status;
  }, []);

  const migrateLegacyAiKeys = React.useCallback(async () => {
    if (window.localStorage.getItem(LEGACY_AI_KEY_MIGRATION_ATTEMPTED_KEY) === 'true') {
      return;
    }

    const legacyValue = window.localStorage.getItem('hexbuffer-ai-keys');
    if (!legacyValue) {
      window.localStorage.setItem(LEGACY_AI_KEY_MIGRATION_ATTEMPTED_KEY, 'true');
      return;
    }

    try {
      const parsed = JSON.parse(legacyValue) as { state?: { keys?: Record<string, string> }; keys?: Record<string, string> };
      const keys = parsed.state?.keys ?? parsed.keys ?? {};
      const entries = Object.entries(keys).filter(([, value]) => value.trim().length > 0);

      for (const [provider, apiKey] of entries) {
        await invoke<AiKeyStatus>('set_ai_api_key', { provider, apiKey });
      }

      window.localStorage.removeItem('hexbuffer-ai-keys');
      window.localStorage.setItem(LEGACY_AI_KEY_MIGRATION_ATTEMPTED_KEY, 'true');
      if (entries.length > 0) {
        toast.success('Migrated saved AI API keys to the OS credential store');
      }
    } catch (error) {
      window.localStorage.setItem(LEGACY_AI_KEY_MIGRATION_ATTEMPTED_KEY, 'true');
      console.error('Failed to migrate legacy AI API keys:', error);
      toast.error(`Failed to migrate saved AI API keys: ${toErrorMessage(error, 'Unknown error')}`);
    }
  }, []);

  const loadAiSettings = React.useCallback(async () => {
    try {
      setAiSettingsLoading(true);
      await migrateLegacyAiKeys();
      const keyStatus = await refreshAiKeyStatus();
      const settings = await invoke<AiSettings>('get_ai_settings');
      setAiSettings({ ...settings, hasApiKey: !!keyStatus[settings.provider] });
      setSavedAiSettings(settings);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast.error(`Failed to load AI settings: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setAiSettingsLoading(false);
    }
  }, [migrateLegacyAiKeys, refreshAiKeyStatus]);

  React.useEffect(() => {
    void loadAiSettings();
  }, [loadAiSettings]);

  const loadR2Settings = React.useCallback(async () => {
    try {
      setR2Loading(true);
      // Public status only — the secret access key never leaves the Rust process
      const settings = await invoke<{
        accountId: string;
        accessKeyId: string;
        customEndpointUrl?: string | null;
        hasSecret: boolean;
      } | null>('r2_credentials_status');

      if (settings) {
        setR2AccountId(settings.accountId);
        setR2AccessKeyId(settings.accessKeyId);
        setR2SecretAccessKey('');
        setR2CustomEndpointUrl(settings.customEndpointUrl ?? '');
        setR2HasSecretKey(settings.hasSecret);
      } else {
        setR2AccountId('');
        setR2AccessKeyId('');
        setR2SecretAccessKey('');
        setR2CustomEndpointUrl('');
        setR2HasSecretKey(false);
      }
    } catch (error) {
      console.error('Failed to load R2 settings:', error);
    } finally {
      setR2Loading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadR2Settings();
  }, [loadR2Settings]);

  const handleSaveR2Settings = React.useCallback(async () => {
    try {
      setR2Saving(true);
      // Blank secret field keeps the existing keychain entry (backend keeps
      // the stored secret when secretAccessKey is null)
      const secretInput = r2SecretAccessKey.trim();

      if (!r2AccountId.trim() || !r2AccessKeyId.trim() || (!secretInput && !r2HasSecretKey)) {
        toast.error('Account ID, Access Key ID, and Secret Access Key must not be empty');
        return;
      }

      await invoke('save_r2_credentials', {
        accountId: r2AccountId.trim(),
        accessKeyId: r2AccessKeyId.trim(),
        secretAccessKey: secretInput || null,
        customEndpointUrl: r2CustomEndpointUrl.trim() || null,
      });

      setR2SecretAccessKey('');
      setR2HasSecretKey(true);
      toast.success('R2 settings saved successfully');
    } catch (error) {
      console.error('Failed to save R2 settings:', error);
      toast.error(`Failed to save R2 settings: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setR2Saving(false);
    }
  }, [r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2CustomEndpointUrl, r2HasSecretKey]);

  const handleClearR2Credentials = React.useCallback(async () => {
    try {
      setR2Saving(true);
      await invoke('clear_r2_credentials');
      setR2AccountId('');
      setR2AccessKeyId('');
      setR2SecretAccessKey('');
      setR2CustomEndpointUrl('');
      setR2HasSecretKey(false);
      toast.success('R2 settings cleared');
    } catch (error) {
      console.error('Failed to clear R2 settings:', error);
      toast.error(`Failed to clear R2 settings: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setR2Saving(false);
    }
  }, []);

  const refreshStorageInfo = React.useCallback(async () => {
    try {
      const info = await invoke<StorageInfo>('get_storage_info');
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to refresh storage info:', error);
    }
  }, []);

  React.useEffect(() => {
    void refreshStorageInfo();
  }, [refreshStorageInfo]);

  React.useEffect(() => {
    setProxyPortDraft(String(proxyDefaultPort));
  }, [proxyDefaultPort]);

  React.useEffect(() => {
    void checkProxyStatus();

    const interval = window.setInterval(() => {
      void checkProxyStatus();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [checkProxyStatus]);

  const handleDeleteAllData = React.useCallback(async () => {
    try {
      setDeletingAllData(true);
      await invoke('reset_all_app_data');
      clearBrowserAutomationArtifactPaths();
      toast.success('All data deleted. Reinitializing...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast.error(`Failed to delete data: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setDeletingAllData(false);
    }
  }, [clearBrowserAutomationArtifactPaths]);

  const handleDeleteArtifact = React.useCallback(async (artifact: string) => {
    try {
      setDeletingArtifact(artifact);
      const result = await invoke<{ bytesDeleted: number; label: string }>('delete_storage_artifact', { artifact });
      const mb = (result.bytesDeleted / 1024 / 1024).toFixed(1);
      toast.success(`${result.label} cleared (${mb} MB freed)`);
      await refreshStorageInfo();
    } catch (error) {
      console.error('Failed to delete artifact:', error);
      toast.error(`Failed to delete: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setDeletingArtifact(null);
    }
  }, [refreshStorageInfo]);

  const handleDownloadCert = React.useCallback(async () => {
    try {
      setDownloading(true);

      const filePath = await save({
        title: 'FloppyDisk CA Certificate',
        defaultPath: 'hexbuffer-ca.pem',
        filters: [
          {
            name: 'PEM Certificate',
            extensions: ['pem', 'crt', 'cer'],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      const certPem = await getCaCert();
      await saveCaCert(filePath, certPem);
      toast.success(`Certificate saved to ${filePath}`);
    } catch (error) {
      console.error('Failed to download CA certificate:', error);
      toast.error(`Failed to save certificate: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleInstallMacCert = React.useCallback(async () => {
    try {
      setInstallingCa(true);
      const message = await trustInterceptCa();
      toast.success(message);
    } catch (error) {
      console.error('Failed to install CA certificate:', error);
      toast.error(`Failed to install certificate: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setInstallingCa(false);
    }
  }, []);

  const handleRegenerateCert = React.useCallback(async () => {
    try {
      setRegeneratingCa(true);
      await regenerateCaCert();
      toast.success('CA certificate regenerated. You may need to re-install it in your browsers.');
    } catch (error) {
      console.error('Failed to regenerate CA certificate:', error);
      toast.error(`Failed to regenerate certificate: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setRegeneratingCa(false);
    }
  }, []);

  const aiProviderLabel = React.useCallback(
    (provider: string) =>
      AI_KEY_PROVIDER_OPTIONS.find((option) => option.id === provider)?.label ?? provider,
    [],
  );

  const updateAiProvider = React.useCallback((provider: string) => {
    // switchAiProvider drops every provider-scoped draft (model, base URL, typed key) so a
    // provider switch never leaks the previous provider's configuration into the new one, then
    // restores whatever that provider had saved in its own profile.
    setAiSettings((current) =>
      switchAiProvider(current, provider, !!providerKeyStatus[provider], current.providerProfiles),
    );
  }, [providerKeyStatus]);

  const updateAiSettings = React.useCallback((updates: Partial<AiSettings>) => {
    setAiSettings((current) => ({ ...current, ...updates }));
  }, []);

  const handleSaveProviderKey = React.useCallback(
    async (provider: string, apiKey: string) => {
      const trimmedKey = apiKey.trim();

      if (!trimmedKey) {
        toast.error(`Enter the ${aiProviderLabel(provider)} API key before saving`);
        return false;
      }

      // A key pointed at a loopback endpoint never leaves the machine, so it does not need the
      // third-party sharing policy — the same exemption the chat path applies. Replacing a key
      // that is already stored needs no consent either: the credential is already local, and the
      // authoritative gate on sending data is the send-time check in Rust. Only the first key for
      // a remote provider requires consent. `canSaveProviderKey` is the single source of this
      // rule; the row's button uses it too, so the two cannot disagree.
      //
      // The base URL must come from `keyGateBaseUrl`, not `baseUrlForProvider`: the embeddings
      // pseudo-provider keeps its endpoint in `embeddingsBaseUrl`, so reading it through the
      // profile map would return undefined and block a save the row's button had enabled.
      const baseUrl = keyGateBaseUrl(provider, {
        activeProvider: aiSettings.provider,
        activeBaseUrl: aiSettings.customBaseUrl,
        embeddingsBaseUrl: aiSettings.embeddingsBaseUrl,
        profiles: aiSettings.providerProfiles,
      });

      const allowed = canSaveProviderKey({
        provider,
        hasKey: providerKeyStatus[provider] === true,
        allowThirdPartyAiSharing: aiSettings.allowThirdPartyAiSharing,
        baseUrl,
      });

      if (!allowed) {
        toast.error('Enable third-party AI data sharing before saving an API key');
        return false;
      }

      try {
        setKeyActionProvider(provider);
        const nextKeyStatus = await invoke<AiKeyStatus>('set_ai_api_key', {
          provider,
          apiKey: trimmedKey,
        });
        setProviderKeyStatus(nextKeyStatus);
        setAiSettings((current) => ({
          ...current,
          apiKey: '',
          hasApiKey: current.provider === provider ? true : current.hasApiKey,
        }));
        toast.success(`${aiProviderLabel(provider)} API key saved`);
        return true;
      } catch (error) {
        console.error('Failed to save AI API key:', error);
        toast.error(`Failed to save AI API key: ${toErrorMessage(error, 'Unknown error')}`);
        return false;
      } finally {
        setKeyActionProvider(null);
      }
    },
    [
      aiProviderLabel,
      aiSettings.allowThirdPartyAiSharing,
      aiSettings.provider,
      aiSettings.customBaseUrl,
      // Read through `keyGateBaseUrl` to decide the embeddings exemption, so a change to the
      // embeddings endpoint must re-create this callback.
      aiSettings.embeddingsBaseUrl,
      aiSettings.providerProfiles,
      // Read inside the callback to decide whether this is a first save or a replacement, so it
      // must be a dependency or the check would run against a stale status map.
      providerKeyStatus,
    ],
  );

  const handleClearProviderKey = React.useCallback(
    async (provider: string) => {
      try {
        setKeyActionProvider(provider);
        const nextKeyStatus = await invoke<AiKeyStatus>('clear_ai_api_key', { provider });
        setProviderKeyStatus(nextKeyStatus);
        setAiSettings((current) =>
          current.provider === provider ? { ...current, apiKey: '', hasApiKey: false } : current,
        );
        toast.success(`${aiProviderLabel(provider)} API key cleared`);
        return true;
      } catch (error) {
        console.error('Failed to clear AI API key:', error);
        toast.error(`Failed to clear AI API key: ${toErrorMessage(error, 'Unknown error')}`);
        return false;
      } finally {
        setKeyActionProvider(null);
      }
    },
    [aiProviderLabel],
  );

  const handleSaveAiSettings = React.useCallback(async () => {
    try {
      setAiSettingsSaving(true);

      // API keys are managed per provider by the saved-keys list, never by this save.
      const settingsToSave = { ...aiSettings, apiKey: '' };
      const savedSettings = await invoke<AiSettings>('save_ai_settings', {
        settings: settingsToSave,
      });
      setAiSettings({
        ...savedSettings,
        hasApiKey: !!providerKeyStatus[savedSettings.provider],
      });
      setSavedAiSettings(savedSettings);
      toast.success('AI settings saved');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error(`Failed to save AI settings: ${toErrorMessage(error, 'Unknown error')}`);
    } finally {
      setAiSettingsSaving(false);
    }
  }, [aiSettings, providerKeyStatus]);

  /**
   * The sharing policy gates every non-local request and every key save, so it is persisted the
   * moment it is toggled instead of waiting for the main Save — otherwise a key saved right
   * afterwards would sit behind a policy that was never written out.
   *
   * The payload is rebuilt from the last saved settings, never from the draft, so this write
   * cannot carry unsaved provider/model/base-URL edits along with it, and it cannot trip the
   * backend's model/base-URL validation while the user is mid-edit.
   */
  const handleToggleThirdPartyAiSharing = React.useCallback(
    async (enabled: boolean) => {
      updateAiSettings({ allowThirdPartyAiSharing: enabled });

      if (!savedAiSettings) {
        return;
      }

      try {
        const saved = await invoke<AiSettings>('save_ai_settings', {
          settings: { ...savedAiSettings, allowThirdPartyAiSharing: enabled, apiKey: '' },
        });
        setSavedAiSettings(saved);
      } catch (error) {
        console.error('Failed to persist third-party AI sharing policy:', error);
        toast.error(`Failed to save sharing policy: ${toErrorMessage(error, 'Unknown error')}`);
      }
    },
    [savedAiSettings, updateAiSettings],
  );

  const aiProviderKeyEntries = React.useMemo(
    () =>
      buildAiProviderKeyEntries({
        keyStatus: providerKeyStatus,
        activeProvider: aiSettings.provider,
        activeBaseUrl: aiSettings.customBaseUrl,
        // The embeddings row is gated on its own endpoint (URL-only in Rust), so it must be fed
        // here or the row would stay blocked on a loopback Ollama/LM Studio endpoint.
        embeddingsBaseUrl: aiSettings.embeddingsBaseUrl,
        profiles: aiSettings.providerProfiles,
        allowThirdPartyAiSharing: aiSettings.allowThirdPartyAiSharing,
      }),
    [
      providerKeyStatus,
      aiSettings.provider,
      aiSettings.customBaseUrl,
      aiSettings.embeddingsBaseUrl,
      aiSettings.providerProfiles,
      aiSettings.allowThirdPartyAiSharing,
    ],
  );

  const handleSaveProxyDefaultPort = React.useCallback(async () => {
    const parsedPort = Number(proxyPortDraft);

    if (!isValidProxyPort(parsedPort)) {
      toast.error(`Enter a port between ${MIN_PROXY_PORT} and ${MAX_PROXY_PORT}`);
      return;
    }

    try {
      const activePort = await saveProxyDefaultPort(parsedPort);
      toast.success(
        proxyStatus === 'connected'
          ? `Proxy listener restarted on ${activePort}`
          : `Proxy listener port saved: ${parsedPort}`
      );
    } catch (error) {
      toast.error(toErrorMessage(error, 'Failed to save proxy port'));
    }
  }, [proxyPortDraft, proxyStatus, saveProxyDefaultPort]);
  const handleResetProxyDefaultPort = React.useCallback(async () => {
    try {
      const activePort = await saveProxyDefaultPort(DEFAULT_PROXY_PORT);
      setProxyPortDraft(String(DEFAULT_PROXY_PORT));
      toast.success(
        proxyStatus === 'connected'
          ? `Proxy listener reset and restarted on ${activePort}`
          : 'Proxy listener port reset'
      );
    } catch (error) {
      toast.error(toErrorMessage(error, 'Failed to reset proxy port'));
    }
  }, [proxyStatus, saveProxyDefaultPort]);

  const isMac = useIsMac();

  return {
    isMac,
    aiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    currentVersion,
    proxyDefaultPort,
    proxyFactoryDefaultPort: DEFAULT_PROXY_PORT,
    proxyPort,
    proxyPortDraft,
    proxyStatus,
    deletingAllData,
    deletingArtifact,
    handleDeleteArtifact,
    downloading,
    installingCa,
    regeneratingCa,
    handleDownloadCert,
    handleInstallMacCert,
    handleRegenerateCert,
    handleClearProviderKey,
    handleSaveProviderKey,
    handleDeleteAllData,
    handleResetProxyDefaultPort,
    handleSaveProxyDefaultPort,
    handleSaveAiSettings,
    handleToggleThirdPartyAiSharing,
    setProxyPortDraft,
    storageInfo,
    providerKeyStatus,
    aiProviderKeyEntries,
    keyActionProvider,
    savedAiSettings,
    updateAiProvider,
    updateAiSettings,
    updateAvailable,
    updateChecking,
    updateDownloading,
    updateError,
    updateInstalled,
    updateMessage,
    updateVersion,
    handleCheckForUpdates: checkForUpdates,
    handleInstallUpdate,
    handleRestartApp,
    r2AccountId,
    setR2AccountId,
    r2AccessKeyId,
    setR2AccessKeyId,
    r2SecretAccessKey,
    setR2SecretAccessKey,
    r2CustomEndpointUrl,
    setR2CustomEndpointUrl,
    r2HasSecretKey,
    r2Saving,
    r2Loading,
    handleSaveR2Settings,
    handleClearR2Credentials,
  };
}

export type SettingsPageState = ReturnType<typeof useSettingsPage>;

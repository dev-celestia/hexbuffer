import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { getCaCert, regenerateCaCert, saveCaCert, trustInterceptCa } from '@/pages/live-traffic/http-history/api';
import { useUpdater } from '@/hooks/use-updater';
import { DEFAULT_PROXY_PORT, MAX_PROXY_PORT, MIN_PROXY_PORT, isValidProxyPort, useAppStore } from '@/stores/app';
import { useBrowserAutomationStore } from '@/stores/browser-automation';
import { AI_MODEL_OPTIONS_BY_PROVIDER } from '../constants';

export interface AiSettings {
  provider: string;
  model: string;
  apiKey: string;
  hasApiKey: boolean;
  allowThirdPartyAiSharing: boolean;
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
    updateAvailable,
    updateVersion,
    checkForUpdates,
    installUpdate,
  } = useUpdater();

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
      toast.error(`Failed to migrate saved AI API keys: ${error}`);
    }
  }, []);

  const loadAiSettings = React.useCallback(async () => {
    try {
      setAiSettingsLoading(true);
      await migrateLegacyAiKeys();
      const keyStatus = await refreshAiKeyStatus();
      const settings = await invoke<AiSettings>('get_ai_settings');
      setAiSettings({ ...settings, hasApiKey: !!keyStatus[settings.provider] });
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast.error(`Failed to load AI settings: ${error}`);
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
      const settings = await invoke<{
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
        customEndpointUrl?: string;
      } | null>('get_r2_settings');

      if (settings) {
        setR2AccountId(settings.accountId);
        setR2AccessKeyId(settings.accessKeyId);
        setR2SecretAccessKey('');
        setR2CustomEndpointUrl(settings.customEndpointUrl ?? '');
        setR2HasSecretKey(!!settings.secretAccessKey);
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
      let secretToSave = r2SecretAccessKey.trim();
      if (!secretToSave && r2HasSecretKey) {
        const settings = await invoke<{ secretAccessKey: string } | null>('get_r2_settings');
        if (settings) {
          secretToSave = settings.secretAccessKey;
        }
      }

      if (!r2AccountId.trim() || !r2AccessKeyId.trim() || !secretToSave) {
        toast.error('Account ID, Access Key ID, and Secret Access Key must not be empty');
        return;
      }

      await invoke('save_r2_credentials', {
        accountId: r2AccountId.trim(),
        accessKeyId: r2AccessKeyId.trim(),
        secretAccessKey: secretToSave,
        customEndpointUrl: r2CustomEndpointUrl.trim() || null,
      });

      setR2SecretAccessKey('');
      setR2HasSecretKey(true);
      toast.success('R2 settings saved successfully');
    } catch (error) {
      console.error('Failed to save R2 settings:', error);
      toast.error(`Failed to save R2 settings: ${error}`);
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
      toast.error(`Failed to clear R2 settings: ${error}`);
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
      toast.error(`Failed to delete data: ${error}`);
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
      toast.error(`Failed to delete: ${error}`);
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
      toast.error(`Failed to save certificate: ${error}`);
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
      toast.error(`Failed to install certificate: ${error}`);
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
      toast.error(`Failed to regenerate certificate: ${error}`);
    } finally {
      setRegeneratingCa(false);
    }
  }, []);

  const updateAiProvider = React.useCallback((provider: string) => {
    const models = AI_MODEL_OPTIONS_BY_PROVIDER[provider] ?? [];

    setAiSettings((current) => ({
      ...current,
      provider,
      model: models[0] ?? '',
      apiKey: '',
      hasApiKey: !!providerKeyStatus[provider],
    }));
  }, [providerKeyStatus]);

  const updateAiSettings = React.useCallback((updates: Partial<AiSettings>) => {
    setAiSettings((current) => ({ ...current, ...updates }));
  }, []);

  const handleSaveAiSettings = React.useCallback(async () => {
    try {
      setAiSettingsSaving(true);

      let nextKeyStatus = providerKeyStatus;
      if (aiSettings.apiKey.trim()) {
        nextKeyStatus = await invoke<AiKeyStatus>('set_ai_api_key', {
          provider: aiSettings.provider,
          apiKey: aiSettings.apiKey.trim(),
        });
        setProviderKeyStatus(nextKeyStatus);
      }

      // FloppyDisk provider/model settings to backend (without the key)
      const settingsToSave = { ...aiSettings, apiKey: '' };
      const savedSettings = await invoke<AiSettings>('save_ai_settings', {
        settings: settingsToSave,
      });
      setAiSettings({ ...savedSettings, hasApiKey: !!nextKeyStatus[savedSettings.provider] });
      toast.success('AI settings saved');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error(`Failed to save AI settings: ${error}`);
    } finally {
      setAiSettingsSaving(false);
    }
  }, [aiSettings, providerKeyStatus]);

  const handleClearAiApiKey = React.useCallback(async () => {
    try {
      setAiSettingsSaving(true);
      const nextKeyStatus = await invoke<AiKeyStatus>('clear_ai_api_key', {
        provider: aiSettings.provider,
      });
      setProviderKeyStatus(nextKeyStatus);
      setAiSettings((current) => ({ ...current, apiKey: '', hasApiKey: false }));
      toast.success('AI API key cleared');
    } catch (error) {
      console.error('Failed to clear AI API key:', error);
      toast.error(`Failed to clear AI API key: ${error}`);
    } finally {
      setAiSettingsSaving(false);
    }
  }, [aiSettings.provider]);

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
      toast.error(error instanceof Error ? error.message : `Failed to save proxy port: ${error}`);
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
      toast.error(error instanceof Error ? error.message : `Failed to reset proxy port: ${error}`);
    }
  }, [proxyStatus, saveProxyDefaultPort]);

  return {
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
    handleClearAiApiKey,
    handleDeleteAllData,
    handleResetProxyDefaultPort,
    handleSaveProxyDefaultPort,
    handleSaveAiSettings,
    setProxyPortDraft,
    storageInfo,
    providerKeyStatus,
    updateAiProvider,
    updateAiSettings,
    updateAvailable,
    updateChecking,
    updateDownloading,
    updateError,
    updateMessage,
    updateVersion,
    handleCheckForUpdates: checkForUpdates,
    handleInstallUpdate: installUpdate,
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

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DashboardAiProvider, DashboardAiSettings } from '../types';

interface UseAiConfigDialogProps {
  aiSettings: DashboardAiSettings;
  updateAiSettings: (updates: Partial<DashboardAiSettings> & { apiKey?: string }) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useAiConfigDialog({
  aiSettings,
  updateAiSettings,
  open,
  onOpenChange,
}: UseAiConfigDialogProps) {
  const [provider, setProvider] = useState<DashboardAiProvider>(aiSettings.provider);
  const [model, setModel] = useState<string>(aiSettings.model);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(aiSettings.customBaseUrl ?? '');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [allowThirdPartyAiSharing, setAllowThirdPartyAiSharing] = useState<boolean>(
    aiSettings.allowThirdPartyAiSharing,
  );
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setProvider(aiSettings.provider);
      setModel(aiSettings.model);
      setCustomBaseUrl(aiSettings.customBaseUrl ?? '');
      setApiKey('');
      setAllowThirdPartyAiSharing(aiSettings.allowThirdPartyAiSharing);
    }
  }, [open, aiSettings]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await updateAiSettings({
        provider,
        model: model.trim() || (provider === 'deepseek' ? 'deepseek-v4-pro' : 'gpt-4o-mini'),
        customBaseUrl: provider === 'openai-compatible' ? (customBaseUrl.trim() || 'https://api.openai.com/v1') : null,
        apiKey: apiKey.trim() || undefined,
        allowThirdPartyAiSharing,
      });
      toast.success('AI configuration saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save AI configuration:', error);
      toast.error(`Failed to save AI configuration: ${error}`);
    } finally {
      setSaving(false);
    }
  }, [provider, model, customBaseUrl, apiKey, allowThirdPartyAiSharing, updateAiSettings, onOpenChange]);

  const setPresetBaseUrl = useCallback((url: string, defaultModel?: string) => {
    setCustomBaseUrl(url);
    if (defaultModel) {
      setModel(defaultModel);
    }
  }, []);

  return {
    provider,
    setProvider,
    model,
    setModel,
    customBaseUrl,
    setCustomBaseUrl,
    apiKey,
    setApiKey,
    showApiKey,
    setShowApiKey,
    allowThirdPartyAiSharing,
    setAllowThirdPartyAiSharing,
    saving,
    handleSave,
    setPresetBaseUrl,
  };
}

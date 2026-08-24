import { Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@celestia-project/ui';
import * as React from 'react';
import { WarningCircleIcon, EyeIcon, EyeSlashIcon, FloppyDiskIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

import {
  AI_API_KEY_PLACEHOLDERS,
  AI_MODEL_OPTIONS_BY_PROVIDER,
  AI_PROVIDER_OPTIONS,
} from '../constants';
import type { SettingsPageState } from '../hooks/use-settings-page';
import { SettingsGroup, SettingsRow } from './settings-group';

interface AiSettingsTabProps {
  readonly settings: SettingsPageState;
}

export function AiSettingsTab({ settings }: Readonly<AiSettingsTabProps>) {
  const {
    aiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    handleClearAiApiKey,
    handleSaveAiSettings,
    updateAiProvider,
    updateAiSettings,
  } = settings;

  const selectedProvider = AI_PROVIDER_OPTIONS.find((provider) => provider.id === aiSettings.provider);
  const selectedProviderLabel = selectedProvider?.label ?? 'AI';
  const modelOptions = AI_MODEL_OPTIONS_BY_PROVIDER[aiSettings.provider] ?? [];
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState(aiSettings.apiKey);
  const isSavingNewApiKey = apiKeyInput.trim().length > 0;
  const canSaveAiSettings = !isSavingNewApiKey || aiSettings.allowThirdPartyAiSharing;

  React.useEffect(() => {
    setApiKeyInput(aiSettings.apiKey);
    setShowApiKey(false);
  }, [aiSettings.apiKey, aiSettings.provider]);

  const handleApiKeyChange = (value: string) => {
    setApiKeyInput(value);
    updateAiSettings({ apiKey: value });
  };

  return (
    <SettingsGroup label="Provider" description="Configure BYOK and the model used by the AI workflow.">
      <SettingsRow label="Provider">
        <Select
          value={aiSettings.provider}
          onValueChange={updateAiProvider}
          disabled={aiSettingsLoading}
        >
          <SelectTrigger
            id="ai-provider"
            className={cn(
              // Sizing & Spacing
              "w-40"
            )}
          >
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {AI_PROVIDER_OPTIONS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>
      <SettingsRow label="Model">
        <Select
          value={aiSettings.model}
          onValueChange={(model) => {
            if (model) {
              updateAiSettings({ model });
            }
          }}
          disabled={aiSettingsLoading}
        >
          <SelectTrigger
            id="ai-model"
            className={cn(
              // Sizing & Spacing
              "w-40"
            )}
          >
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>
      <SettingsRow
        label={`${selectedProviderLabel} API Key`}
        description={
          aiSettings.hasApiKey
            ? 'A key is saved in your OS credential store.'
            : 'No key saved yet. Provider and model are saved locally; API keys are kept in the OS credential store.'
        }
      >
        <div
          className={cn(
            // Layout & Positioning
            "relative",

            // Sizing & Spacing
            "w-56"
          )}
        >
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(event) => handleApiKeyChange(event.target.value)}
            placeholder={
              aiSettings.hasApiKey && !aiSettings.apiKey
                ? '••••••••••••••••••••••••'
                : (AI_API_KEY_PLACEHOLDERS[aiSettings.provider] ?? 'API key')
            }
            disabled={aiSettingsLoading}
            className={cn(
              // Sizing & Spacing
              "pr-9"
            )}
          />
          <button
            type="button"
            onClick={() => setShowApiKey((prev) => !prev)}
            className={cn(
              // Layout & Positioning
              "absolute right-2 top-1/2 -translate-y-1/2",

              // Sizing & Spacing
              "rounded p-0.5",

              // Typography
              "text-muted-foreground",

              // Interactive & States
              "hover:text-foreground"
            )}
            tabIndex={-1}
          >
            {showApiKey ? (
              <EyeSlashIcon
                className={cn(
                  // Sizing & Spacing
                  "size-4"
                )}
              />
            ) : (
              <EyeIcon
                className={cn(
                  // Sizing & Spacing
                  "size-4"
                )}
              />
            )}
          </button>
        </div>
      </SettingsRow>

      <div
        className={cn(
          // Sizing & Spacing
          "px-4 py-3"
        )}
      >
        <label
          className={cn(
            // Layout & Positioning
            "flex items-start gap-3",

            // Sizing & Spacing
            "p-3 rounded-md",

            // Backgrounds & Borders
            "border border-amber-500/40 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10"
          )}
        >
          <Checkbox
            checked={aiSettings.allowThirdPartyAiSharing}
            onCheckedChange={(checked) => updateAiSettings({ allowThirdPartyAiSharing: checked === true })}
            disabled={aiSettingsLoading}
          />
          <span
            className={cn(
              // Layout & Positioning
              "min-w-0 space-y-1"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-2",

                // Typography
                "text-sm font-medium"
              )}
            >
              <WarningCircleIcon
                className={cn(
                  // Sizing & Spacing
                  "size-4",

                  // Typography
                  "text-amber-600 dark:text-amber-400"
                )}
              />
              Allow third-party AI data sharing
            </span>
            <span
              className={cn(
                // Layout & Positioning
                "block",

                // Typography
                "text-xs leading-relaxed text-muted-foreground"
              )}
            >
              Optional AI features may send selected prompts, chat messages, crawl context, page summaries,
              logs, insights, URLs, and analysis context to {selectedProviderLabel}. Do not enable this for
              sensitive data unless you are authorized to share it.
            </span>
          </span>
        </label>
      </div>

      <SettingsRow label="Actions">
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-2"
          )}
        >
          <Button
            size="sm"
            onClick={handleSaveAiSettings}
            disabled={aiSettingsLoading || aiSettingsSaving || !canSaveAiSettings}
          >
            <FloppyDiskIcon
              className={cn(
                // Sizing & Spacing
                "mr-1.5 size-3.5"
              )}
            />
            {aiSettingsSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAiApiKey}
            disabled={aiSettingsLoading || aiSettingsSaving || !aiSettings.hasApiKey}
          >
            Clear API Key
          </Button>
        </div>
      </SettingsRow>

      {!canSaveAiSettings && (
        <div
          className={cn(
            // Sizing & Spacing
            "px-4 py-2"
          )}
        >
          <p
            className={cn(
              // Typography
              "text-xs text-amber-700 dark:text-amber-300"
            )}
          >
            Enable third-party AI data sharing before saving or using an API key.
          </p>
        </div>
      )}
    </SettingsGroup>
  );
}

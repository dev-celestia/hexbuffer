import { Badge, Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@celestia-project/ui';
import * as React from 'react';
import { WarningCircleIcon, EyeIcon, EyeSlashIcon, FloppyDiskIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

import {
  AI_API_KEY_PLACEHOLDERS,
  AI_MODEL_OPTIONS_BY_PROVIDER,
  AI_PROVIDER_OPTIONS,
  OPENAI_COMPATIBLE_BASE_URL_EXAMPLES,
  OPENAI_COMPATIBLE_BASE_URL_PLACEHOLDER,
  OPENAI_COMPATIBLE_PROVIDER_ID,
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
    handleClearEmbeddingsApiKey,
    handleSaveAiSettings,
    providerKeyStatus,
    updateAiProvider,
    updateAiSettings,
  } = settings;

  const selectedProvider = AI_PROVIDER_OPTIONS.find((provider) => provider.id === aiSettings.provider);
  const selectedProviderLabel = selectedProvider?.label ?? 'AI';
  const isOpenAiCompatible = aiSettings.provider === OPENAI_COMPATIBLE_PROVIDER_ID;
  const modelOptions = AI_MODEL_OPTIONS_BY_PROVIDER[aiSettings.provider] ?? [];
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState(aiSettings.apiKey);
  const [showEmbeddingsKey, setShowEmbeddingsKey] = React.useState(false);
  const [embeddingsKeyInput, setEmbeddingsKeyInput] = React.useState(
    aiSettings.embeddingsApiKey ?? '',
  );
  const embeddingsConfigured =
    !!aiSettings.embeddingsBaseUrl?.trim() && !!aiSettings.embeddingsModel?.trim();
  const hasEmbeddingsKey = !!providerKeyStatus?.embeddings;
  const isSavingNewApiKey = apiKeyInput.trim().length > 0;
  const canSaveAiSettings = !isSavingNewApiKey || aiSettings.allowThirdPartyAiSharing;
  const canSaveOpenAiCompatible =
    !isOpenAiCompatible ||
    (!!aiSettings.model.trim() && !!aiSettings.customBaseUrl?.trim());

  React.useEffect(() => {
    setApiKeyInput(aiSettings.apiKey);
    setShowApiKey(false);
  }, [aiSettings.apiKey, aiSettings.provider]);

  React.useEffect(() => {
    setEmbeddingsKeyInput(aiSettings.embeddingsApiKey ?? '');
    setShowEmbeddingsKey(false);
  }, [aiSettings.embeddingsApiKey]);

  const handleApiKeyChange = (value: string) => {
    setApiKeyInput(value);
    updateAiSettings({ apiKey: value });
  };

  const handleEmbeddingsKeyChange = (value: string) => {
    setEmbeddingsKeyInput(value);
    updateAiSettings({ embeddingsApiKey: value });
  };

  return (
    <>
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
      {isOpenAiCompatible ? (
        <SettingsRow
          label="Base URL"
          description={`OpenAI-compatible chat completions endpoint. Examples: ${OPENAI_COMPATIBLE_BASE_URL_EXAMPLES.join(', ')}`}
        >
          <Input
            value={aiSettings.customBaseUrl ?? ''}
            onChange={(event) => updateAiSettings({ customBaseUrl: event.target.value })}
            placeholder={OPENAI_COMPATIBLE_BASE_URL_PLACEHOLDER}
            disabled={aiSettingsLoading}
            className={cn(
              // Sizing & Spacing
              "w-72"
            )}
          />
        </SettingsRow>
      ) : null}
      <SettingsRow label="Model">
        {isOpenAiCompatible ? (
          <Input
            value={aiSettings.model}
            onChange={(event) => updateAiSettings({ model: event.target.value })}
            placeholder="e.g. gpt-4o-mini, llama3.1:8b"
            disabled={aiSettingsLoading}
            className={cn(
              // Sizing & Spacing
              "w-40"
            )}
          />
        ) : (
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
        )}
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
            disabled={aiSettingsLoading || aiSettingsSaving || !canSaveAiSettings || !canSaveOpenAiCompatible}
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

      {isOpenAiCompatible && !canSaveOpenAiCompatible && (
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
            Enter a base URL and model name for the OpenAI-compatible provider.
          </p>
        </div>
      )}
      </SettingsGroup>

      <SettingsGroup
        label="Embeddings (Memory RAG)"
        description="Optional OpenAI-compatible embeddings endpoint used by Memory for semantic vector search. Leave blank to use SQLite FTS5 keyword search."
      >
        <SettingsRow
          label="Embeddings Base URL"
          description="OpenAI-compatible /embeddings endpoint (e.g. https://api.openai.com/v1, http://localhost:11434/v1)."
        >
          <Input
            value={aiSettings.embeddingsBaseUrl ?? ''}
            onChange={(event) => updateAiSettings({ embeddingsBaseUrl: event.target.value })}
            placeholder="https://api.openai.com/v1"
            disabled={aiSettingsLoading}
            className={cn(
              // Sizing & Spacing
              "w-72"
            )}
          />
        </SettingsRow>
        <SettingsRow
          label="Embeddings Model"
          description="Model identifier (e.g. text-embedding-3-small, nomic-embed-text)."
        >
          <Input
            value={aiSettings.embeddingsModel ?? ''}
            onChange={(event) => updateAiSettings({ embeddingsModel: event.target.value })}
            placeholder="text-embedding-3-small"
            disabled={aiSettingsLoading}
            className={cn(
              // Sizing & Spacing
              "w-56"
            )}
          />
        </SettingsRow>
        <SettingsRow
          label="Embeddings API Key"
          description={
            hasEmbeddingsKey
              ? 'A key is saved in your OS credential store.'
              : 'Optional for local models (e.g. Ollama). Saved to the OS credential store under provider "embeddings".'
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
              type={showEmbeddingsKey ? 'text' : 'password'}
              value={embeddingsKeyInput}
              onChange={(event) => handleEmbeddingsKeyChange(event.target.value)}
              placeholder={
                hasEmbeddingsKey && !embeddingsKeyInput
                  ? '••••••••••••••••••••••••'
                  : 'sk-… (optional for Ollama)'
              }
              disabled={aiSettingsLoading}
              className={cn(
                // Sizing & Spacing
                "pr-9"
              )}
            />
            <button
              type="button"
              onClick={() => setShowEmbeddingsKey((prev) => !prev)}
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
              {showEmbeddingsKey ? (
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
        <SettingsRow
          label="Vector Search Status"
          description={
            embeddingsConfigured
              ? 'Semantic vector retrieval is enabled using your configured embeddings model.'
              : 'Vector search is inactive; falling back to SQLite FTS5 full-text keyword retrieval.'
          }
        >
          <Badge variant={embeddingsConfigured ? 'default' : 'secondary'}>
            {embeddingsConfigured ? 'Vector Search Active' : 'FTS5 Keyword Only'}
          </Badge>
        </SettingsRow>
        {hasEmbeddingsKey ? (
          <SettingsRow label="Embeddings Key Action">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearEmbeddingsApiKey}
              disabled={aiSettingsLoading || aiSettingsSaving}
            >
              Clear Embeddings Key
            </Button>
          </SettingsRow>
        ) : null}
      </SettingsGroup>
    </>
  );
}

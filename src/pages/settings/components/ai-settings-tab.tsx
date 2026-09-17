import { Badge, Button, Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@celestia-project/ui';
import * as React from 'react';
import { WarningCircleIcon, EyeIcon, EyeSlashIcon, FloppyDiskIcon, CheckIcon, TrashIcon } from '@phosphor-icons/react';
import { embeddingsEndpointAllowed } from '@/lib/ai-endpoint';
import { cn } from '@/lib/utils';

import {
  AI_API_KEY_PLACEHOLDERS,
  AI_MODEL_OPTIONS_BY_PROVIDER,
  AI_PROVIDER_OPTIONS,
  ANTHROPIC_COMPATIBLE_BASE_URL_EXAMPLES,
  ANTHROPIC_COMPATIBLE_BASE_URL_PLACEHOLDER,
  ANTHROPIC_COMPATIBLE_PROVIDER_ID,
  OPENAI_COMPATIBLE_BASE_URL_EXAMPLES,
  OPENAI_COMPATIBLE_BASE_URL_PLACEHOLDER,
  OPENAI_COMPATIBLE_PROVIDER_ID,
} from '../constants';
import type { AiProviderKeyEntry } from '../lib/ai-providers';
import type { SettingsPageState } from '../hooks/use-settings-page';
import { SettingsGroup, SettingsRow, SettingsRowSeparator } from './settings-group';

/**
 * Keeps Ctrl/Cmd+A selecting the contents of the focused field instead of the whole page.
 * Shared by every credential-ish input on this tab.
 */
const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    (event.ctrlKey || event.metaKey) &&
    (event.key === 'a' || event.key === 'A' || event.code === 'KeyA')
  ) {
    event.preventDefault();
    event.currentTarget.select();
  }
};

interface AiProviderKeyRowProps {
  readonly entry: AiProviderKeyEntry;
  readonly disabled: boolean;
  /**
   * `entry.canSaveKey` — the shared policy verdict, not a local rule. False only for a remote
   * provider with no key yet while sharing is off; the row then says so next to the button.
   */
  readonly canSave: boolean;
  readonly pending: boolean;
  readonly onClear: (provider: string) => Promise<boolean>;
  readonly onSave: (provider: string, apiKey: string) => Promise<boolean>;
  readonly onUse: (provider: string) => void;
}

/**
 * One provider in the saved-keys list: status badges, an inline key field, and the
 * per-provider save/clear actions. Draft state is local because it is discarded on save.
 */
function AiProviderKeyRow({
  entry,
  disabled,
  canSave,
  pending,
  onClear,
  onSave,
  onUse,
}: Readonly<AiProviderKeyRowProps>) {
  const [apiKeyInput, setApiKeyInput] = React.useState('');
  const [showApiKey, setShowApiKey] = React.useState(false);

  const resetDraft = () => {
    setApiKeyInput('');
    setShowApiKey(false);
  };

  const handleSave = async () => {
    if (await onSave(entry.id, apiKeyInput)) {
      resetDraft();
    }
  };

  const handleClear = async () => {
    if (await onClear(entry.id)) {
      resetDraft();
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col gap-2",

        // Sizing & Spacing
        "px-4 py-3"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-start justify-between gap-4"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "min-w-0 space-y-1"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2"
            )}
          >
            <p
              className={cn(
                // Typography
                "text-sm font-medium leading-none"
              )}
            >
              {entry.label}
            </p>
            <Badge variant={entry.hasKey ? 'secondary' : 'outline'}>
              {entry.hasKey ? 'Key saved' : 'No key'}
            </Badge>
            {entry.isActive ? <Badge variant="default">Active</Badge> : null}
          </div>
          <p
            className={cn(
              // Typography
              "text-xs leading-relaxed text-muted-foreground"
            )}
          >
            {entry.description}
          </p>
        </div>
        {entry.selectable ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUse(entry.id)}
            disabled={disabled || pending || entry.isActive}
          >
            <CheckIcon
              className={cn(
                // Sizing & Spacing
                "mr-1.5 size-3.5"
              )}
            />
            {entry.isActive ? 'In use' : 'Use'}
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "relative",

            // Sizing & Spacing
            "w-72"
          )}
        >
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label={`${entry.label} API key`}
            // A saved key is never read back into the field, so this must read as an invitation to
            // type a replacement. Dots here look exactly like a masked stored value and made the
            // field appear read-only — users tried to edit them and nothing happened.
            placeholder={
              entry.hasKey
                ? 'Enter a new key to replace the saved one'
                : (AI_API_KEY_PLACEHOLDERS[entry.id] ?? 'API key')
            }
            disabled={disabled || pending}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            className={cn(
              // Sizing & Spacing
              "pr-9"
            )}
          />
          <button
            type="button"
            onClick={() => setShowApiKey((prev) => !prev)}
            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
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
        <Button
          size="sm"
          onClick={handleSave}
          disabled={disabled || pending || !canSave || !apiKeyInput.trim()}
        >
          <FloppyDiskIcon
            className={cn(
              // Sizing & Spacing
              "mr-1.5 size-3.5"
            )}
          />
          {pending ? 'Saving…' : entry.hasKey ? 'Replace key' : 'Save key'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={disabled || pending || !entry.hasKey}
        >
          <TrashIcon
            className={cn(
              // Sizing & Spacing
              "mr-1.5 size-3.5"
            )}
          />
          Clear
        </Button>
      </div>

      {/*
        Without this the row shows a disabled save button next to a working Clear button, which
        reads as "the key can only be deleted, not edited". Say which one is blocked and why.
        Only reachable for a provider with no key yet — replacing a saved key needs no consent.
      */}
      {!canSave ? (
        <p
          className={cn(
            // Typography
            "text-xs text-amber-700 dark:text-amber-300"
          )}
        >
          Enable third-party AI data sharing above to save a key for this provider.
        </p>
      ) : null}

      {/*
        The mirror of the notice above. A loopback endpoint leaves Save enabled with sharing off,
        which looks like the gate is broken unless the row says why — and a local endpoint is
        exactly the case where a key is optional, so say that too.
      */}
      {entry.savesKeyWithoutSharing ? (
        <p
          className={cn(
            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          Local endpoint, so no third-party sharing consent is needed. A key is optional here.
        </p>
      ) : null}
    </div>
  );
}

interface AiSettingsTabProps {
  readonly settings: SettingsPageState;
}

export function AiSettingsTab({ settings }: Readonly<AiSettingsTabProps>) {
  const {
    aiProviderKeyEntries,
    aiSettings,
    aiSettingsLoading,
    aiSettingsSaving,
    handleClearProviderKey,
    handleSaveAiSettings,
    handleSaveProviderKey,
    handleToggleThirdPartyAiSharing,
    keyActionProvider,
    savedAiSettings,
    updateAiProvider,
    updateAiSettings,
  } = settings;

  const selectedProvider = AI_PROVIDER_OPTIONS.find((provider) => provider.id === aiSettings.provider);
  const selectedProviderLabel = selectedProvider?.label ?? 'AI';
  const isOpenAiCompatible = aiSettings.provider === OPENAI_COMPATIBLE_PROVIDER_ID;
  const isAnthropicCompatible =
    aiSettings.provider === ANTHROPIC_COMPATIBLE_PROVIDER_ID ||
    aiSettings.provider === 'anthropic';
  const isCustomCompatible = isOpenAiCompatible || isAnthropicCompatible;
  const modelOptions = AI_MODEL_OPTIONS_BY_PROVIDER[aiSettings.provider] ?? [];
  // Configuration is not the same as usability: the backend also requires a loopback endpoint or
  // third-party sharing consent (`embeddings_sharing_allowed` in Rust). Reading only the endpoint
  // and model made this badge claim "Vector Search Active" directly beneath a sharing toggle that
  // was off, while `tool_loop.rs` stored every new entry without a vector and raised nothing.
  const embeddingsConfigured =
    !!aiSettings.embeddingsBaseUrl?.trim() && !!aiSettings.embeddingsModel?.trim();
  // `embeddingsEndpointAllowed` is only the *permission* half — it is true whenever sharing is on,
  // configured or not — so it must be ANDed with "is configured" or an empty endpoint with sharing
  // on would report vector search as active.
  const embeddingsUsable =
    embeddingsConfigured &&
    embeddingsEndpointAllowed(aiSettings.embeddingsBaseUrl, aiSettings.allowThirdPartyAiSharing);
  // A provider switch clears the model, so this gate also covers the preset dropdowns — the
  // user must pick a model rather than silently inheriting one.
  const needsModel = !aiSettings.model.trim();
  const needsBaseUrl = isOpenAiCompatible && !aiSettings.customBaseUrl?.trim();
  const canSaveProviderSettings = !needsModel && !needsBaseUrl;
  const sharingPolicyUnsaved =
    aiSettings.allowThirdPartyAiSharing !== !!savedAiSettings?.allowThirdPartyAiSharing;
  // The "Active" badge follows the draft, so a provider picked with "Use" looks applied before it
  // is. Say so explicitly rather than letting the badge imply the assistant already switched.
  const providerSwitchUnsaved =
    !!savedAiSettings && aiSettings.provider !== savedAiSettings.provider;

  let saveBlockedHint: string | null = null;
  if (needsBaseUrl) {
    saveBlockedHint = 'Enter a base URL for the OpenAI-compatible provider.';
  } else if (needsModel) {
    saveBlockedHint = isCustomCompatible
      ? `Enter a model name for the ${isOpenAiCompatible ? 'OpenAI' : 'Anthropic'}-compatible provider.`
      : `Select a model for ${selectedProviderLabel}.`;
  }

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
              "w-72"
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
      {isCustomCompatible ? (
        <SettingsRow
          label="Wire Format"
          description={
            isOpenAiCompatible
              ? 'OpenAI Chat Completions protocol (POST /v1/chat/completions) with Bearer token authentication.'
              : 'Anthropic Messages protocol (POST /v1/messages) with x-api-key authentication.'
          }
        >
          <Badge variant="secondary">
            {isOpenAiCompatible ? 'OpenAI Chat Completions' : 'Anthropic Messages'}
          </Badge>
        </SettingsRow>
      ) : null}
      {isCustomCompatible ? (
        <SettingsRow
          label="Base URL"
          description={
            isOpenAiCompatible
              ? `OpenAI-compatible chat completions endpoint. Examples: ${OPENAI_COMPATIBLE_BASE_URL_EXAMPLES.join(', ')}`
              : `Anthropic-compatible messages endpoint. Optional (defaults to https://api.anthropic.com). Examples: ${ANTHROPIC_COMPATIBLE_BASE_URL_EXAMPLES.join(', ')}`
          }
        >
          <Input
            value={aiSettings.customBaseUrl ?? ''}
            onChange={(event) => updateAiSettings({ customBaseUrl: event.target.value })}
            onKeyDown={handleInputKeyDown}
            placeholder={
              isOpenAiCompatible
                ? OPENAI_COMPATIBLE_BASE_URL_PLACEHOLDER
                : ANTHROPIC_COMPATIBLE_BASE_URL_PLACEHOLDER
            }
            disabled={aiSettingsLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              // Sizing & Spacing
              "w-72"
            )}
          />
        </SettingsRow>
      ) : null}
      <SettingsRow
        label="Model"
        description={
          isCustomCompatible
            ? 'Model identifier. Supports vendor/model syntax (e.g. openai/gpt-5.6-sol, anthropic/claude-3-7-sonnet).'
            : undefined
        }
      >
        {isCustomCompatible ? (
          <Input
            value={aiSettings.model}
            onChange={(event) => updateAiSettings({ model: event.target.value })}
            onKeyDown={handleInputKeyDown}
            placeholder={
              isOpenAiCompatible
                ? 'e.g. gpt-4o, openai/gpt-5.6-sol, llama3.1'
                : 'e.g. claude-3-7-sonnet-latest, anthropic/claude-3-5-sonnet'
            }
            disabled={aiSettingsLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              // Sizing & Spacing
              "w-72"
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
                "w-48"
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
            onCheckedChange={(checked) => {
              void handleToggleThirdPartyAiSharing(checked === true);
            }}
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
            disabled={aiSettingsLoading || aiSettingsSaving || !canSaveProviderSettings}
          >
            <FloppyDiskIcon
              className={cn(
                // Sizing & Spacing
                "mr-1.5 size-3.5"
              )}
            />
            {aiSettingsSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </SettingsRow>

      {saveBlockedHint || providerSwitchUnsaved ? (
        <div
          className={cn(
            // Layout & Positioning
            "space-y-1",

            // Sizing & Spacing
            "px-4 py-2"
          )}
        >
          {saveBlockedHint ? (
            <p
              className={cn(
                // Typography
                "text-xs text-amber-700 dark:text-amber-300"
              )}
            >
              {saveBlockedHint}
            </p>
          ) : null}
          {providerSwitchUnsaved ? (
            <p
              className={cn(
                // Typography
                "text-xs text-muted-foreground"
              )}
            >
              {selectedProviderLabel} is selected here but not applied yet — press Save to switch
              the assistant over to it.
            </p>
          ) : null}
        </div>
      ) : null}
      </SettingsGroup>

      <SettingsGroup
        label="Saved API Keys"
        description="Every provider keeps its own API key in the OS credential store, so you can configure several at once and switch between them without re-entering a key."
      >
        {aiProviderKeyEntries.map((entry, index) => (
          <React.Fragment key={entry.id}>
            {index > 0 ? <SettingsRowSeparator /> : null}
            <AiProviderKeyRow
              entry={entry}
              disabled={aiSettingsLoading}
              canSave={entry.canSaveKey}
              pending={keyActionProvider === entry.id}
              onClear={handleClearProviderKey}
              onSave={handleSaveProviderKey}
              onUse={updateAiProvider}
            />
          </React.Fragment>
        ))}
        {/*
          Each blocked row already explains itself inline, so this only covers the one thing a row
          cannot say: the toggle was flipped but not yet applied to the backend.
        */}
        {sharingPolicyUnsaved ? (
          <div
            className={cn(
              // Sizing & Spacing
              "px-4 pb-3"
            )}
          >
            <p
              className={cn(
                // Typography
                "text-xs text-amber-700 dark:text-amber-300"
              )}
            >
              Press Save above to apply third-party AI data sharing; until then the assistant blocks
              non-local providers.
            </p>
          </div>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        label="Embeddings (Memory RAG)"
        description="Optional OpenAI-compatible embeddings endpoint used by Memory for semantic vector search. Leave blank to use SQLite FTS5 keyword search. Its API key is managed in Saved API Keys."
      >
        <SettingsRow
          label="Embeddings Base URL"
          description="OpenAI-compatible /embeddings endpoint (e.g. https://api.openai.com/v1, http://localhost:11434/v1)."
        >
          <Input
            value={aiSettings.embeddingsBaseUrl ?? ''}
            onChange={(event) => updateAiSettings({ embeddingsBaseUrl: event.target.value })}
            onKeyDown={handleInputKeyDown}
            placeholder="https://api.openai.com/v1"
            disabled={aiSettingsLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
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
            onKeyDown={handleInputKeyDown}
            placeholder="text-embedding-3-small"
            disabled={aiSettingsLoading}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              // Sizing & Spacing
              "w-56"
            )}
          />
        </SettingsRow>
        <SettingsRow
          label="Vector Search Status"
          description={
            embeddingsUsable
              ? 'Semantic vector retrieval is enabled using your configured embeddings model.'
              : embeddingsConfigured
                ? 'Embeddings are configured, but the endpoint is remote and third-party AI data sharing is off, so new entries are stored without vectors. Enable sharing below, or point the endpoint at a local server.'
                : 'Vector search is inactive; falling back to SQLite FTS5 full-text keyword retrieval.'
          }
        >
          <Badge variant={embeddingsUsable ? 'default' : 'secondary'}>
            {embeddingsUsable
              ? 'Vector Search Active'
              : embeddingsConfigured
                ? 'Needs Sharing Consent'
                : 'FTS5 Keyword Only'}
          </Badge>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}

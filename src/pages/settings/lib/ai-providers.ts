import { isLocalAiEndpoint, isLocalAiProviderEndpoint } from '@/lib/ai-endpoint';
import { AI_KEY_PROVIDER_OPTIONS, EMBEDDINGS_KEY_PROVIDER_ID } from '../constants';

/** Model + base URL remembered for one provider (mirrors `AiProviderProfile` in Rust). */
export interface AiProviderProfile {
  readonly model: string;
  readonly customBaseUrl?: string | null;
}

/** The provider-scoped slice of the AI settings form. */
export interface AiProviderScopedSettings {
  provider: string;
  model: string;
  apiKey: string;
  hasApiKey: boolean;
  customBaseUrl?: string | null;
  providerProfiles?: Record<string, AiProviderProfile>;
}

export interface AiProviderKeyEntry {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly selectable: boolean;
  readonly hasKey: boolean;
  readonly isActive: boolean;
  /**
   * True when this row's key can be saved without third-party sharing consent, because the
   * provider points at a loopback endpoint that never leaves the machine.
   */
  readonly savesKeyWithoutSharing: boolean;
  /** Whether this row's save/replace action is allowed right now. See `canSaveProviderKey`. */
  readonly canSaveKey: boolean;
}

/**
 * The base URL that applies to `provider`: the in-form draft while it is the active provider,
 * otherwise the one remembered in its profile.
 */
export function baseUrlForProvider(
  provider: string,
  activeProvider: string,
  activeBaseUrl: string | null | undefined,
  profiles?: Record<string, AiProviderProfile>,
): string | null | undefined {
  return provider === activeProvider ? activeBaseUrl : profiles?.[provider]?.customBaseUrl;
}

/** The provider-scoped fields needed to resolve which base URL gates a provider's key. */
export interface AiProviderBaseUrlScope {
  readonly activeProvider: string;
  readonly activeBaseUrl?: string | null;
  /** The embeddings pseudo-provider's own endpoint field, which has no per-provider profile. */
  readonly embeddingsBaseUrl?: string | null;
  readonly profiles?: Record<string, AiProviderProfile>;
}

/**
 * The base URL whose loopback status decides whether `provider`'s key may be saved.
 *
 * The `embeddings` pseudo-provider keeps its endpoint in a dedicated field rather than in the
 * per-provider profiles (it is not selectable), so reading it through `baseUrlForProvider` would
 * always come back undefined and silently keep the row gated. Both the list and the save handler
 * resolve through here so they cannot drift.
 */
export function keyGateBaseUrl(
  provider: string,
  scope: AiProviderBaseUrlScope,
): string | null | undefined {
  if (provider === EMBEDDINGS_KEY_PROVIDER_ID) {
    return scope.embeddingsBaseUrl;
  }
  return baseUrlForProvider(
    provider,
    scope.activeProvider,
    scope.activeBaseUrl,
    scope.profiles,
  );
}

/**
 * True when `provider` at `baseUrl` is exempt from the third-party sharing policy.
 *
 * There are two backend gates and they genuinely differ, so this mirrors both instead of
 * collapsing them into one provider-scoped rule:
 *
 * - **Chat providers** (`deepseek`, `openai-compatible`, `anthropic-compatible`) are gated by
 *   `is_local_ai_endpoint` (`src-tauri/src/ai/providers.rs`), which is provider-scoped: only the
 *   OpenAI-compatible wire format at loopback is exempt, and a loopback Anthropic-compatible
 *   endpoint still requires the policy.
 * - **The `embeddings` pseudo-provider** is gated by `embeddings_sharing_allowed`
 *   (`src-tauri/src/ai/embeddings.rs`), which is URL-only — because embeddings always speak the
 *   OpenAI wire format (`build_embedding_model` uses `openai::Client` whatever chat provider is
 *   selected), so there is no wire-format caveat to scope on.
 *
 * Applying the chat rule to the embeddings row made the settings gate stricter than the backend:
 * saving the optional key for a local Ollama / LM Studio embeddings endpoint demanded the sharing
 * toggle, which also unlocks remote chat traffic — a broader consent than the action needs, for a
 * request the backend would never have blocked.
 */
export function providerIsSharingExempt(
  provider: string,
  baseUrl: string | null | undefined,
): boolean {
  return provider === EMBEDDINGS_KEY_PROVIDER_ID
    ? isLocalAiEndpoint(baseUrl)
    : isLocalAiProviderEndpoint(provider, baseUrl);
}

/**
 * Clears every provider-scoped draft when the provider changes, then restores the target
 * provider's own remembered model / base URL. A provider that was never configured starts empty,
 * so nothing leaks across. The API key is never restored into the form — keys live in the
 * credential store and are managed by the saved-keys list.
 *
 * Re-selecting the current provider returns `current` untouched, so a no-op change event can
 * never wipe a half-typed form. Everything else (embeddings config, sharing policy) is kept —
 * those are not scoped to the selected provider.
 */
export function switchAiProvider<T extends AiProviderScopedSettings>(
  current: T,
  provider: string,
  hasSavedKey: boolean,
  profiles?: Record<string, AiProviderProfile>,
): T {
  if (current.provider === provider) {
    return current;
  }

  const profile = profiles?.[provider];

  return {
    ...current,
    provider,
    model: profile?.model ?? '',
    customBaseUrl: profile?.customBaseUrl ?? '',
    apiKey: '',
    hasApiKey: hasSavedKey,
  };
}

export interface AiProviderKeyEntryInput extends AiProviderBaseUrlScope {
  readonly keyStatus: Record<string, boolean> | undefined;
  readonly allowThirdPartyAiSharing: boolean;
}

/**
 * Whether a key may be written for `provider` right now.
 *
 * Three ways in, in order of why:
 * 1. **It already has a key.** Replacing a stored credential discloses nothing new — the key is
 *    already in the local credential store, and the authoritative gate on *sending* data is the
 *    send-time check in Rust. Requiring consent here made replacing impossible while deleting was
 *    allowed, which users read as "the key can only be deleted, not edited".
 * 2. **Third-party sharing is enabled.** Consent is what the policy is actually about, so it
 *    unlocks the first key for any provider.
 * 3. **The endpoint is loopback.** Nothing leaves the machine, so there is nothing to consent to.
 *
 * Single source of this rule: both the row's action button and the save handler call it.
 */
export function canSaveProviderKey(input: {
  provider: string;
  hasKey: boolean;
  allowThirdPartyAiSharing: boolean;
  baseUrl?: string | null;
}): boolean {
  return (
    input.hasKey ||
    input.allowThirdPartyAiSharing ||
    providerIsSharingExempt(input.provider, input.baseUrl)
  );
}

/**
 * Rows for the "Saved API Keys" list: which providers hold a key in the credential store, which
 * one is currently selected, and whether each row's key can be written. Keys live per provider, so
 * several can be saved at once.
 */
export function buildAiProviderKeyEntries(input: AiProviderKeyEntryInput): AiProviderKeyEntry[] {
  return AI_KEY_PROVIDER_OPTIONS.map((provider) => {
    const hasKey = input.keyStatus?.[provider.id] === true;
    const baseUrl = keyGateBaseUrl(provider.id, input);

    return {
      id: provider.id,
      label: provider.label,
      description: provider.description,
      selectable: provider.selectable,
      hasKey,
      isActive: provider.selectable && provider.id === input.activeProvider,
      savesKeyWithoutSharing: providerIsSharingExempt(provider.id, baseUrl),
      canSaveKey: canSaveProviderKey({
        provider: provider.id,
        hasKey,
        allowThirdPartyAiSharing: input.allowThirdPartyAiSharing,
        baseUrl,
      }),
    };
  });
}

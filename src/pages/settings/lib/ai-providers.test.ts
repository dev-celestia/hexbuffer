import { describe, expect, it } from 'vitest';
import {
  AI_KEY_PROVIDER_OPTIONS,
  ANTHROPIC_COMPATIBLE_PROVIDER_ID,
  EMBEDDINGS_KEY_PROVIDER_ID,
  OPENAI_COMPATIBLE_PROVIDER_ID,
} from '../constants';
import {
  baseUrlForProvider,
  buildAiProviderKeyEntries,
  canSaveProviderKey,
  keyGateBaseUrl,
  providerIsSharingExempt,
  switchAiProvider,
  type AiProviderProfile,
  type AiProviderScopedSettings,
} from './ai-providers';

interface FormState extends AiProviderScopedSettings {
  allowThirdPartyAiSharing: boolean;
  embeddingsBaseUrl?: string | null;
  embeddingsModel?: string | null;
}

function makeFormState(overrides: Partial<FormState> = {}): FormState {
  return {
    provider: 'deepseek',
    model: 'deepseek-v4-pro',
    apiKey: 'sk-half-typed',
    hasApiKey: true,
    customBaseUrl: 'https://api.openai.com/v1',
    allowThirdPartyAiSharing: true,
    embeddingsBaseUrl: 'http://localhost:11434/v1',
    embeddingsModel: 'nomic-embed-text',
    ...overrides,
  };
}

const LOCAL_URL = 'http://localhost:11434/v1';

describe('switchAiProvider', () => {
  it('clears every provider-scoped draft when the provider changes', () => {
    const next = switchAiProvider(makeFormState(), OPENAI_COMPATIBLE_PROVIDER_ID, false);

    expect(next.provider).toBe(OPENAI_COMPATIBLE_PROVIDER_ID);
    expect(next.model).toBe('');
    expect(next.customBaseUrl).toBe('');
    expect(next.apiKey).toBe('');
  });

  it('restores the remembered model and base URL of the provider being switched to', () => {
    const profiles: Record<string, AiProviderProfile> = {
      [OPENAI_COMPATIBLE_PROVIDER_ID]: { model: 'llama3.1', customBaseUrl: LOCAL_URL },
      [ANTHROPIC_COMPATIBLE_PROVIDER_ID]: {
        model: 'claude-3-7-sonnet-latest',
        customBaseUrl: 'https://gateway.example/v1',
      },
    };

    const next = switchAiProvider(
      makeFormState({ providerProfiles: profiles }),
      OPENAI_COMPATIBLE_PROVIDER_ID,
      true,
      profiles,
    );

    expect(next.model).toBe('llama3.1');
    expect(next.customBaseUrl).toBe(LOCAL_URL);
  });

  it('starts empty for a provider that has no profile yet', () => {
    const next = switchAiProvider(
      makeFormState({ providerProfiles: {} }),
      OPENAI_COMPATIBLE_PROVIDER_ID,
      false,
      {},
    );

    expect(next.model).toBe('');
    expect(next.customBaseUrl).toBe('');
  });

  it('normalises a profile with no base URL to an empty string, not undefined', () => {
    // The form inputs bind straight to these fields, so an undefined would make them
    // uncontrolled and React would warn about switching to controlled mid-life.
    const next = switchAiProvider(
      makeFormState({ customBaseUrl: 'https://api.deepseek.com' }),
      OPENAI_COMPATIBLE_PROVIDER_ID,
      false,
      { [OPENAI_COMPATIBLE_PROVIDER_ID]: { model: 'llama3.1' } },
    );

    expect(next.model).toBe('llama3.1');
    expect(next.customBaseUrl).toBe('');
  });

  it('never restores a saved key into the form, only its status', () => {
    const next = switchAiProvider(makeFormState(), OPENAI_COMPATIBLE_PROVIDER_ID, true, {
      [OPENAI_COMPATIBLE_PROVIDER_ID]: { model: 'llama3.1' },
    });

    expect(next.apiKey).toBe('');
    expect(next.hasApiKey).toBe(true);
  });

  it('takes hasApiKey from the credential store status of the new provider', () => {
    // deepseek -> anthropic-compatible, which has no saved key
    expect(
      switchAiProvider(makeFormState(), ANTHROPIC_COMPATIBLE_PROVIDER_ID, false).hasApiKey,
    ).toBe(false);
    // deepseek -> openai-compatible, which has one
    expect(
      switchAiProvider(makeFormState(), OPENAI_COMPATIBLE_PROVIDER_ID, true).hasApiKey,
    ).toBe(true);
  });

  it('leaves hasApiKey alone on a re-select, matching the no-op rule', () => {
    expect(switchAiProvider(makeFormState(), 'deepseek', false).hasApiKey).toBe(true);
  });

  it('keeps settings that are not scoped to the selected provider', () => {
    const next = switchAiProvider(makeFormState(), ANTHROPIC_COMPATIBLE_PROVIDER_ID, false);

    expect(next.allowThirdPartyAiSharing).toBe(true);
    expect(next.embeddingsBaseUrl).toBe('http://localhost:11434/v1');
    expect(next.embeddingsModel).toBe('nomic-embed-text');
  });

  it('is a no-op when the provider is re-selected, so a half-typed form survives', () => {
    const current = makeFormState();
    expect(switchAiProvider(current, 'deepseek', false)).toBe(current);
  });

  it('is a no-op on a re-select even when a profile exists, so a draft is never clobbered', () => {
    const current = makeFormState({ model: 'typed-but-unsaved' });
    const profiles: Record<string, AiProviderProfile> = {
      deepseek: { model: 'deepseek-v4-pro' },
    };

    expect(switchAiProvider(current, 'deepseek', true, profiles)).toBe(current);
  });
});

describe('baseUrlForProvider', () => {
  const profiles: Record<string, AiProviderProfile> = {
    [OPENAI_COMPATIBLE_PROVIDER_ID]: { model: 'llama3.1', customBaseUrl: LOCAL_URL },
  };

  it('prefers the in-form draft while the provider is active', () => {
    expect(
      baseUrlForProvider(OPENAI_COMPATIBLE_PROVIDER_ID, OPENAI_COMPATIBLE_PROVIDER_ID, 'http://draft', profiles),
    ).toBe('http://draft');
  });

  it('falls back to the remembered profile for an inactive provider', () => {
    expect(baseUrlForProvider(OPENAI_COMPATIBLE_PROVIDER_ID, 'deepseek', 'http://draft', profiles)).toBe(
      LOCAL_URL,
    );
  });

  it('returns undefined when nothing is known about the provider', () => {
    expect(baseUrlForProvider(ANTHROPIC_COMPATIBLE_PROVIDER_ID, 'deepseek', undefined, profiles)).toBe(
      undefined,
    );
  });
});

describe('providerIsSharingExempt', () => {
  it('exempts an OpenAI-compatible provider pointed at loopback', () => {
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, LOCAL_URL)).toBe(true);
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, 'http://127.0.0.1:1234/v1')).toBe(true);
  });

  it('does not exempt an OpenAI-compatible provider pointed at a remote host', () => {
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, 'https://api.openai.com/v1')).toBe(
      false,
    );
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, '')).toBe(false);
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, undefined)).toBe(false);
  });

  it('never exempts the Anthropic-compatible wire format, matching the backend scope', () => {
    // Rust's `is_local_ai_endpoint` is scoped to OpenAI-compatible, so a loopback Anthropic
    // endpoint still needs the policy. Exempting it here would show a Save button that the
    // backend gate then rejects.
    expect(providerIsSharingExempt(ANTHROPIC_COMPATIBLE_PROVIDER_ID, LOCAL_URL)).toBe(false);
    expect(providerIsSharingExempt('anthropic', LOCAL_URL)).toBe(false);
  });

  it('never exempts a hosted provider, even with a loopback base URL typed in', () => {
    expect(providerIsSharingExempt('deepseek', LOCAL_URL)).toBe(false);
  });

  it('exempts the embeddings pseudo provider on loopback, matching its URL-only backend gate', () => {
    // Rust gates embeddings with `embeddings_sharing_allowed` = `is_local_ai_url(base_url) ||
    // allow_third_party_ai_sharing`, with no provider scoping, because embeddings always use the
    // OpenAI wire format. Applying the chat provider-scoped rule here made the settings gate
    // stricter than the backend and forced a local Ollama user to enable third-party sharing.
    expect(providerIsSharingExempt(EMBEDDINGS_KEY_PROVIDER_ID, LOCAL_URL)).toBe(true);
    expect(providerIsSharingExempt(EMBEDDINGS_KEY_PROVIDER_ID, 'http://127.0.0.1:1234/v1')).toBe(true);
  });

  it('does not exempt the embeddings pseudo provider on a remote endpoint', () => {
    expect(providerIsSharingExempt(EMBEDDINGS_KEY_PROVIDER_ID, 'https://api.openai.com/v1')).toBe(
      false,
    );
    expect(providerIsSharingExempt(EMBEDDINGS_KEY_PROVIDER_ID, '')).toBe(false);
    expect(providerIsSharingExempt(EMBEDDINGS_KEY_PROVIDER_ID, undefined)).toBe(false);
  });

  it('fails closed on hosts that merely look local', () => {
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, 'http://localhost.evil.example/v1')).toBe(
      false,
    );
    expect(providerIsSharingExempt(OPENAI_COMPATIBLE_PROVIDER_ID, 'not a url')).toBe(false);
    expect(providerIsSharingExempt(EMBEDDINGS_KEY_PROVIDER_ID, 'not a url')).toBe(false);
  });
});

describe('keyGateBaseUrl', () => {
  const profiles: Record<string, AiProviderProfile> = {
    [OPENAI_COMPATIBLE_PROVIDER_ID]: { model: 'llama3.1', customBaseUrl: 'http://127.0.0.1:1234/v1' },
  };
  const scope = {
    activeProvider: 'deepseek',
    activeBaseUrl: 'https://api.deepseek.com',
    embeddingsBaseUrl: LOCAL_URL,
    profiles,
  };

  it('reads the dedicated embeddings endpoint for the embeddings pseudo provider', () => {
    // The embeddings provider is not selectable and has no profile, so `baseUrlForProvider` would
    // return undefined here and keep the row gated forever.
    expect(keyGateBaseUrl(EMBEDDINGS_KEY_PROVIDER_ID, scope)).toBe(LOCAL_URL);
    expect(keyGateBaseUrl(EMBEDDINGS_KEY_PROVIDER_ID, { activeProvider: 'deepseek' })).toBeUndefined();
  });

  it('still resolves chat providers through the active draft and profile map', () => {
    expect(keyGateBaseUrl('deepseek', scope)).toBe('https://api.deepseek.com');
    expect(keyGateBaseUrl(OPENAI_COMPATIBLE_PROVIDER_ID, scope)).toBe('http://127.0.0.1:1234/v1');
  });
});

describe('canSaveProviderKey', () => {
  it('allows the first key for a remote provider only with sharing consent', () => {
    expect(
      canSaveProviderKey({
        provider: 'deepseek',
        hasKey: false,
        allowThirdPartyAiSharing: false,
        baseUrl: 'https://api.deepseek.com',
      }),
    ).toBe(false);
    expect(
      canSaveProviderKey({
        provider: 'deepseek',
        hasKey: false,
        allowThirdPartyAiSharing: true,
        baseUrl: 'https://api.deepseek.com',
      }),
    ).toBe(true);
  });

  it('always allows replacing a key that is already stored', () => {
    // The reported bug: with sharing off, Replace was disabled while Clear worked, so a saved key
    // could only be deleted. The credential is already local and sending is gated separately, so
    // replacing discloses nothing new and must not need consent.
    expect(
      canSaveProviderKey({
        provider: 'deepseek',
        hasKey: true,
        allowThirdPartyAiSharing: false,
        baseUrl: 'https://api.deepseek.com',
      }),
    ).toBe(true);
    expect(
      canSaveProviderKey({
        provider: ANTHROPIC_COMPATIBLE_PROVIDER_ID,
        hasKey: true,
        allowThirdPartyAiSharing: false,
        baseUrl: undefined,
      }),
    ).toBe(true);
  });

  it('allows a first key for a loopback endpoint without consent', () => {
    expect(
      canSaveProviderKey({
        provider: OPENAI_COMPATIBLE_PROVIDER_ID,
        hasKey: false,
        allowThirdPartyAiSharing: false,
        baseUrl: LOCAL_URL,
      }),
    ).toBe(true);
  });

  it('does not extend the loopback exemption to the Anthropic wire format', () => {
    expect(
      canSaveProviderKey({
        provider: ANTHROPIC_COMPATIBLE_PROVIDER_ID,
        hasKey: false,
        allowThirdPartyAiSharing: false,
        baseUrl: LOCAL_URL,
      }),
    ).toBe(false);
  });

  it('allows a first embeddings key on a loopback endpoint without consent', () => {
    // Ollama / LM Studio need no key at all, but some local gateways (vLLM `--api-key`) do, and
    // the backend would accept it. Requiring the sharing toggle pushed users into granting remote
    // chat access to save a credential that never leaves the machine.
    expect(
      canSaveProviderKey({
        provider: EMBEDDINGS_KEY_PROVIDER_ID,
        hasKey: false,
        allowThirdPartyAiSharing: false,
        baseUrl: LOCAL_URL,
      }),
    ).toBe(true);
  });

  it('still gates a first embeddings key on a remote endpoint', () => {
    expect(
      canSaveProviderKey({
        provider: EMBEDDINGS_KEY_PROVIDER_ID,
        hasKey: false,
        allowThirdPartyAiSharing: false,
        baseUrl: 'https://api.openai.com/v1',
      }),
    ).toBe(false);
    expect(
      canSaveProviderKey({
        provider: EMBEDDINGS_KEY_PROVIDER_ID,
        hasKey: false,
        allowThirdPartyAiSharing: true,
        baseUrl: 'https://api.openai.com/v1',
      }),
    ).toBe(true);
  });
});

describe('buildAiProviderKeyEntries', () => {
  const SHARING_OFF = { allowThirdPartyAiSharing: false } as const;

  it('lists every provider that can hold a key', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: 'deepseek',
      ...SHARING_OFF,
    });

    expect(entries.map((entry) => entry.id)).toEqual(
      AI_KEY_PROVIDER_OPTIONS.map((provider) => provider.id),
    );
    expect(entries.every((entry) => !entry.hasKey)).toBe(true);
  });

  it('marks the active provider and reflects saved keys per provider', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {
        deepseek: true,
        [OPENAI_COMPATIBLE_PROVIDER_ID]: true,
        [EMBEDDINGS_KEY_PROVIDER_ID]: true,
      },
      activeProvider: OPENAI_COMPATIBLE_PROVIDER_ID,
      ...SHARING_OFF,
    });

    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    expect(byId.get(OPENAI_COMPATIBLE_PROVIDER_ID)?.isActive).toBe(true);
    expect(byId.get(OPENAI_COMPATIBLE_PROVIDER_ID)?.hasKey).toBe(true);
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.hasKey).toBe(true);
    // Only the selected chat provider is active, never the embeddings pseudo provider.
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.isActive).toBe(false);
    expect(byId.get('deepseek')?.isActive).toBe(false);
  });

  it('never marks the embeddings pseudo provider as active', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: EMBEDDINGS_KEY_PROVIDER_ID,
      ...SHARING_OFF,
    });

    expect(entries.filter((entry) => entry.isActive)).toEqual([]);
  });

  it('tolerates a missing status map', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: undefined,
      activeProvider: 'deepseek',
      ...SHARING_OFF,
    });

    expect(entries.every((entry) => !entry.hasKey)).toBe(true);
  });

  it('flags only the active OpenAI-compatible row as savable without sharing consent', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: OPENAI_COMPATIBLE_PROVIDER_ID,
      activeBaseUrl: LOCAL_URL,
      ...SHARING_OFF,
    });

    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    expect(byId.get(OPENAI_COMPATIBLE_PROVIDER_ID)?.savesKeyWithoutSharing).toBe(true);
    expect(byId.get(ANTHROPIC_COMPATIBLE_PROVIDER_ID)?.savesKeyWithoutSharing).toBe(false);
    expect(byId.get('deepseek')?.savesKeyWithoutSharing).toBe(false);
    // No embeddings endpoint configured in this fixture, so its row is not exempt.
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.savesKeyWithoutSharing).toBe(false);
  });

  it('exempts the embeddings row from its own endpoint, not from the chat provider', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: 'deepseek',
      activeBaseUrl: 'https://api.deepseek.com',
      embeddingsBaseUrl: LOCAL_URL,
      ...SHARING_OFF,
    });

    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.savesKeyWithoutSharing).toBe(true);
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.canSaveKey).toBe(true);
    // A loopback embeddings endpoint must not leak the exemption into the chat rows.
    expect(byId.get('deepseek')?.savesKeyWithoutSharing).toBe(false);
    expect(byId.get(ANTHROPIC_COMPATIBLE_PROVIDER_ID)?.canSaveKey).toBe(false);
  });

  it('keeps the embeddings row gated when its endpoint is remote', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: OPENAI_COMPATIBLE_PROVIDER_ID,
      activeBaseUrl: LOCAL_URL,
      embeddingsBaseUrl: 'https://api.openai.com/v1',
      ...SHARING_OFF,
    });

    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.savesKeyWithoutSharing).toBe(false);
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.canSaveKey).toBe(false);
    // The loopback chat provider is still exempt in the same render.
    expect(byId.get(OPENAI_COMPATIBLE_PROVIDER_ID)?.canSaveKey).toBe(true);
  });

  it('uses a provider profile base URL for an inactive row', () => {
    // The row for a provider you are not currently on must still know it points at loopback,
    // otherwise its Save button would stay disabled until you switch to it.
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: 'deepseek',
      activeBaseUrl: 'https://api.deepseek.com',
      profiles: { [OPENAI_COMPATIBLE_PROVIDER_ID]: { model: 'llama3.1', customBaseUrl: LOCAL_URL } },
      ...SHARING_OFF,
    });

    const openAiRow = entries.find((entry) => entry.id === OPENAI_COMPATIBLE_PROVIDER_ID);
    expect(openAiRow?.savesKeyWithoutSharing).toBe(true);
    expect(openAiRow?.canSaveKey).toBe(true);
  });

  it('does not exempt any row when no sharing exemption applies', () => {
    const entries = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: 'deepseek',
      activeBaseUrl: 'https://api.deepseek.com',
      ...SHARING_OFF,
    });

    expect(entries.some((entry) => entry.savesKeyWithoutSharing)).toBe(false);
  });

  it('blocks every first key with sharing off, and unblocks them all with it on', () => {
    const blocked = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: 'deepseek',
      activeBaseUrl: 'https://api.deepseek.com',
      allowThirdPartyAiSharing: false,
    });
    expect(blocked.every((entry) => !entry.canSaveKey)).toBe(true);

    const allowed = buildAiProviderKeyEntries({
      keyStatus: {},
      activeProvider: 'deepseek',
      activeBaseUrl: 'https://api.deepseek.com',
      allowThirdPartyAiSharing: true,
    });
    expect(allowed.every((entry) => entry.canSaveKey)).toBe(true);
  });

  it('keeps stored keys replaceable with sharing off', () => {
    // The whole point of the fix: a provider that already holds a key stays editable.
    const entries = buildAiProviderKeyEntries({
      keyStatus: { deepseek: true, [OPENAI_COMPATIBLE_PROVIDER_ID]: true },
      activeProvider: 'deepseek',
      activeBaseUrl: 'https://api.deepseek.com',
      ...SHARING_OFF,
    });

    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    expect(byId.get('deepseek')?.canSaveKey).toBe(true);
    expect(byId.get(OPENAI_COMPATIBLE_PROVIDER_ID)?.canSaveKey).toBe(true);
    // Providers with no key yet stay blocked.
    expect(byId.get(ANTHROPIC_COMPATIBLE_PROVIDER_ID)?.canSaveKey).toBe(false);
    expect(byId.get(EMBEDDINGS_KEY_PROVIDER_ID)?.canSaveKey).toBe(false);
  });
});

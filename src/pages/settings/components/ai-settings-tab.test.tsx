// @vitest-environment jsdom
/**
 * Render tests for the AI settings tab's saved-key rows.
 *
 * These exist because the pure-function tests in `../lib/ai-providers.test.ts` could not catch a
 * real regression: a saved key rendered its placeholder as dots, which look identical to a masked
 * stored value, so the field appeared read-only and the only usable action was Clear. Guard the
 * affordances here, not just the gate logic.
 *
 * The tab deep-imports `@celestia-project/ui`, so this file is slow (~45s) to boot. That is why it
 * is the only render test for the tab rather than several small ones.
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, describe, expect, test } from 'vitest';

import { AiSettingsTab } from './ai-settings-tab';
import { buildAiProviderKeyEntries } from '../lib/ai-providers';
import type { SettingsPageState } from '../hooks/use-settings-page';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const noop = () => {};
const noopAsync = async () => true;

interface StateOverrides {
  aiSettings?: Record<string, unknown>;
  savedAiSettings?: Record<string, unknown>;
  keyStatus?: Record<string, boolean>;
  keyActionProvider?: string | null;
  handleSaveProviderKey?: (provider: string, apiKey: string) => Promise<boolean>;
  handleClearProviderKey?: (provider: string) => Promise<boolean>;
}

function makeState(overrides: StateOverrides = {}): SettingsPageState {
  // Merge the nested objects rather than spreading `overrides` last — a partial would replace
  // the whole aiSettings object and crash the tab on `aiSettings.model.trim()`.
  const aiSettings = {
    provider: 'deepseek',
    model: 'deepseek-v4-pro',
    apiKey: '',
    hasApiKey: true,
    allowThirdPartyAiSharing: true,
    customBaseUrl: '',
    // Declared here (not only spread in) so the property exists on the inferred type.
    embeddingsBaseUrl: '',
    ...overrides.aiSettings,
  };

  return {
    aiSettings,
    aiSettingsLoading: false,
    aiSettingsSaving: false,
    aiProviderKeyEntries: buildAiProviderKeyEntries({
      keyStatus: overrides.keyStatus ?? { deepseek: true },
      activeProvider: aiSettings.provider,
      activeBaseUrl: aiSettings.customBaseUrl,
      // Forwarded so the embeddings row is gated on its own endpoint, as the hook does.
      embeddingsBaseUrl: aiSettings.embeddingsBaseUrl as string | null | undefined,
      allowThirdPartyAiSharing: aiSettings.allowThirdPartyAiSharing,
    }),
    handleClearProviderKey: overrides.handleClearProviderKey ?? noopAsync,
    handleSaveAiSettings: noopAsync,
    handleSaveProviderKey: overrides.handleSaveProviderKey ?? noopAsync,
    handleToggleThirdPartyAiSharing: noopAsync,
    keyActionProvider: overrides.keyActionProvider ?? null,
    savedAiSettings: { ...aiSettings, ...overrides.savedAiSettings },
    updateAiProvider: noop,
    updateAiSettings: noop,
  } as unknown as SettingsPageState;
}

let container: HTMLDivElement | null = null;

function render(state: SettingsPageState) {
  container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<AiSettingsTab settings={state} />);
  });
  return container;
}

afterEach(() => {
  container?.remove();
  container = null;
});

function apiKeyField(el: HTMLElement, label: string) {
  return el.querySelector(`input[aria-label="${label} API key"]`) as HTMLInputElement;
}

function button(el: HTMLElement, label: string) {
  return Array.from(el.querySelectorAll('button')).find(
    (candidate) => (candidate.textContent ?? '').trim() === label,
  );
}

/**
 * The saved-key row for `label`, found by walking up from its key field.
 *
 * Needed because several rows can show the same action text at once — with keys stored for only
 * some providers, `button(el, 'Save key')` silently returns whichever row comes first in the list
 * rather than the row under test.
 */
function rowFor(el: HTMLElement, label: string): HTMLElement {
  let node: HTMLElement | null = apiKeyField(el, label).parentElement;

  while (node && node !== el) {
    if (button(node, 'Save key') ?? button(node, 'Replace key')) return node;
    node = node.parentElement;
  }

  throw new Error(`No saved-key row found for ${label}`);
}

/** The save/replace button inside `label`'s own row. */
function rowSaveButton(el: HTMLElement, label: string): HTMLButtonElement {
  const row = rowFor(el, label);
  return (button(row, 'Save key') ?? button(row, 'Replace key')) as HTMLButtonElement;
}

/** React tracks its own value on the node, so set through the native setter then dispatch input. */
function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

const BLOCKED_NOTICE =
  'Enable third-party AI data sharing above to save a key for this provider';

/** How many rows show the inline "blocked" explanation. */
function countNotices(el: HTMLElement): number {
  return (el.textContent ?? '').split(BLOCKED_NOTICE).length - 1;
}

describe('saved-key row affordances', () => {
  test('a saved key invites a replacement instead of showing fake masked dots', () => {
    const el = render(makeState());
    const field = apiKeyField(el, 'DeepSeek');

    // The bug this guards: dots here are indistinguishable from a masked stored value, so the
    // field looked read-only and users reported the key could not be edited.
    expect(field.placeholder).not.toContain('•');
    expect(field.placeholder.toLowerCase()).toContain('replace');
    expect(field.value).toBe('');
    expect(field.readOnly).toBe(false);
    expect(field.disabled).toBe(false);
  });

  test('typing a new key enables the replace button when sharing is on', () => {
    const el = render(makeState());

    const before = button(el, 'Replace key') as HTMLButtonElement;
    expect(before).toBeTruthy();
    expect(before.disabled).toBe(true);

    act(() => {
      typeInto(apiKeyField(el, 'DeepSeek'), 'sk-rotated');
    });

    expect((button(el, 'Replace key') as HTMLButtonElement).disabled).toBe(false);
    // Clear must stay usable so a key can always be removed.
    expect((button(el, 'Clear') as HTMLButtonElement).disabled).toBe(false);
  });

  test('a saved key stays replaceable with sharing off, and only Clear used to work', () => {
    const el = render(makeState({ aiSettings: { allowThirdPartyAiSharing: false } }));

    act(() => {
      typeInto(apiKeyField(el, 'DeepSeek'), 'sk-rotated');
    });

    // The reported bug: with sharing off this button was disabled while Clear worked, so the only
    // usable action on a saved key was deleting it. Replacing a stored key needs no consent.
    expect((button(el, 'Replace key') as HTMLButtonElement).disabled).toBe(false);
    expect((button(el, 'Clear') as HTMLButtonElement).disabled).toBe(false);

    // Its own row carries no blocked notice. The other three providers have no key yet and are
    // still gated, so count them rather than asserting the string is absent page-wide.
    expect(countNotices(el)).toBe(3);
  });

  test('explains the block for a first key instead of leaving only Clear usable', () => {
    // No key stored yet, remote provider, sharing off — this is the one case still gated.
    const el = render(
      makeState({ aiSettings: { allowThirdPartyAiSharing: false }, keyStatus: {} }),
    );

    act(() => {
      typeInto(apiKeyField(el, 'DeepSeek'), 'sk-first');
    });

    expect(rowSaveButton(el, 'DeepSeek').disabled).toBe(true);
    expect(el.textContent).toContain(BLOCKED_NOTICE);
  });

  test('a loopback provider is savable without sharing consent', () => {
    const el = render(
      makeState({
        aiSettings: {
          provider: 'openai-compatible',
          model: 'llama3.1',
          allowThirdPartyAiSharing: false,
          customBaseUrl: 'http://localhost:11434/v1',
        },
        keyStatus: { 'openai-compatible': true },
      }),
    );

    act(() => {
      typeInto(apiKeyField(el, 'OpenAI Compatible'), 'sk-local');
    });

    expect(rowSaveButton(el, 'OpenAI Compatible').disabled).toBe(false);

    // The blocked explanation is per row, so with sharing off it belongs on the rows with no key
    // yet (deepseek, anthropic-compatible, embeddings) and not on the loopback one.
    expect(countNotices(el)).toBe(3);
  });

  test('the embeddings row is savable on a loopback endpoint without sharing consent', () => {
    // Rust gates embeddings URL-only (`embeddings_sharing_allowed` = `is_local_ai_url(base_url)
    // || allow_third_party_ai_sharing`), with no provider scoping, because embeddings always use
    // the OpenAI wire format. Applying the chat provider-scoped rule here made saving a key for a
    // local Ollama / LM Studio endpoint demand the sharing toggle — which also unlocks remote chat
    // traffic, i.e. a broader consent than the action needs.
    const el = render(
      makeState({
        aiSettings: {
          allowThirdPartyAiSharing: false,
          embeddingsBaseUrl: 'http://localhost:11434/v1',
          embeddingsModel: 'nomic-embed-text',
        },
        keyStatus: { deepseek: true },
      }),
    );

    act(() => {
      typeInto(apiKeyField(el, 'Embeddings (Memory RAG)'), 'sk-local');
    });

    // Scoped to the embeddings row: the two remote providers with no key yet render a 'Save key'
    // button as well, and theirs stays disabled.
    expect(rowSaveButton(el, 'Embeddings (Memory RAG)').disabled).toBe(false);
    expect(rowSaveButton(el, 'OpenAI Compatible').disabled).toBe(true);

    // deepseek holds a key (replaceable) and embeddings is loopback-exempt, so the blocked notice
    // belongs only to the two remote providers with no key yet.
    expect(countNotices(el)).toBe(2);
  });

  test('a provider with no key shows the save action and a real key placeholder', () => {
    const el = render(makeState({ keyStatus: {} }));

    expect(button(el, 'Save key')).toBeTruthy();
    expect(button(el, 'Replace key')).toBeUndefined();
    expect(apiKeyField(el, 'DeepSeek').placeholder).not.toContain('replace');
  });

  test('a pending row disables its own controls', () => {
    const el = render(makeState({ keyActionProvider: 'deepseek' }));

    expect(apiKeyField(el, 'DeepSeek').disabled).toBe(true);
    expect((button(el, 'Saving…') as HTMLButtonElement).disabled).toBe(true);
    // A different provider's row is unaffected.
    expect(apiKeyField(el, 'Anthropic Compatible').disabled).toBe(false);
  });
});

describe('replacing a saved key', () => {
  test('clicking Replace sends the provider and the typed key, then clears the field', async () => {
    // Enabling the button is not the same as the button working — this is the action the report
    // said was impossible, so follow it all the way into the handler.
    const calls: Array<[string, string]> = [];
    const el = render(
      makeState({
        handleSaveProviderKey: async (provider, apiKey) => {
          calls.push([provider, apiKey]);
          return true;
        },
      }),
    );

    const field = apiKeyField(el, 'DeepSeek');
    act(() => {
      typeInto(field, '  sk-rotated  ');
    });

    await act(async () => {
      (button(el, 'Replace key') as HTMLButtonElement).click();
    });

    expect(calls).toEqual([['deepseek', '  sk-rotated  ']]);
    // A successful save clears the draft, so the field goes back to inviting a replacement.
    expect(apiKeyField(el, 'DeepSeek').value).toBe('');
  });

  test('keeps the typed key when the save fails, so it is not lost', async () => {
    const el = render(makeState({ handleSaveProviderKey: async () => false }));

    act(() => {
      typeInto(apiKeyField(el, 'DeepSeek'), 'sk-rotated');
    });

    await act(async () => {
      (button(el, 'Replace key') as HTMLButtonElement).click();
    });

    expect(apiKeyField(el, 'DeepSeek').value).toBe('sk-rotated');
  });

  test('clicking Clear sends the provider', async () => {
    const cleared: string[] = [];
    const el = render(
      makeState({
        handleClearProviderKey: async (provider) => {
          cleared.push(provider);
          return true;
        },
      }),
    );

    await act(async () => {
      (button(el, 'Clear') as HTMLButtonElement).click();
    });

    expect(cleared).toEqual(['deepseek']);
  });
});

import { describe, expect, it } from 'vitest';
import {
  embeddingsEndpointAllowed,
  isLocalAiEndpoint,
  isLocalAiProviderEndpoint,
} from './ai-endpoint';

/**
 * Direct tests for the shared loopback rule.
 *
 * Until now this module was only covered indirectly, through `providerIsSharingExempt` in
 * `settings/lib/ai-providers.test.ts`, which exercises the provider-scoped wrapper and never the
 * URL parsing itself. The parsing is the security-relevant half — it decides whether traffic is
 * considered to stay on the machine — so the spoofing and fail-closed cases are asserted here.
 */
describe('isLocalAiEndpoint', () => {
  it('accepts loopback hosts', () => {
    expect(isLocalAiEndpoint('http://localhost:11434/v1')).toBe(true);
    expect(isLocalAiEndpoint('http://127.0.0.1:1234/v1')).toBe(true);
    expect(isLocalAiEndpoint('http://127.9.9.9/v1')).toBe(true);
    expect(isLocalAiEndpoint('https://api.localhost/v1')).toBe(true);
    // Unspecified address, which `url::Host::is_unspecified` also exempts on the Rust side.
    expect(isLocalAiEndpoint('http://0.0.0.0:8080/v1')).toBe(true);
    expect(isLocalAiEndpoint('http://[::1]:11434/v1')).toBe(true);
    expect(isLocalAiEndpoint('http://[::]/v1')).toBe(true);
  });

  it('rejects remote hosts, including private LAN addresses', () => {
    expect(isLocalAiEndpoint('https://api.openai.com/v1')).toBe(false);
    expect(isLocalAiEndpoint('https://openrouter.ai/api/v1')).toBe(false);
    // A LAN address is reachable over the network, so it is not loopback and still needs consent.
    // Rust's `ip.is_loopback()` agrees — only 127.0.0.0/8 is exempt.
    expect(isLocalAiEndpoint('http://192.168.1.50:11434/v1')).toBe(false);
    expect(isLocalAiEndpoint('http://10.0.0.5:11434/v1')).toBe(false);
    expect(isLocalAiEndpoint('http://8.8.8.8/v1')).toBe(false);
  });

  it('is not fooled by hosts or paths that merely contain a loopback string', () => {
    // Parsing is exact, so none of these can be smuggled past the gate.
    expect(isLocalAiEndpoint('http://localhost.attacker.example/v1')).toBe(false);
    expect(isLocalAiEndpoint('http://127.0.0.1.attacker.example/v1')).toBe(false);
    expect(isLocalAiEndpoint('http://attacker.example?x=localhost')).toBe(false);
    expect(isLocalAiEndpoint('http://attacker.example#localhost')).toBe(false);
    expect(isLocalAiEndpoint('http://attacker.example/localhost')).toBe(false);
    expect(isLocalAiEndpoint('http://127.0.0.1@attacker.example/v1')).toBe(false);
  });

  it('fails closed on unparseable input and non-HTTP schemes', () => {
    expect(isLocalAiEndpoint('not a url')).toBe(false);
    expect(isLocalAiEndpoint('')).toBe(false);
    expect(isLocalAiEndpoint(undefined)).toBe(false);
    expect(isLocalAiEndpoint(null)).toBe(false);
    expect(isLocalAiEndpoint('ftp://localhost/v1')).toBe(false);
    expect(isLocalAiEndpoint('file:///etc/passwd')).toBe(false);
    expect(isLocalAiEndpoint('javascript:alert(1)')).toBe(false);
  });

  it('documents the deliberate divergence from Rust on IPv4-mapped IPv6', () => {
    // Rust unwraps `::ffff:127.0.0.1` and exempts it; this side treats it as remote. Stricter, so
    // it fails closed rather than open — the backend gate is authoritative either way.
    expect(isLocalAiEndpoint('http://[::ffff:127.0.0.1]:11434/v1')).toBe(false);
  });
});

describe('isLocalAiProviderEndpoint', () => {
  it('exempts only the OpenAI-compatible wire format at loopback', () => {
    expect(isLocalAiProviderEndpoint('openai-compatible', 'http://localhost:11434/v1')).toBe(true);
    expect(isLocalAiProviderEndpoint('openai-compatible', 'https://api.openai.com/v1')).toBe(false);
    // The Anthropic-compatible path always requires the policy, even on loopback.
    expect(isLocalAiProviderEndpoint('anthropic-compatible', 'http://localhost:11434/v1')).toBe(
      false,
    );
    expect(isLocalAiProviderEndpoint('deepseek', 'http://localhost:11434/v1')).toBe(false);
  });

  it('tolerates surrounding whitespace and casing on the provider id', () => {
    expect(isLocalAiProviderEndpoint('  OpenAI-Compatible  ', 'http://localhost:11434/v1')).toBe(
      true,
    );
  });

  it('rejects a missing provider or endpoint', () => {
    expect(isLocalAiProviderEndpoint(undefined, 'http://localhost:11434/v1')).toBe(false);
    expect(isLocalAiProviderEndpoint('openai-compatible', undefined)).toBe(false);
    expect(isLocalAiProviderEndpoint(null, null)).toBe(false);
  });
});

describe('embeddingsEndpointAllowed', () => {
  it('allows a loopback endpoint without sharing consent', () => {
    expect(embeddingsEndpointAllowed('http://localhost:11434/v1', false)).toBe(true);
    expect(embeddingsEndpointAllowed('http://127.0.0.1:1234/v1', false)).toBe(true);
  });

  it('requires sharing consent for a remote endpoint', () => {
    expect(embeddingsEndpointAllowed('https://api.openai.com/v1', false)).toBe(false);
    expect(embeddingsEndpointAllowed('https://api.openai.com/v1', true)).toBe(true);
  });

  it('is not provider-scoped, unlike the chat rule', () => {
    // The whole point of this helper: it must mirror `embeddings_sharing_allowed`, which is
    // URL-only. It takes no provider argument precisely so the chat rule cannot leak in.
    expect(embeddingsEndpointAllowed('http://localhost:11434/v1', false)).toBe(
      isLocalAiEndpoint('http://localhost:11434/v1'),
    );
  });

  it('stays closed when nothing is configured or the URL is unusable', () => {
    expect(embeddingsEndpointAllowed(undefined, false)).toBe(false);
    expect(embeddingsEndpointAllowed('', false)).toBe(false);
    expect(embeddingsEndpointAllowed('not a url', false)).toBe(false);
    // A LAN endpoint is remote, so it is gated like any other.
    expect(embeddingsEndpointAllowed('http://192.168.1.50:11434/v1', false)).toBe(false);
  });

  it('is true for an unconfigured endpoint once sharing is on, so callers must AND with "configured"', () => {
    // This answers "is it *permitted*?", not "is it *usable*?" — it mirrors the backend gate, which
    // has nothing to say about whether an endpoint is set. Reading it as a readiness check shipped a
    // real bug: sharing on + no endpoint reported "Vector Search Active" in the settings badge.
    // Correct shape: `configured && embeddingsEndpointAllowed(baseUrl, sharing)`.
    expect(embeddingsEndpointAllowed('', true)).toBe(true);
    expect(embeddingsEndpointAllowed(undefined, true)).toBe(true);
  });
});

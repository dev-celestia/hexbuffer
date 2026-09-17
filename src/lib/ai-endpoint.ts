/**
 * True when an AI endpoint URL resolves to this machine (loopback or unspecified host), so
 * requests never leave the box and need neither third-party sharing consent nor a real API key.
 *
 * Mirrors `is_local_ai_url` in `src-tauri/src/ai/providers.rs`. Parsing is exact, so hosts such
 * as `localhost.attacker.example`, `127.0.0.1@evil.com` or `attacker.example?x=localhost` are
 * never misclassified, and unparseable URLs fail closed (treated as remote).
 *
 * One deliberate divergence from the Rust version: IPv4-mapped IPv6 hosts (`[::ffff:127.0.0.1]`)
 * are treated as remote here, where Rust unwraps them. The backend gate is authoritative and
 * exempts them; this side is simply stricter, which fails closed rather than open.
 */
export function isLocalAiEndpoint(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) return true;
    // IPv4 loopback (127.0.0.0/8) and unspecified (0.0.0.0)
    if (/^127(\.\d{1,3}){3}$/.test(hostname) || hostname === '0.0.0.0') return true;
    // IPv6 loopback / unspecified
    if (hostname === '[::1]' || hostname === '::1' || hostname === '[::]' || hostname === '::') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * The only provider whose wire format is exempt from third-party sharing consent when it points
 * at a loopback endpoint. Mirrors `OPENAI_COMPATIBLE_PROVIDER` in `src-tauri/src/ai/providers.rs`.
 */
const LOCAL_EXEMPT_PROVIDER_ID = 'openai-compatible';

/**
 * True when `provider` at `baseUrl` never leaves this machine, so it needs neither third-party
 * sharing consent nor a real API key.
 *
 * Deliberately scoped to the OpenAI-compatible wire format, matching `is_local_ai_endpoint` in
 * `src-tauri/src/ai/providers.rs`: a loopback Anthropic-compatible endpoint still requires the
 * sharing policy.
 *
 * This is the *chat* rule only. The `embeddings` pseudo-provider is gated URL-only by
 * `embeddings_sharing_allowed` (`src-tauri/src/ai/embeddings.rs`) because it always speaks the
 * OpenAI wire format regardless of the selected chat provider; callers that need to cover both
 * credentials should use `providerIsSharingExempt` (`src/pages/settings/lib/ai-providers.ts`),
 * which dispatches between the two. Keep this as the single frontend source of the chat rule —
 * the chat transport and the settings gate both derive from it, and they had already drifted
 * apart once.
 */
export function isLocalAiProviderEndpoint(
  provider?: string | null,
  baseUrl?: string | null,
): boolean {
  return provider?.trim().toLowerCase() === LOCAL_EXEMPT_PROVIDER_ID && isLocalAiEndpoint(baseUrl);
}

/**
 * True when the embeddings endpoint may actually be used.
 *
 * A named mirror of `embeddings_sharing_allowed` in `src-tauri/src/ai/embeddings.rs`:
 * `is_local_ai_url(base_url) || allow_third_party_ai_sharing`. It is URL-only, with no provider
 * scoping, because embeddings always speak the OpenAI wire format regardless of the selected chat
 * provider — so this is deliberately *not* `isLocalAiProviderEndpoint`.
 *
 * Keep the two sides in step. A caller that decides "is vector search usable?" from the endpoint
 * and model alone will claim the feature is on while the backend silently stores entries without
 * vectors, which is exactly how the memory toolbar came to report vector search as enabled on a
 * remote endpoint with sharing off.
 */
export function embeddingsEndpointAllowed(
  baseUrl: string | null | undefined,
  allowThirdPartyAiSharing: boolean,
): boolean {
  return isLocalAiEndpoint(baseUrl) || allowThirdPartyAiSharing;
}

/**
 * IPv4-mapped IPv6, which `new URL` canonicalises to two hex groups — `[::ffff:127.0.0.1]` arrives
 * as `[::ffff:7f00:1]`, and `[::ffff:0.0.0.0]` as `[::ffff:0:0]`.
 */
const IPV4_MAPPED_IPV6 = /^\[::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})\]$/i;

/**
 * The IPv4 loopback / unspecified test applied to an IPv4-mapped IPv6 host, mirroring Rust's
 * `ip.to_ipv4_mapped().map(|v4| v4.is_loopback() || v4.is_unspecified())` in `is_local_ai_url`.
 *
 * The two 16-bit groups spell out the four octets, so the first octet is the high byte of the first
 * group: `7f00` → 127 (loopback), `808` → 8 (remote), both groups zero → 0.0.0.0 (unspecified).
 */
function isLoopbackIpv4Mapped(hostname: string): boolean {
  const match = IPV4_MAPPED_IPV6.exec(hostname);
  if (!match) return false;

  const high = Number.parseInt(match[1], 16);
  const low = Number.parseInt(match[2], 16);

  return ((high >> 8) & 0xff) === 127 || (high === 0 && low === 0);
}

/**
 * True when an AI endpoint URL resolves to this machine (loopback or unspecified host), so
 * requests never leave the box and need neither third-party sharing consent nor a real API key.
 *
 * Mirrors `is_local_ai_url` in `src-tauri/src/ai/providers.rs`, including its IPv4-mapped IPv6
 * handling. Parsing is exact, so hosts such as `localhost.attacker.example`,
 * `127.0.0.1@evil.com` or `attacker.example?x=localhost` are never misclassified, and unparseable
 * URLs fail closed (treated as remote).
 *
 * The two sides are kept deliberately identical. An earlier version treated IPv4-mapped IPv6 as
 * remote while Rust exempted it — safe (it failed closed) but wrong in the direction that matters
 * for the UI: the settings gate asked for sharing consent the backend did not require, and the
 * memory badge reported "Needs Sharing Consent" for an endpoint that would have worked.
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
    // IPv6 loopback / unspecified. `URL` always brackets an IPv6 host, so the bracketed forms are
    // the ones that can match; the bare forms are kept as cheap defence.
    if (hostname === '[::1]' || hostname === '::1' || hostname === '[::]' || hostname === '::') {
      return true;
    }
    return isLoopbackIpv4Mapped(hostname);
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
 * True when the embeddings endpoint is *permitted* to be used.
 *
 * This is the permission half only, and it answers exactly what the backend gate answers — it does
 * **not** say the endpoint is configured. With sharing enabled it returns `true` even for an empty
 * URL, so every caller must AND it with "a base URL and model are set" before claiming vector
 * search is usable:
 *
 * ```ts
 * const usable = configured && embeddingsEndpointAllowed(baseUrl, allowThirdPartyAiSharing);
 * ```
 *
 * A named mirror of `embeddings_sharing_allowed` in `src-tauri/src/ai/embeddings.rs`:
 * `is_local_ai_url(base_url) || allow_third_party_ai_sharing`. It is URL-only, with no provider
 * scoping, because embeddings always speak the OpenAI wire format regardless of the selected chat
 * provider — so this is deliberately *not* `isLocalAiProviderEndpoint`.
 *
 * Keep the two sides in step. A caller that decides "is vector search usable?" from the endpoint
 * and model alone will claim the feature is on while the backend silently stores entries without
 * vectors, which is exactly how the memory toolbar and the settings badge came to report vector
 * search as enabled on a remote endpoint with sharing off.
 */
export function embeddingsEndpointAllowed(
  baseUrl: string | null | undefined,
  allowThirdPartyAiSharing: boolean,
): boolean {
  return isLocalAiEndpoint(baseUrl) || allowThirdPartyAiSharing;
}

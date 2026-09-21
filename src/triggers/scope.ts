import { useTargetStore } from '@/stores/target';

/**
 * Scope enforcement for AI tool executors that fire traffic at a host.
 *
 * A pentest engagement is only authorized against hosts the user has declared in
 * scope. These helpers let an executor refuse to target a host that is not in the
 * target store's scope, so a misbehaving or misinstructed model cannot send
 * requests, fuzz, or scan out-of-scope hosts.
 */

/** Normalizes a host string to a comparable lowercase hostname without a scheme or path. */
export function normalizeHost(host: string): string {
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.replace(/^https?:\/\//i, '').split('/')[0].replace(/\.$/, '').trim();
}

/** Extracts the hostname from a URL or bare host, or '' when it cannot be parsed. */
function extractHost(hostOrUrl: string): string {
  const value = hostOrUrl.trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    try {
      return new URL(value).hostname.toLowerCase();
    } catch {
      return normalizeHost(value);
    }
  }
  return normalizeHost(value);
}

/** All normalized in-scope hosts across every target in the store. */
export function getScopeHosts(): string[] {
  const hosts: string[] = [];
  for (const target of useTargetStore.getState().targets) {
    for (const entry of target.scope ?? []) {
      const host = normalizeHost(entry);
      if (host) hosts.push(host);
    }
  }
  return hosts;
}

/**
 * Whether a host/URL is in scope. A host matches when it equals an in-scope host or
 * is a subdomain of one. Parent domains never match a narrower scope entry, and an
 * empty scope matches nothing (fail-closed).
 */
export function isHostInScope(hostOrUrl: string): boolean {
  const host = extractHost(hostOrUrl);
  if (!host) return false;
  const scope = getScopeHosts();
  if (scope.length === 0) return false;
  return scope.some((s) => host === s || host.endsWith(`.${s}`));
}

/**
 * Throws when the host/URL is not in scope. Use at the top of an executor that is
 * about to send traffic, fuzz, or scan a remote host so the failure is reported to
 * the model instead of silently targeting an unauthorized host.
 */
export function assertHostInScope(hostOrUrl: string, action: string): void {
  if (!isHostInScope(hostOrUrl)) {
    const scope = getScopeHosts();
    const hint =
      scope.length === 0
        ? 'No targets are in scope yet.'
        : `In-scope hosts: ${scope.join(', ')}.`;
    throw new Error(
      `Refusing to ${action} "${hostOrUrl}": host is not in the authorized target scope. ` +
        `Add it to scope first with add_scope_target. ${hint}`,
    );
  }
}

import {
  ShieldIcon,
  ShieldWarningIcon,
  WarningCircleIcon,
  Info,
} from '@phosphor-icons/react';
import type { JwtAlgorithm, JwtVulnerabilitySeverity } from './types';

// ── Severity styling ──────────────────────────────────────

export const SEVERITY_CONFIG: Record<
  JwtVulnerabilitySeverity,
  { color: string; icon: React.ElementType }
> = {
  critical: { color: 'text-red-500 border-red-500/20 bg-red-500/5', icon: ShieldWarningIcon },
  high: { color: 'text-orange-500 border-orange-500/20 bg-orange-500/5', icon: ShieldIcon },
  medium: { color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5', icon: WarningCircleIcon },
  low: { color: 'text-blue-500 border-blue-500/20 bg-blue-500/5', icon: Info },
  info: { color: 'text-muted-foreground border-border bg-muted/50', icon: Info },
};

export interface AlgorithmOption {
  value: JwtAlgorithm;
  label: string;
  category: 'HMAC' | 'RSA' | 'ECDSA' | 'RSA-PSS' | 'None';
  type: 'symmetric' | 'asymmetric' | 'none';
  description: string;
}

export const ALGORITHM_OPTIONS: AlgorithmOption[] = [
  // Symmetric (HMAC)
  { value: 'HS256', label: 'HS256', category: 'HMAC', type: 'symmetric', description: 'HMAC using SHA-256' },
  { value: 'HS384', label: 'HS384', category: 'HMAC', type: 'symmetric', description: 'HMAC using SHA-384' },
  { value: 'HS512', label: 'HS512', category: 'HMAC', type: 'symmetric', description: 'HMAC using SHA-512' },

  // Asymmetric (RSA PKCS#1 v1.5)
  { value: 'RS256', label: 'RS256', category: 'RSA', type: 'asymmetric', description: 'RSASSA-PKCS1-v1_5 using SHA-256' },
  { value: 'RS384', label: 'RS384', category: 'RSA', type: 'asymmetric', description: 'RSASSA-PKCS1-v1_5 using SHA-384' },
  { value: 'RS512', label: 'RS512', category: 'RSA', type: 'asymmetric', description: 'RSASSA-PKCS1-v1_5 using SHA-512' },

  // Asymmetric (ECDSA)
  { value: 'ES256', label: 'ES256', category: 'ECDSA', type: 'asymmetric', description: 'ECDSA using P-256 and SHA-256' },
  { value: 'ES384', label: 'ES384', category: 'ECDSA', type: 'asymmetric', description: 'ECDSA using P-384 and SHA-384' },
  { value: 'ES512', label: 'ES512', category: 'ECDSA', type: 'asymmetric', description: 'ECDSA using P-521 and SHA-512' },

  // Asymmetric (RSA-PSS)
  { value: 'PS256', label: 'PS256', category: 'RSA-PSS', type: 'asymmetric', description: 'RSASSA-PSS using SHA-256' },
  { value: 'PS384', label: 'PS384', category: 'RSA-PSS', type: 'asymmetric', description: 'RSASSA-PSS using SHA-384' },
  { value: 'PS512', label: 'PS512', category: 'RSA-PSS', type: 'asymmetric', description: 'RSASSA-PSS using SHA-512' },

  // Unsecured / None
  { value: 'none', label: 'none', category: 'None', type: 'none', description: 'Unsecured (No signature)' },
];

// ── Defaults ──────────────────────────────────────────────

export const DEFAULT_HEADER = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2);
export const DEFAULT_PAYLOAD = JSON.stringify(
  { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
  null,
  2,
);

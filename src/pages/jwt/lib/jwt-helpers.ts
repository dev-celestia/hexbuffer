import type { JwtAlgorithm, JwtDecoded, JwtVulnerability } from '../types';

// ── Base64url ─────────────────────────────────────────────

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  else if (pad === 3) base64 += '=';
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    return atob(base64);
  }
}

export function base64UrlEncode(str: string): string {
  const encoded = btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  const encoded = btoa(binary);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Decode ────────────────────────────────────────────────

export function decodeJwt(token: string): JwtDecoded | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return {
      header,
      payload,
      signature: parts[2],
      algorithm: String(header.alg ?? 'unknown'),
      parts: parts as [string, string, string],
    };
  } catch {
    return null;
  }
}

// ── Timestamp formatting ──────────────────────────────────

export function formatTimestamp(value: unknown): string | null {
  if (typeof value !== 'number') return null;
  const epoch = value > 1e12 ? value / 1000 : value;
  const date = new Date(epoch * 1000);
  if (isNaN(date.getTime())) return null;

  const formatted = date.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
  const now = Date.now() / 1000;
  const diffSec = epoch - now;
  const absDiff = Math.abs(diffSec);

  let relative: string;
  if (absDiff < 60) relative = `${Math.round(absDiff)}s`;
  else if (absDiff < 3600) relative = `${Math.round(absDiff / 60)}m`;
  else if (absDiff < 86400) relative = `${Math.round(absDiff / 3600)}h`;
  else relative = `${Math.round(absDiff / 86400)}d`;

  const direction = diffSec < 0 ? `${relative} ago` : `in ${relative}`;
  return `${formatted} (${direction})`;
}

// ── Vulnerabilities ───────────────────────────────────────

export function checkVulnerabilities(decoded: JwtDecoded): JwtVulnerability[] {
  const findings: JwtVulnerability[] = [];
  const alg = decoded.algorithm.toLowerCase();

  if (alg === 'none') {
    findings.push({
      id: 'none-alg',
      severity: 'critical',
      title: "Algorithm set to 'none'",
      description:
        'The token uses the "none" algorithm, which disables signature verification. An attacker can forge arbitrary tokens.',
    });
  }

  const now = Date.now() / 1000;

  if (typeof decoded.payload.exp === 'number') {
    const exp = decoded.payload.exp > 1e12 ? decoded.payload.exp / 1000 : decoded.payload.exp;
    if (exp < now) {
      findings.push({
        id: 'expired',
        severity: 'high',
        title: 'Token has expired',
        description: `The exp claim (${exp}) is in the past. This token should no longer be valid.`,
      });
    }
  } else {
    findings.push({
      id: 'missing-exp',
      severity: 'medium',
      title: 'No expiration claim',
      description: 'The token has no exp claim. Without expiration, tokens never expire unless enforced server-side.',
    });
  }

  if (typeof decoded.payload.nbf === 'number') {
    const nbf = decoded.payload.nbf > 1e12 ? decoded.payload.nbf / 1000 : decoded.payload.nbf;
    if (nbf > now) {
      findings.push({
        id: 'not-yet-valid',
        severity: 'medium',
        title: 'Token not yet valid',
        description: `The nbf claim (${nbf}) is in the future. This token should not be accepted yet.`,
      });
    }
  }

  if (typeof decoded.payload.iat !== 'number') {
    findings.push({
      id: 'missing-iat',
      severity: 'low',
      title: 'No issued-at claim',
      description: 'The token has no iat claim, making it harder to determine when it was issued.',
    });
  }

  if (alg.startsWith('hs')) {
    findings.push({
      id: 'symmetric-alg',
      severity: 'info',
      title: 'Symmetric algorithm',
      description:
        'The token uses a symmetric algorithm (HMAC). Consider asymmetric algorithms (RS256, ES256) for better key management.',
    });
  }

  return findings;
}

// ── Sign ──────────────────────────────────────────────────

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function wrapPkcs1InPkcs8(pkcs1Der: Uint8Array): Uint8Array {
  const rsaOid = new Uint8Array([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
  const version = new Uint8Array([0x02, 0x01, 0x00]);

  const encodeLength = (len: number): number[] => {
    if (len < 128) return [len];
    if (len < 256) return [0x81, len];
    if (len < 65536) return [0x82, (len >> 8) & 0xff, len & 0xff];
    return [0x83, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff];
  };

  const octetHeader = [0x04, ...encodeLength(pkcs1Der.length)];
  const innerLen = version.length + rsaOid.length + octetHeader.length + pkcs1Der.length;
  const seqHeader = [0x30, ...encodeLength(innerLen)];

  const result = new Uint8Array(seqHeader.length + innerLen);
  let offset = 0;
  result.set(seqHeader, offset);
  offset += seqHeader.length;
  result.set(version, offset);
  offset += version.length;
  result.set(rsaOid, offset);
  offset += rsaOid.length;
  result.set(octetHeader, offset);
  offset += octetHeader.length;
  result.set(pkcs1Der, offset);
  return result;
}

export function derToPem(
  der: ArrayBuffer,
  type: 'PRIVATE KEY' | 'PUBLIC KEY' | 'RSA PRIVATE KEY',
): string {
  const binary = Array.from(new Uint8Array(der), (b) => String.fromCharCode(b)).join('');
  const b64 = btoa(binary);
  const formattedB64 = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  return `-----BEGIN ${type}-----\n${formattedB64}\n-----END ${type}-----`;
}

export async function generateKeyPairPem(
  algorithm: JwtAlgorithm,
): Promise<{ privateKeyPem: string; publicKeyPem?: string }> {
  if (algorithm === 'none') {
    return { privateKeyPem: '' };
  }

  if (algorithm.startsWith('HS')) {
    const length = algorithm === 'HS256' ? 32 : algorithm === 'HS384' ? 48 : 64;
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    const secret = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return { privateKeyPem: secret };
  }

  if (algorithm.startsWith('RS')) {
    const hashMap: Record<'RS256' | 'RS384' | 'RS512', string> = {
      RS256: 'SHA-256',
      RS384: 'SHA-384',
      RS512: 'SHA-512',
    };
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: hashMap[algorithm as 'RS256' | 'RS384' | 'RS512'],
      },
      true,
      ['sign', 'verify'],
    );
    const privateDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    return {
      privateKeyPem: derToPem(privateDer, 'PRIVATE KEY'),
      publicKeyPem: derToPem(publicDer, 'PUBLIC KEY'),
    };
  }

  if (algorithm.startsWith('ES')) {
    const curveMap: Record<'ES256' | 'ES384' | 'ES512', string> = {
      ES256: 'P-256',
      ES384: 'P-384',
      ES512: 'P-521',
    };
    const namedCurve = curveMap[algorithm as 'ES256' | 'ES384' | 'ES512'];
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve,
      },
      true,
      ['sign', 'verify'],
    );
    const privateDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    return {
      privateKeyPem: derToPem(privateDer, 'PRIVATE KEY'),
      publicKeyPem: derToPem(publicDer, 'PUBLIC KEY'),
    };
  }

  if (algorithm.startsWith('PS')) {
    const hashMap: Record<'PS256' | 'PS384' | 'PS512', string> = {
      PS256: 'SHA-256',
      PS384: 'SHA-384',
      PS512: 'SHA-512',
    };
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: hashMap[algorithm as 'PS256' | 'PS384' | 'PS512'],
      },
      true,
      ['sign', 'verify'],
    );
    const privateDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const publicDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    return {
      privateKeyPem: derToPem(privateDer, 'PRIVATE KEY'),
      publicKeyPem: derToPem(publicDer, 'PUBLIC KEY'),
    };
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
}

export function pemToDer(pem: string): ArrayBuffer {
  const trimmed = pem.trim();
  if (trimmed.includes('BEGIN RSA PRIVATE KEY')) {
    const b64 = trimmed
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    const pkcs1Der = base64ToUint8Array(b64);
    return wrapPkcs1InPkcs8(pkcs1Der).buffer;
  }

  const b64 = trimmed
    .replace(/-----BEGIN [A-Z0-9 _-]+-----/gi, '')
    .replace(/-----END [A-Z0-9 _-]+-----/gi, '')
    .replace(/\s+/g, '');

  return base64ToUint8Array(b64).buffer;
}

export async function signJwt(
  header: object,
  payload: object,
  secretOrKey: string,
  algorithm: JwtAlgorithm,
): Promise<string> {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  if (algorithm === 'none') {
    return `${data}.`;
  }

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  if (algorithm.startsWith('HS')) {
    const hashMap: Record<'HS256' | 'HS384' | 'HS512', string> = {
      HS256: 'SHA-256',
      HS384: 'SHA-384',
      HS512: 'SHA-512',
    };
    const hash = hashMap[algorithm as 'HS256' | 'HS384' | 'HS512'];
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secretOrKey),
        { name: 'HMAC', hash },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
      return `${data}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
    } catch (err) {
      throw new Error(
        `Failed to sign with HMAC (${algorithm}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (algorithm.startsWith('RS')) {
    const hashMap: Record<'RS256' | 'RS384' | 'RS512', string> = {
      RS256: 'SHA-256',
      RS384: 'SHA-384',
      RS512: 'SHA-512',
    };
    const hash = hashMap[algorithm as 'RS256' | 'RS384' | 'RS512'];
    let der: ArrayBuffer;
    try {
      der = pemToDer(secretOrKey);
    } catch {
      throw new Error(
        `Invalid PEM format for ${algorithm}. Expected a valid base64-encoded PEM string (e.g. '-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----').`,
      );
    }

    try {
      const key = await crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'RSASSA-PKCS1-v1_5', hash },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, dataBytes);
      return `${data}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
    } catch {
      throw new Error(
        `Invalid RSA Private Key for ${algorithm}. Ensure you provide a valid PKCS#8 or PKCS#1 RSA private key in PEM format. Plain text strings (like "${secretOrKey.slice(0, 10)}...") are only valid for HMAC algorithms (HS256, HS384, HS512).`,
      );
    }
  }

  if (algorithm.startsWith('ES')) {
    const curveMap: Record<'ES256' | 'ES384' | 'ES512', { namedCurve: string; hash: string }> = {
      ES256: { namedCurve: 'P-256', hash: 'SHA-256' },
      ES384: { namedCurve: 'P-384', hash: 'SHA-384' },
      ES512: { namedCurve: 'P-521', hash: 'SHA-512' },
    };
    const config = curveMap[algorithm as 'ES256' | 'ES384' | 'ES512'];
    let der: ArrayBuffer;
    try {
      der = pemToDer(secretOrKey);
    } catch {
      throw new Error(
        `Invalid PEM format for ${algorithm}. Expected a valid base64-encoded PEM string.`,
      );
    }

    try {
      const key = await crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'ECDSA', namedCurve: config.namedCurve },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: { name: config.hash } },
        key,
        dataBytes,
      );
      return `${data}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
    } catch {
      throw new Error(
        `Invalid ECDSA Private Key for ${algorithm}. Ensure you provide a valid PKCS#8 EC private key matching curve ${config.namedCurve} in PEM format.`,
      );
    }
  }

  if (algorithm.startsWith('PS')) {
    const pssMap: Record<'PS256' | 'PS384' | 'PS512', { hash: string; saltLength: number }> = {
      PS256: { hash: 'SHA-256', saltLength: 32 },
      PS384: { hash: 'SHA-384', saltLength: 48 },
      PS512: { hash: 'SHA-512', saltLength: 64 },
    };
    const config = pssMap[algorithm as 'PS256' | 'PS384' | 'PS512'];
    let der: ArrayBuffer;
    try {
      der = pemToDer(secretOrKey);
    } catch {
      throw new Error(
        `Invalid PEM format for ${algorithm}. Expected a valid base64-encoded PEM string.`,
      );
    }

    try {
      const key = await crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'RSA-PSS', hash: config.hash },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign(
        { name: 'RSA-PSS', saltLength: config.saltLength },
        key,
        dataBytes,
      );
      return `${data}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
    } catch {
      throw new Error(
        `Invalid RSA-PSS Private Key for ${algorithm}. Ensure you provide a valid PKCS#8 or PKCS#1 RSA private key in PEM format.`,
      );
    }
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
}

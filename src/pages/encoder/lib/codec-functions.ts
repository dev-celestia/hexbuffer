import CryptoJS from 'crypto-js';
import type { CodecType, CodecResult } from '../types';

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_UNESCAPE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ESCAPE_MAP).map(([char, entity]) => [entity, char]),
);

export const ENCODER_FUNCTIONS: Record<CodecType, (input: string) => string> = {
  url: (input) => encodeURIComponent(input),
  base64: (input) => CryptoJS.enc.Utf8.parse(input).toString(CryptoJS.enc.Base64),
  base64url: (input) =>
    CryptoJS.enc.Utf8.parse(input)
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''),
  hex: (input) => CryptoJS.enc.Utf8.parse(input).toString(CryptoJS.enc.Hex),
  binary: (input) => {
    const bytes = CryptoJS.enc.Utf8.parse(input);
    let bits = '';
    for (let i = 0; i < bytes.sigBytes; i++) {
      bits += ((bytes.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff).toString(2).padStart(8, '0');
    }
    return bits;
  },
  html: (input) => input.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]),
};

export const DECODER_FUNCTIONS: Record<CodecType, (input: string) => CodecResult> = {
  url: (input) => {
    try {
      return { output: decodeURIComponent(input), error: null };
    } catch {
      return { output: '', error: 'Invalid URL-encoded string' };
    }
  },
  base64: (input) => {
    try {
      const output = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
      return output
        ? { output, error: null }
        : { output: '', error: 'Invalid Base64 string' };
    } catch {
      return { output: '', error: 'Invalid Base64 string' };
    }
  },
  base64url: (input) => {
    const normalized = input
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(input.length / 4) * 4, '=');
    try {
      const output = CryptoJS.enc.Base64.parse(normalized).toString(CryptoJS.enc.Utf8);
      return output
        ? { output, error: null }
        : { output: '', error: 'Invalid Base64URL string' };
    } catch {
      return { output: '', error: 'Invalid Base64URL string' };
    }
  },
  hex: (input) => {
    try {
      const hex = input.replace(/\s/g, '');
      if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
        return { output: '', error: 'Invalid hex string' };
      }
      return { output: CryptoJS.enc.Hex.parse(hex).toString(CryptoJS.enc.Utf8), error: null };
    } catch {
      return { output: '', error: 'Invalid hex string' };
    }
  },
  binary: (input) => {
    const bits = input.replace(/\s/g, '');
    if (!/^[01]*$/.test(bits) || bits.length % 8 !== 0) {
      return { output: '', error: 'Invalid binary string' };
    }
    let hex = '';
    for (let i = 0; i < bits.length; i += 8) {
      hex += parseInt(bits.slice(i, i + 8), 2).toString(16).padStart(2, '0');
    }
    try {
      return { output: CryptoJS.enc.Hex.parse(hex).toString(CryptoJS.enc.Utf8), error: null };
    } catch {
      return { output: '', error: 'Invalid binary string' };
    }
  },
  html: (input) => {
    const output = input.replace(
      /&(?:#x([0-9a-fA-F]+)|#(\d+)|[a-zA-Z]+);/g,
      (entity, hexCode, decCode) => {
        if (hexCode) {
          return String.fromCodePoint(parseInt(hexCode, 16));
        }
        if (decCode) {
          return String.fromCodePoint(parseInt(decCode, 10));
        }
        return HTML_UNESCAPE_MAP[entity] ?? entity;
      },
    );
    return { output, error: null };
  },
};

export function convert(input: string, activeType: CodecType, mode: 'encode' | 'decode'): CodecResult {
  if (!input.trim()) {
    return { output: '', error: null };
  }

  if (mode === 'encode') {
    try {
      return { output: ENCODER_FUNCTIONS[activeType](input), error: null };
    } catch {
      return { output: '', error: 'Encoding failed' };
    }
  }

  return DECODER_FUNCTIONS[activeType](input);
}

import type { CodecType, CodecMode } from './types';

export interface CodecDefinition {
  id: CodecType;
  label: string;
  hint: string;
}

export const CODECS: CodecDefinition[] = [
  { id: 'url', label: 'URL', hint: 'Percent-encoding' },
  { id: 'base64', label: 'Base64', hint: 'Standard alphabet' },
  { id: 'base64url', label: 'Base64URL', hint: 'URL-safe alphabet' },
  { id: 'hex', label: 'Hex', hint: 'Hexadecimal bytes' },
  { id: 'binary', label: 'Binary', hint: '8-bit groups' },
  { id: 'html', label: 'HTML', hint: 'HTML entities' },
];

export const CODEC_LABELS: Record<CodecType, string> = Object.fromEntries(
  CODECS.map((codec) => [codec.id, codec.label]),
) as Record<CodecType, string>;

export const MODE_LABELS: Record<CodecMode, { source: string; target: string; action: string }> = {
  encode: {
    source: 'Plain text',
    target: 'Encoded',
    action: 'Encode',
  },
  decode: {
    source: 'Encoded',
    target: 'Plain text',
    action: 'Decode',
  },
};

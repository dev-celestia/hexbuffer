export type CodecType = 'url' | 'base64' | 'base64url' | 'hex' | 'binary' | 'html';

export type CodecMode = 'encode' | 'decode';

export interface CodecResult {
  output: string;
  error: string | null;
}

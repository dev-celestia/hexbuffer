const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  json: 'application/json',
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  ts: 'application/typescript',
};

/** Best-effort Content-Type lookup for an upload file name. */
export function getMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  return (ext && MIME_BY_EXTENSION[ext]) || 'application/octet-stream';
}

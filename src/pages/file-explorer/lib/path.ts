/**
 * Splits path-like strings into segments and strips anything that could
 * escape the intended root directory: empty segments, "." and "..", across
 * both POSIX and Windows separators. Use wherever remote-provided names
 * (S3 object keys, bucket names, manifest hrefs) become local file paths.
 */
export function safePathSegments(...parts: (string | undefined)[]): string[] {
  const segments: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    for (const segment of part.split(/[/\\]+/)) {
      if (!segment || segment === '.' || segment === '..') continue;
      segments.push(segment);
    }
  }
  return segments;
}

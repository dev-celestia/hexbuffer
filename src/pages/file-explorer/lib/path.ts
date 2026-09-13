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

/**
 * Strict single-segment check for user-typed file/folder names. Unlike
 * safePathSegments (which strips), callers here reject so a name that
 * would escape or nest outside the workspace is never silently rewritten.
 */
export function isSafeFileName(name: string): boolean {
  return (
    name.length > 0 &&
    name !== '.' &&
    name !== '..' &&
    !/[/\\]/.test(name)
  );
}

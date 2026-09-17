export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function getMemoryTypeBadgeVariant(
  type: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (type.toLowerCase()) {
    case 'credential':
      return 'destructive';
    case 'finding':
      return 'default';
    case 'procedure':
    case 'decision':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function getImportanceLabel(importance: number): string {
  if (importance >= 0.8) return 'High';
  if (importance >= 0.4) return 'Medium';
  return 'Low';
}

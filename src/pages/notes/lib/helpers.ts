import { toast } from 'sonner';

export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'Unknown';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function extractSnippet(content: string, maxLength: number = 140): string {
  if (!content || !content.trim()) return 'No content yet...';
  
  // Remove markdown headings, blockquotes, code block fences
  const cleaned = content
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trimEnd()}…`;
}

export function getWordAndCharCount(content?: string): { words: number; chars: number; lines: number } {
  if (!content) return { words: 0, chars: 0, lines: 0 };
  const chars = content.length;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const lines = content.split('\n').length;
  return { words, chars, lines };
}

export function downloadAsMarkdown(name: string, content: string) {
  try {
    const filename = `${(name || 'note').replace(/[/\\?%*:|"<>]/g, '_')}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Note exported', { description: filename });
  } catch (err) {
    console.error('Failed to export note:', err);
    toast.error('Failed to export note');
  }
}

export async function copyNoteToClipboard(content: string, title?: string) {
  try {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard', { description: title ? `"${title}" content copied` : undefined });
  } catch (err) {
    console.error('Failed to copy note:', err);
    toast.error('Failed to copy to clipboard');
  }
}

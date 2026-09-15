export interface ParsedOptionItem {
  id: string;
  label: string; // e.g. "A", "B", "C"
  originalNumber: string; // e.g. "1", "2"
  title: string;
  description?: string;
  prompt: string;
}

/**
 * Parses structured question options from assistant message markdown.
 * Detects numbered lists (1. **Title** ..., 2. **Title** ...) or lettered lists (A. ..., B. ...).
 * Returns an array of options if at least 2 sequential choices are found.
 */
export function parseMessageOptions(text: string): ParsedOptionItem[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const items: { num: string; content: string }[] = [];

  const numberedRegex = /^\s*(?:(\d+)[\.\)]|([A-Za-z])[\.\)])\s+(.*)$/;

  let currentItem: { num: string; content: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(numberedRegex);
    if (match) {
      if (currentItem) {
        items.push(currentItem);
      }
      currentItem = {
        num: match[1] || match[2].toUpperCase(),
        content: match[3],
      };
    } else if (currentItem) {
      // Check if this line marks the end of the question block
      const isBreakSection =
        trimmed.startsWith('#') ||
        trimmed.startsWith('---') ||
        trimmed.toLowerCase().startsWith('alternatively') ||
        trimmed.toLowerCase().startsWith('how would you like to proceed') ||
        trimmed.toLowerCase().startsWith('let me know');

      if (isBreakSection) {
        items.push(currentItem);
        currentItem = null;
      } else {
        currentItem.content += ' ' + trimmed;
      }
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  // Need at least 2 options and at most 6 options to be considered an actionable choice card
  if (items.length < 2 || items.length > 6) {
    return [];
  }

  // Verify that options are sequential (1, 2, 3... or A, B, C...)
  const isSequentialNumbers = items.every((item, idx) => item.num === String(idx + 1));
  const isSequentialLetters = items.every(
    (item, idx) => item.num === String.fromCharCode(65 + idx),
  );

  if (!isSequentialNumbers && !isSequentialLetters) {
    return [];
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return items.map((item, idx) => {
    let title = '';
    let description = '';
    const rawContent = item.content.trim();

    // Check if starts with bold text: **Title** or __Title__
    const boldMatch = rawContent.match(/^(?:\*\*([^*]+)\*\*|__([^_]+)__)(.*)$/);
    if (boldMatch) {
      title = (boldMatch[1] || boldMatch[2]).trim();
      description = (boldMatch[3] || '').trim().replace(/^[\s:—–-]+/, '');
    } else {
      // Look for colon, question mark, or dash separator
      const sepMatch = rawContent.match(/^([^:?—–-]+[:?—–-])\s*(.*)$/);
      if (sepMatch && sepMatch[1].length < 90) {
        title = sepMatch[1].trim();
        description = sepMatch[2].trim();
      } else {
        title = rawContent.length > 80 ? rawContent.slice(0, 77) + '...' : rawContent;
        description = rawContent.length > 80 ? rawContent : '';
      }
    }

    const cleanTitle = title.replace(/\*+/g, '').replace(/[:?]+$/, '').trim();
    const cleanDesc = description.replace(/\*+/g, '').trim();

    // Generate natural user response prompt when clicked
    let promptText = '';
    const lowerTitle = cleanTitle.toLowerCase();
    if (lowerTitle.startsWith('do you want me to ')) {
      const action = cleanTitle.slice('do you want me to '.length);
      promptText = `Yes, please ${action}${cleanDesc ? ` (${cleanDesc})` : ''}.`;
    } else if (lowerTitle.startsWith('is ')) {
      promptText = `${cleanTitle}${cleanDesc ? ` (${cleanDesc})` : ''}.`;
    } else {
      promptText = cleanDesc ? `${cleanTitle}: ${cleanDesc}` : cleanTitle;
    }

    return {
      id: `opt-${idx}`,
      label: optionLabels[idx] || String(idx + 1),
      originalNumber: item.num,
      title: cleanTitle,
      description: cleanDesc,
      prompt: promptText,
    };
  });
}

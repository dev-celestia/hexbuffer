export interface ParsedOptionItem {
  id: string;
  label: string; // e.g. "A", "B", "C"
  originalNumber: string; // e.g. "1", "2"
  title: string;
  description?: string;
  prompt: string;
}

/**
 * Extracts an option marker from a single line and returns the normalized option number
 * plus the remaining content.
 *
 * Accepts the numbered and lettered lists this parser originally expected (1., 2), A., B))
 * as well as the `Option A — …` headings the model actually writes instead — with or
 * without a bullet prefix, and with or without bold around the marker. The `Option` form
 * is re-emphasized so the title/description split below can separate the title from the
 * description lines that follow it.
 */
function matchOptionLine(trimmed: string): { num: string; content: string } | null {
  // Strip a bullet prefix so "- **Option A** — …" parses like the bare form.
  const line = trimmed.replace(/^[-*+]\s+/, '');

  const optionMatch = line.match(
    /^(?:\*\*|__)?Option\s+([A-Za-z\d]{1,2})(?:\*\*|__)?\s*[:.)—–-]?\s*(.*)$/,
  );
  if (optionMatch) {
    const body = optionMatch[2].replace(/[*_]+$/, '').trim();
    if (!body) return null;
    return {
      num: optionMatch[1].toUpperCase(),
      content: body.startsWith('**') || body.startsWith('__') ? body : `**${body}**`,
    };
  }

  // Letters are capped at F: the card renders at most six options, so a later letter
  // cannot be a real choice and is far more likely to be prose ("G. Smith noted").
  const listMatch = line.match(/^(\d{1,2}|[A-Fa-f])[.)]\s+(.*)$/);
  if (!listMatch) return null;

  return { num: listMatch[1].toUpperCase(), content: listMatch[2] };
}

/**
 * Parses structured question options from assistant message markdown.
 * Detects numbered lists (1. **Title** ...), lettered lists (A. ..., B. ...) and
 * `Option A — ...` headings. Returns an array of options if at least 2 sequential
 * choices are found.
 */
export function parseMessageOptions(text: string): ParsedOptionItem[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const items: { num: string; content: string }[] = [];

  let currentItem: { num: string; content: string } | null = null;
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock && currentItem) {
        items.push(currentItem);
        currentItem = null;
      }
      continue;
    }
    if (inCodeBlock || !trimmed) continue;

    const match = matchOptionLine(trimmed);
    if (match) {
      if (currentItem) {
        items.push(currentItem);
      }
      currentItem = match;
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

  // Reject false positives: network scan outputs (e.g. 80/tcp open) or command lines
  const isCommandOrNetworkOutput = items.some((item) => {
    const lower = item.content.toLowerCase().trim();
    return (
      lower.includes('/tcp') ||
      lower.includes('/udp') ||
      lower.startsWith('`npm ') ||
      lower.startsWith('`pnpm ') ||
      lower.startsWith('`cargo ') ||
      lower.startsWith('`curl ') ||
      lower.startsWith('npm ') ||
      lower.startsWith('pnpm ') ||
      lower.startsWith('cargo ') ||
      lower.startsWith('curl ') ||
      lower.startsWith('git ') ||
      lower.startsWith('sudo ')
    );
  });

  if (isCommandOrNetworkOutput) {
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

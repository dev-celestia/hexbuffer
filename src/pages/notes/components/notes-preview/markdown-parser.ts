import type { ParsedBlock } from './types';

/**
 * Parses raw markdown into identifiable blocks with line ranges
 */
export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const lines = markdown.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Code Block
    if (line.trim().startsWith('```')) {
      const startLine = i;
      const lang = line.trim().replace(/^```/, '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const endLine = Math.min(i, lines.length - 1);
      const rawText = lines.slice(startLine, endLine + 1).join('\n');
      const codeText = codeLines.join('\n');

      blocks.push({
        id: `block-${startLine}`,
        startLine,
        endLine,
        type: 'code',
        rawText,
        data: { code: codeText, lang: lang || 'text' },
      });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({
        id: `block-${i}`,
        startLine: i,
        endLine: i,
        type: 'h1',
        rawText: line,
        data: { text: line.slice(2) },
      });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({
        id: `block-${i}`,
        startLine: i,
        endLine: i,
        type: 'h2',
        rawText: line,
        data: { text: line.slice(3) },
      });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({
        id: `block-${i}`,
        startLine: i,
        endLine: i,
        type: 'h3',
        rawText: line,
        data: { text: line.slice(4) },
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const startLine = i;
      const quoteLines: string[] = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++;
        quoteLines.push(lines[i].slice(2));
      }
      blocks.push({
        id: `block-${startLine}`,
        startLine,
        endLine: i,
        type: 'quote',
        rawText: lines.slice(startLine, i + 1).join('\n'),
        data: { text: quoteLines.join('\n') },
      });
      i++;
      continue;
    }

    // Standalone Image: ![alt](url)
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({
        id: `block-${i}`,
        startLine: i,
        endLine: i,
        type: 'image',
        rawText: line,
        data: { alt: imgMatch[1], src: imgMatch[2] },
      });
      i++;
      continue;
    }

    // Task list items
    if (/^-\s*\[([ xX])\]\s+(.*)/.test(line)) {
      const startLine = i;
      const tasks: { lineIndex: number; isChecked: boolean; text: string }[] = [];
      while (i < lines.length && /^-\s*\[([ xX])\]\s+(.*)/.test(lines[i])) {
        const match = lines[i].match(/^-\s*\[([ xX])\]\s+(.*)/);
        if (match) {
          tasks.push({
            lineIndex: i,
            isChecked: match[1].toLowerCase() === 'x',
            text: match[2],
          });
        }
        i++;
      }
      blocks.push({
        id: `block-${startLine}`,
        startLine,
        endLine: i - 1,
        type: 'task',
        rawText: lines.slice(startLine, i).join('\n'),
        data: { tasks },
      });
      continue;
    }

    // Standard Bullet list
    if (/^[\*\-]\s+(.*)/.test(line)) {
      const startLine = i;
      const items: string[] = [];
      while (i < lines.length && /^[\*\-]\s+(.*)/.test(lines[i]) && !/^-\s*\[([ xX])\]/.test(lines[i])) {
        const match = lines[i].match(/^[\*\-]\s+(.*)/);
        if (match) items.push(match[1]);
        i++;
      }
      blocks.push({
        id: `block-${startLine}`,
        startLine,
        endLine: i - 1,
        type: 'ul',
        rawText: lines.slice(startLine, i).join('\n'),
        data: { items },
      });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+(.*)/.test(line)) {
      const startLine = i;
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+(.*)/.test(lines[i])) {
        const match = lines[i].match(/^\d+\.\s+(.*)/);
        if (match) items.push(match[1]);
        i++;
      }
      blocks.push({
        id: `block-${startLine}`,
        startLine,
        endLine: i - 1,
        type: 'ol',
        rawText: lines.slice(startLine, i).join('\n'),
        data: { items },
      });
      continue;
    }

    // Regular Paragraph
    blocks.push({
      id: `block-${i}`,
      startLine: i,
      endLine: i,
      type: 'p',
      rawText: line,
      data: { text: line },
    });
    i++;
  }

  return blocks;
}

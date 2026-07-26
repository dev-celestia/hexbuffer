import type { FileUIPart } from 'ai';

export interface ExtractedFileAttachment {
  filename: string;
  ext: string;
}

/**
 * Extracts and decodes text content from a FileUIPart (supporting .txt, .md, base64 data URLs, and blob URLs).
 */
export async function extractTextFromFilePart(file: FileUIPart): Promise<string> {
  if (!file.url) {
    return '';
  }

  if (file.url.startsWith('data:')) {
    try {
      const commaIndex = file.url.indexOf(',');
      if (commaIndex !== -1) {
        const meta = file.url.substring(0, commaIndex);
        const dataStr = file.url.substring(commaIndex + 1);
        if (meta.includes('base64')) {
          const binary = atob(dataStr);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return new TextDecoder('utf-8').decode(bytes);
        }
        return decodeURIComponent(dataStr);
      }
    } catch (err) {
      console.error('Failed to decode data URL for file:', file.filename, err);
      return '';
    }
  }

  if (file.url.startsWith('blob:')) {
    try {
      const res = await fetch(file.url);
      return await res.text();
    } catch (err) {
      console.error('Failed to fetch blob URL for file:', file.filename, err);
      return '';
    }
  }

  return '';
}

/**
 * Formats an attached text or markdown file into a formatted Markdown string block for the AI prompt.
 */
export async function formatAttachedFileContent(file: FileUIPart): Promise<string> {
  const filename = file.filename || 'uploaded-file.txt';
  const content = await extractTextFromFilePart(file);

  const isMd = filename.toLowerCase().endsWith('.md') || filename.toLowerCase().endsWith('.markdown');
  const lang = isMd ? 'markdown' : 'text';

  return `[Attached File: ${filename}]\n\`\`\`${lang}\n${content}\n\`\`\``;
}

/**
 * Parses file attachments from message parts or embedded [Attached File: ...] headers in message text.
 */
export function parseAttachedFilesFromMessage(
  parts: FileUIPart[],
  text: string,
): ExtractedFileAttachment[] {
  const results: ExtractedFileAttachment[] = [];
  const seen = new Set<string>();

  // 1. Parse file parts
  for (const part of parts) {
    const filename = part.filename || 'Attached File';
    if (!seen.has(filename)) {
      seen.add(filename);
      const ext = filename.split('.').pop()?.toUpperCase() || 'TXT';
      results.push({ filename, ext });
    }
  }

  // 2. Parse text content for [Attached File: <filename>] markers
  const regex = /\[Attached File:\s*([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const filename = match[1].trim();
    if (!seen.has(filename)) {
      seen.add(filename);
      const ext = filename.split('.').pop()?.toUpperCase() || 'TXT';
      results.push({ filename, ext });
    }
  }

  return results;
}

/**
 * Returns user message text stripped of embedded [Attached File: ...] blocks.
 */
export function getUserPromptOnly(text: string): string {
  if (!text.includes('[Attached File:')) {
    return text;
  }

  const cleaned = text.replace(/\[Attached File:\s*[^\]]+\]\s*```[\s\S]*?```/g, '').trim();
  return cleaned;
}

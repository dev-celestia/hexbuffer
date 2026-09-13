export interface BundledWordlist {
  id: string;
  category: string;
  name: string;
  description: string;
  values: string[];
}

const wordlistFiles = import.meta.glob('./bundled-wordlists/**/*', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export function formatWordlistName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function wordlistFromFile([path, content]: [string, string]): BundledWordlist {
  const relativePath = path.replace('./bundled-wordlists/', '');
  const parts = relativePath.split('/');
  const fileName = parts.at(-1) ?? relativePath;
  const category = parts.length > 1 ? parts[0] : 'General';
  const values = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    id: relativePath,
    category,
    name: formatWordlistName(fileName),
    description: `${relativePath} wordlist bundled with the app.`,
    values,
  };
}

export const BUNDLED_WORDLISTS: BundledWordlist[] = Object.entries(wordlistFiles)
  .map(wordlistFromFile)
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

export const BUNDLED_WORDLIST_CATEGORIES = Array.from(
  new Set(BUNDLED_WORDLISTS.map((wordlist) => wordlist.category))
);

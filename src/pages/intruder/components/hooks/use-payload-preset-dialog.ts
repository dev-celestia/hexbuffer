import * as React from 'react';
import { documentDir, join } from '@tauri-apps/api/path';
import { exists, readDir, readTextFile, stat } from '@tauri-apps/plugin-fs';

import {
  BUNDLED_WORDLISTS,
  BUNDLED_WORDLIST_CATEGORIES,
  formatWordlistName,
} from '@/pages/file-explorer/data/bundled-wordlists';
import { WORDLISTS_DIR_NAME } from '@/pages/file-explorer/constants';
import { LOCAL_STORAGE_DIR_NAME } from '@/pages/file-explorer/hooks/use-local-storage';
import { formatBytes } from '@/pages/file-explorer/lib/format';

export const PAYLOAD_PREVIEW_LIMIT = 500;

const DOWNLOADED_CATEGORY = 'Downloaded';

/**
 * A selectable preset in the payload preset dialog. Bundled entries come from
 * the shared file-explorer wordlist catalog (inlined at build time); file
 * entries point at wordlists downloaded to the local Wordlists Hub directory
 * and are read at runtime.
 */
export interface PayloadPresetEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: 'bundled' | 'file';
  values: string[];
  filePath?: string;
  fileSize?: number;
  metaLabel: string;
}

const BUNDLED_PRESET_ENTRIES: PayloadPresetEntry[] = BUNDLED_WORDLISTS.map((wordlist) => ({
  id: wordlist.id,
  name: wordlist.name,
  description: wordlist.description,
  category: wordlist.category,
  kind: 'bundled',
  values: wordlist.values,
  metaLabel: `${wordlist.values.length.toLocaleString()} payloads`,
}));

async function collectDownloadedWordlists(
  baseDir: string,
  dir: string
): Promise<PayloadPresetEntry[]> {
  const entries = await readDir(dir);
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = await join(dir, entry.name);

      if (entry.isDirectory) {
        return collectDownloadedWordlists(baseDir, entryPath);
      }

      if (!entry.name || !entry.name.toLowerCase().endsWith('.txt')) {
        return null;
      }

      const segments = entryPath
        .slice(baseDir.length)
        .split(/[/\\]/)
        .filter(Boolean);
      if (segments.length === 0) {
        return null;
      }

      try {
        const fileStat = await stat(entryPath);
        return {
          id: `downloaded:${segments.join('/')}`,
          name: formatWordlistName(entry.name),
          description: `${segments.join('/')} wordlist downloaded from the Wordlists Hub.`,
          category: DOWNLOADED_CATEGORY,
          kind: 'file' as const,
          values: [],
          filePath: entryPath,
          fileSize: fileStat.size,
          metaLabel: formatBytes(fileStat.size),
        };
      } catch {
        return null;
      }
    })
  );

  return nested
    .flat()
    .filter((entry): entry is PayloadPresetEntry => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface UsePayloadPresetDialogProps {
  open: boolean;
  onUsePayload: (payload: PayloadPresetEntry) => void;
  onOpenChange: (open: boolean) => void;
}

export function usePayloadPresetDialog({
  open,
  onUsePayload,
  onOpenChange,
}: UsePayloadPresetDialogProps) {
  const [selectedCategory, setSelectedCategory] = React.useState(
    BUNDLED_WORDLIST_CATEGORIES[0] ?? ''
  );
  const [selectedPayloadId, setSelectedPayloadId] = React.useState(
    BUNDLED_PRESET_ENTRIES[0]?.id ?? ''
  );
  const [search, setSearch] = React.useState('');
  const [downloadedEntries, setDownloadedEntries] = React.useState<PayloadPresetEntry[]>([]);
  const [filePreview, setFilePreview] = React.useState<{
    id: string;
    values: string[];
    totalLines: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // Enumerate wordlists downloaded via the Wordlists Hub while the dialog is open.
  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function scan() {
      try {
        const docDir = await documentDir();
        const base = await join(docDir, LOCAL_STORAGE_DIR_NAME, WORDLISTS_DIR_NAME);
        if (!(await exists(base))) {
          return;
        }
        const found = await collectDownloadedWordlists(base, base);
        if (!cancelled) {
          setDownloadedEntries(found);
        }
      } catch (err) {
        console.error('Failed to scan downloaded wordlists:', err);
      }
    }

    scan();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const allEntries = React.useMemo(
    () => [...BUNDLED_PRESET_ENTRIES, ...downloadedEntries],
    [downloadedEntries]
  );

  const categories = React.useMemo(() => {
    return downloadedEntries.length > 0
      ? [...BUNDLED_WORDLIST_CATEGORIES, DOWNLOADED_CATEGORY]
      : [...BUNDLED_WORDLIST_CATEGORIES];
  }, [downloadedEntries]);

  const visiblePayloads = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return allEntries.filter((payload) => {
      const matchesCategory = payload.category === selectedCategory;
      if (!query) {
        return matchesCategory;
      }

      return (
        matchesCategory &&
        `${payload.name} ${payload.description}`.toLowerCase().includes(query)
      );
    });
  }, [allEntries, search, selectedCategory]);

  const selectedPayload =
    allEntries.find((payload) => payload.id === selectedPayloadId) ??
    visiblePayloads[0] ??
    BUNDLED_PRESET_ENTRIES[0];

  // Downloaded lists are read from disk lazily when selected.
  React.useEffect(() => {
    if (!selectedPayload || selectedPayload.kind !== 'file' || !selectedPayload.filePath) {
      setFilePreview(null);
      return;
    }

    let cancelled = false;
    const entryId = selectedPayload.id;
    const filePath = selectedPayload.filePath;

    setPreviewLoading(true);
    setFilePreview(null);

    readTextFile(filePath)
      .then((text) => {
        if (cancelled) return;
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        setFilePreview({
          id: entryId,
          values: lines.slice(0, PAYLOAD_PREVIEW_LIMIT),
          totalLines: lines.length,
        });
      })
      .catch((err) => {
        console.error('Failed to read downloaded wordlist:', err);
        if (!cancelled) {
          setFilePreview({ id: entryId, values: [], totalLines: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPayload]);

  const previewValues = React.useMemo(() => {
    if (!selectedPayload) {
      return [];
    }
    if (selectedPayload.kind === 'bundled') {
      return selectedPayload.values.slice(0, PAYLOAD_PREVIEW_LIMIT);
    }
    return filePreview && filePreview.id === selectedPayload.id ? filePreview.values : [];
  }, [selectedPayload, filePreview]);

  const hiddenPreviewCount = React.useMemo(() => {
    if (!selectedPayload) {
      return 0;
    }
    if (selectedPayload.kind === 'bundled') {
      return Math.max(0, selectedPayload.values.length - previewValues.length);
    }
    if (filePreview && filePreview.id === selectedPayload.id) {
      return Math.max(0, filePreview.totalLines - previewValues.length);
    }
    return 0;
  }, [selectedPayload, previewValues, filePreview]);

  const selectedMetaLabel = React.useMemo(() => {
    if (!selectedPayload) {
      return '';
    }
    if (selectedPayload.kind === 'bundled') {
      return `${selectedPayload.values.length.toLocaleString()} items`;
    }
    if (filePreview && filePreview.id === selectedPayload.id) {
      return filePreview.totalLines > 0
        ? `${filePreview.totalLines.toLocaleString()} items`
        : 'Empty file';
    }
    return formatBytes(selectedPayload.fileSize);
  }, [selectedPayload, filePreview]);

  React.useEffect(() => {
    if (
      visiblePayloads.length > 0 &&
      !visiblePayloads.some((payload) => payload.id === selectedPayloadId)
    ) {
      setSelectedPayloadId(visiblePayloads[0].id);
    }
  }, [selectedPayloadId, visiblePayloads]);

  const handleCategorySelect = React.useCallback(
    (category: string) => {
      setSelectedCategory(category);
      setSearch('');
      const firstMatching = allEntries.find((payload) => payload.category === category);
      if (firstMatching) {
        setSelectedPayloadId(firstMatching.id);
      }
    },
    [allEntries]
  );

  const handleUsePayload = React.useCallback(() => {
    if (!selectedPayload) {
      return;
    }

    onUsePayload(selectedPayload);
    onOpenChange(false);
  }, [selectedPayload, onUsePayload, onOpenChange]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return {
    categories,
    selectedCategory,
    selectedPayloadId,
    search,
    setSearch,
    visiblePayloads,
    selectedPayload,
    previewValues,
    hiddenPreviewCount,
    previewLoading,
    selectedMetaLabel,
    handleCategorySelect,
    setSelectedPayloadId,
    handleUsePayload,
    handleClose,
  };
}

export const useInvokerPayloadPresetDialog = usePayloadPresetDialog;

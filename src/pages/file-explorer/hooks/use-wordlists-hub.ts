import * as React from 'react';
import { documentDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, remove, stat, writeTextFile } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { toast } from 'sonner';

import {
  LOCAL_STORAGE_DIR_NAME,
} from './use-local-storage';
import {
  WORDLISTS_DIR_NAME,
  WORDLISTS_MANIFEST_URL,
  WORDLISTS_RAW_BASE_URL,
} from '../constants';
import type {
  WordlistCategoryTag,
  WordlistItemWithStatus,
  WordlistManifestItem,
} from '../types';

const CACHE_KEY = 'hexbuffer_wordlists_manifest_cache';

export function useWordlistsHub() {
  const [wordlistsDir, setWordlistsDir] = React.useState<string>('');
  const [items, setItems] = React.useState<WordlistItemWithStatus[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [selectedTag, setSelectedTag] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedItem, setSelectedItem] = React.useState<WordlistItemWithStatus | null>(null);
  const [previewContent, setPreviewContent] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);
  const [bundleDownloading, setBundleDownloading] = React.useState<boolean>(false);
  const [bundleProgress, setBundleProgress] = React.useState<{ current: number; total: number } | null>(null);

  // Initialize storage directory
  React.useEffect(() => {
    async function initDir() {
      try {
        const docDir = await documentDir();
        const base = await join(docDir, LOCAL_STORAGE_DIR_NAME, WORDLISTS_DIR_NAME);
        const dirExists = await exists(base);
        if (!dirExists) {
          await mkdir(base, { recursive: true });
        }
        setWordlistsDir(base);
      } catch (err) {
        console.error('Failed to init wordlists directory:', err);
      }
    }
    initDir().catch(console.error);
  }, []);

  // Check local existence of files
  const syncLocalStatuses = React.useCallback(
    async (manifestList: WordlistManifestItem[], baseDir: string): Promise<WordlistItemWithStatus[]> => {
      if (!baseDir) {
        return manifestList.map((item) => ({
          ...item,
          id: item.href,
          status: 'idle',
        }));
      }

      return Promise.all(
        manifestList.map(async (item) => {
          try {
            // href like "wordlists/passwords/000webhost.txt" -> normalize relative path
            const relativePath = item.href.replace(/^wordlists[/\\]/, '');
            const localPath = await join(baseDir, relativePath);
            const fileExists = await exists(localPath);

            if (fileExists) {
              const fileStat = await stat(localPath);
              return {
                ...item,
                id: item.href,
                status: 'installed',
                localPath,
                fileSize: fileStat.size,
              };
            }
          } catch {
            // Ignore stat/exists errors
          }

          return {
            ...item,
            id: item.href,
            status: 'idle',
          };
        })
      );
    },
    []
  );

  // Fetch or load manifest
  const fetchManifest = React.useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        let manifest: WordlistManifestItem[] | null = null;

        if (!force) {
          try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              manifest = JSON.parse(cached) as WordlistManifestItem[];
            }
          } catch {
            // Ignore parse errors
          }
        }

        if (!manifest || force) {
          const res = await fetch(WORDLISTS_MANIFEST_URL);
          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
          }
          manifest = (await res.json()) as WordlistManifestItem[];
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(manifest));
          } catch (e) {
            console.warn('Failed to cache manifest in localStorage:', e);
          }
        }

        if (wordlistsDir) {
          const withStatus = await syncLocalStatuses(manifest, wordlistsDir);
          setItems(withStatus);
        } else {
          setItems(
            manifest.map((m) => ({
              ...m,
              id: m.href,
              status: 'idle',
            }))
          );
        }
      } catch (err) {
        toast.error(`Failed to load wordlists: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    },
    [wordlistsDir, syncLocalStatuses]
  );

  // Initial load when directory is ready
  React.useEffect(() => {
    if (wordlistsDir) {
      fetchManifest(false).catch(console.error);
    }
  }, [wordlistsDir, fetchManifest]);

  // Extract all unique tags with count stats
  const tags = React.useMemo<WordlistCategoryTag[]>(() => {
    const map = new Map<string, { count: number; installedCount: number }>();

    for (const item of items) {
      for (const tag of item.tags) {
        const current = map.get(tag) || { count: 0, installedCount: 0 };
        current.count += 1;
        if (item.status === 'installed') {
          current.installedCount += 1;
        }
        map.set(tag, current);
      }
    }

    const result: WordlistCategoryTag[] = Array.from(map.entries()).map(([name, stat]) => ({
      name,
      count: stat.count,
      installedCount: stat.installedCount,
    }));

    result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return result;
  }, [items]);

  // Filtered items by tag and search query
  const filteredItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);
      if (!matchesTag) return false;

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, selectedTag, searchQuery]);

  // Download single wordlist
  const downloadWordlist = React.useCallback(
    async (item: WordlistItemWithStatus) => {
      if (!wordlistsDir) {
        toast.error('Local storage directory is not ready');
        return;
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'downloading', error: undefined } : i))
      );

      try {
        const downloadUrl = `${WORDLISTS_RAW_BASE_URL}${item.href}`;
        const res = await fetch(downloadUrl);
        if (!res.ok) {
          throw new Error(`Failed to download (HTTP ${res.status})`);
        }
        const text = await res.text();

        const relativePath = item.href.replace(/^wordlists[/\\]/, '');
        const targetPath = await join(wordlistsDir, relativePath);

        // Ensure parent directories exist
        const parts = relativePath.split(/[/\\]/);
        if (parts.length > 1) {
          const parentFolderRelative = parts.slice(0, -1).join('/');
          const parentFolder = await join(wordlistsDir, parentFolderRelative);
          const parentExists = await exists(parentFolder);
          if (!parentExists) {
            await mkdir(parentFolder, { recursive: true });
          }
        }

        await writeTextFile(targetPath, text);
        const fileStat = await stat(targetPath);

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'installed',
                  localPath: targetPath,
                  fileSize: fileStat.size,
                }
              : i
          )
        );

        toast.success(`Downloaded "${item.name}"`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: message } : i))
        );
        toast.error(`Download failed for ${item.name}: ${message}`);
      }
    },
    [wordlistsDir]
  );

  // Download all wordlists under active tag bundle
  const downloadBundle = React.useCallback(
    async (tag: string) => {
      if (!wordlistsDir) return;
      const targetItems = items.filter(
        (i) => (tag === 'all' || i.tags.includes(tag)) && i.status !== 'installed'
      );

      if (targetItems.length === 0) {
        toast.info('All wordlists in this category are already downloaded.');
        return;
      }

      setBundleDownloading(true);
      setBundleProgress({ current: 0, total: targetItems.length });

      let completed = 0;
      const CONCURRENCY = 3;

      for (let i = 0; i < targetItems.length; i += CONCURRENCY) {
        const chunk = targetItems.slice(i, i + CONCURRENCY);
        await Promise.all(
          chunk.map(async (item) => {
            try {
              await downloadWordlist(item);
            } catch {
              // Handled in downloadWordlist
            } finally {
              completed += 1;
              setBundleProgress({ current: completed, total: targetItems.length });
            }
          })
        );
      }

      setBundleDownloading(false);
      setBundleProgress(null);
      toast.success(`Finished bundle download for "${tag}" (${completed} lists)`);
    },
    [items, wordlistsDir, downloadWordlist]
  );

  // Delete local wordlist file
  const deleteWordlist = React.useCallback(
    async (item: WordlistItemWithStatus) => {
      if (!item.localPath) return;
      try {
        const fileExists = await exists(item.localPath);
        if (fileExists) {
          await remove(item.localPath);
        }
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'idle',
                  localPath: undefined,
                  fileSize: undefined,
                }
              : i
          )
        );
        if (selectedItem?.id === item.id) {
          setSelectedItem((prev) =>
            prev ? { ...prev, status: 'idle', localPath: undefined, fileSize: undefined } : null
          );
        }
        toast.success(`Removed "${item.name}" from local storage`);
      } catch (err) {
        toast.error(`Failed to delete file: ${err}`);
      }
    },
    [selectedItem]
  );

  // Load preview lines for an item
  const loadPreview = React.useCallback(
    async (item: WordlistItemWithStatus) => {
      setSelectedItem(item);
      setPreviewLoading(true);
      setPreviewContent(null);

      try {
        if (item.status === 'installed' && item.localPath) {
          const raw = await readTextFile(item.localPath);
          const previewLines = raw.split(/\r?\n/).slice(0, 100).join('\n');
          setPreviewContent(previewLines);
        } else {
          // Fetch raw from remote
          const res = await fetch(`${WORDLISTS_RAW_BASE_URL}${item.href}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const raw = await res.text();
          const previewLines = raw.split(/\r?\n/).slice(0, 100).join('\n');
          setPreviewContent(previewLines);
        }
      } catch (err) {
        setPreviewContent(`[Preview unavailable: ${err instanceof Error ? err.message : String(err)}]`);
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  // Open file in local OS file manager/opener
  const openWordlist = React.useCallback(async (item: WordlistItemWithStatus) => {
    if (!item.localPath) return;
    try {
      await openPath(item.localPath);
    } catch (err) {
      toast.error(`Could not open file: ${err}`);
    }
  }, []);

  return {
    items: filteredItems,
    allItems: items,
    loading,
    wordlistsDir,
    tags,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    selectedItem,
    setSelectedItem,
    previewContent,
    previewLoading,
    bundleDownloading,
    bundleProgress,
    fetchManifest,
    downloadWordlist,
    downloadBundle,
    deleteWordlist,
    loadPreview,
    openWordlist,
  };
}

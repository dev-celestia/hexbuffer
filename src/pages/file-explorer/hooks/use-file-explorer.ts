import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { toast } from 'sonner';
import { copyText } from '@/lib/clipboard';
import { getMimeType } from '../lib/mime';
import { safePathSegments } from '../lib/path';
import type { R2Item, R2Credentials } from '../types';

export interface R2UploadProgressEvent {
  fileName: string;
  progress: number;
}

interface R2Listing {
  folders: { prefix: string; name: string }[];
  files: {
    name: string;
    key: string;
    size?: number;
    lastModifiedMs?: number;
  }[];
}

export function useFileExplorer() {
  const [loading, setLoading] = React.useState(true);
  const [credentials, setCredentials] = React.useState<R2Credentials | null>(null);
  const [buckets, setBuckets] = React.useState<string[]>([]);
  const [currentBucket, setCurrentBucket] = React.useState<string>('');
  const [currentPrefix, setCurrentPrefix] = React.useState<string>('');
  const [items, setItems] = React.useState<R2Item[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<R2Item | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<{ fileName: string; progress: number } | null>(null);
  const [cacheStatus, setCacheStatus] = React.useState<Record<string, { isCached: boolean; localPath: string }>>({});
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);
  const [customBuckets, setCustomBuckets] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('r2_custom_buckets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Upload progress comes from the Rust uploader via the event system
  React.useEffect(() => {
    const unlisten = listen<R2UploadProgressEvent>('r2-upload-progress', (event) => {
      setUploadProgress({
        fileName: event.payload.fileName,
        progress: event.payload.progress,
      });
    });
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  }, []);

  // 1. Check credentials configuration (secret stays in the Rust process)
  const fetchCredentials = React.useCallback(async () => {
    try {
      setLoading(true);
      const status = await invokeStatus();
      if (status) {
        setCredentials(status);
      } else {
        setCredentials(null);
      }
    } catch (err) {
      console.error('Failed to load R2 credentials:', err);
      toast.error(`Error loading storage settings: ${err}`);
      setCredentials(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchCredentials();
  }, [fetchCredentials]);

  // 2. Discover buckets once credentials are configured
  const loadBuckets = React.useCallback(async () => {
    if (!credentials) return;
    try {
      setLoading(true);
      const bucketNames = await invoke<string[]>('r2_list_buckets');
      const merged = Array.from(new Set([...bucketNames, ...customBuckets]));
      setBuckets(merged);
      if (merged.length > 0 && !currentBucket) {
        setCurrentBucket(merged[0]);
      }
    } catch (err) {
      console.error('Failed to load R2 buckets:', err);
      setBuckets(customBuckets);
      if (customBuckets.length > 0 && !currentBucket) {
        setCurrentBucket(customBuckets[0]);
      }
      toast.error(`Could not autodiscover R2 Buckets: ${err}. You can manually add a bucket name in the sidebar.`);
    } finally {
      setLoading(false);
    }
  }, [credentials, currentBucket, customBuckets]);

  React.useEffect(() => {
    if (credentials) {
      void loadBuckets();
    }
  }, [credentials, loadBuckets]);

  // ponytail: support actual R2 bucket CRUD, with local fallback for custom buckets if server actions fail (e.g. permission limits)
  const handleAddCustomBucket = React.useCallback(async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (buckets.includes(clean)) {
      setCurrentBucket(clean);
      return;
    }
    setLoading(true);
    if (credentials) {
      try {
        await invoke('r2_create_bucket', { name: clean });
        toast.success(`Bucket '${clean}' created on R2`);
      } catch (err) {
        console.warn('R2 bucket creation failed, fallback to local registration:', err);
        const errMsg = String(err);
        if (errMsg.includes('BucketAlreadyExists') || errMsg.includes('BucketAlreadyOwnedByYou')) {
          toast.info(`Bucket '${clean}' already exists, registered locally`);
        } else {
          toast.info(`Added bucket '${clean}' locally (Server: ${err})`);
        }
      }
    } else {
      toast.info(`Added bucket '${clean}' locally`);
    }

    setCustomBuckets((prev) => {
      const updated = Array.from(new Set([...prev, clean]));
      localStorage.setItem('r2_custom_buckets', JSON.stringify(updated));
      return updated;
    });
    setBuckets((prev) => Array.from(new Set([...prev, clean])));
    setCurrentBucket(clean);
    setLoading(false);
  }, [credentials, buckets]);

  const handleRemoveBucket = React.useCallback(async (name: string) => {
    setLoading(true);
    if (credentials) {
      try {
        await invoke('r2_delete_bucket', { name });
        toast.success(`Bucket '${name}' deleted from R2`);
      } catch (err) {
        console.error('Failed to delete bucket from R2:', err);
        toast.error(`Could not delete bucket from R2: ${err}`);
      }
    }

    setCustomBuckets((prev) => {
      const updated = prev.filter((b) => b !== name);
      localStorage.setItem('r2_custom_buckets', JSON.stringify(updated));
      return updated;
    });
    setBuckets((prev) => prev.filter((b) => b !== name));
    setCurrentBucket((prev) => (prev === name ? '' : prev));
    setLoading(false);
    if (credentials) {
      void loadBuckets();
    }
  }, [credentials, loadBuckets]);

  // 3. List objects under current prefix
  const listItems = React.useCallback(async () => {
    if (!credentials || !currentBucket) return;
    try {
      setLoading(true);
      const listing = await invoke<R2Listing>('r2_list_objects', {
        bucket: currentBucket,
        prefix: currentPrefix,
      });

      const folders: R2Item[] = listing.folders.map((f) => ({
        type: 'folder',
        name: f.name,
        key: f.prefix,
      }));

      const files: R2Item[] = listing.files.map((f) => ({
        type: 'file',
        name: f.name,
        key: f.key,
        size: f.size,
        lastModified: f.lastModifiedMs !== undefined ? new Date(f.lastModifiedMs) : undefined,
      }));

      setItems([...folders, ...files]);
      setSelectedItem(null);
    } catch (err) {
      console.error('Failed to list R2 items:', err);
      toast.error(`Error loading objects: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [credentials, currentBucket, currentPrefix]);

  React.useEffect(() => {
    if (credentials && currentBucket) {
      void listItems();
    }
  }, [credentials, currentBucket, currentPrefix, listItems]);

  // 4. Update cache status for current items
  const updateCacheStatuses = React.useCallback(async () => {
    if (!currentBucket || items.length === 0) return;
    const statusMap: Record<string, { isCached: boolean; localPath: string }> = {};
    const localData = await appLocalDataDir();

    for (const item of items) {
      if (item.type === 'file') {
        // S3 keys may legally contain "../" — sanitize before they touch the filesystem
        const cachePath = await join(localData, 'r2_cache', ...safePathSegments(currentBucket, item.key));
        const fileExists = await exists(cachePath);
        statusMap[item.key] = { isCached: fileExists, localPath: cachePath };
      }
    }
    setCacheStatus((prev) => ({ ...prev, ...statusMap }));
  }, [currentBucket, items]);

  React.useEffect(() => {
    void updateCacheStatuses();
  }, [updateCacheStatuses]);

  // 5. Navigation helper methods
  const navigateToFolder = (folderKey: string) => {
    setCurrentPrefix(folderKey);
  };

  const navigateUp = () => {
    if (!currentPrefix) return;
    const parts = currentPrefix.slice(0, -1).split('/');
    parts.pop();
    const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
    setCurrentPrefix(newPrefix);
  };

  // 6. Copy Public URL
  const handleCopyPublicUrl = async (item: R2Item) => {
    if (!credentials) return;

    let publicUrl = '';
    if (credentials.customEndpointUrl) {
      publicUrl = `${credentials.customEndpointUrl.replace(/\/$/, '')}/${item.key}`;
    } else {
      publicUrl = `https://${credentials.accountId}.r2.cloudflarestorage.com/${currentBucket}/${item.key}`;
    }

    await copyText(publicUrl);
    toast.success('Public URL copied to clipboard');
  };

  // 7. Copy Presigned URL (signed in the Rust process)
  const handleCopyPresignedUrl = async (item: R2Item, expirationSeconds: number) => {
    if (!credentials || !currentBucket) return;
    try {
      const url = await invoke<string>('r2_presign_url', {
        bucket: currentBucket,
        key: item.key,
        expiresSeconds: expirationSeconds,
      });
      await copyText(url);
      toast.success(`Presigned URL (valid for ${expirationSeconds / 3600}h) copied to clipboard`);
    } catch (err) {
      console.error('Failed to generate presigned URL:', err);
      toast.error(`Failed to generate link: ${err}`);
    }
  };

  // 8. Create folder placeholder
  const handleCreateFolder = async (folderName: string) => {
    if (!credentials || !currentBucket || !folderName.trim()) return;
    const cleanName = folderName.trim().replace(/\/$/, '');
    const folderKey = `${currentPrefix}${cleanName}/`;

    try {
      setCreatingFolder(true);
      await invoke('r2_put_object_empty', { bucket: currentBucket, key: folderKey });
      toast.success(`Folder '${cleanName}' created successfully`);
      void listItems();
    } catch (err) {
      console.error('Failed to create folder:', err);
      toast.error(`Failed to create folder: ${err}`);
    } finally {
      setCreatingFolder(false);
    }
  };

  // 9. Delete item
  const handleDeleteItem = async (item: R2Item) => {
    if (!credentials || !currentBucket) return;
    setDeletingKey(item.key);
    // ponytail: use toast.promise for clean loading, success, and error feedback without boilerplate
    const deletePromise = (async () => {
      await invoke('r2_delete_object', { bucket: currentBucket, key: item.key });
      await listItems();
    })();

    toast.promise(deletePromise, {
      loading: `Deleting ${item.type === 'folder' ? 'folder' : 'file'} '${item.name}'...`,
      success: `Deleted ${item.type === 'folder' ? 'folder' : 'file'} '${item.name}'`,
      error: (err) => `Delete failed: ${err}`,
    });

    try {
      await deletePromise;
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeletingKey(null);
    }
  };

  // 10. File Upload — the Rust side handles single-part vs multipart and
  // reports progress via the "r2-upload-progress" event
  const uploadFileFromPath = React.useCallback(async (filePath: string) => {
    if (!credentials || !currentBucket) return;
    const fileName = filePath.split(/[/\\]/).pop() ?? 'uploaded-file';
    const key = `${currentPrefix}${fileName}`;

    await invoke('r2_upload_file', {
      bucket: currentBucket,
      key,
      sourcePath: filePath,
      contentType: getMimeType(fileName),
    });
  }, [credentials, currentBucket, currentPrefix]);

  const runUploads = React.useCallback(async (paths: string[]) => {
    if (!credentials || !currentBucket || paths.length === 0) return;
    try {
      setLoading(true);
      for (const path of paths) {
        await uploadFileFromPath(path);
      }
      void listItems();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(`Upload failed: ${err}`);
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  }, [credentials, currentBucket, listItems, uploadFileFromPath]);

  const handleUploadFile = React.useCallback(async () => {
    try {
      const filePath = await open({
        multiple: false,
        title: 'Select File to Upload',
      });

      if (!filePath) return;
      await runUploads([filePath as string]);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(`Upload failed: ${err}`);
      setUploadProgress(null);
    }
  }, [runUploads]);

  // Upload one or more files dropped onto the workspace (paths from Tauri drag-drop)
  const handleUploadPaths = React.useCallback(async (paths: string[]) => {
    await runUploads(paths);
  }, [runUploads]);

  // 11. File caching download and open streaming — Rust writes the cache
  // copy and returns its path
  const handleOpenFile = async (item: R2Item) => {
    if (!credentials || !currentBucket || item.type !== 'file') return;
    try {
      setLoading(true);
      const localData = await appLocalDataDir();
      const localPath = await join(localData, 'r2_cache', ...safePathSegments(currentBucket, item.key));

      const fileExists = await exists(localPath);
      if (fileExists) {
        toast.info(`Opening '${item.name}' instantly from local cache`);
        await openPath(localPath);
        return;
      }

      toast.loading(`Streaming '${item.name}' from Cloudflare R2...`);
      const cachedPath = await invoke<string>('r2_download_object', {
        bucket: currentBucket,
        key: item.key,
      });

      setCacheStatus((prev) => ({
        ...prev,
        [item.key]: { isCached: true, localPath: cachedPath },
      }));

      toast.dismiss();
      toast.success(`Cached & opening '${item.name}'`);
      await openPath(cachedPath);
    } catch (err) {
      toast.dismiss();
      console.error('Failed to stream / open file:', err);
      toast.error(`Failed to stream file: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  return {
    loading,
    credentials,
    buckets,
    currentBucket,
    setCurrentBucket,
    currentPrefix,
    setCurrentPrefix,
    items: filteredItems,
    selectedItem,
    setSelectedItem,
    uploadProgress,
    cacheStatus,
    creatingFolder,
    searchQuery,
    setSearchQuery,
    navigateToFolder,
    navigateUp,
    handleCopyPublicUrl,
    handleCopyPresignedUrl,
    handleCreateFolder,
    handleDeleteItem,
    deletingKey,
    handleUploadFile,
    handleUploadPaths,
    handleOpenFile,
    handleAddCustomBucket,
    handleRemoveBucket,
    refreshList: listItems,
  };
}

/** Public (non-secret) credential status reported by the Rust process. */
async function invokeStatus(): Promise<R2Credentials | null> {
  const status = await invoke<{
    accountId: string;
    accessKeyId: string;
    customEndpointUrl?: string | null;
    hasSecret: boolean;
  } | null>('r2_credentials_status');

  if (!status || !status.hasSecret) return null;
  return {
    accountId: status.accountId,
    accessKeyId: status.accessKeyId,
    secretAccessKey: '', // never leaves the Rust process
    customEndpointUrl: status.customEndpointUrl ?? undefined,
  };
}

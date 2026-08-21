import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFileExplorer } from './use-file-explorer';
import { useLocalStorage, LOCAL_STORAGE_DIR_NAME } from './use-local-storage';
import type { PageTabItem } from '@/components/tabs-layout/types';
import type { FileItem } from '../components/file-grid';

export type FileExplorerTabId = 'r2' | 'local' | 'wordlists';
export type FileExplorerViewMode = 'list' | 'grid';

export const FILE_EXPLORER_TABS: PageTabItem[] = [
  { id: 'local', name: 'Local Files' },
  { id: 'r2', name: 'R2 Storage' },
  { id: 'wordlists', name: 'Wordlists Hub' },
];

export function useFileExplorerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<FileExplorerTabId>('local');

  // Persist viewMode in localStorage across sessions
  const [viewMode, setViewMode] = React.useState<FileExplorerViewMode>(() => {
    try {
      const saved = localStorage.getItem('explorer_view_mode');
      return (saved as FileExplorerViewMode) === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });

  const handleViewModeChange = React.useCallback((mode: FileExplorerViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('explorer_view_mode', mode);
    } catch (e) {
      console.warn('Failed to save view mode to localStorage:', e);
    }
  }, []);

  const explorer = useFileExplorer();
  const local = useLocalStorage();

  const [localRenamingPath, setLocalRenamingPath] = React.useState<string | null>(null);
  const [localRenameValue, setLocalRenameValue] = React.useState('');
  const localRenameInputRef = React.useRef<HTMLInputElement>(null);

  // Build R2 breadcrumbs list
  const r2Breadcrumbs = React.useMemo(() => {
    const parts = explorer.currentPrefix.split('/').filter(Boolean);
    const crumbs = [{ label: explorer.currentBucket || 'R2 Bucket', id: '' }];

    let pathAcc = '';
    parts.forEach((part) => {
      pathAcc += `${part}/`;
      crumbs.push({
        label: part,
        id: pathAcc,
      });
    });

    return crumbs;
  }, [explorer.currentBucket, explorer.currentPrefix]);

  // Build Local breadcrumbs list with clickable navigation paths
  const localBreadcrumbs = React.useMemo(() => {
    if (!local.rootDir || !local.currentPath) {
      return [{ label: LOCAL_STORAGE_DIR_NAME, id: local.rootDir }];
    }
    const relative = local.currentPath.slice(local.rootDir.length).replace(/^[/\\]/, '');
    const parts = relative ? relative.split(/[/\\]/) : [];

    const crumbs = [{ label: LOCAL_STORAGE_DIR_NAME, id: local.rootDir }];
    let accPath = local.rootDir;

    parts.forEach((part) => {
      const sep = local.currentPath.includes('\\') ? '\\' : '/';
      accPath = `${accPath}${sep}${part}`;
      crumbs.push({
        label: part,
        id: accPath,
      });
    });

    return crumbs;
  }, [local.rootDir, local.currentPath]);

  // Local renaming state management callbacks
  const localStartRename = React.useCallback((e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    setLocalRenamingPath(item.id);
    setLocalRenameValue(item.name);
    setTimeout(() => localRenameInputRef.current?.select(), 0);
  }, []);

  const localCommitRename = React.useCallback((item: FileItem) => {
    const orig = local.items.find((i) => i.path === item.id);
    if (orig && localRenameValue.trim() && localRenameValue !== orig.name) {
      local.handleRenameItem(orig, localRenameValue);
    }
    setLocalRenamingPath(null);
  }, [local.items, localRenameValue, local]);

  const localCancelRename = React.useCallback(() => {
    setLocalRenamingPath(null);
  }, []);

  return {
    navigate,
    activeTab,
    setActiveTab: (tabId: string) => setActiveTab(tabId as FileExplorerTabId),
    tabs: FILE_EXPLORER_TABS,
    viewMode,
    handleViewModeChange,
    explorer,
    local,
    r2Breadcrumbs,
    localBreadcrumbs,
    localRenamingPath,
    localRenameValue,
    setLocalRenameValue,
    localRenameInputRef,
    localStartRename,
    localCommitRename,
    localCancelRename,
  };
}

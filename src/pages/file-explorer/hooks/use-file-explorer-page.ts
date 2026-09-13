import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFileExplorer } from './use-file-explorer';
import { useLocalStorage, LOCAL_STORAGE_DIR_NAME } from './use-local-storage';
import { useTauriFileDrop } from './use-tauri-file-drop';
import { handleFileGridKeyDown } from '../lib/keyboard-nav';
import type { PageTabItem } from '@/layout/tabs-layout/types';
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

  // Pending delete target shared by the grid confirm dialog (context menu,
  // hover actions, and the Delete key all funnel through it)
  const [deleteTarget, setDeleteTarget] = React.useState<FileItem | null>(null);

  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId as FileExplorerTabId);
    setDeleteTarget(null);
  }, []);

  const [localRenamingPath, setLocalRenamingPath] = React.useState<string | null>(null);
  const [localRenameValue, setLocalRenameValue] = React.useState('');
  const localRenameInputRef = React.useRef<HTMLInputElement>(null);

  // Normalized grid items (id-joined) shared by the grids and keyboard nav
  const r2GridItems = React.useMemo(
    () => explorer.items.map((item) => ({ ...item, id: item.key })),
    [explorer.items]
  );
  const localGridItems = React.useMemo(
    () => local.items.map((item) => ({ ...item, id: item.path })),
    [local.items]
  );

  // Tauri native file drop zones (HTML5 drop events carry no file data)
  const r2Drop = useTauriFileDrop(
    (paths) => {
      void explorer.handleUploadPaths(paths);
    },
    activeTab === 'r2' && !!explorer.currentBucket
  );
  const localDrop = useTauriFileDrop(
    (paths) => {
      void local.handleImportFile(paths);
    },
    activeTab === 'local'
  );

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
  const localStartRename = React.useCallback((item: FileItem) => {
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

  // Keyboard navigation for the R2 grid (arrows, Enter, Delete, Escape)
  const handleR2GridKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      handleFileGridKeyDown(e, {
        items: r2GridItems,
        selectedId: explorer.selectedItem?.key ?? null,
        viewMode,
        onSelect: (item) =>
          explorer.setSelectedItem(explorer.items.find((i) => i.key === item.id) ?? null),
        onOpen: (item) => {
          const orig = explorer.items.find((i) => i.key === item.id);
          if (!orig) return;
          if (orig.type === 'folder') {
            explorer.navigateToFolder(orig.key);
          } else {
            void explorer.handleOpenFile(orig);
          }
        },
        onRequestDelete: setDeleteTarget,
        onClearSelection: () => explorer.setSelectedItem(null),
      });
    },
    [r2GridItems, explorer, viewMode]
  );

  // Keyboard navigation for the local grid (adds F2 rename)
  const handleLocalGridKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      handleFileGridKeyDown(e, {
        items: localGridItems,
        selectedId: local.selectedItem?.path ?? null,
        viewMode,
        onSelect: (item) =>
          local.setSelectedItem(local.items.find((i) => i.path === item.id) ?? null),
        onOpen: (item) => {
          const orig = local.items.find((i) => i.path === item.id);
          if (orig) void local.handleOpenFile(orig);
        },
        onStartRename: localStartRename,
        onRequestDelete: setDeleteTarget,
        onClearSelection: () => local.setSelectedItem(null),
      });
    },
    [localGridItems, local, viewMode, localStartRename]
  );

  return {
    navigate,
    activeTab,
    setActiveTab: handleTabChange,
    tabs: FILE_EXPLORER_TABS,
    viewMode,
    handleViewModeChange,
    explorer,
    local,
    r2Breadcrumbs,
    localBreadcrumbs,
    r2GridItems,
    localGridItems,
    deleteTarget,
    setDeleteTarget,
    handleR2GridKeyDown,
    handleLocalGridKeyDown,
    r2DropZoneRef: r2Drop.dropZoneRef,
    r2DropActive: r2Drop.isDragOver,
    localDropZoneRef: localDrop.dropZoneRef,
    localDropActive: localDrop.isDragOver,
    localRenamingPath,
    localRenameValue,
    setLocalRenameValue,
    localRenameInputRef,
    localStartRename,
    localCommitRename,
    localCancelRename,
  };
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@celestia-project/ui';
import * as React from 'react';
import { CircleNotchIcon, FolderIcon } from '@phosphor-icons/react';
import { FileGridCard } from './file-grid-card';
import { FileListRow } from './file-list-row';
import { cn } from '@/lib/utils';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string | Date;
}

interface FileGridProps<T extends FileItem> {
  items: T[];
  selectedItem: T | null;
  loading: boolean;
  onSelectItem: (item: T) => void;
  onDoubleClickItem: (item: T) => void;
  onDeleteItem: (item: T) => void;
  viewMode: 'list' | 'grid';
  emptyMessage?: string;
  renderSyncStatus?: (item: T) => React.ReactNode;
  renderExtraContextMenuItems?: (item: T) => React.ReactNode;
  renderGridStatusOverlay?: (item: T) => React.ReactNode;
  renamingId?: string | null;
  renameValue?: string;
  onRenameStart?: (e: React.MouseEvent, item: T) => void;
  onRenameChange?: (value: string) => void;
  onRenameCommit?: (item: T) => void;
  onRenameCancel?: () => void;
  renameInputRef?: React.RefObject<HTMLInputElement | null>;
  deletingId?: string | null;
}

export function FileGrid<T extends FileItem>({
  items,
  selectedItem,
  loading,
  onSelectItem,
  onDoubleClickItem,
  onDeleteItem,
  viewMode,
  emptyMessage = 'This folder contains no files or sub-directories.',
  renderSyncStatus,
  renderExtraContextMenuItems,
  renderGridStatusOverlay,
  renamingId,
  renameValue,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  renameInputRef,
  deletingId,
}: FileGridProps<T>) {
  const [itemToDelete, setItemToDelete] = React.useState<T | null>(null);

  if (loading && items.length === 0) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 items-center justify-center select-none",

          // Sizing & Spacing
          "h-full p-8 gap-2",

          // Typography & Colors
          "text-xs text-muted-foreground"
        )}
      >
        <CircleNotchIcon className="size-5 animate-spin text-primary" />
        <span>Loading files…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 flex-col items-center justify-center select-none text-center",

          // Sizing & Spacing
          "h-full p-8 gap-2",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        <FolderIcon className="size-10 text-muted-foreground/30 mb-1" />
        <p className="text-xs font-semibold text-foreground">Empty folder</p>
        <p className="text-[11px] text-muted-foreground max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "relative flex flex-col flex-1 h-full min-h-0 overflow-hidden",

        // Backgrounds & Borders
        "rounded-md border border-border bg-background"
      )}
    >
      {viewMode === 'grid' ? (
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 overflow-auto select-none",

            // Sizing & Spacing
            "p-3"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]",

              // Sizing & Spacing
              "gap-3"
            )}
          >
            {items.map((item) => (
              <FileGridCard
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                isRenaming={renamingId === item.id}
                renameValue={renameValue}
                onSelectItem={onSelectItem}
                onDoubleClickItem={onDoubleClickItem}
                onDeleteItem={(item) => setItemToDelete(item)}
                renderExtraContextMenuItems={renderExtraContextMenuItems}
                renderGridStatusOverlay={renderGridStatusOverlay}
                onRenameStart={onRenameStart}
                onRenameChange={onRenameChange}
                onRenameCommit={onRenameCommit}
                onRenameCancel={onRenameCancel}
                renameInputRef={renameInputRef}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 overflow-auto min-h-0 select-none"
          )}
        >
          <table
            className={cn(
              // Layout & Positioning
              "w-full text-left border-collapse",

              // Typography
              "text-xs"
            )}
          >
            <thead
              className={cn(
                // Layout & Positioning
                "sticky top-0 z-10 select-none",

                // Backgrounds & Borders
                "bg-muted/50 border-b border-border text-muted-foreground",

                // Typography
                "text-[10px] font-semibold uppercase tracking-wider"
              )}
            >
              <tr>
                <th className="px-3 py-2 font-medium w-1/2">Name</th>
                <th className="px-3 py-2 font-medium w-16 text-center">Type</th>
                <th className="px-3 py-2 font-medium w-24 text-right">Size</th>
                <th className="px-3 py-2 font-medium w-36 text-left">Modified</th>
                {renderSyncStatus && (
                  <th className="px-3 py-2 font-medium w-20 text-center">Sync</th>
                )}
                <th className="px-2 py-2 font-medium w-16 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {items.map((item) => (
                <FileListRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  isRenaming={renamingId === item.id}
                  renameValue={renameValue}
                  onSelectItem={onSelectItem}
                  onDoubleClickItem={onDoubleClickItem}
                  onDeleteItem={(item) => setItemToDelete(item)}
                  renderSyncStatus={renderSyncStatus}
                  renderExtraContextMenuItems={renderExtraContextMenuItems}
                  onRenameStart={onRenameStart}
                  onRenameChange={onRenameChange}
                  onRenameCommit={onRenameCommit}
                  onRenameCancel={onRenameCancel}
                  renameInputRef={renameInputRef}
                  isDeleting={deletingId === item.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'folder' ? 'Folder' : 'File'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {itemToDelete?.type === 'folder' ? 'folder' : 'file'} "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="xs" disabled={deletingId === itemToDelete?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              size="xs"
              variant="destructive"
              disabled={deletingId === itemToDelete?.id}
              onClick={() => {
                if (itemToDelete) {
                  onDeleteItem(itemToDelete);
                  setItemToDelete(null);
                }
              }}
            >
              {deletingId === itemToDelete?.id && (
                <CircleNotchIcon className="mr-1.5 size-3.5 animate-spin" />
              )}
              {deletingId === itemToDelete?.id ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

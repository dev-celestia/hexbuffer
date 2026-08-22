import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@celestia-project/ui';
import * as React from 'react';
import { FolderOpenIcon, TrashIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getFileIconSrc, getFolderIconSrc } from '../lib/file-icons';

import type { FileItem } from './file-grid';

interface FileListRowProps<T extends FileItem> {
  item: T;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue?: string;
  onSelectItem: (item: T) => void;
  onDoubleClickItem: (item: T) => void;
  onDeleteItem: (item: T) => void;
  renderSyncStatus?: (item: T) => React.ReactNode;
  renderExtraContextMenuItems?: (item: T) => React.ReactNode;
  onRenameStart?: (e: React.MouseEvent, item: T) => void;
  onRenameChange?: (value: string) => void;
  onRenameCommit?: (item: T) => void;
  onRenameCancel?: () => void;
  renameInputRef?: React.RefObject<HTMLInputElement | null>;
  isDeleting?: boolean;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileListRow<T extends FileItem>({
  item,
  isSelected,
  isRenaming,
  renameValue,
  onSelectItem,
  onDoubleClickItem,
  onDeleteItem,
  renderSyncStatus,
  renderExtraContextMenuItems,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  renameInputRef,
  isDeleting,
}: Readonly<FileListRowProps<T>>) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <tr
            onClick={() => onSelectItem(item)}
            onDoubleClick={() => onDoubleClickItem(item)}
            onContextMenu={() => onSelectItem(item)}
            className={cn(
              // Layout & Positioning
              "group cursor-pointer",

              // Backgrounds & Borders
              isSelected
                ? "bg-primary/10 hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20 text-foreground font-medium"
                : "hover:bg-muted/30",

              // Interactive & States
              "transition-colors",
              isDeleting && "opacity-40 pointer-events-none"
            )}
          />
        }
      >
        {/* File / Folder Name */}
        <td
          className={cn(
            // Layout & Positioning
            "flex items-center truncate",

            // Sizing & Spacing
            "px-3 py-1.5 gap-2",

            // Typography
            "font-sans text-xs"
          )}
        >
          {item.type === 'folder' ? (
            <img
              src={getFolderIconSrc(item.name)}
              alt=""
              className="size-4 shrink-0 select-none object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/explorer-icon/_folder.svg';
              }}
            />
          ) : (
            <img
              src={getFileIconSrc(item.name) ?? '/src/assets/explorer-icon/_file.svg'}
              alt=""
              className="size-4 shrink-0 select-none object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/explorer-icon/_file.svg';
              }}
            />
          )}
          {isRenaming && onRenameChange && onRenameCommit && onRenameCancel ? (
            <input
              ref={(el) => {
                if (renameInputRef) {
                  (renameInputRef as any).current = el;
                }
              }}
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameCommit(item);
                if (e.key === 'Escape') onRenameCancel();
              }}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => onRenameCommit(item)}
              className={cn(
                // Layout & Positioning
                "flex-1 min-w-0 outline-none",

                // Sizing & Spacing
                "px-1 py-0.5 rounded",

                // Typography
                "text-xs font-sans text-foreground",

                // Backgrounds & Borders
                "bg-background border border-primary/60",

                // Interactive & States
                "focus:ring-1 focus:ring-primary/40"
              )}
              autoFocus
            />
          ) : (
            <span
              className={cn(
                // Layout & Positioning
                "truncate",

                // Typography
                item.type === 'folder'
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",

                // Interactive & States
                "transition-colors"
              )}
            >
              {item.name}
            </span>
          )}
        </td>

        {/* Type Badge */}
        <td
          className={cn(
            // Layout & Positioning
            "text-center uppercase",

            // Sizing & Spacing
            "px-3 py-1.5",

            // Typography
            "text-[10px] font-sans text-muted-foreground"
          )}
        >
          {item.type}
        </td>

        {/* File Size */}
        <td
          className={cn(
            // Layout & Positioning
            "text-right",

            // Sizing & Spacing
            "px-3 py-1.5",

            // Typography
            "font-mono text-[11px] text-muted-foreground"
          )}
        >
          {item.type === 'folder' ? '—' : formatBytes(item.size)}
        </td>

        {/* Last Modified */}
        <td
          className={cn(
            // Layout & Positioning
            "text-left",

            // Sizing & Spacing
            "px-3 py-1.5",

            // Typography
            "font-sans text-[11px] text-muted-foreground"
          )}
        >
          {item.lastModified
            ? new Date(item.lastModified).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </td>

        {/* Sync Status Badge */}
        {renderSyncStatus && (
          <td
            className={cn(
              // Layout & Positioning
              "text-center",

              // Sizing & Spacing
              "px-3 py-1.5"
            )}
          >
            {renderSyncStatus(item)}
          </td>
        )}

        {/* Action Icons */}
        <td
          className={cn(
            // Layout & Positioning
            "text-right",

            // Sizing & Spacing
            "px-2 py-1.5"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "inline-flex items-center justify-end",

              // Sizing & Spacing
              "gap-1",

              // Interactive & States
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            {onRenameStart && (
              <button
                type="button"
                onClick={(e) => onRenameStart(e, item)}
                className={cn(
                  // Sizing & Spacing
                  "p-1 rounded",

                  // Typography & Colors
                  "text-muted-foreground hover:text-primary",

                  // Interactive & States
                  "transition-colors"
                )}
                title="Rename"
              >
                <PencilSimpleIcon className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item);
              }}
              className={cn(
                // Sizing & Spacing
                "p-1 rounded",

                // Typography & Colors
                "text-muted-foreground hover:text-destructive",

                // Interactive & States
                "transition-colors"
              )}
              title="Delete"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </div>
        </td>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44 font-sans text-xs">
        <ContextMenuItem onClick={() => onDoubleClickItem(item)}>
          <FolderOpenIcon className="mr-2 size-3.5" />
          <span>{item.type === 'folder' ? 'Open Folder' : 'Open'}</span>
        </ContextMenuItem>

        {onRenameStart && (
          <ContextMenuItem onClick={(e) => onRenameStart(e as any, item)}>
            <PencilSimpleIcon className="mr-2 size-3.5" />
            <span>Rename</span>
          </ContextMenuItem>
        )}

        {renderExtraContextMenuItems && renderExtraContextMenuItems(item)}

        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            onDeleteItem(item);
          }}
        >
          <TrashIcon className="mr-2 size-3.5" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

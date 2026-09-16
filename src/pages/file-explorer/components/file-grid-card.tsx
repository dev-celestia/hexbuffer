import { ContextMenu, ContextMenuTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { getFileIconSrc, getFolderIconSrc } from '../lib/file-icons';
import { FileContextMenuContent } from './file-context-menu';

import type { FileItem } from './file-grid';

interface FileGridCardProps<T extends FileItem> {
  item: T;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue?: string;
  onSelectItem: (item: T) => void;
  onDoubleClickItem: (item: T) => void;
  onRequestDelete: (item: T) => void;
  renderExtraContextMenuItems?: (item: T) => React.ReactNode;
  renderGridStatusOverlay?: (item: T) => React.ReactNode;
  onRenameStart?: (item: T) => void;
  onRenameChange?: (value: string) => void;
  onRenameCommit?: (item: T) => void;
  onRenameCancel?: () => void;
  renameInputRef?: React.RefObject<HTMLInputElement | null>;
  isDeleting?: boolean;
}

export function FileGridCard<T extends FileItem>({
  item,
  isSelected,
  isRenaming,
  renameValue,
  onSelectItem,
  onDoubleClickItem,
  onRequestDelete,
  renderExtraContextMenuItems,
  renderGridStatusOverlay,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  renameInputRef,
  isDeleting,
}: Readonly<FileGridCardProps<T>>) {
  const cardContent = (
    <ContextMenuTrigger>
      <div
        data-file-item
        onClick={() => onSelectItem(item)}
        onDoubleClick={() => onDoubleClickItem(item)}
        onContextMenu={() => onSelectItem(item)}
        className={cn(
          // Layout & Positioning
          "relative flex flex-col items-center justify-between text-center group cursor-pointer",

          // Sizing & Spacing
          "h-24 p-2 rounded-md",

          // Backgrounds & Borders
          isSelected
            ? "bg-primary/10 border border-primary/30"
            : "hover:bg-muted/50 border border-transparent",

          // Interactive & States
          "transition-all duration-100 ease-out active:scale-[0.97]",
          isDeleting && "opacity-40 pointer-events-none"
        )}
      >
        {/* File / Folder Icon */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-1 items-center justify-center min-h-0"
          )}
        >
          {item.type === 'folder' ? (
            <img
              src={getFolderIconSrc(item.name)}
              alt=""
              className={cn(
                // Sizing & Spacing
                "size-12 shrink-0 select-none object-contain"
              )}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/explorer-icon/_folder.svg';
              }}
            />
          ) : (
            <img
              src={getFileIconSrc(item.name) ?? '/src/assets/explorer-icon/_file.svg'}
              alt=""
              className={cn(
                // Sizing & Spacing
                "size-12 shrink-0 select-none object-contain"
              )}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/explorer-icon/_file.svg';
              }}
            />
          )}
        </div>

        {/* Label / Rename input */}
        <div
          className={cn(
            // Layout & Positioning
            "relative flex flex-col items-center justify-end w-full"
          )}
        >
          {isRenaming && onRenameChange && onRenameCommit && onRenameCancel ? (
            <input
              ref={(el) => {
                if (renameInputRef) renameInputRef.current = el;
              }}
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameCommit(item);
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  onRenameCancel();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => onRenameCommit(item)}
              className={cn(
                // Layout & Positioning
                "w-full min-w-0 text-center outline-none",

                // Sizing & Spacing
                "px-1 py-0.5 rounded",

                // Typography
                "text-[11px] font-sans text-foreground",

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
                "truncate w-full px-1 block",

                // Typography
                "text-[11px] font-sans",
                item.type === 'folder'
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",

                // Interactive & States
                "transition-colors"
              )}
              title={item.name}
            >
              {item.name}
            </span>
          )}

          {!isRenaming && renderGridStatusOverlay && renderGridStatusOverlay(item)}
        </div>
      </div>
    </ContextMenuTrigger>
  );

  return (
    <ContextMenu>
      {isRenaming ? (
        cardContent
      ) : (
        <Tooltip>
          <TooltipTrigger>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent className="font-sans text-xs">
            {item.name}
          </TooltipContent>
        </Tooltip>
      )}

      <FileContextMenuContent
        item={item}
        onOpen={onDoubleClickItem}
        onRequestDelete={onRequestDelete}
        onStartRename={onRenameStart}
        renderExtraItems={renderExtraContextMenuItems}
      />
    </ContextMenu>
  );
}

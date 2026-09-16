import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@celestia-project/ui';
import { FolderOpenIcon, TrashIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import * as React from 'react';

import type { FileItem } from './file-grid';

interface FileContextMenuContentProps<T extends FileItem> {
  item: T;
  onOpen: (item: T) => void;
  onRequestDelete: (item: T) => void;
  onStartRename?: (item: T) => void;
  renderExtraItems?: (item: T) => React.ReactNode;
}

/**
 * Shared context menu content for grid cards and list rows so both
 * interaction surfaces stay in sync.
 */
export function FileContextMenuContent<T extends FileItem>({
  item,
  onOpen,
  onRequestDelete,
  onStartRename,
  renderExtraItems,
}: Readonly<FileContextMenuContentProps<T>>) {
  return (
    <ContextMenuContent className="w-44 font-sans text-xs">
      <ContextMenuItem onClick={() => onOpen(item)}>
        <FolderOpenIcon className="mr-2 size-3.5" />
        <span>{item.type === 'folder' ? 'Open Folder' : 'Open'}</span>
      </ContextMenuItem>

      {onStartRename && (
        <ContextMenuItem onClick={() => onStartRename(item)}>
          <PencilSimpleIcon className="mr-2 size-3.5" />
          <span>Rename</span>
        </ContextMenuItem>
      )}

      {renderExtraItems?.(item)}

      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => onRequestDelete(item)}>
        <TrashIcon className="mr-2 size-3.5" />
        <span>Delete</span>
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

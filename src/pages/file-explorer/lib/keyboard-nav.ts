import type React from 'react';
import type { FileItem } from '../components/file-grid';

export interface FileGridKeyNavOptions<T extends FileItem> {
  items: T[];
  selectedId: string | null;
  viewMode: 'list' | 'grid';
  onSelect: (item: T) => void;
  onOpen: (item: T) => void;
  onStartRename?: (item: T) => void;
  onRequestDelete: (item: T) => void;
  onClearSelection: () => void;
}

function getSelectedIndex<T extends FileItem>(items: T[], selectedId: string | null): number {
  if (!selectedId) return -1;
  return items.findIndex((item) => item.id === selectedId);
}

/**
 * Number of cards per row in the current grid, derived from the DOM so it
 * stays correct across resizes of the resizable panel layout.
 */
function getGridColumns(container: HTMLElement): number {
  const cells = container.querySelectorAll<HTMLElement>('[data-file-item]');
  if (cells.length < 2) return 1;
  const firstTop = cells[0].offsetTop;
  let columns = 1;
  for (let i = 1; i < cells.length; i += 1) {
    if (cells[i].offsetTop !== firstTop) break;
    columns += 1;
  }
  return Math.max(columns, 1);
}

function clampSelection<T extends FileItem>(items: T[], index: number): T | null {
  if (items.length === 0) return null;
  const next = Math.min(Math.max(index, 0), items.length - 1);
  return items[next] ?? null;
}

/**
 * Keyboard model for the file grid/list container:
 * - Arrows move selection (spatial in grid mode via DOM row geometry)
 * - Enter/Space open, F2 rename, Delete/Backspace request delete
 * - Escape clears selection
 * Ignores events coming from inline inputs (rename, search) so those
 * keep native behavior.
 */
export function handleFileGridKeyDown<T extends FileItem>(
  e: React.KeyboardEvent<HTMLElement>,
  options: FileGridKeyNavOptions<T>,
): void {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

  const { items, selectedId, viewMode } = options;
  if (items.length === 0) return;

  const selectedIndex = getSelectedIndex(items, selectedId);
  const select = (item: T | null) => {
    if (!item) return;
    e.preventDefault();
    options.onSelect(item);
  };

  switch (e.key) {
    case 'ArrowDown': {
      const step = viewMode === 'grid' ? getGridColumns(e.currentTarget) : 1;
      if (selectedIndex === -1) select(items[0]);
      else select(clampSelection(items, selectedIndex + step));
      break;
    }
    case 'ArrowUp': {
      const step = viewMode === 'grid' ? getGridColumns(e.currentTarget) : 1;
      select(clampSelection(items, selectedIndex - step));
      break;
    }
    case 'ArrowRight':
      select(clampSelection(items, selectedIndex + 1));
      break;
    case 'ArrowLeft':
      select(clampSelection(items, selectedIndex - 1));
      break;
    case 'Home':
      select(items[0]);
      break;
    case 'End':
      select(items[items.length - 1]);
      break;
    case 'Enter':
    case ' ':
      if (selectedIndex >= 0) {
        e.preventDefault();
        options.onOpen(items[selectedIndex]);
      }
      break;
    case 'F2':
      if (selectedIndex >= 0 && options.onStartRename) {
        e.preventDefault();
        options.onStartRename(items[selectedIndex]);
      }
      break;
    case 'Delete':
    case 'Backspace':
      if (selectedIndex >= 0) {
        e.preventDefault();
        options.onRequestDelete(items[selectedIndex]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      options.onClearSelection();
      break;
    default:
      break;
  }
}

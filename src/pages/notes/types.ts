import type { Scratchpad } from '@/stores/scratchpad';

export type NoteSortOption = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc' | 'created-desc';

export type NoteFilterTab = 'all' | 'open' | 'closed';

export interface SavedNotesManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface NoteCardProps {
  note: Scratchpad;
  isOpenInTab: boolean;
  isActiveTab: boolean;
  onOpen: (id: string) => void;
  onCloseTab: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (note: Scratchpad) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

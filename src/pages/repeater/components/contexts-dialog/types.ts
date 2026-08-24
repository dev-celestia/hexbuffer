import type { ContextRecord, KeyValuePair } from '@/stores/collections';

export interface ContextsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface UseContextsDialogReturn {
  editingContext: ContextRecord | null;
  name: string;
  setName: (name: string) => void;
  variables: KeyValuePair[];
  isCreating: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deletingContextId: string | null;
  setDeletingContextId: (id: string | null) => void;
  activeContextId: string | null;
  filteredContexts: ContextRecord[];
  handleStartCreate: () => void;
  handleStartEdit: (ctx: ContextRecord) => void;
  handleCancel: () => void;
  handleAddVar: () => void;
  handleRemoveVar: (index: number) => void;
  handleVarChange: (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => void;
  handleSave: () => Promise<void>;
  handleConfirmDelete: (id: string) => Promise<void>;
  handleDuplicate: (ctx: ContextRecord) => Promise<void>;
  handleSetActive: (ctx: ContextRecord) => void;
  getVariablesSummary: (ctx: ContextRecord) => string;
}

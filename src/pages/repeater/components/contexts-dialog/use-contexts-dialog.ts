import * as React from 'react';
import { toast } from 'sonner';
import {
  useCollectionsStore,
  type ContextRecord,
  type KeyValuePair,
} from '@/stores/collections';
import type { UseContextsDialogReturn } from './types';

export function useContextsDialog({ open }: { open: boolean }): UseContextsDialogReturn {
  const store = useCollectionsStore();
  const [editingContext, setEditingContext] = React.useState<ContextRecord | null>(null);
  const [name, setName] = React.useState('');
  const [variables, setVariables] = React.useState<KeyValuePair[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deletingContextId, setDeletingContextId] = React.useState<string | null>(null);

  const handleStartCreate = React.useCallback(() => {
    setName('');
    setVariables([{ key: '', value: '', enabled: true }]);
    setIsCreating(true);
    setEditingContext(null);
    setDeletingContextId(null);
  }, []);

  const handleStartEdit = React.useCallback((ctx: ContextRecord) => {
    setName(ctx.name);
    try {
      const parsed = JSON.parse(ctx.variables);
      setVariables(
        Array.isArray(parsed)
          ? parsed.map((v: Record<string, unknown>) => ({
              key: typeof v.key === 'string' ? v.key : '',
              value: typeof v.value === 'string' ? v.value : '',
              enabled: typeof v.enabled === 'boolean' ? v.enabled : true,
            }))
          : [],
      );
    } catch {
      setVariables([]);
    }
    setEditingContext(ctx);
    setIsCreating(false);
    setDeletingContextId(null);
  }, []);

  React.useEffect(() => {
    if (open) {
      if (store.contexts.length > 0) {
        const activeCtx = store.contexts.find((c) => c.id === store.activeContextId);
        const targetCtx = activeCtx || store.contexts[0];
        handleStartEdit(targetCtx);
      } else {
        setEditingContext(null);
        setIsCreating(false);
      }
      setSearchQuery('');
      setDeletingContextId(null);
    }
  }, [open, store.contexts, store.activeContextId, handleStartEdit]);

  const handleCancel = React.useCallback(() => {
    setIsCreating(false);
    if (store.contexts.length > 0) {
      const activeCtx = store.contexts.find((c) => c.id === store.activeContextId);
      const targetCtx = activeCtx || store.contexts[0];
      handleStartEdit(targetCtx);
    } else {
      setEditingContext(null);
    }
  }, [store.contexts, store.activeContextId, handleStartEdit]);

  const handleAddVar = React.useCallback(() => {
    setVariables((prev) => [...prev, { key: '', value: '', enabled: true }]);
  }, []);

  const handleRemoveVar = React.useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleVarChange = React.useCallback(
    (index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
      setVariables((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: val };
        return updated;
      });
    },
    [],
  );

  const handleSave = React.useCallback(async () => {
    if (!name.trim()) return;

    const filteredVars = variables.filter((v) => v.key.trim() !== '');

    if (isCreating) {
      await store.createContext(name, filteredVars);
      toast.success(`Created environment: ${name}`);
    } else if (editingContext) {
      await store.updateContext(editingContext.id, name, filteredVars);
      toast.success(`Updated environment: ${name}`);
    }

    setIsCreating(false);
  }, [name, variables, isCreating, editingContext, store]);

  const handleConfirmDelete = React.useCallback(
    async (id: string) => {
      await store.deleteContext(id);
      setDeletingContextId(null);
      if (editingContext?.id === id) {
        const remaining = store.contexts.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          handleStartEdit(remaining[0]);
        } else {
          setEditingContext(null);
        }
      }
      toast.success('Environment deleted');
    },
    [store, editingContext, handleStartEdit],
  );

  const handleDuplicate = React.useCallback(
    async (ctx: ContextRecord) => {
      let vars: KeyValuePair[] = [];
      try {
        const parsed = JSON.parse(ctx.variables);
        vars = Array.isArray(parsed)
          ? parsed.map((v: Record<string, unknown>) => ({
              key: typeof v.key === 'string' ? v.key : '',
              value: typeof v.value === 'string' ? v.value : '',
              enabled: typeof v.enabled === 'boolean' ? v.enabled : true,
            }))
          : [];
      } catch {
        vars = [];
      }
      await store.createContext(`Copy of ${ctx.name}`, vars);
      toast.success(`Duplicated environment: ${ctx.name}`);
    },
    [store],
  );

  const handleSetActive = React.useCallback(
    (ctx: ContextRecord) => {
      store.setActiveContextId(ctx.id);
      toast.success(`Activated environment: ${ctx.name}`);
    },
    [store],
  );

  const getVariablesSummary = React.useCallback((ctx: ContextRecord) => {
    try {
      const vars = JSON.parse(ctx.variables);
      if (!Array.isArray(vars) || vars.length === 0) return 'No variables';
      const keys = vars
        .filter((v: Record<string, unknown>) => typeof v.key === 'string' && v.key.trim())
        .map((v: Record<string, unknown>) => (v.key as string).trim());
      if (keys.length === 0) return 'No variables';
      if (keys.length <= 2) return keys.join(', ');
      return `${keys.slice(0, 2).join(', ')} (+${keys.length - 2} more)`;
    } catch {
      return 'No variables';
    }
  }, []);

  const filteredContexts = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return store.contexts.filter((ctx) => ctx.name.toLowerCase().includes(query));
  }, [store.contexts, searchQuery]);

  return {
    editingContext,
    name,
    setName,
    variables,
    isCreating,
    searchQuery,
    setSearchQuery,
    deletingContextId,
    setDeletingContextId,
    activeContextId: store.activeContextId,
    filteredContexts,
    handleStartCreate,
    handleStartEdit,
    handleCancel,
    handleAddVar,
    handleRemoveVar,
    handleVarChange,
    handleSave,
    handleConfirmDelete,
    handleDuplicate,
    handleSetActive,
    getVariablesSummary,
  };
}

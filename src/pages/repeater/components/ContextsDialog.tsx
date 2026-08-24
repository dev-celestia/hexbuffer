import * as React from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  ScrollArea,
} from '@celestia-project/ui';
import {
  useCollectionsStore,
  type ContextRecord,
  type KeyValuePair,
} from '@/stores/collections';
import {
  PlusIcon,
  TrashIcon,
  PencilSimpleIcon,
  CopyIcon,
  GlobeIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ContextsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useContextsDialog({ open }: { open: boolean }) {
  const store = useCollectionsStore();
  const [editingContext, setEditingContext] = React.useState<ContextRecord | null>(null);
  const [name, setName] = React.useState('');
  const [variables, setVariables] = React.useState<KeyValuePair[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deletingContextId, setDeletingContextId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEditingContext(null);
      setIsCreating(false);
      setSearchQuery('');
      setDeletingContextId(null);
    }
  }, [open]);

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

  const handleCancel = React.useCallback(() => {
    setIsCreating(false);
    setEditingContext(null);
  }, []);

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
      toast.success(`Created env: ${name}`);
    } else if (editingContext) {
      await store.updateContext(editingContext.id, name, filteredVars);
      toast.success(`Updated env: ${name}`);
    }

    setIsCreating(false);
    setEditingContext(null);
  }, [name, variables, isCreating, editingContext, store]);

  const handleConfirmDelete = React.useCallback(
    async (id: string) => {
      await store.deleteContext(id);
      setDeletingContextId(null);
      if (editingContext?.id === id) {
        setEditingContext(null);
      }
      toast.success('Env deleted');
    },
    [store, editingContext],
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
      toast.success(`Duplicated env: ${ctx.name}`);
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
    store,
    editingContext,
    name,
    setName,
    variables,
    isCreating,
    searchQuery,
    setSearchQuery,
    deletingContextId,
    setDeletingContextId,
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
    getVariablesSummary,
  };
}

export function ContextsDialog({ open, onOpenChange }: ContextsDialogProps) {
  const {
    store,
    editingContext,
    name,
    setName,
    variables,
    isCreating,
    searchQuery,
    setSearchQuery,
    deletingContextId,
    setDeletingContextId,
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
    getVariablesSummary,
  } = useContextsDialog({ open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Layout & Positioning
          'flex flex-col overflow-hidden',
          // Sizing & Spacing
          'sm:max-w-4xl h-[580px] p-0',
        )}
      >
        <DialogTitle className="sr-only">Manage Envs</DialogTitle>
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-1 min-h-0 divide-x divide-border',
          )}
        >
          {/* Left Sidebar */}
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col shrink-0 min-h-0',
              // Sizing & Spacing
              'w-72',
              // Backgrounds & Borders
              'bg-muted/20',
            )}
          >
            {/* Sidebar Header */}
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col shrink-0 border-b border-border',
                // Sizing & Spacing
                'p-3 gap-2',
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  'flex items-center justify-between',
                )}
              >
                <span
                  className={cn(
                    // Typography
                    'text-xs font-semibold tracking-tight text-foreground',
                  )}
                >
                  Envs
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleStartCreate}
                  title="Create Env"
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <Input
                placeholder="Search envs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Envs List */}
            <ScrollArea className="flex-1">
              <div
                className={cn(
                  // Sizing & Spacing
                  'p-2 space-y-1',
                )}
              >
                {filteredContexts.map((ctx) => {
                  const isActive = store.activeContextId === ctx.id;
                  const isSelected = editingContext?.id === ctx.id;
                  const isDeleting = deletingContextId === ctx.id;

                  return (
                    <div
                      key={ctx.id}
                      onClick={() => {
                        if (!isDeleting) handleStartEdit(ctx);
                      }}
                      className={cn(
                        // Layout & Positioning
                        'group relative flex flex-col select-none cursor-pointer border',
                        // Sizing & Spacing
                        'p-2.5 rounded-lg',
                        // Typography
                        'text-sm',
                        // Backgrounds & Borders
                        isSelected
                          ? 'bg-accent/40 border-accent/80'
                          : 'hover:bg-muted/40 border-transparent',
                        // Interactive & States
                        'transition-all duration-200',
                      )}
                    >
                      {isDeleting ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            // Layout & Positioning
                            'flex flex-col',
                            // Sizing & Spacing
                            'gap-1.5 py-0.5',
                          )}
                        >
                          <span
                            className={cn(
                              // Layout & Positioning
                              'flex items-center gap-1 animate-pulse',
                              // Typography
                              'text-[11px] font-semibold text-destructive uppercase tracking-wider',
                            )}
                          >
                            Delete Env?
                          </span>
                          <ButtonGroup>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleConfirmDelete(ctx.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingContextId(null)}
                            >
                              Cancel
                            </Button>
                          </ButtonGroup>
                        </div>
                      ) : (
                        <>
                          <div
                            className={cn(
                              // Layout & Positioning
                              'flex items-center justify-between min-w-0',
                            )}
                          >
                            <span
                              className={cn(
                                // Layout & Positioning
                                'truncate flex-1',
                                // Sizing & Spacing
                                'pr-1',
                                // Typography
                                'text-xs font-medium',
                                isSelected
                                  ? 'text-foreground font-semibold'
                                  : 'text-muted-foreground group-hover:text-foreground',
                              )}
                            >
                              {ctx.name}
                            </span>

                            {isActive && (
                              <Badge variant="secondary">
                                Active
                              </Badge>
                            )}
                          </div>

                          <span
                            className={cn(
                              // Layout & Positioning
                              'truncate',
                              // Sizing & Spacing
                              'mt-1 max-w-[210px]',
                              // Typography
                              'text-[10px] text-muted-foreground/60',
                            )}
                          >
                            {getVariablesSummary(ctx)}
                          </span>

                          <div
                            className={cn(
                              // Layout & Positioning
                              'absolute right-2 top-1/2 -translate-y-1/2 flex items-center',
                              // Sizing & Spacing
                              'pl-4 py-1.5',
                              // Backgrounds & Borders
                              'bg-gradient-to-l from-muted/40 via-background/90 to-transparent',
                              // Interactive & States
                              'opacity-0 group-hover:opacity-100 transition-opacity',
                            )}
                          >
                            <ButtonGroup>
                              {!isActive && (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    store.setActiveContextId(ctx.id);
                                    toast.success(`Activated env: ${ctx.name}`);
                                  }}
                                  title="Set Active"
                                >
                                  <CheckIcon className="size-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(ctx);
                                }}
                                title="Edit"
                              >
                                <PencilSimpleIcon className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(ctx);
                                }}
                                title="Duplicate"
                              >
                                <CopyIcon className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingContextId(ctx.id);
                                }}
                                title="Delete"
                              >
                                <TrashIcon className="size-3.5" />
                              </Button>
                            </ButtonGroup>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {filteredContexts.length === 0 && (
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex flex-col items-center justify-center text-center',
                      // Sizing & Spacing
                      'py-12 px-4 gap-2',
                      // Typography
                      'text-xs text-muted-foreground',
                    )}
                  >
                    <GlobeIcon className="size-8 text-muted-foreground/30 stroke-[1.5]" />
                    <span>
                      {searchQuery ? 'No matching envs' : 'No envs configured'}
                    </span>
                    {!searchQuery && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartCreate}
                      >
                        Add Env
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Details / Editor Column */}
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-1 flex-col min-h-0',
              // Backgrounds & Borders
              'bg-background',
            )}
          >
            <AnimatePresence mode="wait">
              {isCreating || editingContext ? (
                <motion.div
                  key={editingContext?.id || 'create'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Header with Title and Actions */}
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex items-center justify-between border-b border-border shrink-0',
                      // Sizing & Spacing
                      'p-4 gap-4',
                      // Backgrounds & Borders
                      'bg-muted/5',
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex-1 min-w-0',
                      )}
                    >
                      <Input
                        placeholder="Env Name (e.g. Production, Development)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex items-center',
                        // Sizing & Spacing
                        'gap-1.5',
                      )}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddVar}
                      >
                        <PlusIcon className="size-3.5" />
                        Add Row
                      </Button>
                    </div>
                  </div>

                  {/* Variables Table */}
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex flex-1 flex-col min-h-0',
                    )}
                  >
                    {/* Table Header */}
                    <div
                      className={cn(
                        // Layout & Positioning
                        'grid grid-cols-[36px_1fr_1.2fr_36px] border-b border-border/60 shrink-0',
                        // Sizing & Spacing
                        'gap-2 px-6 py-2',
                        // Typography
                        'text-[10px] font-semibold text-muted-foreground uppercase tracking-wider',
                        // Backgrounds & Borders
                        'bg-muted/10',
                      )}
                    >
                      <div className="text-center">Active</div>
                      <div>Key</div>
                      <div>Value</div>
                      <div className="text-center">Action</div>
                    </div>

                    {/* Table Rows */}
                    <ScrollArea className="flex-1">
                      <div
                        className={cn(
                          // Sizing & Spacing
                          'px-4 py-2 space-y-1.5',
                        )}
                      >
                        {variables.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.1, delay: Math.min(index * 0.02, 0.15) }}
                            className={cn(
                              // Layout & Positioning
                              'grid grid-cols-[36px_1fr_1.2fr_36px] items-center border border-transparent',
                              // Sizing & Spacing
                              'gap-2 p-1 rounded-lg',
                              // Backgrounds & Borders
                              'hover:border-border/50 hover:bg-muted/10',
                              // Interactive & States
                              'transition-all duration-150',
                            )}
                          >
                            <div className="flex justify-center items-center">
                              <Checkbox
                                checked={item.enabled !== false}
                                onCheckedChange={(checked) =>
                                  handleVarChange(index, 'enabled', !!checked)
                                }
                              />
                            </div>

                            <Input
                              placeholder="VARIABLE_KEY"
                              value={item.key}
                              onChange={(e) => handleVarChange(index, 'key', e.target.value)}
                            />

                            <Input
                              placeholder="Value"
                              value={item.value}
                              onChange={(e) => handleVarChange(index, 'value', e.target.value)}
                            />

                            <div className="flex justify-center items-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveVar(index)}
                                title="Delete Variable"
                              >
                                <TrashIcon className="size-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}

                        {variables.length === 0 && (
                          <div
                            className={cn(
                              // Layout & Positioning
                              'flex flex-col items-center justify-center text-center border border-dashed border-border/80',
                              // Sizing & Spacing
                              'py-16 px-4 m-2 rounded-xl',
                              // Backgrounds & Borders
                              'bg-muted/5',
                            )}
                          >
                            <GlobeIcon className="size-8 text-muted-foreground/30 stroke-[1.5] mb-2" />
                            <span
                              className={cn(
                                // Typography
                                'text-xs font-semibold text-muted-foreground mb-1',
                              )}
                            >
                              No Variables Configured
                            </span>
                            <span
                              className={cn(
                                // Sizing & Spacing
                                'max-w-[250px] mb-4',
                                // Typography
                                'text-[11px] text-muted-foreground/60',
                              )}
                            >
                              Add variables to refer to endpoint URLs, tokens, and other workspace settings dynamically.
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAddVar}
                            >
                              <PlusIcon className="size-3.5" />
                              Add First Variable
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Footer Help Bar */}
                    <div
                      className={cn(
                        // Layout & Positioning
                        'flex items-center justify-between border-t border-border shrink-0 select-none',
                        // Sizing & Spacing
                        'p-3',
                        // Typography
                        'text-[10px] text-muted-foreground',
                        // Backgrounds & Borders
                        'bg-muted/5',
                      )}
                    >
                      <span>
                        Reference variables in requests using:{' '}
                        <code className="font-mono bg-muted/40 px-1 py-0.5 rounded text-foreground">
                          {'{{variable_key}}'}
                        </code>
                      </span>
                    </div>
                  </div>

                  {/* Dialog Footer */}
                  <div
                    className={cn(
                      // Layout & Positioning
                      'flex justify-end border-t border-border shrink-0',
                      // Sizing & Spacing
                      'p-4',
                      // Backgrounds & Borders
                      'bg-muted/5',
                    )}
                  >
                    <ButtonGroup>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!name.trim()}
                      >
                        Save Env
                      </Button>
                    </ButtonGroup>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/5"
                >
                  <h3
                    className={cn(
                      // Typography
                      'text-sm font-semibold tracking-tight text-foreground',
                    )}
                  >
                    Envs & Variables
                  </h3>
                  <p
                    className={cn(
                      // Sizing & Spacing
                      'max-w-[280px] mt-1.5',
                      // Typography
                      'text-xs text-muted-foreground/70 leading-relaxed',
                    )}
                  >
                    Configure env variables to hold sets of key-value variables. You can easily switch active envs to run requests under different contexts.
                  </p>
                  <p
                    className={cn(
                      // Sizing & Spacing
                      'max-w-[260px] mt-2.5',
                      // Typography
                      'text-[11px] text-muted-foreground/50 leading-relaxed',
                    )}
                  >
                    Reference active variables in URLs, queries, and headers using double braces, e.g.{' '}
                    <code className="font-mono bg-muted px-1 rounded">{'{{base_url}}'}</code>.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleStartCreate}
                    className={"mt-2"}
                  >
                    <PlusIcon className="size-3.5" />
                    Create Env
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

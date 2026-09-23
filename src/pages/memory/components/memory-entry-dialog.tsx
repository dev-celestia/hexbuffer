import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { MEMORY_TYPES } from '../constants';
import type { MemoryPageState } from '../hooks/use-memory-page';
import type { SaveMemoryPayload } from '../types';

interface MemoryEntryDialogProps {
  state: MemoryPageState;
}

export function MemoryEntryDialog({ state }: Readonly<MemoryEntryDialogProps>) {
  const {
    isEntryDialogOpen,
    setIsEntryDialogOpen,
    editingItem,
    handleSaveEntry,
    selectedNamespace,
  } = state;

  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [namespace, setNamespace] = React.useState('default');
  const [memoryType, setMemoryType] = React.useState('fact');
  const [importance, setImportance] = React.useState('0.5');
  const [tagsInput, setTagsInput] = React.useState('');
  const [source, setSource] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (isEntryDialogOpen) {
      if (editingItem) {
        setTitle(editingItem.title);
        setContent(editingItem.content);
        setNamespace(editingItem.namespace || 'default');
        setMemoryType(editingItem.memoryType || 'fact');
        setImportance(editingItem.importance.toString());
        setTagsInput(editingItem.tags.join(', '));
        setSource(editingItem.source || '');
      } else {
        setTitle('');
        setContent('');
        setNamespace(selectedNamespace || 'default');
        setMemoryType('fact');
        setImportance('0.5');
        setTagsInput('');
        setSource('');
      }
    }
  }, [isEntryDialogOpen, editingItem, selectedNamespace]);

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload: SaveMemoryPayload = {
      title: title.trim(),
      content: content.trim(),
      namespace: namespace.trim() || 'default',
      memoryType,
      importance: parseFloat(importance) || 0.5,
      tags,
      source: source.trim() || undefined,
    };

    try {
      setSaving(true);
      await handleSaveEntry(payload);
    } catch {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          "sm:max-w-[580px]"
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              // Typography
              "font-semibold"
            )}
          >
            {editingItem ? 'Edit Memory Entry' : 'Add Memory Entry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-3.5",

              // Sizing & Spacing
              "py-2"
            )}
          >
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label leading="tight">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input textSize="xs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Target GraphQL Introspection Enabled, API Token, Admin URL"
                className="h-8"
                autoFocus
              />
            </div>

            {/* Row: Namespace, Type, Importance */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Namespace */}
              <div className="flex flex-col gap-1.5">
                <Label leading="tight">Namespace</Label>
                <Input textSize="xs" mono
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  placeholder="default"
                  className="h-8"
                />
              </div>

              {/* Memory Type */}
              <div className="flex flex-col gap-1.5">
                <Label leading="tight">Type</Label>
                <Select
                  value={memoryType}
                  // Base UI reports a cleared selection as `null`. `all` is filtered out of the
                  // options, so this field must always hold a concrete type — absorb the clear.
                  onValueChange={(v) => {
                    if (v !== null) setMemoryType(v);
                  }}
                >
                  <SelectTrigger leading="tight" className="h-8 capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_TYPES.filter((t) => t.id !== 'all').map((t) => (
                      <SelectItem leading="tight" key={t.id} value={t.id} className="capitalize">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Importance */}
              <div className="flex flex-col gap-1.5">
                <Label leading="tight">Priority</Label>
                <Select
                  value={importance}
                  // As above — priority is always one of the four bands.
                  onValueChange={(v) => {
                    if (v !== null) setImportance(v);
                  }}
                >
                  <SelectTrigger leading="tight" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem leading="tight" value="0.2">Low (20%)</SelectItem>
                    <SelectItem leading="tight" value="0.5">Normal (50%)</SelectItem>
                    <SelectItem leading="tight" value="0.8">High (80%)</SelectItem>
                    <SelectItem leading="tight" value="1.0">Critical (100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags & Source */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label leading="tight">Tags (comma-separated)</Label>
                <Input textSize="xs" mono
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="vuln, auth, api, scope"
                  className="h-8"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label leading="tight">Source / URL (optional)</Label>
                <Input textSize="xs"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="https://example.com/api"
                  className="h-8"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5">
              <Label leading="tight">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea leading="tight" mono
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed security observation, credential secret, reproduction steps, or context note..."
                rows={6}
                className="leading-relaxed resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button leading="tight"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEntryDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button leading="tight"
              type="submit"
              variant="default"
              size="sm"
              disabled={!canSave || saving}
            >
              {saving ? 'Saving…' : editingItem ? 'Update Memory' : 'Save Memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

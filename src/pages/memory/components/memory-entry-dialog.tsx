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
              "text-sm font-semibold"
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
              <Label className="text-xs font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Target GraphQL Introspection Enabled, API Token, Admin URL"
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            {/* Row: Namespace, Type, Importance */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Namespace */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Namespace</Label>
                <Input
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  placeholder="default"
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Memory Type */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={memoryType} onValueChange={setMemoryType}>
                  <SelectTrigger className="h-8 text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_TYPES.filter((t) => t.id !== 'all').map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs capitalize">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Importance */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={importance} onValueChange={setImportance}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.2" className="text-xs">Low (20%)</SelectItem>
                    <SelectItem value="0.5" className="text-xs">Normal (50%)</SelectItem>
                    <SelectItem value="0.8" className="text-xs">High (80%)</SelectItem>
                    <SelectItem value="1.0" className="text-xs">Critical (100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags & Source */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Tags (comma-separated)</Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="vuln, auth, api, scope"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Source / URL (optional)</Label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="https://example.com/api"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed security observation, credential secret, reproduction steps, or context note..."
                rows={6}
                className="text-xs font-mono leading-relaxed resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEntryDialogOpen(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!canSave || saving}
              className="text-xs"
            >
              {saving ? 'Saving…' : editingItem ? 'Update Memory' : 'Save Memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

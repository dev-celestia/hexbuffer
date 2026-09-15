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
  Textarea,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { MemoryState } from '../hooks/use-memory';

interface MemoryEntryDialogProps {
  state: MemoryState;
}

export function MemoryEntryDialog({ state }: Readonly<MemoryEntryDialogProps>) {
  const { dialogOpen, setDialogOpen, editingEntry, handleSaveEntry } = state;

  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (dialogOpen) {
      if (editingEntry) {
        setTitle(editingEntry.title);
        setContent(editingEntry.content);
        setTagsInput(editingEntry.tags.join(', '));
        setUrl(editingEntry.url ?? '');
      } else {
        setTitle('');
        setContent('');
        setTagsInput('');
        setUrl('');
      }
    }
  }, [dialogOpen, editingEntry]);

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    try {
      setSaving(true);
      await handleSaveEntry({
        title: title.trim(),
        content: content.trim(),
        tags,
        url: url.trim() || undefined,
      });
    } catch {
      // toast already shown in hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          "sm:max-w-[560px]"
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              // Typography
              "text-sm font-semibold"
            )}
          >
            {editingEntry ? 'Edit Memory Note' : 'Add Memory Note'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              // Layout & Positioning
              "space-y-3.5",

              // Sizing & Spacing
              "py-2"
            )}
          >
            {/* Title */}
            <div
              className={cn(
                // Layout & Positioning
                "space-y-1.5"
              )}
            >
              <Label
                htmlFor="context-title"
                className={cn(
                  // Typography
                  "text-xs font-medium"
                )}
              >
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="context-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Admin GraphQL Authorization Bypass"
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-full",

                  // Typography
                  "text-xs"
                )}
                autoFocus
              />
            </div>

            {/* Content */}
            <div
              className={cn(
                // Layout & Positioning
                "space-y-1.5"
              )}
            >
              <Label
                htmlFor="context-content"
                className={cn(
                  // Typography
                  "text-xs font-medium"
                )}
              >
                Content / Notes <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="context-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the reference notes, findings, reproduction steps, or credentials to remember…"
                rows={7}
                className={cn(
                  // Sizing & Spacing
                  "w-full",

                  // Typography
                  "text-xs font-mono resize-y"
                )}
              />
            </div>

            {/* Tags */}
            <div
              className={cn(
                // Layout & Positioning
                "space-y-1.5"
              )}
            >
              <Label
                htmlFor="context-tags"
                className={cn(
                  // Typography
                  "text-xs font-medium"
                )}
              >
                Tags (comma separated)
              </Label>
              <Input
                id="context-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. auth, bypass, scope, p1"
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-full",

                  // Typography
                  "text-xs"
                )}
              />
            </div>

            {/* URL */}
            <div
              className={cn(
                // Layout & Positioning
                "space-y-1.5"
              )}
            >
              <Label
                htmlFor="context-url"
                className={cn(
                  // Typography
                  "text-xs font-medium"
                )}
              >
                Target URL (optional)
              </Label>
              <Input
                id="context-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://target.com/api/admin"
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-full",

                  // Typography
                  "text-xs"
                )}
              />
            </div>
          </div>

          <DialogFooter
            className={cn(
              // Layout & Positioning
              "flex justify-end gap-2 pt-2"
            )}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="default"
              disabled={!canSave || saving}
            >
              {saving ? 'Saving…' : editingEntry ? 'Save Changes' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

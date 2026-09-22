import * as React from 'react';
import { GitForkIcon } from '@phosphor-icons/react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { EDGE_RELATIONS } from '../constants';
import type { MemoryPageState } from '../hooks/use-memory-page';

interface MemoryLinkDialogProps {
  state: MemoryPageState;
}

export function MemoryLinkDialog({ state }: Readonly<MemoryLinkDialogProps>) {
  const {
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    selectedEntry,
    entries,
    handleLinkEntries,
  } = state;

  const [targetId, setTargetId] = React.useState('');
  const [relation, setRelation] = React.useState('references');
  const [linking, setLinking] = React.useState(false);

  const candidateEntries = React.useMemo(
    () => entries.filter((e) => e.id !== selectedEntry?.id),
    [entries, selectedEntry]
  );

  React.useEffect(() => {
    if (isLinkDialogOpen) {
      setTargetId(candidateEntries[0]?.id ?? '');
      setRelation('references');
    }
  }, [isLinkDialogOpen, candidateEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !relation || linking) return;

    try {
      setLinking(true);
      await handleLinkEntries(targetId, relation);
    } catch {
      // toast in hook
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
      <DialogContent
        className={cn(
          // Layout & Positioning
          "sm:max-w-[460px]"
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2",

              // Typography
              "font-semibold"
            )}
          >
            <GitForkIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span>Link Memory Relationship</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-3 py-2 text-xs"
            )}
          >
            {/* From Source */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Source Memory</Label>
              <div
                className={cn(
                  // Sizing & Spacing
                  "p-2 rounded border border-border/70 truncate",

                  // Backgrounds & Borders
                  "bg-muted/40 font-medium text-foreground"
                )}
              >
                {selectedEntry?.title}
              </div>
            </div>

            {/* Relation Type */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Relationship</Label>
              <Select
                value={relation}
                // Base UI reports a cleared selection as `null`; a link always has a relation.
                onValueChange={(v) => {
                  if (v !== null) setRelation(v);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDGE_RELATIONS.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.label} ({r.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Memory */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Target Memory</Label>
              {candidateEntries.length === 0 ? (
                <div className="text-muted-foreground p-2 border border-dashed rounded text-xs">
                  No other memory entries available in store.
                </div>
              ) : (
                <Select
                  value={targetId}
                  // `''` is this field's own "nothing chosen" sentinel — the trigger renders a
                  // placeholder for it — so a cleared selection maps back onto it instead of being
                  // absorbed.
                  onValueChange={(v) => setTargetId(v ?? '')}
                >
                  <SelectTrigger className="h-8 text-xs truncate">
                    <SelectValue placeholder="Select target memory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateEntries.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-xs">
                        <span className="font-medium">{e.title}</span>{' '}
                        <span className="text-muted-foreground font-mono">[{e.memoryType}]</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLinkDialogOpen(false)}
              disabled={linking}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!targetId || linking}
              className="text-xs"
            >
              {linking ? 'Linking…' : 'Create Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

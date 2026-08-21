import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { Plus, Trash, UploadSimple, Check, X } from '@phosphor-icons/react';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useState } from 'react';
import { toast } from 'sonner';
import type { TargetHash, HashType } from '../types';
import { HASH_OPTIONS } from '../constants';

interface TargetHashPanelProps {
  targets: TargetHash[];
  defaultAlgorithm: HashType;
  onTargetsChange: (targets: TargetHash[]) => void;
  disabled: boolean;
}

export function TargetHashPanel({
  targets,
  defaultAlgorithm,
  onTargetsChange,
  disabled,
}: TargetHashPanelProps) {
  const [inputHash, setInputHash] = useState('');
  const [inputAlgorithm, setInputAlgorithm] = useState<HashType>(defaultAlgorithm);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const addSingleHash = () => {
    const trimmed = inputHash.trim();
    if (!trimmed) {
      toast.error('Please enter a hash value');
      return;
    }

    const newTarget: TargetHash = {
      id: `target-${Date.now()}-${Math.random()}`,
      hash: trimmed,
      algorithm: inputAlgorithm,
      cracked: false,
    };

    onTargetsChange([...targets, newTarget]);
    setInputHash('');
    toast.success('Target hash added');
  };

  const addBulkHashes = () => {
    const lines = bulkInput.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      toast.error('Please enter at least one hash');
      return;
    }

    const newTargets: TargetHash[] = lines.map((line, idx) => ({
      id: `target-bulk-${Date.now()}-${idx}`,
      hash: line.trim(),
      algorithm: inputAlgorithm,
      cracked: false,
    }));

    onTargetsChange([...targets, ...newTargets]);
    setBulkInput('');
    setBulkMode(false);
    toast.success(`Added ${newTargets.length} target hashes`);
  };

  const removeTarget = (id: string) => {
    onTargetsChange(targets.filter((t) => t.id !== id));
    toast.success('Target hash removed');
  };

  const clearAll = () => {
    onTargetsChange([]);
    toast.success('All targets cleared');
  };

  const importFromFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'Hash lists', extensions: ['txt', 'hash', 'lst'] },
          { name: 'All files', extensions: ['*'] },
        ],
      });

      if (selected && typeof selected === 'string') {
        const text = await readTextFile(selected);
        const lines = text.split('\n').filter((line) => line.trim());

        const newTargets: TargetHash[] = lines.map((line, idx) => ({
          id: `target-file-${Date.now()}-${idx}`,
          hash: line.trim(),
          algorithm: inputAlgorithm,
          cracked: false,
        }));

        onTargetsChange([...targets, ...newTargets]);
        toast.success(`Imported ${newTargets.length} hashes from file`);
        return;
      }
    } catch {
      // Fallback to web input if native fails
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.hash';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const lines = text.split('\n').filter((line) => line.trim());

          const newTargets: TargetHash[] = lines.map((line, idx) => ({
            id: `target-file-${Date.now()}-${idx}`,
            hash: line.trim(),
            algorithm: inputAlgorithm,
            cracked: false,
          }));

          onTargetsChange([...targets, ...newTargets]);
          toast.success(`Imported ${newTargets.length} hashes from file`);
        } catch {
          toast.error('Failed to read file');
        }
      };

      input.click();
    }
  };

  const crackedCount = targets.filter((t) => t.cracked).length;
  const totalCount = targets.length;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "h-10 px-3 gap-2",

          // Backgrounds & Borders
          "border-b border-border/40 bg-muted/15 backdrop-blur-md",

          // Typography
          "select-none"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-baseline",

            // Sizing & Spacing
            "gap-2.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            )}
          >
            Target Hashes
          </span>
          <span
            className={cn(
              // Typography
              "text-[10px] text-muted-foreground font-mono"
            )}
          >
            {crackedCount > 0 ? `${crackedCount}/${totalCount} cracked` : `${totalCount} loaded`}
          </span>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setBulkMode(!bulkMode)}
            disabled={disabled}
          >
            {bulkMode ? 'Single' : 'Bulk'}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={importFromFile}
            disabled={disabled}
          >
            <UploadSimple className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={clearAll}
            disabled={disabled || totalCount === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Input Area */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col shrink-0",

          // Sizing & Spacing
          "p-3 gap-2.5",

          // Backgrounds & Borders
          "border-b border-border/40 bg-muted/5"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <div
            className={cn(
              // Sizing & Spacing
              "w-48"
            )}
          >
            <Select
              value={inputAlgorithm}
              onValueChange={(v) => setInputAlgorithm(v as HashType)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HASH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!bulkMode ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex-1 min-w-0"
              )}
            >
              <Input
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="Enter hash value (hex string)..."
                disabled={disabled}
                onKeyDown={(e) => e.key === 'Enter' && addSingleHash()}
              />
            </div>
            <Button
              size="xs"
              onClick={addSingleHash}
              disabled={disabled || !inputHash.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Paste multiple hashes (one per line)..."
              disabled={disabled}
              className={cn(
                // Layout & Positioning
                "w-full resize-none",

                // Sizing & Spacing
                "h-24 p-2",

                // Typography
                "font-mono text-xs text-foreground",

                // Backgrounds & Borders
                "rounded-md border border-border/60 bg-background",

                // Interactive & States
                "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              )}
            />
            <div
              className={cn(
                // Layout & Positioning
                "flex justify-end"
              )}
            >
              <Button
                size="xs"
                onClick={addBulkHashes}
                disabled={disabled || !bulkInput.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                Add {bulkInput.split('\n').filter((l) => l.trim()).length} Hashes
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Target List */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 overflow-y-auto",

          // Sizing & Spacing
          "p-2 gap-1.5"
        )}
      >
        {targets.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center flex-1",

              // Sizing & Spacing
              "gap-2 p-8",

              // Typography
              "text-center"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-medium text-muted-foreground"
              )}
            >
              No target hashes added yet
            </span>
            <span
              className={cn(
                // Typography
                "text-[11px] text-muted-foreground/70"
              )}
            >
              Add hashes individually, bulk paste, or import from wordlist file
            </span>
          </div>
        ) : (
          targets.map((target) => (
            <div
              key={target.id}
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between",

                // Sizing & Spacing
                "p-2.5 gap-2",

                // Backgrounds & Borders
                "rounded-md border",
                target.cracked
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-muted/20 border-border/40",

                // Interactive & States
                "hover:bg-muted/40 transition-colors group"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center flex-1 min-w-0",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                {target.cracked ? (
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}

                <div
                  className={cn(
                    // Layout & Positioning
                    "flex flex-col flex-1 min-w-0",

                    // Sizing & Spacing
                    "gap-0.5"
                  )}
                >
                  <div
                    className={cn(
                      // Typography
                      "text-xs font-mono truncate",
                      target.cracked ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}
                    title={target.hash}
                  >
                    {target.hash}
                  </div>

                  {target.plaintext && (
                    <div
                      className={cn(
                        // Typography
                        "text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold truncate"
                      )}
                    >
                      → {target.plaintext}
                    </div>
                  )}

                  <div
                    className={cn(
                      // Typography
                      "text-[10px] text-muted-foreground/70 uppercase"
                    )}
                  >
                    {HASH_OPTIONS.find((h) => h.value === target.algorithm)?.label ||
                      target.algorithm}
                    {target.crackedAt && (
                      <span className="ml-2">
                        • Cracked {new Date(target.crackedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Interactive & States
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => removeTarget(target.id)}
                  disabled={disabled}
                  title="Remove target"
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      {targets.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "h-8 px-3 gap-2",

            // Backgrounds & Borders
            "border-t border-border/40 bg-muted/10",

            // Typography
            "text-[11px] text-muted-foreground"
          )}
        >
          <span>Total: {totalCount}</span>
          <span>Pending: {totalCount - crackedCount}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Cracked: {crackedCount}
          </span>
        </div>
      )}
    </div>
  );
}

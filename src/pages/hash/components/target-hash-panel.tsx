import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
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
          "flex items-center justify-between",

          // Sizing & Spacing
          "h-11 px-3 gap-2",

          // Backgrounds & Borders
          "border-b border-border bg-muted/20",

          // Typography
          "select-none"
        )}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
            Target Hashes
          </span>
          <span className="text-[10px] text-muted-foreground">
            {crackedCount > 0 ? `${crackedCount}/${totalCount} cracked` : `${totalCount} loaded`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setBulkMode(!bulkMode)}
            disabled={disabled}
            className="h-7 text-[11px] px-2"
          >
            {bulkMode ? 'Single' : 'Bulk'}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={importFromFile}
            disabled={disabled}
            className="h-7 text-[11px] gap-1 px-2"
          >
            <UploadSimple className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={clearAll}
            disabled={disabled || totalCount === 0}
            className="h-7 text-[11px] px-2"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Input Area */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "p-3 gap-3",

          // Backgrounds & Borders
          "border-b border-border/50 bg-muted/5"
        )}
      >
        <div className="flex gap-2">
          <Select
            value={inputAlgorithm}
            onValueChange={(v) => setInputAlgorithm(v as HashType)}
            disabled={disabled}
          >
            <SelectTrigger className="w-44 h-9 text-xs">
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

        {!bulkMode ? (
          <div className="flex gap-2">
            <Input
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="Enter hash value (hex or string)"
              disabled={disabled}
              onKeyDown={(e) => e.key === 'Enter' && addSingleHash()}
              className="flex-1 h-9 text-xs font-mono"
            />
            <Button
              size="sm"
              onClick={addSingleHash}
              disabled={disabled || !inputHash.trim()}
              className="h-9 gap-1.5 px-3"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Paste multiple hashes (one per line)..."
              disabled={disabled}
              className="min-h-[120px] text-xs font-mono resize-none"
            />
            <Button
              size="sm"
              onClick={addBulkHashes}
              disabled={disabled || !bulkInput.trim()}
              className="h-9 gap-1.5 self-end"
            >
              <Plus className="h-4 w-4" />
              Add {bulkInput.split('\n').filter((l) => l.trim()).length} Hashes
            </Button>
          </div>
        )}
      </div>

      {/* Target List */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 overflow-y-auto",

          // Sizing & Spacing
          "p-2 gap-1"
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
            <span className="text-sm text-muted-foreground">No target hashes added yet</span>
            <span className="text-xs text-muted-foreground/70">
              Add hashes manually or import from a file
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
                "p-2 gap-2",

                // Backgrounds & Borders
                "rounded border",
                target.cracked
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-muted/30 border-border/50",

                // Interactive & States
                "hover:bg-muted/50 transition-colors group"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {target.cracked ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}

                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                  <div
                    className={cn(
                      // Typography
                      "text-xs font-mono truncate",
                      target.cracked ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={target.hash}
                  >
                    {target.hash}
                  </div>

                  {target.plaintext && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-mono truncate">
                      → {target.plaintext}
                    </div>
                  )}

                  <div className="text-[10px] text-muted-foreground/60 uppercase">
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

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTarget(target.id)}
                disabled={disabled}
                className={cn(
                  // Sizing & Spacing
                  "h-7 w-7 shrink-0",

                  // Interactive & States
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-destructive/20 hover:text-destructive"
                )}
              >
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      {targets.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between",

            // Sizing & Spacing
            "h-9 px-3 gap-2",

            // Backgrounds & Borders
            "border-t border-border bg-muted/10",

            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          <span>Total: {totalCount}</span>
          <span>Pending: {totalCount - crackedCount}</span>
          <span className="text-green-600 dark:text-green-400">Cracked: {crackedCount}</span>
        </div>
      )}
    </div>
  );
}

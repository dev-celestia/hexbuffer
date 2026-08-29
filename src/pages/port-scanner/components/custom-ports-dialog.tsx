import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@celestia-project/ui';
import {
  ListBulletsIcon,
  TrashIcon,
  CheckIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { parsePorts, formatPortsSummary } from '../lib/port-helpers';
import { PORT_PRESETS } from '../constants';

interface CustomPortsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ports: string;
  onSavePorts: (ports: string) => void;
}

export function CustomPortsDialog({
  open,
  onOpenChange,
  ports,
  onSavePorts,
}: CustomPortsDialogProps) {
  const [draft, setDraft] = useState(ports);

  // Sync draft when opened
  useEffect(() => {
    if (open) {
      setDraft(ports);
    }
  }, [open, ports]);

  const parsed = useMemo(() => parsePorts(draft), [draft]);
  const summary = useMemo(() => formatPortsSummary(parsed), [parsed]);

  const handleApply = useCallback(() => {
    onSavePorts(draft);
    onOpenChange(false);
  }, [draft, onSavePorts, onOpenChange]);

  const handleAppendPreset = useCallback((presetString: string) => {
    setDraft((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetString;
      return `${trimmed}, ${presetString}`;
    });
  }, []);

  const handleClear = useCallback(() => {
    setDraft('');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ListBulletsIcon className="size-4 text-primary" />
              Custom Port List Editor
            </DialogTitle>
            <Badge variant="outline">
              {summary}
            </Badge>
          </div>
          <DialogDescription>
            Enter custom ports, sequential ranges, or paste multi-line wordlists with flexible pattern matching.
          </DialogDescription>
        </DialogHeader>

        {/* Quick presets / Shortcuts */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center",

            // Sizing & Spacing
            "gap-1.5 py-1"
          )}
        >
          <span
            className={cn(
              // Sizing & Spacing
              "mr-1",

              // Typography
              "text-xs font-semibold text-muted-foreground"
            )}
          >
            Quick Add:
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleAppendPreset('80, 443, 8080, 8443, 3000, 5000, 8000, 8888')}
          >
            + Web Ports
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleAppendPreset('3306, 5432, 1433, 1521, 27017, 6379, 9200')}
          >
            + DB Ports
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleAppendPreset(PORT_PRESETS.Top100)}
          >
            + Top 100
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleAppendPreset('1-1024')}
          >
            + 1 - 1024
          </Button>
          {draft.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClear}
              className={cn(
                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:text-destructive"
              )}
            >
              <TrashIcon className="size-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Textarea Input */}
        <div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Examples:\n80, 443, 8080\n1 - 4\n3000..3010\n80/tcp\nweb, db`}
            rows={7}
            className={cn(
              // Typography
              "font-mono text-xs"
            )}
          />
        </div>

        {/* Supported Patterns Guide */}
        <div
          className={cn(
            // Layout & Positioning
            "space-y-1.5",

            // Sizing & Spacing
            "p-3",

            // Typography
            "text-xs text-muted-foreground",

            // Backgrounds & Borders
            "rounded-lg bg-muted/40"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5",

              // Typography
              "font-medium text-foreground text-xs"
            )}
          >
            <SparkleIcon className="size-3.5 text-primary" />
            <span>Supported Pattern Syntax</span>
          </div>
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2",

              // Sizing & Spacing
              "gap-x-4 gap-y-1 pt-1",

              // Typography
              "font-mono text-[11px]"
            )}
          >
            <div><span className="text-foreground font-semibold">1,2,3,4</span> <span className="text-muted-foreground font-sans">➔ comma separated</span></div>
            <div><span className="text-foreground font-semibold">1 - 4</span> <span className="text-muted-foreground font-sans">➔ range with spaces</span></div>
            <div><span className="text-foreground font-semibold">3000..3010</span> <span className="text-muted-foreground font-sans">➔ double-dot range</span></div>
            <div><span className="text-foreground font-semibold">80/tcp</span> <span className="text-muted-foreground font-sans">➔ port with protocol</span></div>
            <div><span className="text-foreground font-semibold">web, db</span> <span className="text-muted-foreground font-sans">➔ named shortcuts</span></div>
            <div><span className="text-foreground font-semibold">\n (multiline)</span> <span className="text-muted-foreground font-sans">➔ one per line</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleApply}
          >
            <CheckIcon className="size-3.5 mr-1" />
            Apply Ports ({parsed.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

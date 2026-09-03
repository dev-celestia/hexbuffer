import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@celestia-project/ui';
import {
  ArrowSquareOutIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { MockRoute } from '../../types';
import { ALL_METHODS, METHOD_COLORS } from './constants';

interface EditorHeaderProps {
  readonly route: MockRoute;
  readonly editingHeader: boolean;
  readonly editMethod: string;
  readonly editPath: string;
  readonly dynamicParams: string[];
  readonly displayMatchSummary: () => string;
  readonly onSetEditingHeader: (v: boolean) => void;
  readonly onSetEditMethod: (v: string) => void;
  readonly onSetEditPath: (v: string) => void;
  readonly onSaveHeader: () => void;
  readonly onCancelHeader: () => void;
  readonly onClone: () => void;
  readonly onSendToRepeater: () => void;
  readonly onDelete: (id: string) => void;
}

export function EditorHeader({
  route,
  editingHeader,
  editMethod,
  editPath,
  dynamicParams,
  displayMatchSummary,
  onSetEditingHeader,
  onSetEditMethod,
  onSetEditPath,
  onSaveHeader,
  onCancelHeader,
  onClone,
  onSendToRepeater,
  onDelete,
}: EditorHeaderProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col shrink-0",

        // Backgrounds & Borders
        "border-b bg-muted/10"
      )}
    >
      {editingHeader ? (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2 p-2.5"
          )}
        >
          <Select
            value={editMethod}
            onValueChange={(v) => { if (v) onSetEditMethod(v); }}
          >
            <SelectTrigger
              className={cn(
                // Sizing & Spacing
                "h-7 w-24",

                // Typography
                "text-xs font-mono font-semibold",

                // Backgrounds & Borders
                "bg-muted/40 border-border"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_METHODS.map((m) => (
                <SelectItem
                  key={m}
                  value={m}
                  className={cn(
                    // Typography
                    "text-xs font-mono",
                    METHOD_COLORS[m] ?? ""
                  )}
                >
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={editPath}
            onChange={(e) => onSetEditPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onSaveHeader(); }
              else if (e.key === 'Escape') { e.preventDefault(); onCancelHeader(); }
            }}
            placeholder="/path or https://api.example.com/path"
            className={cn(
              // Sizing & Spacing
              "h-7 flex-1",

              // Typography
              "font-mono text-xs",

              // Backgrounds & Borders
              "bg-muted/40",

              // Interactive & States
              "focus-visible:ring-1 focus-visible:ring-primary"
            )}
            autoFocus
          />
          <Button size="sm" onClick={onSaveHeader}>Save</Button>
          <Button size="sm" variant="ghost" onClick={onCancelHeader}>Cancel</Button>
        </div>
      ) : (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2.5 p-2.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-xs font-mono",
              METHOD_COLORS[route.method] ?? ""
            )}
          >
            {route.method}
          </span>
          <span
            className={cn(
              // Layout & Positioning
              "truncate",

              // Typography
              "font-mono text-xs font-medium text-foreground"
            )}
          >
            {displayMatchSummary()}
          </span>
          {dynamicParams.map((p) => (
            <Badge
              key={p}
              variant="secondary"
              className={cn(
                // Typography
                "font-mono text-[10px] text-primary"
              )}
              title={`Dynamic route parameter :${p}. Use {{${p}}} in template.`}
            >
              :{p}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSetEditingHeader(true)}
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "h-6 w-6 p-0",

              // Typography
              "text-muted-foreground hover:text-foreground",

              // Interactive & States
              "cursor-pointer"
            )}
            title="Edit method & path"
          >
            <PencilSimpleIcon className={cn("h-3 w-3")} />
          </Button>

          <div
            className={cn(
              // Layout & Positioning
              "ml-auto flex items-center",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <Button variant="outline" size="sm" onClick={onSendToRepeater}>
              <ArrowSquareOutIcon />
              Repeater
            </Button>
            <Button variant="outline" size="sm" onClick={onClone} title="Clone override rule">
              Clone
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => onDelete(route.id)}
              title="Delete override rule"
            >
              <TrashIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

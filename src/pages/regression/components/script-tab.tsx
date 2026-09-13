import { CheckCircleIcon, FloppyDiskIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Input,
  ScrollArea,
  Spinner,
  TextEditor,
  Textarea,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import type { ScriptDraft, ValidationResult } from '../types';
import { SEVERITY_CLASS } from '../constants';

interface ScriptTabProps {
  draft: ScriptDraft;
  validation: ValidationResult | null;
  conditionCount: number;
  isDirty: boolean;
  isSaving: boolean;
  isValidating: boolean;
  onChange: (patch: Partial<ScriptDraft>) => void;
  onValidate: () => void;
  onSave: () => void;
}

export function ScriptTab({
  draft,
  validation,
  conditionCount,
  isDirty,
  isSaving,
  isValidating,
  onChange,
  onValidate,
  onSave,
}: ScriptTabProps) {
  const { theme } = useTheme();
  const hasErrors = (validation?.errors.length ?? 0) > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col min-h-0 h-full'
      )}
    >
      {/* Meta fields */}
      <div
        className={cn(
          // Layout & Positioning
          'grid grid-cols-2 gap-3 shrink-0',

          // Sizing & Spacing
          'p-4 pb-3'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col gap-1.5'
          )}
        >
          <label
            className={cn(
              // Typography
              'text-[11px] font-semibold text-muted-foreground'
            )}
          >
            Name
          </label>
          <Input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Test case name"
          />
        </div>
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col gap-1.5'
          )}
        >
          <label
            className={cn(
              // Typography
              'text-[11px] font-semibold text-muted-foreground'
            )}
          >
            Target URL
          </label>
          <Input
            value={draft.targetUrl}
            onChange={(e) => onChange({ targetUrl: e.target.value })}
            placeholder="https://target.example.com"
          />
        </div>
        <div
          className={cn(
            // Layout & Positioning
            'col-span-2 flex flex-col gap-1.5'
          )}
        >
          <label
            className={cn(
              // Typography
              'text-[11px] font-semibold text-muted-foreground'
            )}
          >
            Description
          </label>
          <Textarea
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What does this regression test case verify?"
          />
        </div>
      </div>

      {/* YAML editor */}
      <div
        className={cn(
          // Layout & Positioning
          'flex-1 min-h-0 relative',

          // Backgrounds & Borders
          'bg-background'
        )}
      >
        <TextEditor
          value={draft.yaml}
          onChange={(val) => onChange({ yaml: val ?? '' })}
          language="yaml"
          height="100%"
          theme={theme}
        />
      </div>

      {/* Footer: conditions + actions */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center gap-3 shrink-0',

          // Sizing & Spacing
          'px-4 py-2.5',

          // Backgrounds & Borders
          'border-t bg-muted/10'
        )}
      >
        <span
          className={cn(
            // Typography
            'text-[11px] text-muted-foreground'
          )}
        >
          {conditionCount > 0
            ? `${conditionCount} condition${conditionCount === 1 ? '' : 's'} detected`
            : 'No conditions detected yet'}
        </span>

        {validation && (
          <span
            className={cn(
              // Layout & Positioning
              'flex items-center gap-1',

              // Typography
              'text-[11px] font-semibold',

              // Interactive & States
              validation.valid ? 'text-emerald-500' : 'text-red-500'
            )}
          >
            {validation.valid ? (
              <CheckCircleIcon className="h-3.5 w-3.5" />
            ) : (
              <WarningCircleIcon className="h-3.5 w-3.5" />
            )}
            {validation.valid ? 'Valid script' : `${validation.errors.length} error(s)`}
          </span>
        )}

        <div
          className={cn(
            // Layout & Positioning
            'ml-auto flex items-center gap-2'
          )}
        >
          <Button variant="outline" size="sm" onClick={onValidate} disabled={isValidating}>
            {isValidating && <Spinner className="h-3 w-3" />}
            Validate
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Spinner className="h-3 w-3" /> : <FloppyDiskIcon className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      {/* Validation diagnostics */}
      {validation && validation.errors.length > 0 && (
        <ScrollArea
          className={cn(
            // Sizing & Spacing
            'max-h-24 shrink-0',

            // Backgrounds & Borders
            'border-t bg-red-500/5'
          )}
        >
          <div
            className={cn(
              // Sizing & Spacing
              'p-2.5 flex flex-col gap-1',

              // Typography
              'text-[11px] font-mono text-red-400'
            )}
          >
            {validation.errors.map((error, i) => (
              <span key={i}>{error}</span>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Detected conditions summary */}
      {validation && validation.templates.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-wrap items-center gap-1.5 shrink-0',

            // Sizing & Spacing
            'px-4 py-2',

            // Backgrounds & Borders
            'border-t'
          )}
        >
          {validation.templates.map((template) => (
            <Badge
              key={template.id}
              variant="outline"
              className={cn(
                // Typography
                'text-[9px] font-mono',

                // Backgrounds & Borders
                'border',
                SEVERITY_CLASS[template.severity] ?? SEVERITY_CLASS.info
              )}
            >
              {template.id}
            </Badge>
          ))}
        </div>
      )}

      {isDirty && (
        <div
          className={cn(
            // Sizing & Spacing
            'px-4 py-1.5 shrink-0',

            // Typography
            'text-[10px] text-amber-500',

            // Backgrounds & Borders
            'border-t bg-amber-500/5'
          )}
        >
          Unsaved changes — the Run tab uses the last saved version.
        </div>
      )}
    </div>
  );
}

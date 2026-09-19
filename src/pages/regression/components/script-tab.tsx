import {
  CheckCircleIcon,
  FloppyDiskIcon,
  WarningCircleIcon,
  WarningDiamondIcon,
} from '@phosphor-icons/react';
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
import { PaneHeader } from './pane-header';

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

const FIELD_LABEL_CLASS = cn(
  // Typography
  'text-[11px] font-semibold text-muted-foreground'
);

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
}: Readonly<ScriptTabProps>) {
  const { theme } = useTheme();
  const errors = validation?.errors ?? [];
  const hasErrors = errors.length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex h-full min-h-0 flex-col'
      )}
    >
      {/* Meta fields */}
      <div
        className={cn(
          // Layout & Positioning
          'grid shrink-0 grid-cols-2 gap-3',

          // Sizing & Spacing
          'border-b border-border/60 p-3'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex min-w-0 flex-col gap-1.5'
          )}
        >
          <label className={FIELD_LABEL_CLASS} htmlFor="regression-name">
            Name
          </label>
          <Input
            id="regression-name"
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Test case name"
          />
        </div>
        <div
          className={cn(
            // Layout & Positioning
            'flex min-w-0 flex-col gap-1.5'
          )}
        >
          <label className={FIELD_LABEL_CLASS} htmlFor="regression-target">
            Target URL
          </label>
          <Input
            id="regression-target"
            value={draft.targetUrl}
            onChange={(e) => onChange({ targetUrl: e.target.value })}
            placeholder="https://target.example.com"
            className="font-mono"
          />
        </div>
        <div
          className={cn(
            // Layout & Positioning
            'col-span-2 flex min-w-0 flex-col gap-1.5'
          )}
        >
          <label className={FIELD_LABEL_CLASS} htmlFor="regression-description">
            Description
          </label>
          <Textarea
            id="regression-description"
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What does this regression test case verify?"
            rows={2}
          />
        </div>
      </div>

      {/* YAML editor */}
      <div
        className={cn(
          // Layout & Positioning
          'relative flex min-h-0 flex-1 flex-col',

          // Backgrounds & Borders
          'bg-background'
        )}
      >
        <PaneHeader
          label="Nuclei YAML"
          meta={
            conditionCount > 0
              ? `${conditionCount} condition${conditionCount === 1 ? '' : 's'}`
              : 'No conditions detected'
          }
        />
        <div className="min-h-0 flex-1">
          <TextEditor
            value={draft.yaml}
            onChange={(val) => onChange({ yaml: val ?? '' })}
            language="yaml"
            height="100%"
            theme={theme}
          />
        </div>
      </div>

      {/* Validation diagnostics */}
      {hasErrors && (
        <ScrollArea
          className={cn(
            // Sizing & Spacing
            'max-h-24 shrink-0',

            // Backgrounds & Borders
            'border-t border-red-500/30 bg-red-500/5'
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col gap-1',

              // Sizing & Spacing
              'p-2.5',

              // Typography
              'font-mono text-[11px] text-red-600 dark:text-red-400'
            )}
          >
            {errors.map((error, i) => (
              <span key={i} className="flex items-start gap-1.5">
                <WarningCircleIcon className="mt-0.5 size-3 shrink-0" weight="fill" />
                <span className="break-all">{error}</span>
              </span>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Detected conditions summary */}
      {validation && validation.templates.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            'flex shrink-0 flex-wrap items-center gap-1.5',

            // Sizing & Spacing
            'border-t border-border/60 px-3 py-2'
          )}
        >
          {validation.templates.map((template) => (
            <Badge
              key={template.id}
              variant="outline"
              className={cn(
                // Typography
                'font-mono text-[10px]',

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

      {/* Footer: validation state + actions */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center gap-3',

          // Sizing & Spacing
          'border-t border-border/60 px-3 py-2.5'
        )}
      >
        {validation ? (
          <span
            className={cn(
              // Layout & Positioning
              'flex items-center gap-1',

              // Typography
              'text-[11px] font-semibold',
              validation.valid
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {validation.valid ? (
              <CheckCircleIcon className="size-3.5" weight="fill" />
            ) : (
              <WarningCircleIcon className="size-3.5" weight="fill" />
            )}
            {validation.valid ? 'Valid script' : `${errors.length} error(s)`}
          </span>
        ) : (
          <span
            className={cn(
              // Typography
              'text-[11px] text-muted-foreground'
            )}
          >
            Not validated yet
          </span>
        )}

        {isDirty && (
          <span
            className={cn(
              // Layout & Positioning
              'flex items-center gap-1',

              // Typography
              'text-[11px] text-amber-600 dark:text-amber-400'
            )}
          >
            <WarningDiamondIcon className="size-3.5" />
            Unsaved changes — Run uses the last saved version
          </span>
        )}

        <div
          className={cn(
            // Layout & Positioning
            'ms-auto flex items-center gap-2'
          )}
        >
          <Button variant="outline" size="sm" onClick={onValidate} disabled={isValidating}>
            {isValidating && <Spinner className="size-3" />}
            Validate
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Spinner className="size-3" /> : <FloppyDiskIcon className="size-3.5" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

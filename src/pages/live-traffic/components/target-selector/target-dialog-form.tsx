import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  DialogFooter,
  Input,
  Textarea,
} from '@celestia-project/ui';
import * as React from 'react';
import { useTargetStore } from '@/stores/target';
import { TrashIcon, CheckIcon, PlusIcon, GlobeIcon, TagIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Target } from '@/types';

interface TargetDialogFormProps {
  target?: Target | null;
  onCancel: () => void;
  onSaved: () => void;
}

interface FormValues {
  name: string;
  description: string;
  scope: string;
}

interface FormErrors {
  name?: string;
  scope?: string;
}

function parseScopePatterns(scope: string) {
  return scope
    .split(/[\n,]/)
    .map((pattern) => pattern.trim())
    .filter(Boolean);
}

function createTargetId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `target-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TargetDialogForm({ target, onCancel, onSaved }: TargetDialogFormProps) {
  const addTarget = useTargetStore((state) => state.addTarget);
  const removeTarget = useTargetStore((state) => state.removeTarget);
  const updateTarget = useTargetStore((state) => state.updateTarget);
  const [values, setValues] = React.useState<FormValues>({
    name: target?.name ?? '',
    description: target?.description ?? '',
    scope: target?.scope.join('\n') ?? '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setValues({
      name: target?.name ?? '',
      description: target?.description ?? '',
      scope: target?.scope.join('\n') ?? '',
    });
    setErrors({});
  }, [target]);

  const parsedPatterns = React.useMemo(() => {
    return parseScopePatterns(values.scope);
  }, [values.scope]);

  const updateValue = (field: keyof FormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: event.target.value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const validateForm = (data: FormValues, normalizedScope: string[]) => {
    const nextErrors: FormErrors = {};

    if (!data.name.trim()) {
      nextErrors.name = 'Target name is required';
    }

    if (normalizedScope.length === 0) {
      nextErrors.scope = 'At least one valid scope pattern is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveTarget = async () => {
    if (isSubmitting) {
      return;
    }

    const data = {
      name: values.name.trim(),
      description: values.description.trim(),
      scope: values.scope,
    };
    const normalizedScope = parseScopePatterns(data.scope);

    if (!validateForm(data, normalizedScope)) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (target) {
        updateTarget(target.id, {
          name: data.name,
          description: data.description,
          scope: normalizedScope,
        });
      } else {
        const now = new Date().toISOString();
        addTarget({
          id: createTargetId(),
          name: data.name,
          description: data.description,
          scope: normalizedScope,
          createdAt: now,
          updatedAt: now,
          tabActive: true,
        });
      }

      onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveTarget();
  };

  const deleteTarget = () => {
    if (!target) {
      return;
    }

    removeTarget(target.id);
    onSaved();
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-4 py-1"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "gap-3.5"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          <label
            htmlFor="name"
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between",

              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Target Name
            <span
              className={cn(
                // Typography
                "text-[10px] font-normal text-muted-foreground"
              )}
            >
              Required
            </span>
          </label>
          <Input
            id="name"
            placeholder="e.g., Production API & Web"
            value={values.name}
            onChange={updateValue('name')}
            className={cn(
              // Sizing & Spacing
              "h-8 text-xs"
            )}
          />
          {errors.name && (
            <p
              className={cn(
                // Sizing & Spacing
                "mt-1",

                // Typography
                "text-[11px] font-medium text-destructive"
              )}
            >
              {errors.name}
            </p>
          )}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          <label
            htmlFor="description"
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between",

              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            Description
            <span
              className={cn(
                // Typography
                "text-[10px] font-normal text-muted-foreground"
              )}
            >
              Optional
            </span>
          </label>
          <Input
            id="description"
            placeholder="e.g., Main customer portal scope definition"
            value={values.description}
            onChange={updateValue('description')}
            className={cn(
              // Sizing & Spacing
              "h-8 text-xs"
            )}
          />
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between"
            )}
          >
            <label
              htmlFor="scope"
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5",

                // Typography
                "text-xs font-semibold text-foreground"
              )}
            >
              <GlobeIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3.5",

                  // Typography
                  "text-muted-foreground"
                )}
              />
              Scope Patterns
            </label>
            {parsedPatterns.length > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "px-1.5 py-0.5",

                  // Typography
                  "text-[10px] font-medium text-primary",

                  // Backgrounds & Borders
                  "border-primary/20 bg-primary/10"
                )}
              >
                {parsedPatterns.length} rule{parsedPatterns.length === 1 ? '' : 's'} parsed
              </Badge>
            )}
          </div>
          <Textarea
            id="scope"
            placeholder="*.example.com&#10;api.example.com"
            rows={3}
            value={values.scope}
            onChange={updateValue('scope')}
            className={cn(
              // Sizing & Spacing
              "resize-none",

              // Typography
              "font-mono text-xs"
            )}
          />
          {errors.scope ? (
            <p
              className={cn(
                // Typography
                "text-[11px] font-medium text-destructive"
              )}
            >
              {errors.scope}
            </p>
          ) : (
            <p
              className={cn(
                // Typography
                "text-[11px] text-muted-foreground/80"
              )}
            >
              Separate multiple wildcard patterns or domain names with new lines or commas.
            </p>
          )}

          {parsedPatterns.length > 0 && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "mt-2 pt-2 gap-1.5",

                // Backgrounds & Borders
                "border-t border-border/50"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-1",

                  // Typography
                  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                )}
              >
                <TagIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3"
                  )}
                />
                Scope Preview
              </div>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-wrap overflow-y-auto",

                  // Sizing & Spacing
                  "max-h-[64px] gap-1"
                )}
              >
                {parsedPatterns.map((pattern, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className={cn(
                      // Sizing & Spacing
                      "px-1.5 py-0",

                      // Typography
                      "font-mono text-[10px] text-foreground"
                    )}
                  >
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between sm:justify-between",

          // Sizing & Spacing
          "pt-2",

          // Backgrounds & Borders
          "border-t border-border/40"
        )}
      >
        {target ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button type="button" variant="destructive" size="sm">
                  <TrashIcon />
                  <span>Delete</span>
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Target?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Permanent removal of{' '}
                  <span className="font-semibold text-foreground">{target.name}</span> will clear
                  its stored scope rules.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  size="xs"
                  variant="destructive"
                  onClick={deleteTarget}
                >
                  Delete Target
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div />
        )}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={() => void saveTarget()}
          >
            {target ? (
              <>
                <CheckIcon />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <PlusIcon />
                <span>Create Target</span>
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

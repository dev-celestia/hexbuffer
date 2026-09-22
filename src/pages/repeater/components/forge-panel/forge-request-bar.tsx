import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@celestia-project/ui';
import * as React from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ColorizedUrlInput } from '@/pages/repeater/components/select-env-input';
import { useCollectionsStore } from '@/stores/collections';
import { getMethodTreatment } from '../../lib/method-styles';
import {
  PlusIcon,
  PaperPlaneTiltIcon,
  FloppyDiskIcon,
  GearSixIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { sendCraftRequest, saveActiveEndpoint } from '@/triggers/repeater/craft';
import { deleteEndpoint } from '@/triggers/repeater/management';
import { ContextsDialog } from '../contexts-dialog';

interface ForgeRequestBarProps {
  method: string;
  url: string;
  activeEndpoint: { id: string; name: string } | null;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

/**
 * Two deliberate rows, both built on the 28px control height the design system's `SelectTrigger`
 * and the colourised URL input already use:
 *
 *   1. environment + endpoint actions
 *   2. the request line — method, URL, Send
 *
 * Every control is 28px tall so the two rows share one rhythm; nothing is nudged with padding.
 */
export function ForgeRequestBar({
  method,
  url,
  activeEndpoint,
  onMethodChange,
  onUrlChange,
}: Readonly<ForgeRequestBarProps>) {
  const activeContextId = useCollectionsStore((s) => s.activeContextId);
  const contexts = useCollectionsStore((s) => s.contexts);
  const [contextsDialogOpen, setContextsDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const activeContext = contexts.find((c) => c.id === activeContextId) ?? null;
  const methodTreatment = getMethodTreatment(method);

  const handleDelete = React.useCallback(async () => {
    if (!activeEndpoint) return;
    const endpointName = activeEndpoint.name;
    try {
      await deleteEndpoint(activeEndpoint.id);
      toast.success(`Request "${endpointName}" deleted`);
      setDeleteDialogOpen(false);
    } catch {
      toast.error(`Failed to delete request "${endpointName}"`);
    }
  }, [activeEndpoint]);

  return (
    <>
      {/* ── Row 1: environment + endpoint actions ── */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between',

          // Sizing & Spacing
          'w-full min-w-0 gap-2'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex min-w-0 items-center',

            // Sizing & Spacing
            'gap-1.5'
          )}
        >
          <Select
            value={activeContextId || 'no-context'}
            onValueChange={(val) => {
              if (val === '__manage_envs__') {
                setContextsDialogOpen(true);
                return;
              }
              useCollectionsStore.getState().setActiveContextId(val === 'no-context' ? null : val);
            }}
          >
            <SelectTrigger
              className={cn(
                // Sizing & Spacing
                'w-44',

                // Typography
                'text-xs font-medium'
              )}
              title="Active environment"
            >
              <SelectValue placeholder="No Environment">
                <span
                  className={cn(
                    // Layout & Positioning
                    'flex items-center',

                    // Sizing & Spacing
                    'gap-1.5'
                  )}
                >
                  <span
                    className={cn(
                      // Sizing & Spacing
                      'size-1.5 shrink-0',

                      // Backgrounds & Borders
                      'rounded-full',
                      activeContext ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                    )}
                  />
                  <span className="truncate">{activeContext?.name ?? 'No Environment'}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-context">No Environment</SelectItem>
              {contexts.map((ctx) => (
                <SelectItem key={ctx.id} value={ctx.id}>
                  {ctx.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="__manage_envs__">
                <PlusIcon className="size-3.5" />
                Add Environment
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="ghost"
            className={cn(
              // Sizing & Spacing
              'size-7',

              // Interactive & States
              'text-muted-foreground hover:text-foreground'
            )}
            title="Manage environments"
            aria-label="Manage environments"
            onClick={() => setContextsDialogOpen(true)}
          >
            <GearSixIcon className="size-3.5" />
          </Button>
        </div>

        {activeEndpoint && (
          <div
            className={cn(
              // Layout & Positioning
              'flex min-w-0 items-center',

              // Sizing & Spacing
              'gap-1.5'
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                'hidden truncate sm:block',

                // Sizing & Spacing
                'max-w-[220px]',

                // Typography
                'text-xs text-muted-foreground'
              )}
              title={activeEndpoint.name}
            >
              {activeEndpoint.name}
            </span>
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                void saveActiveEndpoint();
              }}
            >
              <FloppyDiskIcon className="size-3.5" />
              Save
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                // Sizing & Spacing
                'size-7',

                // Interactive & States
                'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              )}
              title="Delete request"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Row 2: the request line ── */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-start',

          // Sizing & Spacing
          'w-full min-w-0 gap-2'
        )}
      >
        <Select value={method} onValueChange={onMethodChange}>
          <SelectTrigger mono
            className={cn(
              // Sizing & Spacing
              'w-[104px] shrink-0',

              // Typography
              'font-semibold'
            )}
          >
            <SelectValue>
              <span
                className={cn(
                  // Layout & Positioning
                  'flex items-center',

                  // Sizing & Spacing
                  'gap-1.5'
                )}
              >
                <span
                  className={cn(
                    // Sizing & Spacing
                    'size-1.5 shrink-0',

                    // Backgrounds & Borders
                    'rounded-full',
                    methodTreatment.rail
                  )}
                />
                <span className={methodTreatment.text}>{method || 'GET'}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem mono
                key={m}
                value={m}
                className={cn(
                  // Typography
                  'font-semibold',
                  getMethodTreatment(m).text
                )}
              >
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ColorizedUrlInput
          placeholder="Enter request URL (e.g. https://api.example.com/v1/users)"
          className={cn(
            // Typography
            'text-xs'
          )}
          value={url}
          onChange={onUrlChange}
        />

        <Button
          size="default"
          className={cn(
            // Sizing & Spacing
            'h-7'
          )}
          onClick={() => {
            void sendCraftRequest();
          }}
        >
          <PaperPlaneTiltIcon className="size-3.5" />
          Send
        </Button>
      </div>

      <ContextsDialog open={contextsDialogOpen} onOpenChange={setContextsDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeEndpoint
                ? `"${activeEndpoint.name}" will be permanently deleted. This action cannot be undone.`
                : 'This request will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                void handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
  ButtonGroup,
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
import { METHOD_COLORS } from '@/lib/status-colors';
import { useCollectionsStore } from '@/stores/collections';
import { PlusIcon, PaperPlaneTiltIcon, FloppyDiskIcon, GearSixIcon, TrashIcon } from '@phosphor-icons/react';
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

export function ForgeRequestBar({
  method,
  url,
  activeEndpoint,
  onMethodChange,
  onUrlChange,
}: ForgeRequestBarProps) {
  const activeContextId = useCollectionsStore((s) => s.activeContextId);
  const contexts = useCollectionsStore((s) => s.contexts);
  const [contextsDialogOpen, setContextsDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

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
      <div className="flex space-x-2 shrink-0 w-full min-w-0 justify-between">
        <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-7 w-7"
          title="Environment Settings"
          onClick={() => setContextsDialogOpen(true)}
        >
          <GearSixIcon className="size-3.5" />
        </Button>

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
          <SelectTrigger className="h-7 w-36 font-medium text-xs">
            <SelectValue placeholder="No Environment">
              {contexts.find((c) => c.id === activeContextId)?.name || 'No Environment'}
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
        
        </div>
        

        <div className='flex gap-2'>
 {activeEndpoint && (
          <div className='flex gap-2'>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { void saveActiveEndpoint(); }}
            >
              <FloppyDiskIcon className="size-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        )}
        </div>
       
      </div>

      <div className="flex space-x-2 shrink-0 w-full min-w-0 items-start">
        <Select value={method} onValueChange={onMethodChange}>
          <SelectTrigger className="w-28 font-semibold h-8">
            {method ? (
              <span className={METHOD_COLORS[method]}>{method}</span>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m} className={cn('font-semibold', METHOD_COLORS[m])}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ColorizedUrlInput
          placeholder="Enter request URL (e.g. https://api.example.com/v1/users)"
          className="text-sm"
          value={url}
          onChange={onUrlChange}
        />

        <Button
          size="sm"
          onClick={() => { void sendCraftRequest(); }}
          className="h-6"
        >
          <PaperPlaneTiltIcon className="size-3.5" /> Send
        </Button>
      </div>

      <ContextsDialog open={contextsDialogOpen} onOpenChange={setContextsDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
            <AlertDialogDescription>
              This request will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { void handleDelete(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

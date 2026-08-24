import {
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

import { cn } from '@/lib/utils';
import { ColorizedUrlInput } from '@/pages/repeater/components/select-env-input';
import { METHOD_COLORS } from '@/lib/status-colors';
import { useCollectionsStore } from '@/stores/collections';
import { PlusIcon, PaperPlaneTiltIcon, FloppyDiskIcon } from '@phosphor-icons/react';
import { sendCraftRequest, saveActiveEndpoint } from '@/triggers/repeater/craft';
import { ContextsDialog } from '../ContextsDialog';

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

  return (
    <>
      <div className="flex space-x-2 shrink-0 w-full min-w-0 justify-end">
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
          <SelectTrigger className="h-7 w-32 font-medium text-xs">
            <SelectValue placeholder="No Env">
              {contexts.find((c) => c.id === activeContextId)?.name || 'No Env'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-context">No Env</SelectItem>
            {contexts.map((ctx) => (
              <SelectItem key={ctx.id} value={ctx.id}>
                {ctx.name}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value="__manage_envs__">
              <PlusIcon className="size-3.5" />
              Add Env
            </SelectItem>
          </SelectContent>
        </Select>


          {activeEndpoint && (
            <Button
              size="sm"
              variant={"outline"}
              onClick={() => { void saveActiveEndpoint(); }}
            >
              <FloppyDiskIcon className="size-3.5" />

              Save
            </Button>
          )}
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
            className={"h-6"}
          >
            <PaperPlaneTiltIcon className="size-3.5" /> Send
          </Button>
          
      </div>

    

      <ContextsDialog open={contextsDialogOpen} onOpenChange={setContextsDialogOpen} />
    </>
  );
}

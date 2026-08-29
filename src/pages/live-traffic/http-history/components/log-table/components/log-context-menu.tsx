import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@celestia-project/ui';
import { memo } from 'react';

import { CopyIcon, PlusIcon, TrashIcon, PaperPlaneTiltIcon, PushPinSimpleIcon, PushPinSimpleSlashIcon, ProhibitIcon, PaletteIcon } from '@phosphor-icons/react';
import type { ApiCall } from '@/types';
import { useLogContextMenu } from './hooks/use-log-context-menu';
import { CollectionPickerSubmenu } from '@/triggers/repeater/collection-picker-submenu';

interface LogEntryContextMenuProps {
  call: ApiCall;
  children: React.ReactNode;
  onDelete?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  onNewGroup?: (call: ApiCall) => void;
}

export const LogEntryContextMenu = memo(function LogEntryContextMenu({
  call,
  children,
  onDelete,
  onOpenChange,
  onNewGroup,
}: LogEntryContextMenuProps) {
  const {
    pinned,
    groups,
    requestGroupIds,
    addRequestToGroup,
    removeRequestFromGroup,
    handleQuickAddToGroup,
    handleTogglePin,
    handleCopyCurlCommand,
    handleCopyUrl,
    handleAddToScope,
    handleOpenInInvoker,
    handleSendToCollection,
    handleSendToIntercept,
    handleSendToResponseOverride,
    // handleOpenInBrowserAutomation,
    handleSendToNotes,
    handleDelete,
    handleBlacklistHost,
    handleBlacklistHostAndPath,
    handleHighlightHost,
    handleRemoveHighlight,
    highlightColor,
    highlightColors,
    highlightColorLabels,
  } = useLogContextMenu({ call, onDelete });

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="p-0.5">
        <ContextMenuItem onClick={handleCopyCurlCommand} className='text-xs py-1 px-1.5'>
          <CopyIcon className="mr-1.5 size-3" /> Copy as curl command (bash)
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyUrl} className='text-xs py-1 px-1.5'>
          <CopyIcon className="mr-1.5 size-3" /> Copy URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleTogglePin} className='text-xs py-1 px-1.5'>
          {pinned
            ? <><PushPinSimpleSlashIcon className="mr-1.5 size-3" /> Unpin</>
            : <><PushPinSimpleIcon className="mr-1.5 size-3" /> Pin </>
          }
        </ContextMenuItem>
        <ContextMenuSeparator />
        {groups.length === 0 ? (
          <ContextMenuItem onClick={handleQuickAddToGroup} className='text-xs py-1 px-1.5'>
            <PlusIcon className="mr-1.5 size-3" /> Add to Group
          </ContextMenuItem>
        ) : (
          <ContextMenuSub>
            <ContextMenuSubTrigger className='text-xs py-1 px-1.5'>
              <PlusIcon className="mr-1.5 size-3" /> Add to Group
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {groups.map((g) => (
                <ContextMenuItem
                  key={g.id}
                  className='text-xs py-1 px-1.5'
                  onClick={() => addRequestToGroup(g.id, call)}
                >
                  <span className="mr-1.5 size-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                  {g.name}
                  {requestGroupIds.includes(g.id) && <span className="ml-auto text-muted-foreground">✓</span>}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem className='text-xs py-1 px-1.5' onClick={() => onNewGroup?.(call)}>
                <PlusIcon className="mr-1.5 size-3" /> New Group…
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        {requestGroupIds.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className='text-xs py-1 px-1.5'>
              Remove from Group
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {requestGroupIds.map((gid) => {
                const g = groups.find((gr) => gr.id === gid);
                if (!g) return null;
                return (
                  <ContextMenuItem
                    key={g.id}
                    className='text-xs py-1 px-1.5'
                    onClick={() => removeRequestFromGroup(g.id, call.id)}
                  >
                    <span className="mr-1.5 size-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.name}
                  </ContextMenuItem>
                );
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleAddToScope} className='text-xs py-1 px-1.5'>
          <PlusIcon className="mr-1.5 size-3" /> Add to Target
        </ContextMenuItem>
        <ContextMenuItem onClick={handleOpenInInvoker} className='text-xs py-1 px-1.5'>
          <PaperPlaneTiltIcon className="mr-1.5 size-3" /> Send to Intruder
        </ContextMenuItem>

        <CollectionPickerSubmenu
          variant="context"
          onSelect={(stashId) => { void handleSendToCollection(stashId); }}
        />
        <ContextMenuItem onClick={handleSendToIntercept} className='text-xs py-1 px-1.5'>
          <PaperPlaneTiltIcon className="mr-1.5 size-3" /> Send to Intercept
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSendToResponseOverride} className='text-xs py-1 px-1.5'>
          <PaperPlaneTiltIcon className="mr-1.5 size-3" /> Send to API Override
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSendToNotes} className='text-xs py-1 px-1.5'>
          <PaperPlaneTiltIcon className="mr-1.5 size-3" /> Send to Notes
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger className='text-xs py-1 px-2'>
            <PaletteIcon className="mr-3 size-3" /> Highlight
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {highlightColors.map((color) => (
              <ContextMenuItem
                key={color}
                className='text-xs py-1 px-1.5'
                onClick={() => handleHighlightHost(color)}
              >
                <span className="mr-2 size-2 rounded-full" style={{ backgroundColor: color }} />
                {highlightColorLabels[color] || color}
                {highlightColor === color && <span className="ml-auto text-muted-foreground">✓</span>}
              </ContextMenuItem>
            ))}
            {highlightColor && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-xs py-1 px-1.5"
                  onClick={handleRemoveHighlight}
                >
                  Remove Highlight
                </ContextMenuItem>
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleBlacklistHost} className='text-xs py-1 px-1.5'>
          <ProhibitIcon className="mr-1.5 size-3" /> Blacklist Host
        </ContextMenuItem>
        <ContextMenuItem onClick={handleBlacklistHostAndPath} className='text-xs py-1 px-1.5'>
          <ProhibitIcon className="mr-1.5 size-3" /> Blacklist Host + Path
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} variant="destructive" className='text-xs py-1 px-1.5'>
          <TrashIcon className="mr-1.5 size-3" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

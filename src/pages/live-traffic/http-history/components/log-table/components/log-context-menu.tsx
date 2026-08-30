import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@celestia-project/ui';
import { memo } from 'react';
import { DotsThreeVerticalIcon } from '@phosphor-icons/react';

import type { ApiCall } from '@/types';
import { cn } from '@/lib/utils';
import { CollectionPickerSubmenu } from '@/triggers/repeater/collection-picker-submenu';
import {
  type LogMenuVariant,
  type LogSubmenuItemData,
} from '../constants';
import { useLogMenuItems } from './hooks/use-log-menu-items';

export type { LogMenuVariant } from '../constants';

export interface LogMenuItemsProps {
  call: ApiCall;
  variant: LogMenuVariant;
  onNewGroup?: (call: ApiCall) => void;
  onDelete?: (id: string) => void;
}

function renderSubmenuItem(
  item: LogSubmenuItemData,
  Item: typeof DropdownMenuItem | typeof ContextMenuItem,
  Separator: typeof DropdownMenuSeparator | typeof ContextMenuSeparator
) {
  if (item.type === 'separator') {
    return <Separator key={item.key} />;
  }

  const Icon = item.icon;
  const dotSize = item.colorDotSize || 'size-1.5';

  return (
    <Item
      key={item.key}
      className="text-xs"
      onClick={item.onClick}
      disabled={item.disabled}
    >
      {item.colorDot && (
        <span
          className={cn('mr-2 rounded-full', dotSize)}
          style={{ backgroundColor: item.colorDot }}
        />
      )}
      {Icon && <Icon className="mr-2 size-3" />}
      {item.label}
      {item.isChecked && <span className="ml-auto text-muted-foreground">✓</span>}
    </Item>
  );
}

export const LogMenuItems = memo(function LogMenuItems({
  call,
  variant,
  onNewGroup,
  onDelete,
}: LogMenuItemsProps) {
  const { menuItems, handleSendToCollection } = useLogMenuItems({
    call,
    onDelete,
    onNewGroup,
  });

  const Sub = variant === 'dropdown' ? DropdownMenuSub : ContextMenuSub;
  const SubTrigger = variant === 'dropdown' ? DropdownMenuSubTrigger : ContextMenuSubTrigger;
  const SubContent = variant === 'dropdown' ? DropdownMenuSubContent : ContextMenuSubContent;
  const Item = variant === 'dropdown' ? DropdownMenuItem : ContextMenuItem;
  const Separator = variant === 'dropdown' ? DropdownMenuSeparator : ContextMenuSeparator;

  return (
    <>
      {menuItems.map((entry) => {
        if (entry.type === 'separator') {
          return <Separator key={entry.key} />;
        }

        if (entry.type === 'repeater-collection') {
          return (
            <CollectionPickerSubmenu
              key={entry.key}
              variant={variant}
              onSelect={(stashId) => {
                void handleSendToCollection(stashId);
              }}
            />
          );
        }

        if (entry.type === 'submenu') {
          const Icon = entry.icon;
          return (
            <Sub key={entry.key}>
              <SubTrigger className="text-xs">
                {Icon && <Icon className="mr-2 size-3" />}
                {entry.label}
              </SubTrigger>
              <SubContent>
                {entry.items.map((subItem) =>
                  renderSubmenuItem(subItem, Item, Separator)
                )}
              </SubContent>
            </Sub>
          );
        }

        const Icon = entry.icon;
        return (
          <Item
            key={entry.key}
            onClick={entry.onClick}
            variant={entry.variant}
            className="text-xs"
            disabled={entry.disabled}
          >
            {Icon && <Icon className="mr-2 size-3" />}
            {entry.label}
          </Item>
        );
      })}
    </>
  );
});

export interface LogEntryContextMenuProps {
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
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="p-0.5">
        <LogMenuItems
          call={call}
          variant="context"
          onNewGroup={onNewGroup}
          onDelete={onDelete}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

export interface CallActionCellProps {
  call: ApiCall;
  onNewGroup?: (call: ApiCall) => void;
  onDelete?: (id: string) => void;
}

export const CallActionCell = memo(function CallActionCell({
  call,
  onNewGroup,
  onDelete,
}: CallActionCellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            // Layout & Positioning
            'p-0',

            // Sizing & Spacing
            'h-6 w-6'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThreeVerticalIcon className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <LogMenuItems
          call={call}
          variant="dropdown"
          onNewGroup={onNewGroup}
          onDelete={onDelete}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

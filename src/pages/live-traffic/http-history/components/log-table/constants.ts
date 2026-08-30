import type React from "react";
import {
  CopyIcon,
  PaletteIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  ProhibitIcon,
  PushPinSimpleIcon,
  PushPinSimpleSlashIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import type { ApiCall } from "@/types";
import type { GroupDefinition } from "@/stores/history";

export type LogMenuVariant = "dropdown" | "context";

export type LogSubmenuItemData =
  | {
      type: "item";
      key: string;
      label: React.ReactNode;
      icon?: React.ComponentType<{ className?: string }>;
      colorDot?: string;
      colorDotSize?: string;
      isChecked?: boolean;
      onClick?: () => void;
      disabled?: boolean;
    }
  | {
      type: "separator";
      key: string;
    };

export type LogMenuItemData =
  | {
      type: "item";
      key: string;
      label: React.ReactNode;
      icon?: React.ComponentType<{ className?: string }>;
      onClick?: () => void;
      variant?: "default" | "destructive";
      disabled?: boolean;
    }
  | {
      type: "separator";
      key: string;
    }
  | {
      type: "submenu";
      key: string;
      label: React.ReactNode;
      icon?: React.ComponentType<{ className?: string }>;
      items: LogSubmenuItemData[];
    }
  | {
      type: "repeater-collection";
      key: string;
    };

export interface BuildLogMenuItemsParams {
  call: ApiCall;
  pinned: boolean;
  groups: GroupDefinition[];
  requestGroupIds: string[];
  highlightColor?: string;
  highlightColors: readonly string[];
  highlightColorLabels: Record<string, string>;
  onTogglePin: () => void;
  onCopyCurlCommand: () => void;
  onCopyUrl: () => void;
  onQuickAddToGroup: () => void;
  onAddRequestToGroup: (groupId: string, call: ApiCall) => void;
  onRemoveRequestFromGroup: (groupId: string, callId: string) => void;
  onNewGroup?: (call: ApiCall) => void;
  onAddToScope: () => void;
  onOpenInInvoker: () => void;
  onSendToIntercept: () => void;
  onOpenInBrowserAutomation?: () => void;
  onSendToNotes: () => void;
  onHighlightHost: (color: string) => void;
  onRemoveHighlight: () => void;
  onBlacklistHost: () => void;
  onBlacklistHostAndPath: () => void;
  onDelete: () => void;
}

export function buildLogMenuItems(params: BuildLogMenuItemsParams): LogMenuItemData[] {
  const {
    call,
    pinned,
    groups,
    requestGroupIds,
    highlightColor,
    highlightColors,
    highlightColorLabels,
    onTogglePin,
    onCopyCurlCommand,
    onCopyUrl,
    onQuickAddToGroup,
    onAddRequestToGroup,
    onRemoveRequestFromGroup,
    onNewGroup,
    onAddToScope,
    onOpenInInvoker,
    onSendToIntercept,
    onOpenInBrowserAutomation,
    onSendToNotes,
    onHighlightHost,
    onRemoveHighlight,
    onBlacklistHost,
    onBlacklistHostAndPath,
    onDelete,
  } = params;

  const items: LogMenuItemData[] = [
    {
      type: "item",
      key: "copy-curl",
      label: "Copy as curl command (bash)",
      icon: CopyIcon,
      onClick: onCopyCurlCommand,
    },
    {
      type: "item",
      key: "copy-url",
      label: "Copy URL",
      icon: CopyIcon,
      onClick: onCopyUrl,
    },
    {
      type: "separator",
      key: "sep-pin",
    },
    {
      type: "item",
      key: "pin",
      label: pinned ? "Unpin" : "Pin",
      icon: pinned ? PushPinSimpleSlashIcon : PushPinSimpleIcon,
      onClick: onTogglePin,
    },
    {
      type: "separator",
      key: "sep-groups",
    },
  ];

  // Groups section
  if (groups.length === 0) {
    items.push({
      type: "item",
      key: "add-group-quick",
      label: "Add to Group",
      icon: PlusIcon,
      onClick: onQuickAddToGroup,
    });
  } else {
    const groupSubmenuItems: LogSubmenuItemData[] = groups.map((g) => ({
      type: "item",
      key: `group-${g.id}`,
      label: g.name,
      colorDot: g.color,
      isChecked: requestGroupIds.includes(g.id),
      onClick: () => onAddRequestToGroup(g.id, call),
    }));

    groupSubmenuItems.push(
      { type: "separator", key: "sep-new-group" },
      {
        type: "item",
        key: "new-group-action",
        label: "New Group…",
        icon: PlusIcon,
        onClick: () => onNewGroup?.(call),
      }
    );

    items.push({
      type: "submenu",
      key: "add-to-group-sub",
      label: "Add to Group",
      icon: PlusIcon,
      items: groupSubmenuItems,
    });
  }

  if (requestGroupIds.length > 0) {
    const removeItems: LogSubmenuItemData[] = [];
    for (const gid of requestGroupIds) {
      const g = groups.find((gr) => gr.id === gid);
      if (g) {
        removeItems.push({
          type: "item",
          key: `remove-group-${g.id}`,
          label: g.name,
          colorDot: g.color,
          onClick: () => onRemoveRequestFromGroup(g.id, call.id),
        });
      }
    }

    items.push({
      type: "submenu",
      key: "remove-from-group-sub",
      label: "Remove from Group",
      items: removeItems,
    });
  }

  // Tools & Navigation section
  items.push(
    {
      type: "separator",
      key: "sep-tools",
    },
    {
      type: "item",
      key: "add-to-scope",
      label: "Add to Target",
      icon: PlusIcon,
      onClick: onAddToScope,
    },
    {
      type: "item",
      key: "send-to-intruder",
      label: "Send to Intruder",
      icon: PaperPlaneTiltIcon,
      onClick: onOpenInInvoker,
    },
    {
      type: "repeater-collection",
      key: "send-to-repeater",
    },
    {
      type: "item",
      key: "send-to-intercept",
      label: "Send to Intercept",
      icon: PaperPlaneTiltIcon,
      onClick: onSendToIntercept,
    },
    {
      type: "item",
      key: "send-to-notes",
      label: "Send to Notes",
      icon: PaperPlaneTiltIcon,
      onClick: onSendToNotes,
    },
    {
      type: "separator",
      key: "sep-highlight",
    }
  );

  // Highlight submenu
  const highlightSubmenuItems: LogSubmenuItemData[] = highlightColors.map((color) => ({
    type: "item",
    key: `highlight-${color}`,
    label: highlightColorLabels[color] || color,
    colorDot: color,
    colorDotSize: "size-2",
    isChecked: highlightColor === color,
    onClick: () => onHighlightHost(color),
  }));

  if (highlightColor) {
    highlightSubmenuItems.push(
      { type: "separator", key: "sep-remove-highlight" },
      {
        type: "item",
        key: "remove-highlight-action",
        label: "Remove Highlight",
        onClick: onRemoveHighlight,
      }
    );
  }

  items.push({
    type: "submenu",
    key: "highlight-sub",
    label: "Highlight",
    icon: PaletteIcon,
    items: highlightSubmenuItems,
  });

  // Blacklist & Destructive
  items.push(
    {
      type: "separator",
      key: "sep-blacklist",
    },
    {
      type: "item",
      key: "blacklist-host",
      label: "Blacklist Host",
      icon: ProhibitIcon,
      onClick: onBlacklistHost,
    },
    {
      type: "item",
      key: "blacklist-host-path",
      label: "Blacklist Host + Path",
      icon: ProhibitIcon,
      onClick: onBlacklistHostAndPath,
    },
    {
      type: "separator",
      key: "sep-delete",
    },
    {
      type: "item",
      key: "delete",
      label: "Delete",
      icon: TrashIcon,
      variant: "destructive",
      onClick: onDelete,
    }
  );

  return items;
}

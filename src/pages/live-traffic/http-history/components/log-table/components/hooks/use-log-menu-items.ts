import { useMemo } from "react";
import type { ApiCall } from "@/types";
import { useLogEntryActions } from "@/pages/live-traffic/http-history/components/log-table/hooks/use-log-entry-actions";
import {
  useHighlightStore,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_COLOR_LABELS,
} from "@/stores/history";
import {
  buildLogMenuItems,
  type LogMenuItemData,
} from "../../constants";

export interface UseLogMenuItemsOptions {
  call: ApiCall;
  onDelete?: (id: string) => void;
  onNewGroup?: (call: ApiCall) => void;
}

export function useLogMenuItems({ call, onDelete, onNewGroup }: UseLogMenuItemsOptions) {
  const logActions = useLogEntryActions(call, onDelete);
  const highlightColor = useHighlightStore((s) => s.getHighlightColor(call.host, call.path));

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
    handleOpenInBrowserAutomation,
    handleSendToNotes,
    handleDelete,
    handleBlacklistHost,
    handleBlacklistHostAndPath,
    handleHighlightHost,
    handleRemoveHighlight,
  } = logActions;

  const menuItems = useMemo<LogMenuItemData[]>(() => {
    return buildLogMenuItems({
      call,
      pinned,
      groups,
      requestGroupIds,
      highlightColor,
      highlightColors: HIGHLIGHT_COLORS,
      highlightColorLabels: HIGHLIGHT_COLOR_LABELS,
      onTogglePin: handleTogglePin,
      onCopyCurlCommand: handleCopyCurlCommand,
      onCopyUrl: handleCopyUrl,
      onQuickAddToGroup: handleQuickAddToGroup,
      onAddRequestToGroup: addRequestToGroup,
      onRemoveRequestFromGroup: removeRequestFromGroup,
      onNewGroup,
      onAddToScope: handleAddToScope,
      onOpenInInvoker: handleOpenInInvoker,
      onSendToIntercept: handleSendToIntercept,
      onOpenInBrowserAutomation: handleOpenInBrowserAutomation,
      onSendToNotes: handleSendToNotes,
      onHighlightHost: handleHighlightHost,
      onRemoveHighlight: handleRemoveHighlight,
      onBlacklistHost: handleBlacklistHost,
      onBlacklistHostAndPath: handleBlacklistHostAndPath,
      onDelete: handleDelete,
    });
  }, [
    call,
    pinned,
    groups,
    requestGroupIds,
    highlightColor,
    handleTogglePin,
    handleCopyCurlCommand,
    handleCopyUrl,
    handleQuickAddToGroup,
    addRequestToGroup,
    removeRequestFromGroup,
    onNewGroup,
    handleAddToScope,
    handleOpenInInvoker,
    handleSendToIntercept,
    handleOpenInBrowserAutomation,
    handleSendToNotes,
    handleHighlightHost,
    handleRemoveHighlight,
    handleBlacklistHost,
    handleBlacklistHostAndPath,
    handleDelete,
  ]);

  return {
    ...logActions,
    highlightColor,
    highlightColors: HIGHLIGHT_COLORS,
    highlightColorLabels: HIGHLIGHT_COLOR_LABELS,
    menuItems,
  };
}

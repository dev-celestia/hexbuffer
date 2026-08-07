import type { ApiCall } from "@/types";
import { useLogEntryActions } from "@/pages/live-traffic/http-history/components/log-table/hooks/use-log-entry-actions";
import {
  useHighlightStore,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_COLOR_LABELS,
} from "@/stores/history";

export interface UseCallActionCellOptions {
  call: ApiCall;
}

export function useCallActionCell({ call }: UseCallActionCellOptions) {
  const logActions = useLogEntryActions(call);
  const highlightColor = useHighlightStore((s) => s.getHighlightColor(call.host, call.path));
  const removeHighlight = useHighlightStore((s) => s.removeHighlight);

  return {
    ...logActions,
    highlightColor,
    removeHighlight,
    highlightColors: HIGHLIGHT_COLORS,
    highlightColorLabels: HIGHLIGHT_COLOR_LABELS,
  };
}

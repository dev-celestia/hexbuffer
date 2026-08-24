import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import { useIntruderStore } from '@/stores/intruder';
import type { TextEditorInstance } from '@celestia-project/ui';
import {
  buildRawRequest,
  findRequestPayloadPositions,
  parseRawRequest,
} from '../../types';

export interface InvokerMarkerSuggestion {
  id: string;
  start: number;
  end: number;
  value: string;
  category: string;
  location: string;
  confidence: number;
  reason: string;
}

export interface InvokerMarkerSuggestionResponse {
  provider: string;
  model: string;
  suggestions: InvokerMarkerSuggestion[];
  candidateCount: number;
}

export function findMarkerRanges(text: string) {
  const ranges: Array<{ start: number; end: number }> = [];
  let searchStart = 0;

  while (true) {
    const start = text.indexOf('§', searchStart);
    if (start === -1) break;
    const end = text.indexOf('§', start + 1);
    if (end === -1) break;
    ranges.push({ start, end: end + 1 });
    searchStart = end + 1;
  }

  return ranges;
}

export function rangesOverlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && a.end > b.start;
}

export function validateSuggestions(text: string, suggestions: InvokerMarkerSuggestion[]) {
  const markerRanges = findMarkerRanges(text);
  const usedRanges: Array<{ start: number; end: number }> = [];

  return suggestions.filter((suggestion) => {
    if (suggestion.start < 0 || suggestion.end <= suggestion.start || suggestion.end > text.length) {
      return false;
    }

    if (text.slice(suggestion.start, suggestion.end) !== suggestion.value) {
      return false;
    }

    const range = { start: suggestion.start, end: suggestion.end };
    if (markerRanges.some((markerRange) => rangesOverlap(range, markerRange))) {
      return false;
    }

    if (usedRanges.some((usedRange) => rangesOverlap(range, usedRange))) {
      return false;
    }

    usedRanges.push(range);
    return true;
  });
}

export function applyMarkers(text: string, suggestions: InvokerMarkerSuggestion[]) {
  return [...suggestions]
    .sort((a, b) => b.start - a.start)
    .reduce((nextText, suggestion) => {
      const before = nextText.slice(0, suggestion.start);
      const value = nextText.slice(suggestion.start, suggestion.end);
      const after = nextText.slice(suggestion.end);
      return `${before}§${value}§${after}`;
    }, text);
}

export function useRequestTab() {
  const { theme } = useTheme();
  const config = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.config;
  });
  const isRunning = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.isRunning ?? false;
  });
  const updateConfig = useIntruderStore((s) => s.updateConfig);

  const [rawRequestDraft, setRawRequestDraft] = React.useState(() =>
    config ? buildRawRequest(config.base_request) : ''
  );
  const [autoMarkLoading, setAutoMarkLoading] = React.useState(false);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<InvokerMarkerSuggestion[]>([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const rawRequestEditorRef = React.useRef<TextEditorInstance | null>(null);
  const editRef = React.useRef(false);

  React.useEffect(() => {
    if (!config) return;
    if (editRef.current) {
      editRef.current = false;
      return;
    }
    setRawRequestDraft(buildRawRequest(config.base_request));
  }, [config?.base_request]);

  const updateRawRequest = React.useCallback(
    (value: string) => {
      setRawRequestDraft(value);
      const parsed = parseRawRequest(value);
      if (parsed && config) {
        updateConfig({
          base_request: {
            ...config.base_request,
            ...parsed,
          },
          positions: findRequestPayloadPositions(parsed),
        });
      }
    },
    [config, updateConfig]
  );

  const handleEditorChange = React.useCallback(
    (value: string | undefined) => {
      editRef.current = true;
      updateRawRequest(value ?? '');
    },
    [updateRawRequest]
  );

  const setEditorRef = React.useCallback((editor: TextEditorInstance) => {
    rawRequestEditorRef.current = editor;
  }, []);

  const markRawRequestTarget = React.useCallback(() => {
    const editor = rawRequestEditorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;

    if (selection.isEmpty()) {
      editor.executeEdits('marker-action', [
        {
          range: selection,
          text: '§§',
          forceMoveMarkers: true,
        },
      ]);
      const pos = editor.getPosition();
      if (pos) {
        editor.setPosition({
          lineNumber: pos.lineNumber,
          column: pos.column - 1,
        });
      }
    } else {
      const selectedText = model.getValueInRange(selection);
      if (selectedText.startsWith('§') && selectedText.endsWith('§') && selectedText.length >= 2) {
        editor.executeEdits('marker-action', [
          {
            range: selection,
            text: selectedText.slice(1, -1),
            forceMoveMarkers: true,
          },
        ]);
      } else {
        editor.executeEdits('marker-action', [
          {
            range: selection,
            text: `§${selectedText}§`,
            forceMoveMarkers: true,
          },
        ]);
      }
    }
    editor.focus();
    const nextDoc = model.getValue();
    editRef.current = true;
    updateRawRequest(nextDoc);
  }, [updateRawRequest]);

  const clearAllMarkers = React.useCallback(() => {
    const editor = rawRequestEditorRef.current;
    const model = editor?.getModel();
    const currentDoc = model ? model.getValue() : rawRequestDraft;
    if (!currentDoc.includes('§')) return;
    const next = currentDoc.replace(/§/g, '');
    if (editor && model) {
      editor.executeEdits('marker-action', [
        {
          range: model.getFullModelRange(),
          text: next,
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    }
    editRef.current = true;
    updateRawRequest(next);
  }, [rawRequestDraft, updateRawRequest]);

  const handleAutoMark = React.useCallback(async () => {
    if (!rawRequestDraft.trim()) {
      toast.error('Add a raw request before using Auto mark');
      return;
    }

    const parsed = parseRawRequest(rawRequestDraft);
    if (!parsed) {
      toast.error('Fix the raw request before using Auto mark');
      return;
    }

    setAutoMarkLoading(true);
    try {
      const response = await invoke<InvokerMarkerSuggestionResponse>('suggest_invoker_markers', {
        request: { rawRequest: rawRequestDraft },
      });
      const validSuggestions = validateSuggestions(rawRequestDraft, response.suggestions);

      if (validSuggestions.length === 0) {
        toast.info(
          response.candidateCount > 0
            ? 'AI did not find any marker suggestions to apply'
            : 'No fuzzable request inputs were found'
        );
        return;
      }

      setSuggestions(validSuggestions);
      setSelectedSuggestionIds(new Set(validSuggestions.map((suggestion) => suggestion.id)));
      setSuggestionsDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setAutoMarkLoading(false);
    }
  }, [rawRequestDraft]);

  const selectedSuggestions = React.useMemo(
    () => suggestions.filter((suggestion) => selectedSuggestionIds.has(suggestion.id)),
    [selectedSuggestionIds, suggestions]
  );

  const handleApplyAutoMarkers = React.useCallback(() => {
    const nextSuggestions = validateSuggestions(rawRequestDraft, selectedSuggestions);
    if (nextSuggestions.length === 0) {
      toast.error('Select at least one valid marker suggestion');
      return;
    }

    const nextRequest = applyMarkers(rawRequestDraft, nextSuggestions);
    const editor = rawRequestEditorRef.current;
    const model = editor?.getModel();
    if (editor && model) {
      editor.executeEdits('marker-action', [
        {
          range: model.getFullModelRange(),
          text: nextRequest,
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    }
    editRef.current = true;
    updateRawRequest(nextRequest);
    setSuggestionsDialogOpen(false);
    toast.success(`Applied ${nextSuggestions.length} marker${nextSuggestions.length === 1 ? '' : 's'}`);
  }, [rawRequestDraft, selectedSuggestions, updateRawRequest]);

  const toggleSuggestion = React.useCallback((id: string, checked: boolean) => {
    setSelectedSuggestionIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const selectAllSuggestions = React.useCallback(() => {
    setSelectedSuggestionIds(new Set(suggestions.map((item) => item.id)));
  }, [suggestions]);

  const selectNoneSuggestions = React.useCallback(() => {
    setSelectedSuggestionIds(new Set());
  }, []);

  return {
    theme,
    config,
    isRunning,
    rawRequestDraft,
    autoMarkLoading,
    suggestionsDialogOpen,
    setSuggestionsDialogOpen,
    suggestions,
    selectedSuggestions,
    selectedSuggestionIds,
    handleEditorChange,
    setEditorRef,
    markRawRequestTarget,
    clearAllMarkers,
    handleAutoMark,
    handleApplyAutoMarkers,
    toggleSuggestion,
    selectAllSuggestions,
    selectNoneSuggestions,
    markedPositionsCount: config?.positions.length ?? 0,
  };
}

export const useInvokerRequestTab = useRequestTab;

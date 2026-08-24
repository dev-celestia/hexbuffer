import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  TextEditor,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import * as React from 'react';
import { AsteriskIcon, InfoIcon, SpinnerGapIcon, TargetIcon } from '@phosphor-icons/react';
import {
  useRequestTab,
  type InvokerMarkerSuggestion,
} from '../../hooks/use-request-tab';

function HighlightedRequestPreview({
  text,
  suggestions,
}: {
  text: string;
  suggestions: InvokerMarkerSuggestion[];
}) {
  const sortedSuggestions = [...suggestions].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  sortedSuggestions.forEach((suggestion) => {
    if (suggestion.start > cursor) {
      parts.push(text.slice(cursor, suggestion.start));
    }
    parts.push(
      <mark
        key={suggestion.id}
        className="rounded-sm bg-amber-300/70 px-0.5 text-foreground dark:bg-amber-500/40"
      >
        {text.slice(suggestion.start, suggestion.end)}
      </mark>
    );
    cursor = suggestion.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return (
    <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
      {parts}
    </pre>
  );
}

export function RequestTab() {
  const {
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
    markedPositionsCount,
  } = useRequestTab();

  if (!config) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between py-1">
          <Label>Raw Request</Label>
          <div className="flex items-center gap-2">
            <Badge variant={markedPositionsCount > 0 ? 'default' : 'secondary'}>
              {markedPositionsCount} marked
            </Badge>
            <ButtonGroup>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoMark}
                disabled={isRunning || autoMarkLoading}
              >
                {autoMarkLoading ? (
                  <SpinnerGapIcon className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <AsteriskIcon className="mr-1 h-4 w-4" />
                )}
                Auto §
              </Button> */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={markRawRequestTarget}
                disabled={isRunning}
              >
                Add Mark §
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllMarkers}
                disabled={isRunning || markedPositionsCount === 0}
              >
                Clear §
              </Button>
            </ButtonGroup>
          </div>
        </div>
        <div className="h-[460px] overflow-hidden rounded-md border">
          <TextEditor
            value={rawRequestDraft}
            onChange={handleEditorChange}
            onMount={setEditorRef}
            className="text-xs [&_.cm-content]:text-xs [&_.cm-gutters]:text-[10px]"
            theme={theme}
            disableValidation
          />
        </div>
      </div>
      <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
        <DialogContent className="flex max-h-[min(780px,calc(100vh-2rem))] flex-col gap-4 overflow-hidden sm:max-w-[960px]">
          <DialogHeader>
            <DialogTitle>Confirm AI marker suggestions</DialogTitle>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-0 overflow-hidden">
              <HighlightedRequestPreview text={rawRequestDraft} suggestions={selectedSuggestions} />
            </div>

            <div className="min-h-0 max-h-full overflow-auto rounded-md border">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">
                  {selectedSuggestions.length} / {suggestions.length} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAllSuggestions}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectNoneSuggestions}
                  >
                    None
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {suggestions.map((suggestion) => (
                  <label
                    key={suggestion.id}
                    className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={selectedSuggestionIds.has(suggestion.id)}
                      onCheckedChange={(checked) => toggleSuggestion(suggestion.id, checked === true)}
                    />
                    <span className="min-w-0 space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{suggestion.category}</Badge>
                        <span className="truncate text-sm font-medium">{suggestion.location}</span>
                      </span>
                      <code className="block truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                        {suggestion.value}
                      </code>
                      <span className="block text-xs leading-relaxed text-muted-foreground">
                        {suggestion.reason}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Confidence {(suggestion.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" type="button" variant="outline" onClick={() => setSuggestionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyAutoMarkers}
              disabled={selectedSuggestions.length === 0}
            >
              Apply selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const InvokerRequestTab = RequestTab;

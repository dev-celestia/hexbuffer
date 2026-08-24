import { Badge, Label, TextEditor } from '@celestia-project/ui';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { usePreviewPanel } from './hooks/use-preview-panel';

export function IntruderPreviewPane() {
  const {
    theme,
    selectedResult,
    rawResponse,
    url,
    formattedPayload,
    statusBadge,
  } = usePreviewPanel();

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Response Detail</span>
        {selectedResult && (
          <div className="flex min-w-0 items-center gap-3">
            {statusBadge && (
              <Badge variant={statusBadge.variant} className="text-xs">
                {statusBadge.label}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {selectedResult.response_time_ms ? `${selectedResult.response_time_ms}ms` : '-'}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {selectedResult ? (
          <div className="p-4 h-full min-h-0 flex flex-col gap-4">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[72px_1fr] gap-2">
                <span className="text-muted-foreground">URL</span>
                <span className="min-w-0 truncate font-mono text-xs" title={url}>
                  {url || '-'}
                </span>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-2">
                <span className="text-muted-foreground">Payload</span>
                <span className="min-w-0 truncate font-mono text-xs" title={formattedPayload}>
                  {formattedPayload || '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-muted-foreground">Length:</span> {selectedResult.response_length ?? '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Grep:</span>{' '}
                  <Badge variant={selectedResult.grep_match ? 'default' : 'secondary'}>
                    {selectedResult.grep_match ? 'Match' : 'No'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>{' '}
                  {selectedResult.response_time_ms ? `${selectedResult.response_time_ms}ms` : '-'}
                </div>
              </div>
              {selectedResult.grep_extracted && (
                <div>
                  <span className="text-muted-foreground">Extracted:</span>{' '}
                  <span className="font-mono text-xs">{selectedResult.grep_extracted}</span>
                </div>
              )}
              {selectedResult.error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <WarningCircleIcon className="h-4 w-4" />
                  <span>{selectedResult.error}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-[320px] flex flex-col">
              <Label className="text-xs text-muted-foreground mb-1 block">Raw Response</Label>
              <div className="flex-1 min-h-0 overflow-hidden rounded-md border">
                <TextEditor
                  value={rawResponse}
                  options={{ readOnly: true }}
                  language="markdown"
                  className="text-xs [&_.cm-content]:text-xs [&_.cm-gutters]:text-[10px]"
                  theme={theme}
                  disableValidation
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a result to preview
          </div>
        )}
      </div>
    </div>
  );
}

export const InvokerPreviewPane = IntruderPreviewPane;

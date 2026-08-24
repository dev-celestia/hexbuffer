// ponytail: simplify layout by using inline split inspector instead of full-screen drawer overlay
import { Button, TextEditor } from '@celestia-project/ui';
import { XIcon, ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react';
import type { AttackConfig, AttackResult } from '../types';
import { useResultInspector } from './hooks/use-result-inspector';

export interface IntruderResultInspectorProps {
  selectedResult: AttackResult;
  config: AttackConfig;
  onClose: () => void;
}

export type InvokerResultInspectorProps = IntruderResultInspectorProps;

export function IntruderResultInspector({
  selectedResult,
  config,
  onClose,
}: IntruderResultInspectorProps) {
  const {
    theme,
    isStacked,
    toggleStacked,
    modifiedRequest,
    rawResponse,
    payloadSummary,
  } = useResultInspector({ selectedResult, config });

  return (
    <div className="flex h-full min-h-0 flex-col border-t bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result #{selectedResult.id}</span>
          <span className="text-xs text-border">|</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px] font-mono">
            {payloadSummary}
          </span>
          {selectedResult.response_time_ms && (
            <>
              <span className="text-xs text-border">|</span>
              <span className="text-xs text-muted-foreground">{selectedResult.response_time_ms}ms</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={isStacked ? "Split side-by-side" : "Stack vertically"}
            onClick={toggleStacked}
          >
            {isStacked ? <ArrowsOutIcon className="size-3.5" /> : <ArrowsInIcon className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className={`min-h-0 flex-1 grid ${isStacked ? 'grid-rows-2 divide-y' : 'grid-cols-2 divide-x'} divide-border`}>
        {/* Request Pane */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b bg-muted/10 px-3 py-1 shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground">Modified Request</span>
          </div>
          <div className="min-h-0 flex-1">
            <TextEditor
              value={modifiedRequest}
              options={{ readOnly: true }}
              language="markdown"
              className="text-xs [&_.cm-content]:text-xs [&_.cm-gutters]:text-[10px]"
              theme={theme}
              disableValidation
            />
          </div>
        </div>

        {/* Response Pane */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b bg-muted/10 px-3 py-1 shrink-0 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Captured Response</span>
            {selectedResult.response_length && (
              <span className="text-[10px] text-muted-foreground">{selectedResult.response_length} bytes</span>
            )}
          </div>
          <div className="min-h-0 flex-1">
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
    </div>
  );
}

export const InvokerResultInspector = IntruderResultInspector;

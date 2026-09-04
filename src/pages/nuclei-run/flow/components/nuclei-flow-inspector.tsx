import React from 'react';
import {
  Button,
  Badge,
} from '@celestia-project/ui';
import {
  XIcon,
  GlobeIcon,
  ShieldWarningIcon,
  TreeStructureIcon,
  CheckCircleIcon,
  LightningIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type {
  NucleiFlowNode,
  TemplateInfoNodeData,
  RequestNodeData,
  ExtractorNodeData,
  MatcherNodeData,
  FlowNodeData,
} from '../types';

interface NucleiFlowInspectorProps {
  node: NucleiFlowNode | null;
  onClose: () => void;
}

// ponytail: Read-only slide-over inspector for inspecting selected node attributes
export function NucleiFlowInspector({
  node,
  onClose,
}: NucleiFlowInspectorProps) {
  if (!node) return null;

  const { type, data } = node;

  return (
    <aside
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full overflow-hidden shrink-0",
        // Sizing & Spacing
        "w-80 lg:w-96 border-l",
        // Backgrounds & Borders
        "bg-background/95 border-border shadow-md"
      )}
    >
      {/* Inspector Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between gap-2 p-3.5 border-b shrink-0",
          // Backgrounds & Borders
          "bg-muted/15"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-2 min-w-0"
          )}
        >
          {type === 'templateInfo' && <ShieldWarningIcon className="h-4 w-4 text-primary" />}
          {type === 'requestNode' && <GlobeIcon className="h-4 w-4 text-sky-500" />}
          {type === 'extractorNode' && <TreeStructureIcon className="h-4 w-4 text-purple-500" />}
          {type === 'matcherNode' && <CheckCircleIcon className="h-4 w-4 text-emerald-500" />}
          {type === 'flowNode' && <LightningIcon className="h-4 w-4 text-amber-500" />}

          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col min-w-0"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-semibold text-foreground truncate"
              )}
            >
              Step Details
            </span>
            <span
              className={cn(
                // Typography
                "text-[10px] text-muted-foreground font-mono truncate"
              )}
            >
              {node.id}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className={cn(
            // Sizing & Spacing
            "h-7 w-7 p-0",
            // Interactive & States
            "text-muted-foreground hover:text-foreground"
          )}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Inspector Content */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 text-xs"
        )}
      >
        {/* Template Info Node */}
        {type === 'templateInfo' && (() => {
          const tData = data as unknown as TemplateInfoNodeData;
          return (
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Template Name</span>
                <p className="font-semibold text-foreground text-sm mt-0.5">{tData.name || 'Untitled'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Author</span>
                  <p className="font-mono text-xs mt-0.5 text-foreground">{tData.author || 'community'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Severity</span>
                  <div className="mt-0.5">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                      {tData.severity || 'medium'}
                    </Badge>
                  </div>
                </div>
              </div>

              {tData.description && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Description</span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed bg-muted/20 p-2 rounded border">
                    {tData.description}
                  </p>
                </div>
              )}

              {tData.tags && tData.tags.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tData.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] font-mono">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Request Node */}
        {type === 'requestNode' && (() => {
          const rData = data as unknown as RequestNodeData;
          return (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Step Identifier</span>
                  <p className="font-mono font-semibold text-foreground text-xs mt-0.5">{rData.stepId || 'http-probe'}</p>
                </div>
                <Badge variant="outline" className="font-mono font-bold text-[10px] uppercase">
                  {rData.method || 'GET'}
                </Badge>
              </div>

              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Request Path(s)</span>
                <div className="flex flex-col gap-1 mt-1">
                  {(rData.path || ['{{BaseURL}}/']).map((p, idx) => (
                    <div key={idx} className="font-mono text-[11px] bg-muted/30 px-2 py-1 rounded border text-foreground truncate">
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              {rData.body && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Request Body</span>
                  <pre className="font-mono text-[11px] bg-muted/30 p-2 rounded border mt-1 overflow-x-auto text-foreground">
                    {rData.body}
                  </pre>
                </div>
              )}
            </div>
          );
        })()}

        {/* Matcher Node */}
        {type === 'matcherNode' && (() => {
          const mData = data as unknown as MatcherNodeData;
          return (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Matcher Type</span>
                  <p className="font-semibold text-foreground text-xs mt-0.5 capitalize">{mData.type || 'status'}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Part: {mData.part || 'body'}
                </Badge>
              </div>

              {mData.type === 'status' && mData.status && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Expected Status Codes</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mData.status.map((sc, idx) => (
                      <Badge key={idx} variant="secondary" className="font-mono text-[10px]">
                        {sc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(mData.type === 'word' || mData.type === 'regex') && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Match Patterns</span>
                  <div className="flex flex-col gap-1 mt-1 font-mono text-[11px]">
                    {(mData.words || mData.regex || []).map((w, idx) => (
                      <div key={idx} className="bg-muted/30 px-2 py-1 rounded border text-foreground truncate">
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Extractor Node */}
        {type === 'extractorNode' && (() => {
          const eData = data as unknown as ExtractorNodeData;
          return (
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">Variable / Name</span>
                <p className="font-mono font-semibold text-foreground text-xs mt-0.5">{eData.name || 'token'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Type</span>
                  <p className="font-mono text-xs mt-0.5 text-foreground capitalize">{eData.type || 'regex'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Target Part</span>
                  <p className="font-mono text-xs mt-0.5 text-foreground">{eData.part || 'body'}</p>
                </div>
              </div>

              {eData.regex && eData.regex.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">Pattern(s)</span>
                  <div className="flex flex-col gap-1 mt-1 font-mono text-[11px]">
                    {eData.regex.map((rgx, idx) => (
                      <div key={idx} className="bg-muted/30 px-2 py-1 rounded border text-foreground truncate">
                        {rgx}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Flow Logic Node */}
        {type === 'flowNode' && (() => {
          const fData = data as unknown as FlowNodeData;
          return (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">Flow Logic Script (Nuclei v3)</span>
              <pre className="font-mono text-xs bg-muted/30 p-2.5 rounded border text-foreground leading-relaxed overflow-x-auto">
                {fData.flowCode || 'http(1)'}
              </pre>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}

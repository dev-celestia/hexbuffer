import React from 'react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  TextEditor,
} from '@celestia-project/ui';
import {
  PlayIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  CodeBlockIcon,
  SparkleIcon,
  CopyIcon,
  ArrowsClockwiseIcon,
  LightningIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import type { ValidationDiagnostic, TemplateTestResult } from '../types';
import { DEFAULT_TEMPLATES } from '../lib/default-templates';
import { DSL_HELPERS_REFERENCE } from '../constants';

interface NucleiTemplateStudioProps {
  yamlContent: string;
  onYamlChange: (v: string) => void;
  diagnostics: ValidationDiagnostic[];
  target: string;
  onTargetChange: (v: string) => void;
  testResult: TemplateTestResult | null;
  isTesting: boolean;
  onRunTest: () => void;
  onInsertPlaceholder: (ph: string) => void;
  selectedExampleId: string;
  onLoadExample: (id: string) => void;
}

export function NucleiTemplateStudio({
  yamlContent,
  onYamlChange,
  diagnostics,
  target,
  onTargetChange,
  testResult,
  isTesting,
  onRunTest,
  onInsertPlaceholder,
  selectedExampleId,
  onLoadExample,
}: NucleiTemplateStudioProps) {
  const { theme } = useTheme();
  const hasErrors = diagnostics.some((d) => d.type === 'error');

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col lg:flex-row h-full min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border"
      )}
    >
      {/* Left Pane: YAML Template Editor & Linter */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 flex flex-col min-h-0 overflow-hidden"
        )}
      >
        {/* Editor Toolbar */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b bg-card/30 shrink-0"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CodeBlockIcon className="h-4 w-4 text-primary" /> Template Authoring Studio
            </span>

            {/* Example Template Picker */}
            <div className="w-48">
              <Select value={selectedExampleId} onValueChange={onLoadExample}>
                <SelectTrigger className="h-7 text-xs bg-muted/20 border-input/60">
                  <SelectValue placeholder="Load template..." />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_TEMPLATES.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      <span className="text-xs">{tmpl.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Validation Status Pill */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {hasErrors ? (
              <span className="flex items-center gap-1 text-red-500 font-semibold">
                <WarningCircleIcon className="h-3.5 w-3.5" />
                {diagnostics.filter((d) => d.type === 'error').length} Syntax Error(s)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Valid Schema
              </span>
            )}
          </div>
        </div>

        {/* DSL Placeholder Helper Chips */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1 px-4 py-1.5 border-b bg-muted/10 overflow-x-auto shrink-0 text-xs"
          )}
        >
          <span className="text-[11px] text-muted-foreground mr-1 shrink-0">Insert:</span>
          {DSL_HELPERS_REFERENCE.slice(0, 7).map((helper) => (
            <button
              key={helper.name}
              type="button"
              onClick={() => onInsertPlaceholder(helper.name)}
              className={cn(
                // Layout & Positioning
                "px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 transition-colors",
                // Backgrounds & Borders
                "bg-muted/40 text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground",
                // Interactive & States
                "cursor-pointer"
              )}
              title={helper.desc}
            >
              {helper.name}
            </button>
          ))}
        </div>

        {/* Monaco / TextEditor Area */}
        <div className="flex-1 min-h-0 relative bg-background">
          <TextEditor
            value={yamlContent}
            onChange={(val) => onYamlChange(val || '')}
            language="yaml"
            height="100%"
            theme={theme}
          />
        </div>

        {/* Diagnostics Footer Bar */}
        {diagnostics.length > 0 && (
          <div
            className={cn(
              // Layout & Positioning
              "max-h-32 overflow-y-auto p-2.5 border-t shrink-0 text-xs font-mono flex flex-col gap-1",
              // Backgrounds & Borders
              hasErrors ? "bg-red-500/5 text-red-400" : "bg-yellow-500/5 text-yellow-500"
            )}
          >
            {diagnostics.map((diag, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bold uppercase text-[10px] px-1 py-0.2 rounded bg-muted/40">
                  {diag.type}
                </span>
                {diag.line && <span>Line {diag.line}:</span>}
                <span>{diag.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Pane: Live "Test against Target" Playground */}
      <div
        className={cn(
          // Layout & Positioning
          "w-full lg:w-[460px] flex flex-col min-h-0 overflow-hidden bg-card/20 shrink-0"
        )}
      >
        {/* Playground Header */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between gap-2 px-4 py-2 border-b bg-card/40 shrink-0"
          )}
        >
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <LightningIcon className="h-4 w-4 text-amber-500" /> Live Target Test Harness
          </span>
        </div>

        {/* Target input & Test Trigger */}
        <div className="p-3.5 border-b bg-background/40 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              placeholder="Target URL (e.g. https://httpbin.org)"
              className="h-8 text-xs font-mono bg-muted/20 border-input/60"
            />
            <Button
              size="sm"
              variant="default"
              onClick={onRunTest}
              disabled={isTesting || hasErrors || !target.trim()}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
            >
              {isTesting ? (
                <ArrowsClockwiseIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5 fill-current" />
              )}
              <span className="ml-1">{isTesting ? 'Testing...' : 'Test Template'}</span>
            </Button>
          </div>
        </div>

        {/* Test Result Display */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
          {!testResult && !isTesting && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
              <CodeBlockIcon className="h-8 w-8 mb-2 opacity-50" />
              <p className="font-medium text-xs text-foreground">Playground Ready</p>
              <p className="text-[11px] mt-1 max-w-xs">
                Enter a target URL and click "Test Template" to send request probes and verify matcher execution.
              </p>
            </div>
          )}

          {isTesting && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
              <ArrowsClockwiseIcon className="h-8 w-8 mb-2 animate-spin text-primary" />
              <p className="font-medium text-xs text-foreground">Sending Probe Requests...</p>
              <p className="text-[11px] mt-1">Executing matchers and extracting tokens against target.</p>
            </div>
          )}

          {testResult && !isTesting && (
            <div className="flex flex-col gap-3">
              {/* Status Outcome Banner */}
              <div
                className={cn(
                  // Layout & Positioning
                  "p-3 rounded-lg border flex items-center justify-between",
                  // Backgrounds & Borders
                  testResult.matched
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-red-500/10 border-red-500/30 text-red-500"
                )}
              >
                <div className="flex items-center gap-2">
                  {testResult.matched ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <WarningCircleIcon className="h-5 w-5" />
                  )}
                  <div>
                    <h4 className="font-semibold text-xs leading-none">
                      {testResult.matched ? 'MATCH TRIGGERED' : 'NO MATCH'}
                    </h4>
                    <span className="text-[10px] opacity-80">
                      {testResult.matched
                        ? 'All matcher conditions successfully evaluated to true.'
                        : 'Matchers did not evaluate against target response.'}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span>{testResult.elapsed_ms} ms</span>
                </div>
              </div>

              {/* Extracted Tokens */}
              {testResult.extracted && testResult.extracted.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                    Extracted Values
                  </span>
                  <div className="flex flex-col gap-1">
                    {testResult.extracted.map((ext, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono text-[10px] text-amber-500"
                      >
                        {ext}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Sample */}
              {testResult.request_sample && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                    Raw Request Probe
                  </span>
                  <div className="h-28 rounded border border-border overflow-hidden">
                    <TextEditor
                      value={testResult.request_sample}
                      language="http"
                      height="100%"
                      theme={theme}
                    />
                  </div>
                </div>
              )}

              {/* Response Sample */}
              {testResult.response_sample && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                    Raw Target Response
                  </span>
                  <div className="h-36 rounded border border-border overflow-hidden">
                    <TextEditor
                      value={testResult.response_sample}
                      language="json"
                      height="100%"
                      theme={theme}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

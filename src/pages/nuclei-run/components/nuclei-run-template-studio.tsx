import React from 'react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextEditor,
} from '@celestia-project/ui';
import {
  PlayIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  CodeBlockIcon,
  ArrowsClockwiseIcon,
  LightningIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import type { ValidationDiagnostic, TemplateTestResult } from '../types';
import { DEFAULT_TEMPLATES } from '../lib/default-templates';
import { DSL_HELPERS_REFERENCE } from '../constants';

interface NucleiRunTemplateStudioProps {
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

// ponytail: Unified template authoring and live verification playground
export function NucleiRunTemplateStudio({
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
}: NucleiRunTemplateStudioProps) {
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
            "flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b bg-muted/10 shrink-0"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1.5",
                // Typography
                "text-xs font-semibold text-foreground"
              )}
            >
              <CodeBlockIcon className="h-4 w-4 text-primary" /> Template Authoring Studio
            </span>

            {/* Example Template Picker */}
            <div
              className={cn(
                // Sizing & Spacing
                "w-48"
              )}
            >
              <Select value={selectedExampleId} onValueChange={onLoadExample}>
                <SelectTrigger
                  className={cn(
                    // Sizing & Spacing
                    "h-7 text-xs",
                    // Backgrounds & Borders
                    "bg-muted/20 border-input/60"
                  )}
                >
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
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",
              // Typography
              "text-xs font-mono"
            )}
          >
            {hasErrors ? (
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",
                  // Typography
                  "text-red-500 font-semibold"
                )}
              >
                <WarningCircleIcon className="h-3.5 w-3.5" />
                {diagnostics.filter((d) => d.type === 'error').length} Error(s)
              </span>
            ) : (
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1",
                  // Typography
                  "text-emerald-500 font-semibold"
                )}
              >
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
            "flex items-center gap-1 px-3.5 py-1.5 border-b bg-muted/5 overflow-x-auto shrink-0",
            // Typography
            "text-xs"
          )}
        >
          <span
            className={cn(
              // Sizing & Spacing
              "mr-1 shrink-0",
              // Typography
              "text-[11px] text-muted-foreground"
            )}
          >
            Insert:
          </span>
          {DSL_HELPERS_REFERENCE.slice(0, 7).map((helper) => (
            <button
              key={helper.name}
              type="button"
              onClick={() => onInsertPlaceholder(helper.name)}
              className={cn(
                // Layout & Positioning
                "px-1.5 py-0.5 rounded shrink-0 transition-colors",
                // Typography
                "text-[10px] font-mono",
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

        {/* TextEditor Area */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 relative",
            // Backgrounds & Borders
            "bg-background"
          )}
        >
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
              "max-h-28 overflow-y-auto p-2.5 border-t shrink-0 flex flex-col gap-1",
              // Typography
              "text-xs font-mono",
              // Backgrounds & Borders
              hasErrors ? "bg-red-500/5 text-red-400" : "bg-yellow-500/5 text-yellow-500"
            )}
          >
            {diagnostics.map((diag, i) => (
              <div
                key={i}
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-2"
                )}
              >
                <span
                  className={cn(
                    // Layout & Positioning
                    "px-1 py-0.2 rounded",
                    // Typography
                    "font-bold uppercase text-[10px]",
                    // Backgrounds & Borders
                    "bg-muted/40"
                  )}
                >
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
          "w-full lg:w-[440px] flex flex-col min-h-0 overflow-hidden shrink-0",
          // Backgrounds & Borders
          "bg-muted/5"
        )}
      >
        {/* Playground Header */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between gap-2 px-3.5 py-2 border-b bg-muted/10 shrink-0"
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1.5",
              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            <LightningIcon className="h-4 w-4 text-amber-500" /> Target Test Harness
          </span>
        </div>

        {/* Target input & Test Trigger */}
        <div
          className={cn(
            // Layout & Positioning
            "p-3 border-b flex flex-col gap-2 shrink-0",
            // Backgrounds & Borders
            "bg-background/40"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center gap-2"
            )}
          >
            <Input
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              placeholder="Target URL (e.g. https://example.com)"
              className={cn(
                // Sizing & Spacing
                "h-8 text-xs font-mono",
                // Backgrounds & Borders
                "bg-muted/20 border-input/60"
              )}
            />
            <Button
              size="sm"
              variant="default"
              onClick={onRunTest}
              disabled={isTesting || hasErrors || !target.trim()}
              className={cn(
                // Sizing & Spacing
                "h-8 px-3 text-xs shrink-0",
                // Backgrounds & Borders
                "bg-emerald-600 hover:bg-emerald-500 text-white"
              )}
            >
              {isTesting ? (
                <ArrowsClockwiseIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5 fill-current" />
              )}
              <span className="ml-1">{isTesting ? 'Testing...' : 'Test'}</span>
            </Button>
          </div>
        </div>

        {/* Test Result Display */}
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col gap-3",
            // Typography
            "text-xs"
          )}
        >
          {!testResult && !isTesting && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col items-center justify-center h-full p-6 text-center",
                // Typography
                "text-muted-foreground"
              )}
            >
              <CodeBlockIcon className="h-8 w-8 mb-2 opacity-50" />
              <p
                className={cn(
                  // Typography
                  "font-medium text-xs text-foreground"
                )}
              >
                Harness Ready
              </p>
              <p
                className={cn(
                  // Sizing & Spacing
                  "mt-1 max-w-xs",
                  // Typography
                  "text-[11px]"
                )}
              >
                Enter a target URL and click Test to verify request probes and matchers.
              </p>
            </div>
          )}

          {isTesting && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col items-center justify-center h-full p-6 text-center",
                // Typography
                "text-muted-foreground"
              )}
            >
              <ArrowsClockwiseIcon className="h-8 w-8 mb-2 animate-spin text-primary" />
              <p
                className={cn(
                  // Typography
                  "font-medium text-xs text-foreground"
                )}
              >
                Probing Target...
              </p>
            </div>
          )}

          {testResult && !isTesting && (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-3"
              )}
            >
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
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center gap-2"
                  )}
                >
                  {testResult.matched ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <WarningCircleIcon className="h-5 w-5" />
                  )}
                  <div>
                    <h4
                      className={cn(
                        // Typography
                        "font-semibold text-xs leading-none"
                      )}
                    >
                      {testResult.matched ? 'MATCH TRIGGERED' : 'NO MATCH'}
                    </h4>
                    <span
                      className={cn(
                        // Typography
                        "text-[10px] opacity-80"
                      )}
                    >
                      {testResult.matched
                        ? 'Matcher conditions evaluated to true.'
                        : 'Matchers did not evaluate against target response.'}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    // Typography
                    "text-right font-mono text-[11px]"
                  )}
                >
                  <span>{testResult.elapsed_ms} ms</span>
                </div>
              </div>

              {/* Extracted Tokens */}
              {testResult.extracted && testResult.extracted.length > 0 && (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex flex-col gap-1"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
                    )}
                  >
                    Extracted Values
                  </span>
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex flex-col gap-1"
                    )}
                  >
                    {testResult.extracted.map((ext, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          // Sizing & Spacing
                          "p-1.5 rounded",
                          // Typography
                          "font-mono text-[10px] text-amber-500",
                          // Backgrounds & Borders
                          "bg-amber-500/10 border border-amber-500/20"
                        )}
                      >
                        {ext}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Sample */}
              {testResult.request_sample && (
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex flex-col gap-1"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
                    )}
                  >
                    Request Probe
                  </span>
                  <div
                    className={cn(
                      // Sizing & Spacing
                      "h-24 rounded overflow-hidden",
                      // Backgrounds & Borders
                      "border border-border"
                    )}
                  >
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
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex flex-col gap-1"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
                    )}
                  >
                    Response Payload
                  </span>
                  <div
                    className={cn(
                      // Sizing & Spacing
                      "h-32 rounded overflow-hidden",
                      // Backgrounds & Borders
                      "border border-border"
                    )}
                  >
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

export const NucleiTemplateStudio = NucleiRunTemplateStudio;


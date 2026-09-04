import React from 'react';
import { Badge, Button } from '@celestia-project/ui';
import {
  XIcon,
  CopyIcon,
  PaperPlaneTiltIcon,
  GitDiffIcon,
  CheckCircleIcon,
  GlobeIcon,
  CodeBlockIcon,
  ClockIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiFinding } from '../types';
import { SEVERITY_CONFIG, PROTOCOL_BADGES } from '../constants';
import { generateCurlCommand } from '../lib/formatters';

interface NucleiRunFindingDetailDrawerProps {
  finding: NucleiFinding | null;
  onClose: () => void;
  onSendToRepeater: (finding: NucleiFinding) => void;
  onSendToComparer: (finding: NucleiFinding) => void;
  onCopyCurl: (finding: NucleiFinding) => void;
}

// ponytail: Lean inspection drawer focused on rapid triage, payload copying, and repeater forwarding
export function NucleiRunFindingDetailDrawer({
  finding,
  onClose,
  onSendToRepeater,
  onSendToComparer,
  onCopyCurl,
}: NucleiRunFindingDetailDrawerProps) {
  if (!finding) return null;

  const sevConfig = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
  const protoBadge = PROTOCOL_BADGES[finding.protocol] || {
    label: finding.protocol.toUpperCase(),
    bg: 'bg-muted',
    text: 'text-foreground',
  };
  const curlCmd = generateCurlCommand(finding);

  return (
    <aside
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full overflow-hidden shrink-0",
        // Sizing & Spacing
        "w-96 lg:w-[460px]",
        // Backgrounds & Borders
        "border-l bg-background/95"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-start justify-between gap-2 p-3.5 shrink-0",
          // Backgrounds & Borders
          "border-b bg-muted/15"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-1 min-w-0"
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
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase",
                // Backgrounds & Borders
                sevConfig.bg,
                sevConfig.text,
                "border",
                sevConfig.border
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", sevConfig.dotColor)} />
              {finding.severity}
            </span>

            <span
              className={cn(
                // Layout & Positioning
                "px-1.5 py-0.5 rounded",
                // Typography
                "text-[10px] font-mono uppercase",
                // Backgrounds & Borders
                protoBadge.bg,
                protoBadge.text
              )}
            >
              {protoBadge.label}
            </span>

            {finding.cve_id && (
              <Badge
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "h-4 px-1.5",
                  // Typography
                  "text-[10px] font-bold text-amber-500",
                  // Backgrounds & Borders
                  "border-amber-500/30"
                )}
              >
                {finding.cve_id}
              </Badge>
            )}
          </div>

          <h3
            className={cn(
              // Sizing & Spacing
              "mt-1",
              // Typography
              "font-semibold text-sm leading-tight text-foreground"
            )}
          >
            {finding.template_name}
          </h3>
          <span
            className={cn(
              // Typography
              "font-mono text-[11px] text-muted-foreground"
            )}
          >
            {finding.template_id}
          </span>
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

      {/* Action Buttons Bar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2 px-3.5 py-2 shrink-0",
          // Backgrounds & Borders
          "border-b bg-muted/5"
        )}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSendToRepeater(finding)}
          className={cn(
            // Layout & Positioning
            "flex-1 flex items-center justify-center gap-1.5",
            // Sizing & Spacing
            "h-7 text-xs font-medium",
            // Interactive & States
            "hover:text-emerald-500 hover:border-emerald-500/40"
          )}
        >
          <PaperPlaneTiltIcon className="h-3.5 w-3.5" />
          <span>Repeater</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onSendToComparer(finding)}
          className={cn(
            // Layout & Positioning
            "flex-1 flex items-center justify-center gap-1.5",
            // Sizing & Spacing
            "h-7 text-xs font-medium",
            // Interactive & States
            "hover:text-sky-500 hover:border-sky-500/40"
          )}
        >
          <GitDiffIcon className="h-3.5 w-3.5" />
          <span>Comparer</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopyCurl(finding)}
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center gap-1.5",
            // Sizing & Spacing
            "h-7 px-2.5 text-xs font-medium"
          )}
        >
          <CopyIcon className="h-3.5 w-3.5" />
          <span>cURL</span>
        </Button>
      </div>

      {/* Scrollable Content Details */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3.5",
          // Typography
          "text-xs"
        )}
      >
        {/* Matched URL */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-1"
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              "flex items-center gap-1",
              // Typography
              "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
            )}
          >
            <GlobeIcon className="h-3.5 w-3.5" /> Matched Endpoint
          </span>
          <div
            className={cn(
              // Sizing & Spacing
              "p-2 rounded",
              // Typography
              "font-mono text-[11px] break-all select-all",
              // Backgrounds & Borders
              "bg-muted/40 border border-border/50"
            )}
          >
            {finding.matched_url}
          </div>
        </div>

        {/* Extracted Artifacts */}
        {finding.extracted_results && finding.extracted_results.length > 0 && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-1.5"
            )}
          >
            <span
              className={cn(
                // Typography
                "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
              )}
            >
              Extracted Evidence
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col gap-1"
              )}
            >
              {finding.extracted_results.map((res, i) => (
                <div
                  key={i}
                  className={cn(
                    // Sizing & Spacing
                    "p-2 rounded",
                    // Typography
                    "font-mono text-[11px] text-amber-500 break-all select-all",
                    // Backgrounds & Borders
                    "bg-amber-500/10 border border-amber-500/20"
                  )}
                >
                  {res}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {finding.description && (
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
              Description
            </span>
            <p
              className={cn(
                // Typography
                "text-muted-foreground leading-relaxed"
              )}
            >
              {finding.description}
            </p>
          </div>
        )}

        {/* Remediation */}
        {finding.remediation && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col gap-1"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1",
                // Typography
                "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
              )}
            >
              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" /> Remediation
            </span>
            <p
              className={cn(
                // Sizing & Spacing
                "p-2.5 rounded",
                // Typography
                "text-muted-foreground leading-relaxed",
                // Backgrounds & Borders
                "bg-emerald-500/5 border border-emerald-500/20"
              )}
            >
              {finding.remediation}
            </p>
          </div>
        )}

        {/* Tags */}
        {finding.tags && finding.tags.length > 0 && (
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
              Tags
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap gap-1"
              )}
            >
              {finding.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={cn(
                    // Sizing & Spacing
                    "h-4 px-1.5",
                    // Typography
                    "text-[10px] font-mono",
                    // Backgrounds & Borders
                    "bg-muted/60"
                  )}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reproduction cURL */}
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col gap-1"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1",
                // Typography
                "font-semibold text-muted-foreground text-[11px] uppercase tracking-wider"
              )}
            >
              <CodeBlockIcon className="h-3.5 w-3.5" /> cURL Probe
            </span>
            <button
              type="button"
              onClick={() => onCopyCurl(finding)}
              className={cn(
                // Layout & Positioning
                "flex items-center gap-0.5",
                // Typography
                "text-primary hover:underline text-[10px]",
                // Interactive & States
                "cursor-pointer"
              )}
            >
              <CopyIcon className="h-3 w-3" /> Copy
            </button>
          </div>
          <pre
            className={cn(
              // Sizing & Spacing
              "p-2.5 rounded",
              // Typography
              "font-mono text-[10px] text-muted-foreground overflow-x-auto select-all",
              // Backgrounds & Borders
              "bg-muted/40 border border-border/50"
            )}
          >
            {curlCmd}
          </pre>
        </div>

        {/* Metadata Footer Info */}
        <footer
          className={cn(
            // Layout & Positioning
            "mt-auto pt-3 border-t flex flex-col gap-1",
            // Typography
            "text-[11px] text-muted-foreground font-mono"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center gap-1"
              )}
            >
              <ClockIcon className="h-3 w-3" /> Discovered
            </span>
            <span>{new Date(finding.matched_at).toLocaleString()}</span>
          </div>
          {finding.author && (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between"
              )}
            >
              <span
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1"
                )}
              >
                <UserIcon className="h-3 w-3" /> Author
              </span>
              <span>{finding.author}</span>
            </div>
          )}
        </footer>
      </div>
    </aside>
  );
}

export const NucleiFindingDetailDrawer = NucleiRunFindingDetailDrawer;


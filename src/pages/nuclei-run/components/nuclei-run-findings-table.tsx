import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  CopyIcon,
  ShieldCheckIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { NucleiFinding, ProtocolType } from '../types';
import { SEVERITY_CONFIG, PROTOCOL_BADGES } from '../constants';

interface NucleiRunFindingsTableProps {
  findings: NucleiFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  protocolFilter: string[];
  onToggleProtocolFilter: (proto: ProtocolType) => void;
  onSendToRepeater: (finding: NucleiFinding) => void;
  onCopyCurl: (finding: NucleiFinding) => void;
  isRunning: boolean;
}

// ponytail: Decluttered findings table with clean search filtering and subtle row states
export function NucleiRunFindingsTable({
  findings,
  selectedFindingId,
  onSelectFinding,
  searchQuery,
  onSearchChange,
  protocolFilter,
  onToggleProtocolFilter,
  onSendToRepeater,
  onCopyCurl,
  isRunning,
}: NucleiRunFindingsTableProps) {
  const protocols: ProtocolType[] = ['http', 'dns', 'ssl', 'websocket', 'tcp', 'headless'];

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col h-full min-h-0 overflow-hidden"
      )}
    >
      {/* Table Toolbar & Search */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 shrink-0",
          // Backgrounds & Borders
          "border-b bg-muted/10"
        )}
      >
        {/* Search Filter Input */}
        <div
          className={cn(
            // Layout & Positioning
            "relative flex-1 min-w-[240px] max-w-md"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none",
              // Typography
              "text-muted-foreground"
            )}
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter findings by CVE, template, keyword, or URL..."
            className={cn(
              // Sizing & Spacing
              "pl-8 h-7 text-xs",
              // Backgrounds & Borders
              "bg-background/80 border-input/60"
            )}
          />
        </div>

        {/* Protocol Filter Chips */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1 shrink-0"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[11px] text-muted-foreground mr-1"
            )}
          >
            Protocol:
          </span>
          {protocols.map((proto) => {
            const badge = PROTOCOL_BADGES[proto] || { label: proto.toUpperCase(), bg: 'bg-muted', text: 'text-foreground' };
            const isActive = protocolFilter.includes(proto);

            return (
              <button
                key={proto}
                type="button"
                onClick={() => onToggleProtocolFilter(proto)}
                className={cn(
                  // Layout & Positioning
                  "px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors",
                  // Backgrounds & Borders
                  badge.bg,
                  badge.text,
                  // Interactive & States
                  "cursor-pointer hover:opacity-100",
                  !isActive && protocolFilter.length > 0 && "opacity-35"
                )}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings Table Body */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-auto"
        )}
      >
        {findings.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center h-full gap-3 p-8 text-center"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "p-3 rounded-full",
                // Backgrounds & Borders
                "bg-muted/40 text-muted-foreground"
              )}
            >
              <ShieldCheckIcon className="h-8 w-8" />
            </div>
            <div>
              <h3
                className={cn(
                  // Typography
                  "text-sm font-semibold"
                )}
              >
                {isRunning ? 'Scanning in progress...' : 'No Vulnerability Findings'}
              </h3>
              <p
                className={cn(
                  // Sizing & Spacing
                  "mt-1 max-w-sm",
                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                {isRunning
                  ? 'The scanner engine is probing target endpoints. Findings will appear here in real-time as they are discovered.'
                  : 'Start a scan with your selected templates or check target inputs.'}
              </p>
            </div>
          </div>
        ) : (
          <Table className="text-xs">
            <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">Severity</TableHead>
                <TableHead className="min-w-[220px]">Vulnerability / Template</TableHead>
                <TableHead className="w-20">Protocol</TableHead>
                <TableHead className="min-w-[240px]">Matched Location</TableHead>
                <TableHead className="min-w-[160px]">Extracted Evidence</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((finding) => {
                const sevConfig = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
                const protoBadge = PROTOCOL_BADGES[finding.protocol] || { label: finding.protocol.toUpperCase(), bg: 'bg-muted', text: 'text-foreground' };
                const isSelected = selectedFindingId === finding.id;

                return (
                  <TableRow
                    key={finding.id}
                    onClick={() => onSelectFinding(finding.id)}
                    className={cn(
                      // Interactive & States
                      "cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary"
                        : "hover:bg-muted/30"
                    )}
                  >
                    {/* Severity Badge */}
                    <TableCell className="font-mono">
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
                    </TableCell>

                    {/* Template Name & ID */}
                    <TableCell>
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex flex-col gap-0.5"
                        )}
                      >
                        <span
                          className={cn(
                            // Layout & Positioning
                            "truncate max-w-xs",
                            // Typography
                            "font-medium text-foreground"
                          )}
                        >
                          {finding.template_name}
                        </span>
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-center gap-1.5",
                            // Typography
                            "font-mono text-[10px] text-muted-foreground"
                          )}
                        >
                          <span>{finding.template_id}</span>
                          {finding.cve_id && (
                            <Badge
                              variant="outline"
                              className={cn(
                                // Sizing & Spacing
                                "h-3.5 px-1",
                                // Typography
                                "text-[9px] font-bold text-amber-500",
                                // Backgrounds & Borders
                                "border-amber-500/30"
                              )}
                            >
                              {finding.cve_id}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Protocol */}
                    <TableCell>
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
                    </TableCell>

                    {/* Matched URL */}
                    <TableCell>
                      <span
                        className={cn(
                          // Layout & Positioning
                          "truncate max-w-md block select-all",
                          // Typography
                          "font-mono text-muted-foreground"
                        )}
                      >
                        {finding.matched_url}
                      </span>
                    </TableCell>

                    {/* Extracted Evidence */}
                    <TableCell>
                      {finding.extracted_results && finding.extracted_results.length > 0 ? (
                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex flex-wrap gap-1 max-w-xs"
                          )}
                        >
                          {finding.extracted_results.map((res, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className={cn(
                                // Sizing & Spacing
                                "h-4 px-1.5 max-w-[180px]",
                                // Typography
                                "text-[10px] font-mono truncate",
                                // Backgrounds & Borders
                                "bg-muted/60"
                              )}
                            >
                              {res}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span
                          className={cn(
                            // Typography
                            "text-muted-foreground text-[11px]"
                          )}
                        >
                          —
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex items-center justify-end gap-1"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSendToRepeater(finding)}
                              className={cn(
                                // Sizing & Spacing
                                "h-6 w-6 p-0",
                                // Interactive & States
                                "text-muted-foreground hover:text-emerald-500"
                              )}
                            >
                              <PaperPlaneTiltIcon className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Send to Repeater</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onCopyCurl(finding)}
                              className={cn(
                                // Sizing & Spacing
                                "h-6 w-6 p-0",
                                // Interactive & States
                                "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy cURL Command</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export const NucleiFindingsTable = NucleiRunFindingsTable;

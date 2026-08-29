import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@celestia-project/ui';
import { BroadcastIcon } from '@phosphor-icons/react';
import type { PortScanResult } from '../types';
import { cn } from '@/lib/utils';

interface ScanResultsTableProps {
  openResults: PortScanResult[];
  hasResults: boolean;
  isRunning: boolean;
  getLatencyColor: (ms: number) => string;
}

export function ScanResultsTable({
  openResults,
  hasResults,
  isRunning,
  getLatencyColor,
}: ScanResultsTableProps) {
  if (!hasResults) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col items-center justify-center",

          // Sizing & Spacing
          "h-full gap-2 p-4",

          // Typography
          "text-muted-foreground"
        )}
      >
        <BroadcastIcon className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
        <p
          className={cn(
            // Typography
            "text-xs"
          )}
        >
          {isRunning ? 'Scanning...' : 'No open ports discovered'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Interactive & States
        "animate-in fade-in duration-300"
      )}
    >
      <Table
        className={cn(
          // Typography
          "text-xs"
        )}
      >
        <TableHeader
          className={cn(
            // Layout & Positioning
            "sticky top-0 z-10",

            // Backgrounds & Borders
            "bg-background border-b shadow-sm"
          )}
        >
          <TableRow
            className={cn(
              // Interactive & States
              "hover:bg-transparent"
            )}
          >
            <TableHead className="h-8 py-0">Host</TableHead>
            <TableHead className="h-8 py-0 w-24">Port</TableHead>
            <TableHead className="h-8 py-0 w-24">State</TableHead>
            <TableHead className="h-8 py-0 w-28">Service</TableHead>
            <TableHead className="h-8 py-0 w-28">Latency</TableHead>
            <TableHead className="h-8 py-0">Banner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openResults.map((result) => {
            const ms = result.response_time_ms || 0;
            const latencyColor = getLatencyColor(ms);

            return (
              <TableRow
                key={`${result.host}:${result.port}`}
                className={cn(
                  // Backgrounds & Borders
                  "border-b",

                  // Interactive & States
                  "hover:bg-muted/20 transition-colors"
                )}
              >
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "py-1.5",

                    // Typography
                    "font-mono font-medium"
                  )}
                >
                  {result.host}
                </TableCell>
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "py-1.5",

                    // Typography
                    "font-mono font-semibold text-primary"
                  )}
                >
                  {result.port}
                </TableCell>
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "py-1.5"
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      // Sizing & Spacing
                      "h-5 text-[10px]"
                    )}
                  >
                    {result.state}
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "py-1.5",

                    // Typography
                    "font-medium capitalize text-muted-foreground"
                  )}
                >
                  {result.service || 'unknown'}
                </TableCell>
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "py-1.5",

                    // Typography
                    "text-muted-foreground font-mono"
                  )}
                >
                  <div
                    className={cn(
                      // Layout & Positioning
                      "flex items-center",

                      // Sizing & Spacing
                      "gap-2"
                    )}
                  >
                    <span
                      className={cn(
                        // Sizing & Spacing
                        "w-10",

                        // Typography
                        "text-[10px] text-right"
                      )}
                    >
                      {ms ? `${ms}ms` : '-'}
                    </span>
                    {ms > 0 && (
                      <span
                        className={cn(
                          // Layout & Positioning
                          "overflow-hidden inline-block",

                          // Sizing & Spacing
                          "w-12 h-1",

                          // Backgrounds & Borders
                          "bg-muted rounded-full"
                        )}
                      >
                        <span
                          className={cn(
                            // Layout & Positioning
                            "block",

                            // Sizing & Spacing
                            "h-full",

                            // Backgrounds & Borders
                            "rounded-full",
                            latencyColor
                          )}
                          style={{ width: `${Math.min(100, (ms / 1000) * 100)}%` }}
                        />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    // Sizing & Spacing
                    "max-w-[400px] py-1.5",

                    // Typography
                    "truncate font-mono text-[11px] text-foreground/80"
                  )}
                  title={result.banner ?? ''}
                >
                  {result.banner ? (
                    <code
                      className={cn(
                        // Layout & Positioning
                        "block select-all",

                        // Sizing & Spacing
                        "max-w-[350px] px-1 py-0.5",

                        // Typography
                        "truncate text-[10px]",

                        // Backgrounds & Borders
                        "bg-muted/30 rounded"
                      )}
                    >
                      {result.banner}
                    </code>
                  ) : (
                    <span
                      className={cn(
                        // Typography
                        "text-muted-foreground/40"
                      )}
                    >
                      -
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

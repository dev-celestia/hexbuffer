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
          "h-full gap-2",

          // Typography
          "text-muted-foreground"
        )}
      >
        <BroadcastIcon className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
        <p className="text-xs">
          {isRunning ? 'Scanning...' : 'No open ports discovered'}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <Table className="text-xs">
        <TableHeader className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <TableRow className="hover:bg-transparent">
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
                <TableCell className="font-mono py-1.5 font-medium">
                  {result.host}
                </TableCell>
                <TableCell className="font-mono py-1.5 font-semibold text-primary">
                  {result.port}
                </TableCell>
                <TableCell className="py-1.5">
                  <Badge variant="outline" className="h-5 text-[10px]">
                    {result.state}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 font-medium capitalize text-muted-foreground">
                  {result.service || 'unknown'}
                </TableCell>
                <TableCell className="py-1.5 text-muted-foreground font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] w-10 text-right">
                      {ms ? `${ms}ms` : '-'}
                    </span>
                    {ms > 0 && (
                      <span className="w-12 h-1 bg-muted rounded-full overflow-hidden inline-block">
                        <span
                          className={`h-full block rounded-full ${latencyColor}`}
                          style={{ width: `${Math.min(100, (ms / 1000) * 100)}%` }}
                        />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className="max-w-[400px] truncate font-mono text-[11px] py-1.5 text-foreground/80"
                  title={result.banner ?? ''}
                >
                  {result.banner ? (
                    <code className="bg-muted/30 px-1 py-0.5 rounded text-[10px] select-all max-w-[350px] truncate block">
                      {result.banner}
                    </code>
                  ) : (
                    <span className="text-muted-foreground/40">-</span>
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

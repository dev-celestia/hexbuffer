import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@celestia-project/ui';
import {
  CheckCircleIcon,
  MinusCircleIcon,
  RowsIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { RegressionCondition } from '../types';
import { CONDITION_STATUS_META, SEVERITY_CLASS } from '../constants';

interface ConditionsTableProps {
  conditions: RegressionCondition[];
}

export function ConditionsTable({ conditions }: Readonly<ConditionsTableProps>) {
  if (conditions.length === 0) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col items-center justify-center',

          // Sizing & Spacing
          'gap-2 px-4 py-10'
        )}
      >
        <RowsIcon className="size-6 text-muted-foreground/40" />
        <p
          className={cn(
            // Typography
            'text-center text-xs text-muted-foreground'
          )}
        >
          No conditions yet — save and validate the script to see them here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader
        className={cn(
          // Layout & Positioning
          'sticky top-0 z-10',

          // Backgrounds & Borders
          'border-b bg-muted/95 backdrop-blur-sm'
        )}
      >
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-20">Result</TableHead>
          <TableHead>Condition</TableHead>
          <TableHead className="w-24">Severity</TableHead>
          <TableHead>Matched URL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conditions.map((condition) => {
          const meta = CONDITION_STATUS_META[condition.status] ?? CONDITION_STATUS_META.pending;
          return (
            <TableRow key={condition.id}>
              <TableCell>
                <span
                  className={cn(
                    // Layout & Positioning
                    'flex items-center gap-1',

                    // Typography
                    'text-[11px] font-bold',

                    // Interactive & States
                    meta.text
                  )}
                >
                  {condition.status === 'passed' && (
                    <CheckCircleIcon className="size-3.5" weight="fill" />
                  )}
                  {condition.status === 'failed' && (
                    <WarningCircleIcon className="size-3.5" weight="fill" />
                  )}
                  {condition.status === 'pending' && <MinusCircleIcon className="size-3.5" />}
                  {meta.label}
                </span>
              </TableCell>
              <TableCell>
                <div
                  className={cn(
                    // Typography
                    'text-xs font-medium text-foreground'
                  )}
                >
                  {condition.name}
                </div>
                <div
                  className={cn(
                    // Typography
                    'font-mono text-[10px] text-muted-foreground'
                  )}
                >
                  {condition.id}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    // Typography
                    'font-mono text-[10px]',

                    // Backgrounds & Borders
                    'border',
                    SEVERITY_CLASS[condition.severity] ?? SEVERITY_CLASS.info
                  )}
                >
                  {condition.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    // Typography
                    'font-mono text-[11px] break-all text-muted-foreground'
                  )}
                >
                  {condition.matchedUrl ?? '—'}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

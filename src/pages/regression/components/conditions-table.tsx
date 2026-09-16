import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@celestia-project/ui';
import { CheckCircleIcon, WarningCircleIcon, MinusCircleIcon } from '@phosphor-icons/react';
import { Badge } from '@celestia-project/ui';
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
          // Sizing & Spacing
          'p-4',

          // Typography
          'text-[11px] text-muted-foreground'
        )}
      >
        Save and validate the script to see its conditions here.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Result</TableHead>
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
                    <CheckCircleIcon className="h-3.5 w-3.5" weight="fill" />
                  )}
                  {condition.status === 'failed' && (
                    <WarningCircleIcon className="h-3.5 w-3.5" weight="fill" />
                  )}
                  {condition.status === 'pending' && <MinusCircleIcon className="h-3.5 w-3.5" />}
                  {meta.label}
                </span>
              </TableCell>
              <TableCell>
                <div
                  className={cn(
                    // Typography
                    'text-[12px] font-medium'
                  )}
                >
                  {condition.name}
                </div>
                <div
                  className={cn(
                    // Typography
                    'text-[10px] font-mono text-muted-foreground'
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
                    'text-[9px] font-mono',

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
                    'text-[11px] font-mono text-muted-foreground break-all'
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

import { Button } from '@celestia-project/ui';
import { ShieldWarningIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import {
  approveToolConfirmation,
  denyToolConfirmation,
  toolConfirmationLabel,
  type PendingToolConfirmation,
} from '../lib/ai-tools/confirmation';

interface ToolConfirmationCardProps {
  confirmation: PendingToolConfirmation;
}

function formatArguments(args: Record<string, any>): string {
  if (!args || typeof args !== 'object' || Object.keys(args).length === 0) {
    return '(no arguments)';
  }
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

export function ToolConfirmationCard({ confirmation }: ToolConfirmationCardProps) {
  const [busy, setBusy] = useState(false);

  const handleDecision = async (approve: boolean) => {
    setBusy(true);
    try {
      if (approve) {
        await approveToolConfirmation(confirmation.id);
      } else {
        await denyToolConfirmation(confirmation.id);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        // Sizing & Spacing
        'rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm',

        // Backgrounds & Borders
        'dark:border-amber-500/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldWarningIcon
            className={cn(
              // Sizing & Spacing
              'h-4 w-4 shrink-0',

              // Typography
              'text-amber-600 dark:text-amber-400'
            )}
          />
          <span
            className={cn(
              // Typography
              'font-medium text-amber-600 dark:text-amber-400'
            )}
          >
            Confirmation required
          </span>
        </div>
      </div>

      <p className="mt-1.5">
        The assistant wants to execute{' '}
        <span className="font-medium">{toolConfirmationLabel(confirmation.toolName)}</span>.
        Review the arguments before approving.
      </p>

      <pre
        className={cn(
          // Sizing & Spacing
          'mt-2 max-h-40 overflow-auto rounded-md p-2 text-xs',

          // Backgrounds & Borders
          'border border-border bg-background/60',

          // Typography
          'break-all whitespace-pre-wrap'
        )}
      >
        {formatArguments(confirmation.arguments)}
      </pre>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleDecision(true)}
          disabled={busy}
        >
          Approve &amp; run
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDecision(false)}
          disabled={busy}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}

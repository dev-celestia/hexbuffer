import { Button, Tool, ToolHeader, ToolContent, ToolInput } from '@celestia-project/ui';
import { useState } from 'react';

import {
  approveToolConfirmation,
  denyToolConfirmation,
  toolConfirmationLabel,
  type PendingToolConfirmation,
} from '../lib/ai-tools/confirmation';
import { cn } from '@/lib/utils';

interface ToolConfirmationCardProps {
  confirmation: PendingToolConfirmation;
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
    <Tool
      defaultOpen
      className={cn(
        // Sizing & Spacing
        'mb-3',
        // Backgrounds & Borders
        'rounded-xl border border-amber-500/40 bg-amber-500/5',
      )}
    >
      <ToolHeader
        type="dynamic-tool"
        toolName={toolConfirmationLabel(confirmation.toolName)}
        state="approval-requested"
      />
      <ToolContent>
        <p
          className={cn(
            // Typography
            'text-xs text-muted-foreground',
          )}
        >
          The assistant requested permission to run this action. Review parameters before approving:
        </p>
        <ToolInput input={confirmation.arguments} />
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center gap-2',
            // Sizing & Spacing
            'pt-2 mt-1',
            // Backgrounds & Borders
            'border-t border-border/40',
          )}
        >
          <Button
            size="sm"
            onClick={() => handleDecision(true)}
            disabled={busy}
          >
            Approve &amp; Execute
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
      </ToolContent>
    </Tool>
  );
}


import { Button, Tool, ToolHeader, ToolContent, ToolInput } from '@celestia-project/ui';
import { useState } from 'react';

import {
  approveToolConfirmation,
  denyToolConfirmation,
  toolConfirmationLabel,
  type PendingToolConfirmation,
} from '../lib/ai-tools/confirmation';

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
    <Tool defaultOpen className="border-amber-500/40 bg-amber-500/5 mb-3">
      <ToolHeader
        type="dynamic-tool"
        toolName={toolConfirmationLabel(confirmation.toolName)}
        state="approval-requested"
      />
      <ToolContent>
        <p className="text-xs text-muted-foreground">
          The assistant requested permission to run this action. Review parameters before approving:
        </p>
        <ToolInput input={confirmation.arguments} />
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
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

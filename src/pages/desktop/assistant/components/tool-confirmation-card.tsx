import { Button, Tool, ToolHeader, ToolContent, ToolInput, Tooltip, TooltipContent, TooltipTrigger } from '@celestia-project/ui';
import { motion } from 'motion/react';
import { useState } from 'react';
import { DURATION, EASE_OUT } from '../lib/motion';

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

export function ToolConfirmationCard({ confirmation }: Readonly<ToolConfirmationCardProps>) {
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

  const label = toolConfirmationLabel(confirmation.toolName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
    >
    <Tool
      defaultOpen
      className={cn(
        // Sizing & Spacing
        'mb-3',
        // Backgrounds & Borders
        'rounded-lg border-warning/40 bg-warning/5',
      )}
    >
      <ToolHeader
        type="dynamic-tool"
        // `ToolHeaderProps.title` is declared `string`, but `ToolHeader` renders it as a
        // React child (`<span>{title ?? derivedName}</span>`), so passing an element works
        // at runtime. Drop this suppression once the upstream prop widens to `ReactNode`.
        // @ts-expect-error -- third-party prop type is narrower than its implementation
        title={
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="truncate max-w-[170px] xs:max-w-[220px] sm:max-w-[280px] block cursor-default" />
              }
            >
              {label}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm text-xs break-words">
              {label}
            </TooltipContent>
          </Tooltip>
        }
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
    </motion.div>
  );
}


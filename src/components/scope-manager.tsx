import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@celestia-project/ui';
import * as React from 'react';

import { GearSixIcon } from '@phosphor-icons/react';
import { ScopeTable } from './scope-table';
import type { Target } from '@/types';

interface ScopeManagerProps {
  target: Target | null;
  targets: Target[];
  onScopeUpdated: () => void;
}

export function ScopeManager({ target, targets, onScopeUpdated }: ScopeManagerProps) {
  const [open, setOpen] = React.useState(false);

  if (!target) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <GearSixIcon className="mr-2 h-4 w-4" />
          Manage Scope
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Scope Management</DialogTitle>
          <DialogDescription>
            Manage scope domains for all targets. CheckIcon "Subdomain" to include *.domain.com patterns.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScopeTable targets={targets} onTargetsUpdated={onScopeUpdated} />
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
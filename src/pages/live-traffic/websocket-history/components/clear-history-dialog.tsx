import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@celestia-project/ui';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useWebSocketHistoryQueryStore } from '@/stores/history';
import { clearWebSocketAll } from '../api';

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClearHistoryDialog({ open, onOpenChange }: Readonly<ClearHistoryDialogProps>) {
  const [isClearing, setIsClearing] = React.useState(false);

  const handleConfirm = async () => {
    setIsClearing(true);
    try {
      await clearWebSocketAll();
      useWebSocketHistoryQueryStore.getState().triggerRefresh();
      useWebSocketHistoryQueryStore.getState().setSelectedConnectionId(null);
      toast.success('WebSocket history cleared');
      onOpenChange(false);
    } catch {
      toast.error('Failed to clear WebSocket history');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Clear WebSocket History</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete all captured WebSocket connections and messages?
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            // Layout & Positioning
            'flex flex-col',

            // Sizing & Spacing
            'gap-1.5 p-3 my-1',

            // Typography
            'text-xs leading-relaxed',

            // Backgrounds & Borders
            'rounded-md border border-destructive/20 bg-destructive/5 text-muted-foreground'
          )}
        >
          All connection handshakes and recorded frame payloads will be purged.
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isClearing}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={isClearing}>
            {isClearing ? 'Clearing…' : 'Clear All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

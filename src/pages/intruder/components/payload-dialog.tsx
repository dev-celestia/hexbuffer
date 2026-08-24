

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@celestia-project/ui';
import { useIntruderStore } from '@/stores/intruder';
import { useIntruderPayloads } from '../hooks/use-payloads';

export function IntruderPayloadDialog() {
  const payloadDialogOpen = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.payloadDialogOpen ?? false;
  });
  const setPayloadDialogOpen = useIntruderStore((s) => s.setPayloadDialogOpen);
  const { handleLoadPayloads, handleSelectPayloadFile } = useIntruderPayloads();

  return (
    <Dialog open={payloadDialogOpen} onOpenChange={setPayloadDialogOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Load Payloads from File</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button size="sm" type="button" onClick={handleSelectPayloadFile}>
            Choose File
          </Button>
          <input type="file" onChange={handleLoadPayloads} accept=".txt,.lst,.wordlist" />
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => setPayloadDialogOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const InvokerPayloadDialog = IntruderPayloadDialog;


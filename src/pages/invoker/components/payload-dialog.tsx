

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@celestia-project/ui';
import { useInvokerStore } from '@/stores/invoker';
import { useInvokerPayloads } from '../hooks/use-payloads';

export function InvokerPayloadDialog() {
  const payloadDialogOpen = useInvokerStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.payloadDialogOpen ?? false;
  });
  const setPayloadDialogOpen = useInvokerStore((s) => s.setPayloadDialogOpen);
  const { handleLoadPayloads, handleSelectPayloadFile } = useInvokerPayloads();

  return (
    <Dialog open={payloadDialogOpen} onOpenChange={setPayloadDialogOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Load Payloads from File</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button size="xs" type="button" onClick={handleSelectPayloadFile}>
            Choose File
          </Button>
          <input type="file" onChange={handleLoadPayloads} accept=".txt,.lst,.wordlist" />
        </div>
        <DialogFooter>
          <Button size="xs" variant="outline" onClick={() => setPayloadDialogOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

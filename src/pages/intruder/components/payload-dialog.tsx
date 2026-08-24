import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@celestia-project/ui';
import { usePayloadDialog } from './hooks/use-payload-dialog';

export function IntruderPayloadDialog() {
  const {
    open,
    setOpen,
    handleClose,
    handleSelectPayloadFile,
    handleLoadPayloads,
  } = usePayloadDialog();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button size="sm" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const InvokerPayloadDialog = IntruderPayloadDialog;

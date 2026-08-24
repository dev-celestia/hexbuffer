import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label } from '@celestia-project/ui';
import { useRequestDialog } from './hooks/use-request-dialog';

export function IntruderRequestDialog() {
  const {
    open,
    setOpen,
    rawRequestContent,
    setRawRequestContent,
    handleImport,
    handleClose,
    canImport,
  } = useRequestDialog();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Import Raw HTTP Request</DialogTitle>
          <DialogDescription>
            Paste a raw HTTP request to use as the base. Use § to mark payload positions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Raw Request</Label>
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder="GET /path?id=§123§ HTTP/1.1&#10;Host: example.com&#10;&#10;"
              value={rawRequestContent}
              onChange={(event) => setRawRequestContent(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleImport} disabled={!canImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const InvokerRequestDialog = IntruderRequestDialog;

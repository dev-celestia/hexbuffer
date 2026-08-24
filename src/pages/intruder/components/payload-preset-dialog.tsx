import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, ScrollArea } from '@celestia-project/ui';
import { FileTextIcon, FolderIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { PAYLOAD_CATEGORIES, type PredefinedPayload } from '../data/predefined-payloads';
import { usePayloadPresetDialog } from './hooks/use-payload-preset-dialog';

export interface IntruderPayloadPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUsePayload: (payload: PredefinedPayload) => void;
}

export type InvokerPayloadPresetDialogProps = IntruderPayloadPresetDialogProps;

export function IntruderPayloadPresetDialog({
  open,
  onOpenChange,
  onUsePayload,
}: IntruderPayloadPresetDialogProps) {
  const {
    selectedCategory,
    selectedPayloadId,
    search,
    setSearch,
    visiblePayloads,
    selectedPayload,
    previewValues,
    hiddenPreviewCount,
    handleCategorySelect,
    setSelectedPayloadId,
    handleUsePayload,
    handleClose,
  } = usePayloadPresetDialog({ onUsePayload, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(760px,calc(100vh-2rem))] gap-3 p-0 sm:max-w-[960px]">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>Payload Presets</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-[180px_260px_minmax(0,1fr)]">
          <div className="border-r bg-muted/40 p-2">
            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">Categories</div>
            <div className="grid gap-1">
              {PAYLOAD_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-background',
                    selectedCategory === category && 'bg-background shadow-sm'
                  )}
                >
                  <FolderIcon className="size-4 text-muted-foreground" />
                  <span className="truncate">{category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-r p-2">
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search presets"
                className="h-8 pl-7 text-xs"
              />
            </div>
            <ScrollArea className="h-[480px]">
              <div className="grid gap-1 pr-2">
                {visiblePayloads.map((payload) => (
                  <button
                    key={payload.id}
                    type="button"
                    onClick={() => setSelectedPayloadId(payload.id)}
                    className={cn(
                      'rounded-md border px-2 py-2 text-left hover:bg-muted/60',
                      selectedPayload?.id === payload.id && 'border-primary bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{payload.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {payload.values.length} payloads
                    </div>
                  </button>
                ))}
                {visiblePayloads.length === 0 && (
                  <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                    No presets found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-w-0 flex-col p-3">
            {selectedPayload && (
              <>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{selectedPayload.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedPayload.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {selectedPayload.values.length} items
                  </Badge>
                </div>

                <ScrollArea className="h-[410px] rounded-md border bg-muted/20">
                  <pre className="whitespace-pre-wrap p-3 font-mono text-xs leading-relaxed">
                    {previewValues.join('\n')}
                    {hiddenPreviewCount > 0
                      ? `\n\n... ${hiddenPreviewCount.toLocaleString()} more payloads`
                      : ''}
                  </pre>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-3">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleUsePayload} disabled={!selectedPayload}>
            Use Payload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const InvokerPayloadPresetDialog = IntruderPayloadPresetDialog;

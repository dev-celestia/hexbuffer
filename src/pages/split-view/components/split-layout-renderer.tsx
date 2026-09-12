import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { SplitLayoutType } from '@/stores/split-view';
import type { NavItem } from '@/layout/constants';
import { SplitSlot } from './split-slot';

interface SplitLayoutRendererProps {
  layout: SplitLayoutType;
  slots: Record<string, string | null>;
  apps: NavItem[];
  onSelectApp: (slotId: string, appHref: string) => void;
  onClearSlot: (slotId: string) => void;
}

export function SplitLayoutRenderer({
  layout,
  slots,
  apps,
  onSelectApp,
  onClearSlot,
}: Readonly<SplitLayoutRendererProps>) {
  if (layout === 'split-2') {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full min-h-0">
        <ResizablePanel defaultSize={50} minSize={20}>
          <SplitSlot
            slotId="slot-0"
            appHref={slots['slot-0'] ?? null}
            apps={apps}
            onSelectApp={onSelectApp}
            onClearSlot={onClearSlot}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={20}>
          <SplitSlot
            slotId="slot-1"
            appHref={slots['slot-1'] ?? null}
            apps={apps}
            onSelectApp={onSelectApp}
            onClearSlot={onClearSlot}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  if (layout === 'split-3') {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full min-h-0">
        <ResizablePanel defaultSize={50} minSize={20}>
          <SplitSlot
            slotId="slot-0"
            appHref={slots['slot-0'] ?? null}
            apps={apps}
            onSelectApp={onSelectApp}
            onClearSlot={onClearSlot}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={20}>
          <ResizablePanelGroup orientation="vertical" className="h-full w-full min-h-0">
            <ResizablePanel defaultSize={50} minSize={20}>
              <SplitSlot
                slotId="slot-1"
                appHref={slots['slot-1'] ?? null}
                apps={apps}
                onSelectApp={onSelectApp}
                onClearSlot={onClearSlot}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={20}>
              <SplitSlot
                slotId="slot-2"
                appHref={slots['slot-2'] ?? null}
                apps={apps}
                onSelectApp={onSelectApp}
                onClearSlot={onClearSlot}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // layout === 'split-4' (four screen grid)
  return (
    <ResizablePanelGroup orientation="vertical" className="h-full w-full min-h-0">
      <ResizablePanel defaultSize={50} minSize={20}>
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full min-h-0">
          <ResizablePanel defaultSize={50} minSize={20}>
            <SplitSlot
              slotId="slot-0"
              appHref={slots['slot-0'] ?? null}
              apps={apps}
              onSelectApp={onSelectApp}
              onClearSlot={onClearSlot}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={20}>
            <SplitSlot
              slotId="slot-1"
              appHref={slots['slot-1'] ?? null}
              apps={apps}
              onSelectApp={onSelectApp}
              onClearSlot={onClearSlot}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={50} minSize={20}>
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full min-h-0">
          <ResizablePanel defaultSize={50} minSize={20}>
            <SplitSlot
              slotId="slot-2"
              appHref={slots['slot-2'] ?? null}
              apps={apps}
              onSelectApp={onSelectApp}
              onClearSlot={onClearSlot}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={20}>
            <SplitSlot
              slotId="slot-3"
              appHref={slots['slot-3'] ?? null}
              apps={apps}
              onSelectApp={onSelectApp}
              onClearSlot={onClearSlot}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

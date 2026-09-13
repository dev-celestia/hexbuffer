import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { useEncoderPage } from './hooks/use-encoder-page';
import { CODEC_LABELS } from './constants';
import { EncoderTransformColumn } from './components/encoder-transform-column';
import { EncoderInputPanel } from './components/encoder-input-panel';
import { EncoderOutputPanel } from './components/encoder-output-panel';

export function EncoderPage() {
  const page = useEncoderPage();

  return (
    <div
      className={cn(
        // Sizing & Spacing
        "h-full p-2",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0 overflow-hidden",

          // Sizing & Spacing
          "h-full",

          // Backgrounds & Borders
          "border bg-card rounded-md"
        )}
      >
        <main
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-h-0",

            // Backgrounds & Borders
            "bg-card"
          )}
        >
          <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
            <ResizablePanel defaultSize="40%" minSize="25%">
              <EncoderInputPanel
                headerLabel={page.currentMode.source}
                input={page.input}
                onInputChange={page.setInput}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="220px" minSize="190px" maxSize="300px">
              <EncoderTransformColumn
                activeType={page.activeType}
                onTypeChange={page.setActiveType}
                mode={page.mode}
                onModeChange={page.setMode}
                output={page.output}
                isEmpty={page.isEmpty}
                onSwap={page.handleSwap}
                onCopy={page.handleCopy}
                onClear={page.handleClear}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="40%" minSize="25%">
              <EncoderOutputPanel
                headerLabel={page.currentMode.target}
                codecLabel={CODEC_LABELS[page.activeType]}
                output={page.output}
                error={page.error}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}

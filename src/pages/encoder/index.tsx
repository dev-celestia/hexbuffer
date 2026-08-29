import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { useEncoderPage } from './hooks/use-encoder-page';
import { EncoderToolbar } from './components/encoder-toolbar';
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
        <EncoderToolbar
          activeType={page.activeType}
          onTypeChange={page.setActiveType}
          mode={page.mode}
          onModeChange={page.setMode}
          currentMode={page.currentMode}
          output={page.output}
          isEmpty={page.isEmpty}
          onSwap={page.handleSwap}
          onCopy={page.handleCopy}
          onClear={page.handleClear}
        />

        <main
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-h-0",

            // Backgrounds & Borders
            "bg-card"
          )}
        >
          <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
            <ResizablePanel defaultSize={50} minSize={25}>
              <EncoderInputPanel
                headerLabel={page.currentMode.source}
                input={page.input}
                mode={page.mode}
                isEmpty={page.isEmpty}
                onInputChange={page.setInput}
                onClear={page.handleClear}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={25}>
              <EncoderOutputPanel
                headerLabel={page.currentMode.target}
                output={page.output}
                error={page.error}
                onCopy={page.handleCopy}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}

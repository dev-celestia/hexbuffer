import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'hexbuffer-ui';
import { useState } from 'react';

import { toast } from 'sonner';
import { useComparerPage } from './hooks/use-comparer-page';
import { ComparerToolbar } from './components/comparer-toolbar';
import { ComparerInputs } from './components/comparer-inputs';
import { ComparerDiffView } from './components/comparer-diff-view';

import { cn } from '@/lib/utils';

export function ComparerPage() {
  const page = useComparerPage();
  const [showInputs, setShowInputs] = useState(true);

  const copyPanel = async (value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`Copied ${label}`);
  };

  const handlePasteA = async () => {
    try {
      const text = await navigator.clipboard.readText();
      page.setValueA(text);
      toast.success('Pasted into Original (A)');
    } catch (err) {
      toast.error('Could not read from clipboard. Please paste using keyboard shortcut.');
    }
  };

  const handlePasteB = async () => {
    try {
      const text = await navigator.clipboard.readText();
      page.setValueB(text);
      toast.success('Pasted into Modified (B)');
    } catch (err) {
      toast.error('Could not read from clipboard. Please paste using keyboard shortcut.');
    }
  };

  // ponytail: thin page coordinator wiring presentation sub-components together.
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full p-2",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <ComparerToolbar
        hasContent={page.hasContent}
        hasDiff={page.hasDiff}
        diffMode={page.diffMode}
        setDiffMode={page.setDiffMode}
        showInputs={showInputs}
        setShowInputs={setShowInputs}
        handleSwap={page.handleSwap}
        handleClear={page.handleClear}
        handleCopy={page.handleCopy}
        valueA={page.valueA}
        valueB={page.valueB}
        copyPanel={copyPanel}
      />

      <div
        className={cn(
          // Layout & Positioning
          "relative flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-b-md"
        )}
      >
        {showInputs ? (
          <ResizablePanelGroup orientation="vertical" className="h-full">
            <ResizablePanel defaultSize={35} minSize={15}>
              <ComparerInputs
                valueA={page.valueA}
                setValueA={page.setValueA}
                valueB={page.valueB}
                setValueB={page.setValueB}
                handlePasteA={handlePasteA}
                handlePasteB={handlePasteB}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={65} minSize={30}>
              <div
                className={cn(
                  // Layout & Positioning
                  "relative",

                  // Sizing & Spacing
                  "h-full w-full"
                )}
              >
                <ComparerDiffView
                  diffResult={page.diffResult}
                  diffMode={page.diffMode}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "relative",

              // Sizing & Spacing
              "h-full w-full"
            )}
          >
            <ComparerDiffView
              diffResult={page.diffResult}
              diffMode={page.diffMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}


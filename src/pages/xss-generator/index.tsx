
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@celestia-project/ui';
import { cn } from '@/lib/utils';

import { CopyIcon, TrashIcon } from '@phosphor-icons/react';
import { useXssGeneratorPage } from './hooks/use-xss-generator-page';
import { PayloadLibraryPanel } from './components/payload-library-panel';
import { PayloadBuilderPanel } from './components/payload-builder-panel';
import { CATEGORY_LABELS } from './constants';
import type { XssPayloadCategory } from './types';

export function XssGeneratorPage() {
  const page = useXssGeneratorPage();

  const isEmpty = !page.basePayload && !page.encodedOutput;

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
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col min-h-0 overflow-hidden",

          // Sizing & Spacing
          "h-full",

          // Backgrounds & Borders
          "border rounded-md bg-card"
        )}
      >
        {/* Toolbar */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0",

            // Sizing & Spacing
            "px-3 py-2 gap-3",

            // Backgrounds & Borders
            "border-b bg-muted/20"
          )}
        >
          <Tabs
            value={page.activeCategory}
            onValueChange={(v) => page.setActiveCategory(v as XssPayloadCategory)}
          >
            <TabsList>
              {(Object.keys(CATEGORY_LABELS) as XssPayloadCategory[]).map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center shrink-0",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => page.handleCopy(page.encodedOutput)}
              disabled={!page.encodedOutput}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2.5 gap-1.5",

                // Typography
                "text-xs font-medium"
              )}
            >
              <CopyIcon className="size-3.5" />
              <span>Copy Output</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={page.handleClear}
              disabled={isEmpty}
              className={cn(
                // Sizing & Spacing
                "h-7 w-7",

                // Typography
                "text-muted-foreground",

                // Interactive & States
                "hover:text-foreground"
              )}
              title="Clear payloads"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <main
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-h-0"
          )}
        >
          <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
            <ResizablePanel defaultSize={28} minSize={20} maxSize={45}>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col min-h-0",

                  // Sizing & Spacing
                  "h-full"
                )}
              >
                <PayloadLibraryPanel
                  filteredPayloads={page.filteredPayloads}
                  onSelectPayload={page.handleSelectPayload}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={72} minSize={40}>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-col min-h-0",

                  // Sizing & Spacing
                  "h-full"
                )}
              >
                <PayloadBuilderPanel
                  basePayload={page.basePayload}
                  onBasePayloadChange={page.setBasePayload}
                  encodings={page.encodings}
                  onToggleEncoding={page.toggleEncoding}
                  injectionContext={page.injectionContext}
                  onInjectionContextChange={page.setInjectionContext}
                  encodedOutput={page.encodedOutput}
                  onCopy={page.handleCopy}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}

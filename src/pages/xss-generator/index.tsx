
import { Button, Tabs, TabsList, TabsTrigger } from '@celestia-project/ui';
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
        "h-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "px-2 py-1 gap-3",

          // Backgrounds & Borders
          "border-b"
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
            "gap-1"
          )}
        >
          <Button size="xs"
            variant="outline"
            onClick={() => page.handleCopy(page.encodedOutput)}
            disabled={!page.encodedOutput}
          >
            <CopyIcon />
            Copy Output
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={page.handleClear}
            disabled={isEmpty}
          >
            <TrashIcon />
          </Button>
        </div>
      </div>

      <main
        className={cn(
          // Layout & Positioning
          "flex flex-1 min-h-0"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "w-72"
          )}
        >
          <PayloadLibraryPanel
            filteredPayloads={page.filteredPayloads}
            onSelectPayload={page.handleSelectPayload}
          />
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-w-0"
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
      </main>
    </div>
  );
}

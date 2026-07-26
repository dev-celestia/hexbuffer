import { cn } from '@/lib/utils';
import { useHashPage } from './hooks/use-hash-page';
import { HashToolbar } from './components/hash-toolbar';
import { HashInputPanel } from './components/hash-input-panel';
import { HashOutputPanel } from './components/hash-output-panel';

export function HashPage() {
  const page = useHashPage();

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
      <HashToolbar
        activeType={page.activeType}
        onTypeChange={page.setActiveType}
        output={page.output}
        isEmpty={page.isEmpty}
        onCopy={page.handleCopy}
        onClear={page.handleClear}
      />

      <main
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0"
        )}
      >
        {/* Static 50/50 side-by-side pane split */}
        <section
          className={cn(
            // Layout & Positioning
            "grid grid-cols-2 divide-x min-h-0",

            // Sizing & Spacing
            "h-full",

            // Backgrounds & Borders
            "divide-border bg-background"
          )}
        >
          <HashInputPanel
            input={page.input}
            isEmpty={page.isEmpty}
            onInputChange={page.setInput}
            onClear={page.handleClear}
          />

          <HashOutputPanel
            output={page.output}
            onCopy={page.handleCopy}
          />
        </section>
      </main>
    </div>
  );
}

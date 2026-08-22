import { cn } from '@/lib/utils';
import { useScratchpadPage } from './hooks/use-scratchpad-page';
import { ScratchpadSidebar } from './components/scratchpad-sidebar';
import { ScratchpadEditorPane } from './components/scratchpad-editor-pane';

export function ScratchpadPage() {
  const hook = useScratchpadPage();

  // ponytail: sidebar + editor page layout using consistent container aesthetics
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex overflow-hidden",

        // Sizing & Spacing
        "h-full w-full p-2",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "border rounded-md"
        )}
      >
        {hook.isSidebarOpen && <ScratchpadSidebar hook={hook} />}
        <ScratchpadEditorPane hook={hook} />
      </div>
    </div>
  );
}

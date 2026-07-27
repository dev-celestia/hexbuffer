import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BrowserSnapshot } from '@/stores/browser-automation';
import { useAccessibilityTreePanel } from './hooks/use-accessibility-tree-panel';

interface AccessibilityTreePanelProps {
  snapshot: BrowserSnapshot | null;
  onElementClick: (refId: string) => void;
}

export function AccessibilityTreePanel({ snapshot, onElementClick }: AccessibilityTreePanelProps) {
  const { hasSnapshot, elements, hasElements, title } = useAccessibilityTreePanel({ snapshot });

  if (!hasSnapshot) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 flex items-center justify-center",

          // Sizing & Spacing
          "p-4",

          // Typography
          "text-sm text-muted-foreground"
        )}
      >
        No snapshot available. Open the browser and take a snapshot.
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex-1 flex flex-col min-h-0"
      )}
    >
      <div
        className={cn(
          // Sizing & Spacing
          "px-3 py-2",

          // Typography
          "text-xs text-muted-foreground",

          // Backgrounds & Borders
          "border-b"
        )}
      >
        {title && (
          <span
            className={cn(
              // Layout & Positioning
              "block truncate"
            )}
            title={title}
          >
            {title}
          </span>
        )}
      </div>
      <ScrollArea
        className={cn(
          // Layout & Positioning
          "flex-1"
        )}
      >
        <div
          className={cn(
            // Sizing & Spacing
            "p-2 space-y-1"
          )}
        >
          {!hasElements ? (
            <div
              className={cn(
                // Sizing & Spacing
                "p-2",

                // Typography
                "text-sm text-muted-foreground"
              )}
            >
              No interactive elements found.
            </div>
          ) : (
            elements.map((element) => (
              <Button
                key={element.refId}
                variant="ghost"
                className={cn(
                  // Layout & Positioning
                  "w-full justify-start text-left",

                  // Sizing & Spacing
                  "h-auto py-1 px-2",

                  // Typography
                  "text-xs"
                )}
                onClick={() => onElementClick(element.refId)}
              >
                <span
                  className={cn(
                    // Layout & Positioning
                    "inline-flex items-center justify-center",

                    // Sizing & Spacing
                    "w-6 h-6 mr-2",

                    // Typography
                    "font-mono text-muted-foreground",

                    // Backgrounds & Borders
                    "rounded bg-muted"
                  )}
                >
                  {element.refId}
                </span>
                <span
                  className={cn(
                    // Layout & Positioning
                    "inline-flex items-center",

                    // Sizing & Spacing
                    "gap-1"
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      "text-muted-foreground"
                    )}
                  >
                    [{element.role}]
                  </span>
                  <span
                    className={cn(
                      // Layout & Positioning
                      "max-w-[150px] truncate",

                      // Typography
                      "font-medium"
                    )}
                  >
                    {element.name || '(no name)'}
                  </span>
                  {element.value && (
                    <span
                      className={cn(
                        // Layout & Positioning
                        "max-w-[100px] truncate",

                        // Typography
                        "text-muted-foreground"
                      )}
                    >
                      = "{element.value}"
                    </span>
                  )}
                </span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
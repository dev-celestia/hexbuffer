import * as React from 'react';
import { SpinnerGapIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { PAGE_COMPONENT_MAP } from './page-lazy-imports';
import { DesktopWindow } from './desktop-window';
import { useDesktopWorkspace } from './hooks/use-desktop-workspace';

interface DesktopWorkspaceProps {
  activeChild: React.ReactNode;
}

export function DesktopWorkspace({ activeChild }: Readonly<DesktopWorkspaceProps>) {
  const { openWindows, activeWindowId, handleWorkspaceClick } = useDesktopWorkspace();
  const DesktopComponent = PAGE_COMPONENT_MAP['/'];

  // Transparent so BgLayer (behind this) shows through
  const ROOT_BG = 'bg-transparent';

  return (
    <div
      onClick={handleWorkspaceClick}
      className={cn(
        // Layout & Positioning
        "relative overflow-hidden",

        // Sizing & Spacing
        "w-full h-full",

        // Backgrounds & Borders
        ROOT_BG
      )}
    >
      <style>{`
        .select-none-global, .select-none-global * {
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `}</style>
      {/* Desktop Background (Desktop Dashboard) */}
      <div
        data-tauri-drag-region
        className={cn(
          // Layout & Positioning
          "absolute inset-0 z-0 overflow-hidden",

          // Sizing & Spacing
          "w-full h-full"
        )}
      >
        <React.Suspense
          fallback={
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center gap-2",

                // Sizing & Spacing
                "h-full",

                // Typography
                "text-muted-foreground text-sm"
              )}
            >
              <SpinnerGapIcon
                className={cn(
                  // Layout & Positioning
                  "animate-spin shrink-0",

                  // Sizing & Spacing
                  "size-4"
                )}
              />
              Loading desktop…
            </div>
          }
        >
          {DesktopComponent ? <DesktopComponent /> : null}
        </React.Suspense>
      </div>

      {/* Floating Application Windows */}
      <div
        className={cn(
          // Layout & Positioning
          "absolute inset-0 pointer-events-none z-10"
        )}
      >
        {openWindows.map((win) => (
          <DesktopWindow
            key={win.id}
            win={win}
            isFocused={activeWindowId === win.id}
            activeChild={activeChild}
          />
        ))}
      </div>
    </div>
  );
}


import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'hexbuffer-ui';
import { useDesktopPage } from './hooks/use-desktop-page';
import { ProxyWidget } from './components/proxy-widget';
import { VpnWidget } from './components/vpn-widget';
import { TargetWidget } from './components/target-widget';
import { ScratchpadWidget } from './components/scratchpad-widget';
import { CollectionsWidget } from './components/collections-widget';
import { ClipboardWidget } from './components/clipboard-widget';
import { DesktopIconItem } from './components/desktop-icon-item';

import { ShieldWarningIcon, GearSixIcon } from '@phosphor-icons/react';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { ShortcutManager } from './components/shortcut-manager';

import { cn } from '@/lib/utils';

export function DesktopPage() {
  const {
    displayItems,
    handleItemClick,
    handleClearSearch,
  } = useDesktopPage();
  const hiddenWidgets = useAppSettingsStore((s) => s.hiddenWidgets || []);

  const ROOT_BG = 'bg-transparent';

  const showCollections = !hiddenWidgets.includes('collections');
  const showProxy = !hiddenWidgets.includes('proxy');
  const showVpn = !hiddenWidgets.includes('vpn');
  const showTarget = !hiddenWidgets.includes('target');
  const showScratchpad = !hiddenWidgets.includes('scratchpad');
  const showClipboard = !hiddenWidgets.includes('clipboard');
  const hasVisibleWidgets = showCollections || showProxy || showVpn || showTarget || showScratchpad || showClipboard;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0 overflow-y-auto scrollbar-thin",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        ROOT_BG
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col md:flex-row items-start mx-auto",

          // Sizing & Spacing
          "w-full p-6 gap-6"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex-1 min-w-0"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center max-w-[800px]",

              // Sizing & Spacing
              "gap-4 mb-4 pb-2",

              // Backgrounds & Borders
              "border-b border-border/40"
            )}
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  className={cn(
                    // Sizing & Spacing
                    "h-5 px-1.5",

                    // Typography
                    "text-[11px] text-muted-foreground",

                    // Interactive & States
                    "hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <GearSixIcon className="mr-1 size-3.5" />
                  Manage
                </Button>
              </DialogTrigger>
              <DialogContent
                className={cn(
                  // Sizing & Spacing
                  "max-w-md"
                )}
              >
                <DialogHeader>
                  <DialogTitle>Manage Desktop</DialogTitle>
                  <DialogDescription>
                    Toggle visibility of shortcuts and widgets on your desktop workspace.
                  </DialogDescription>
                </DialogHeader>
                <div
                  className={cn(
                    // Sizing & Spacing
                    "mt-2"
                  )}
                >
                  <ShortcutManager />
                </div>
              </DialogContent>
            </Dialog>
            <p
              className={cn(
                // Typography
                "text-[11px] font-mono font-bold tracking-wider uppercase text-muted-foreground"
              )}
            >
              Shortcuts
            </p>
          </div>

          {displayItems.length > 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap justify-items-center max-w-[800px]",

                // Sizing & Spacing
                "gap-3"
              )}
            >
              {displayItems.map((item) => (
                <DesktopIconItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col items-center justify-center",

                // Sizing & Spacing
                "py-16 px-4",

                // Backgrounds & Borders
                "rounded-lg border border-dashed border-border/80 bg-muted/20 backdrop-blur-sm"
              )}
            >
              <ShieldWarningIcon
                className={cn(
                  // Sizing & Spacing
                  "size-8 mb-3",

                  // Typography
                  "text-muted-foreground"
                )}
              />
              <p
                className={cn(
                  // Typography
                  "text-sm font-medium text-foreground"
                )}
              >
                No features matched your search
              </p>
              <p
                className={cn(
                  // Sizing & Spacing
                  "mt-1",

                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                Try searching for another keyword or clear the search input.
              </p>
              <Button
                variant="link"
                onClick={handleClearSearch}
                className={cn(
                  // Sizing & Spacing
                  "h-auto p-0 mt-2",

                  // Typography
                  "text-xs font-semibold text-primary",

                  // Interactive & States
                  "hover:underline"
                )}
              >
                Clear search query
              </Button>
            </div>
          )}
        </div>

        {hasVisibleWidgets && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col shrink-0",

              // Sizing & Spacing
              "w-full md:w-64 lg:w-72 gap-4"
            )}
          >
            {showCollections && <CollectionsWidget />}
            {showProxy && <ProxyWidget />}
            {showVpn && <VpnWidget />}
            {showTarget && <TargetWidget />}
            {showScratchpad && <ScratchpadWidget />}
            {showClipboard && <ClipboardWidget />}
          </div>
        )}
      </div>
    </div>
  );
}


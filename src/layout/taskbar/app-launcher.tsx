import {
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

import { getAppIconImage, MAIN_NAV_ITEMS } from '../constants';
import { useAppSettingsStore } from '@/stores/app-settings-store';

import { TriangleLogo } from '../triangle-logo';

export function AppLauncher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const pinnedNavItems = useAppSettingsStore((s) => s.pinnedNavItems);
  const togglePinNavItem = useAppSettingsStore((s) => s.togglePinNavItem);

  const launcherItems = MAIN_NAV_ITEMS.filter((item) => item.href !== '/');

  const MAX_PINNED = 9;
  const pinnedCount = pinnedNavItems.length;
  const isAtMax = pinnedCount >= MAX_PINNED;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'p') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center shrink-0",
            // Sizing & Spacing
            "size-7 rounded-sm",
            // Typography & Colors
            "text-muted-foreground transition-all",
            // Interactive & States
            "hover:bg-muted/80 hover:text-foreground active:scale-95 cursor-pointer",
            open && "bg-primary/15 text-primary"
          )}
          aria-label="All Apps"
        >
          <TriangleLogo />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={12} className="flex items-center gap-1.5">
          <span>All Apps</span>
          <Kbd className="text-[10px]">
            {isMac ? '⌘ + P' : 'Ctrl + P'}
          </Kbd>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            // Sizing & Spacing
            "sm:max-w-2xl max-w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden"
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Applications</DialogTitle>
            <DialogDescription>Search and launch apps or pin them to dock navbar</DialogDescription>
          </DialogHeader>

          <Command className="border-0 rounded-none bg-transparent">
            <CommandInput placeholder="Search applications, tools, and workflows…" autoFocus />
            <CommandList className="max-h-[420px] p-2">
              <CommandEmpty>No applications found.</CommandEmpty>
              <CommandGroup heading="Available Tools">
                {launcherItems.map((item) => {
                  const isPinned = pinnedNavItems.includes(item.href);
                  const imageSrc = getAppIconImage(item.href, item.label);

                  return (
                    <CommandItem
                      key={item.href}
                      value={`${item.label} ${item.description ?? ''}`}
                      onSelect={() => {
                        navigate(item.href);
                        setOpen(false);
                      }}
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between gap-3",
                        // Sizing & Spacing
                        "py-2.5 px-3 rounded-lg my-0.5",
                        // Interactive & States
                        "cursor-pointer"
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex items-center gap-3 min-w-0 flex-1"
                        )}
                      >
                        <div
                          role="button"
                          tabIndex={-1}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!isPinned && isAtMax) {
                              toast.error('Dock is full', {
                                description: `Maximum ${MAX_PINNED + 1} apps. Unpin one first.`,
                              });
                              return;
                            }
                            togglePinNavItem(item.href);
                          }}
                          className={cn(
                            // Layout & Positioning
                            "flex items-center justify-center shrink-0",
                            // Sizing & Spacing
                            "p-1 rounded-md",
                            // Interactive & States
                            "hover:bg-muted/70 cursor-pointer"
                          )}
                          aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
                          title={isPinned ? "Unpin from dock navbar" : "Pin to dock navbar"}
                        >
                          <Checkbox
                            checked={isPinned}
                            tabIndex={-1}
                            className="pointer-events-none"
                          />
                        </div>

                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex items-center justify-center shrink-0 select-none overflow-hidden",
                            // Sizing & Spacing
                            "size-8.5 rounded-lg",
                            // Backgrounds & Borders
                            item.colors
                              ? `${item.colors.bg} border border-white/20 dark:border-white/10 shadow-xs text-white`
                              : "bg-muted/60 border border-border/60 text-muted-foreground"
                          )}
                        >
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.label}
                              draggable={false}
                              className={cn(
                                // Layout & Positioning
                                "object-cover",
                                // Sizing & Spacing
                                "size-full",
                                // Interactive & States
                                "select-none"
                              )}
                            />
                          ) : (
                            <item.icon className="size-4.5 shrink-0" />
                          )}
                        </div>

                        <div
                          className={cn(
                            // Layout & Positioning
                            "flex flex-col min-w-0 flex-1 space-y-0.5"
                          )}
                        >
                          <div
                            className={cn(
                              // Layout & Positioning
                              "flex items-center gap-2"
                            )}
                          >
                            <span
                              className={cn(
                                // Typography
                                "text-sm font-medium tracking-tight text-foreground truncate"
                              )}
                            >
                              {item.label}
                            </span>
                            {item.flag && item.flag !== 'release' && (
                              <span
                                className={cn(
                                  // Sizing & Spacing
                                  "px-1.5 py-0.5 rounded-[4px] shrink-0 leading-none",
                                  // Typography
                                  "text-[8.5px] font-bold uppercase tracking-wider select-none",
                                  // Backgrounds & Borders
                                  item.flag === 'alpha'
                                    ? "bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/20"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                )}
                              >
                                {item.flag}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p
                              className={cn(
                                // Typography
                                "text-xs text-muted-foreground line-clamp-1 leading-normal"
                              )}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between gap-4 select-none",
              // Sizing & Spacing
              "px-4 py-2.5 border-t border-border/60",
              // Backgrounds & Borders
              "bg-muted/30 text-muted-foreground",
              // Typography
              "text-xs"
            )}
          >
            <p className="line-clamp-1">
              Click an application to open it. Check the box to pin it directly to your bottom dock navbar.
            </p>
            <span
              className={cn(
                // Typography
                "font-medium text-foreground shrink-0 tabular-nums text-[11px]"
              )}
            >
              {pinnedCount}/{MAX_PINNED} pinned
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

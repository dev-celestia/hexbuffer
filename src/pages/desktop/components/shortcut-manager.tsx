import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Input, Label, Switch } from '@celestia-project/ui';
import * as React from 'react';
import { useAppSettingsStore } from '@/stores/app-settings-store';
import { MAIN_NAV_ITEMS } from '@/layout/constants';

import { ArrowCounterClockwiseIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';

import { DESKTOP_WIDGETS, DEFAULT_HIDDEN_WIDGETS } from '../constants';
import { cn } from '@/lib/utils';

export function ShortcutManager() {
  const hiddenNavItems = useAppSettingsStore((s) => s.hiddenNavItems);
  const toggleNavItem = useAppSettingsStore((s) => s.toggleNavItem);
  const resetHiddenNavItems = useAppSettingsStore((s) => s.resetHiddenNavItems);

  const hiddenWidgets = useAppSettingsStore((s) => s.hiddenWidgets || DEFAULT_HIDDEN_WIDGETS);
  const toggleWidget = useAppSettingsStore((s) => s.toggleWidget);
  const resetHiddenWidgets = useAppSettingsStore((s) => s.resetHiddenWidgets);

  const [searchQuery, setSearchQuery] = React.useState('');

  const itemsToManage = React.useMemo(() => {
    return MAIN_NAV_ITEMS.filter((item) => item.label !== 'Desktop');
  }, []);

  const filteredItems = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return itemsToManage.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        (item.description ?? '').toLowerCase().includes(query)
    );
  }, [searchQuery, itemsToManage]);

  const isNavModified = hiddenNavItems.length > 0;
  const isWidgetsModified =
    hiddenWidgets.length !== DEFAULT_HIDDEN_WIDGETS.length ||
    DEFAULT_HIDDEN_WIDGETS.some((id) => !hiddenWidgets.includes(id));
  const hasModifiedItems = isNavModified || isWidgetsModified;

  const handleResetAll = React.useCallback(() => {
    resetHiddenNavItems();
    resetHiddenWidgets();
  }, [resetHiddenNavItems, resetHiddenWidgets]);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col select-none text-left",

        // Sizing & Spacing
        "gap-4"
      )}
    >
      <Accordion
        multiple
        defaultValue={['shortcuts', 'widgets']}
        className={cn(
          // Sizing & Spacing
          "w-full"
        )}
      >
        <AccordionItem
          value="shortcuts"
          className={cn(
            // Backgrounds & Borders
            "border-b border-border/40"
          )}
        >
          <AccordionTrigger
            className={cn(
              // Sizing & Spacing
              "py-2.5",

              // Interactive & States
              "hover:no-underline"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between flex-1",

                // Sizing & Spacing
                "mr-2"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase"
                )}
              >
                Shortcuts
              </span>
              <span
                className={cn(
                  // Typography
                  "text-[10px] text-muted-foreground font-mono font-normal normal-case"
                )}
              >
                {filteredItems.length} available
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              // Sizing & Spacing
              "pt-1 pb-3.5 space-y-3"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "relative"
              )}
            >
              <MagnifyingGlassIcon
                className={cn(
                  // Layout & Positioning
                  "absolute left-2.5 top-2.5",

                  // Sizing & Spacing
                  "size-3.5",

                  // Typography
                  "text-muted-foreground"
                )}
              />
              <Input
                type="text"
                placeholder="Filter shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  // Sizing & Spacing
                  "pl-8 h-8",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "bg-muted/40"
                )}
              />
            </div>

            <div
              className={cn(
                // Layout & Positioning
                "overflow-y-auto scrollbar-thin divide-y divide-border/40",

                // Sizing & Spacing
                "max-h-[220px]",

                // Backgrounds & Borders
                "border border-border/60 rounded-md bg-background"
              )}
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isHidden = hiddenNavItems.includes(item.href);
                  return (
                    <div
                      key={item.href}
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-between",

                        // Sizing & Spacing
                        "gap-4 p-2",

                        // Interactive & States
                        "hover:bg-muted/30 transition-colors"
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex items-center min-w-0",

                          // Sizing & Spacing
                          "gap-2.5"
                        )}
                      >
                        <div
                          className={cn(
                            // Layout & Positioning
                            "shrink-0",

                            // Sizing & Spacing
                            "p-1",

                            // Typography
                            "text-white",

                            // Backgrounds & Borders
                            "rounded-sm border",
                            item.colors?.bg ?? 'bg-muted'
                          )}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Label
                            htmlFor={`shortcut-toggle-${item.href}`}
                            className={cn(
                              // Layout & Positioning
                              "block truncate cursor-pointer",

                              // Typography
                              "text-xs font-medium"
                            )}
                          >
                            {item.label}
                          </Label>
                          {item.description && (
                            <span
                              className={cn(
                                // Typography
                                "text-[10px] text-muted-foreground line-clamp-1"
                              )}
                            >
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <Switch
                        id={`shortcut-toggle-${item.href}`}
                        checked={!isHidden}
                        onCheckedChange={() => toggleNavItem(item.href)}
                      />
                    </div>
                  );
                })
              ) : (
                <div
                  className={cn(
                    // Sizing & Spacing
                    "py-6",

                    // Typography
                    "text-center text-xs text-muted-foreground"
                  )}
                >
                  No matching shortcuts
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="widgets"
          className={cn(
            // Backgrounds & Borders
            "border-b-0"
          )}
        >
          <AccordionTrigger
            className={cn(
              // Sizing & Spacing
              "py-2.5",

              // Interactive & States
              "hover:no-underline"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase"
              )}
            >
              Desktop Widgets
            </span>
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              // Sizing & Spacing
              "pt-1 pb-3.5"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "divide-y divide-border/40",

                // Backgrounds & Borders
                "border border-border/60 rounded-md bg-background"
              )}
            >
              {DESKTOP_WIDGETS.map((widget) => {
                const isHidden = hiddenWidgets.includes(widget.id);
                return (
                  <div
                    key={widget.id}
                    className={cn(
                      // Layout & Positioning
                      "flex items-center justify-between",

                      // Sizing & Spacing
                      "gap-4 p-2",

                      // Interactive & States
                      "hover:bg-muted/30 transition-colors"
                    )}
                  >
                    <div className="min-w-0">
                      <Label
                        htmlFor={`widget-toggle-${widget.id}`}
                        className={cn(
                          // Layout & Positioning
                          "block cursor-pointer",

                          // Typography
                          "text-xs font-medium"
                        )}
                      >
                        {widget.label}
                      </Label>
                      <span
                        className={cn(
                          // Typography
                          "text-[10px] text-muted-foreground line-clamp-1"
                        )}
                      >
                        {widget.description}
                      </span>
                    </div>
                    <Switch
                      id={`widget-toggle-${widget.id}`}
                      checked={!isHidden}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-4 pt-3.5 mt-1",

          // Backgrounds & Borders
          "border-t border-border/60"
        )}
      >
        <div className="space-y-0.5">
          <p className="text-xs font-medium">Reset customized state</p>
          <p className="text-[10px] text-muted-foreground">
            Restore default visibility of all items.
          </p>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={handleResetAll}
          disabled={!hasModifiedItems}
        >
          <ArrowCounterClockwiseIcon className="mr-1.5 size-3" />
          Reset
        </Button>
      </div>
    </div>
  );
}


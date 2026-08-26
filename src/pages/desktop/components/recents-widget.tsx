import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppSettingsStore } from '@/stores/app-settings-store';
import { useNavStore } from '@/stores/nav';
import { getAppIconImage, MAIN_NAV_ITEMS, type NavItem } from '@/layout/constants';
import { cn } from '@/lib/utils';

export function RecentsWidget() {
  const navigate = useNavigate();
  const recentApps = useAppSettingsStore((s) => s.recentApps || []);
  const hiddenNavItems = useAppSettingsStore((s) => s.hiddenNavItems);

  const recentItems = React.useMemo(() => {
    return recentApps
      .filter((href) => href !== '/' && !hiddenNavItems.includes(href))
      .map((href) => MAIN_NAV_ITEMS.find((item) => item.href === href))
      .filter((item): item is NavItem => item != null)
      .slice(0, 3);
  }, [recentApps, hiddenNavItems]);

  const handleOpenApp = React.useCallback(
    (item: NavItem) => {
      const navStore = useNavStore.getState();
      navStore.openWindow(item.href, item.label);
      navStore.focusWindow(item.href, navigate);
    },
    [navigate]
  );

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col select-none",
        // Sizing & Spacing
        "p-1 gap-0.5",
        // Backgrounds & Borders
        "rounded-lg border bg-muted/60 backdrop-blur-md shadow-xs",
        // Interactive & States
        "transition-shadow duration-200 hover:shadow-sm"
      )}
    >
      {recentItems.length > 0 ? (
        recentItems.map((item) => {
          const imageSrc = getAppIconImage(item.href, item.label);

          return (
            <div
              key={item.href}
              className={cn(
                // Layout & Positioning
                "group flex items-center justify-between gap-2",
                // Sizing & Spacing
                "py-1 px-1.5 rounded-md",
                // Interactive & States
                "hover:bg-muted/70 active:bg-muted/90 transition-colors cursor-pointer"
              )}
              onClick={() => handleOpenApp(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenApp(item);
                }
              }}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center gap-1.5 min-w-0 flex-1"
                )}
              >
                {/* Apple squircle app icon badge */}
                <div
                  className={cn(
                    // Layout & Positioning
                    "flex items-center justify-center shrink-0 select-none overflow-hidden",
                    // Sizing & Spacing
                    "size-4.5 rounded-[4px]",
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
                    <item.icon className="size-2.5 shrink-0" />
                  )}
                </div>

              {/* App Label */}
              <span
                className={cn(
                  // Typography
                  "text-[11px] font-medium tracking-tight text-foreground truncate"
                )}
              >
                {item.label}
              </span>

              {item.isNew && (
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-1 py-0.2 rounded-[2.5px] shrink-0 leading-none",
                    // Typography
                    "text-[7.5px] font-bold uppercase tracking-wider select-none",
                    // Backgrounds & Borders
                    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                  )}
                >
                  NEW
                </span>
              )}

              {item.flag && item.flag !== 'release' && (
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-1 py-0.2 rounded-[2.5px] shrink-0 leading-none",
                    // Typography
                    "text-[7.5px] font-bold uppercase tracking-wider select-none",
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
            </div>
          );
        })
      ) : (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center text-center",
            // Sizing & Spacing
            "py-2 px-1.5",
            // Typography
            "text-[11px] text-muted-foreground/70"
          )}
        >
          No recent apps
        </div>
      )}
    </div>
  );
}

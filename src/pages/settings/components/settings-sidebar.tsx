import * as React from 'react';
import type { Icon } from '@phosphor-icons/react';
import {
  GearIcon,
  ShieldCheckIcon,
  SparkleIcon,
  PaletteIcon,
  RobotIcon,
  CloudArrowUpIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type SettingsCategory = 'general' | 'ca-cert' | 'appearance' | 'ai' | 'automation' | 'r2';

interface SettingsNavItem {
  id: SettingsCategory;
  label: string;
  Icon: Icon;
}

/**
 * Sections, not a flat list. The page carries six destinations across three unrelated concerns, and
 * a flat list gave no hint which belonged with which. A section whose items are all filtered out by
 * the `categories` prop disappears rather than leaving an empty heading behind.
 */
const NAV_SECTIONS: Array<{ label: string; items: SettingsNavItem[] }> = [
  {
    label: 'Application',
    items: [
      { id: 'general', label: 'General', Icon: GearIcon },
      { id: 'appearance', label: 'Appearance', Icon: PaletteIcon },
    ],
  },
  {
    label: 'Network',
    items: [{ id: 'ca-cert', label: 'CA Certificate', Icon: ShieldCheckIcon }],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'ai', label: 'AI', Icon: SparkleIcon },
      { id: 'r2', label: 'R2 Storage', Icon: CloudArrowUpIcon },
    ],
  },
  {
    label: 'Automation',
    items: [{ id: 'automation', label: 'Runtime', Icon: RobotIcon }],
  },
];

interface SettingsSidebarProps {
  active: SettingsCategory;
  onSelect: (category: SettingsCategory) => void;
  categories?: SettingsCategory[];
}

export function SettingsSidebar({ active, onSelect, categories }: Readonly<SettingsSidebarProps>) {
  const itemRefs = React.useRef(new Map<SettingsCategory, HTMLButtonElement>());

  const sections = React.useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        label: section.label,
        items: categories
          ? section.items.filter((item) => categories.includes(item.id))
          : section.items,
      })).filter((section) => section.items.length > 0),
    [categories],
  );

  const visibleItems = React.useMemo(() => sections.flatMap((section) => section.items), [sections]);

  // Roving tabindex: the whole nav is one tab stop and arrow keys walk it. Without this, tabbing
  // through six destinations is the only way to reach the panel behind them. `active` can be
  // filtered out by `categories`, in which case the first visible item takes the tab stop — a group
  // with no tabbable child would be unreachable by keyboard entirely.
  const tabbableId = visibleItems.some((item) => item.id === active)
    ? active
    : visibleItems[0]?.id;

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, id: SettingsCategory) => {
      const index = visibleItems.findIndex((item) => item.id === id);
      if (index === -1) return;

      let nextIndex: number;
      switch (event.key) {
        case 'ArrowDown':
          nextIndex = (index + 1) % visibleItems.length;
          break;
        case 'ArrowUp':
          nextIndex = (index - 1 + visibleItems.length) % visibleItems.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = visibleItems.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      itemRefs.current.get(visibleItems[nextIndex].id)?.focus();
    },
    [visibleItems],
  );

  return (
    <nav
      aria-label="Settings sections"
      className={cn(
        // Layout & Positioning
        'flex shrink-0 flex-col',

        // Sizing & Spacing
        'w-56 gap-4 overflow-y-auto p-3',

        // Backgrounds & Borders
        'border-r bg-muted/30'
      )}
    >
      {sections.map((section) => (
        <div
          key={section.label}
          className={cn(
            // Layout & Positioning
            'flex flex-col gap-0.5'
          )}
        >
          <p
            className={cn(
              // Sizing & Spacing
              'px-3 pb-1',

              // Typography
              'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70'
            )}
          >
            {section.label}
          </p>

          {section.items.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) itemRefs.current.set(item.id, node);
                  else itemRefs.current.delete(item.id);
                }}
                type="button"
                onClick={() => onSelect(item.id)}
                onKeyDown={(event) => handleKeyDown(event, item.id)}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={item.id === tabbableId ? 0 : -1}
                className={cn(
                  // Layout & Positioning
                  'group relative flex w-full items-center',

                  // Sizing & Spacing
                  'gap-2.5 rounded-md px-3 py-2',

                  // Typography
                  'text-left text-sm font-medium',

                  // Interactive & States
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {/*
                  Transform + opacity only. A width-animated bar would keep tweening under the
                  reduced-motion preference, which covers `transition-colors` but not layout.
                */}
                <span
                  aria-hidden
                  className={cn(
                    // Layout & Positioning
                    'absolute left-0 top-1/2 -translate-y-1/2',

                    // Sizing & Spacing
                    'h-5 w-[3px] rounded-full',

                    // Backgrounds & Borders
                    'bg-primary',

                    // Interactive & States
                    'transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                    isActive ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0'
                  )}
                />
                <item.Icon
                  className={cn(
                    // Sizing & Spacing
                    'size-4 shrink-0',

                    // Interactive & States
                    'transition-colors duration-150',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                  weight={isActive ? 'fill' : 'regular'}
                />
                <span
                  className={cn(
                    // Layout & Positioning
                    'truncate'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

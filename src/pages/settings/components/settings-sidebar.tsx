import type { Icon } from '@phosphor-icons/react';
import {
  GearIcon,
  ShieldCheckIcon,
  SparkleIcon,
  PaletteIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type SettingsCategory = 'general' | 'ca-cert' | 'appearance' | 'ai' | 'automation' | 'r2';

interface SettingsNavItem {
  id: SettingsCategory;
  label: string;
  Icon: Icon;
}

const NAV_ITEMS: SettingsNavItem[] = [
  { id: 'general', label: 'General', Icon: GearIcon },
  { id: 'ca-cert', label: 'CA Certificate', Icon: ShieldCheckIcon },
  { id: 'ai', label: 'AI', Icon: SparkleIcon },
  { id: 'appearance', label: 'Appearance', Icon: PaletteIcon },
];

interface SettingsSidebarProps {
  active: SettingsCategory;
  onSelect: (category: SettingsCategory) => void;
  categories?: SettingsCategory[];
}

export function SettingsSidebar({ active, onSelect, categories }: SettingsSidebarProps) {
  const visibleNavItems = categories
    ? NAV_ITEMS.filter((item) => categories.includes(item.id))
    : NAV_ITEMS;

  return (
    <nav
      className={cn(
        // Layout & Positioning
        "flex shrink-0 flex-col",

        // Sizing & Spacing
        "w-52 gap-0.5 p-3",

        // Backgrounds & Borders
        "border-r bg-muted/30"
      )}
    >
      {visibleNavItems.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              // Layout & Positioning
              "group relative flex w-full items-center",

              // Sizing & Spacing
              "gap-2.5 rounded-md px-3 py-2",

              // Typography
              "text-left text-sm font-medium",

              // Interactive & States
              "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <item.Icon
              className={cn(
                // Sizing & Spacing
                "size-4 shrink-0",

                // Interactive & States
                "transition-colors duration-150",
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}
              weight={isActive ? "fill" : "regular"}
            />
            <span
              className={cn(
                // Layout & Positioning
                "truncate"
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

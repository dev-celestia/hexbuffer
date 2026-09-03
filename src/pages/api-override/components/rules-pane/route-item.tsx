import { Switch } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { MockRoute } from '../../types';
import { METHOD_COLORS } from './constants';

interface RouteItemProps {
  readonly route: MockRoute;
  readonly isSelected: boolean;
  readonly onSelect: (id: string) => void;
  readonly onUpdate: (id: string, patch: Partial<MockRoute>) => void;
}

export function RouteItem({ route, isSelected, onSelect, onUpdate }: RouteItemProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "group flex items-center cursor-pointer",

        // Sizing & Spacing
        "gap-2 py-1 pl-6 pr-3",

        // Backgrounds & Borders
        "border-b",
        isSelected && "bg-muted/50",

        // Interactive & States
        "transition-colors hover:bg-muted/40",
        !route.enabled && "opacity-40"
      )}
      onClick={() => onSelect(route.id)}
    >
      <span
        className={cn(
          // Layout & Positioning
          "shrink-0",

          // Sizing & Spacing
          "mt-0.5",

          // Typography
          "text-[10px]",
          METHOD_COLORS[route.method] ?? ""
        )}
      >
        {route.method}
      </span>
      <div
        className={cn(
          // Layout & Positioning
          "min-w-0 flex-1 overflow-hidden",

          // Sizing & Spacing
          "pl-0.5"
        )}
      >
        <p
          className={cn(
            // Layout & Positioning
            "truncate",

            // Typography
            "text-[11px] font-medium text-foreground"
          )}
        >
          {route.path}
        </p>
      </div>
      <Switch
        checked={route.enabled}
        onCheckedChange={(v) => onUpdate(route.id, { enabled: v })}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          // Layout & Positioning
          "shrink-0",

          // Sizing & Spacing
          "mt-0.5 scale-75",

          // Interactive & States
          "cursor-pointer"
        )}
      />
    </div>
  );
}

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { NOTE_FILTER_TABS, NOTE_SORT_OPTIONS } from '../../constants';
import type { NoteFilterTab, NoteSortOption } from '../../types';

export interface SavedNotesToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  activeFilterTab: NoteFilterTab;
  onActiveFilterTabChange: (tab: NoteFilterTab) => void;
  sortOption: NoteSortOption;
  onSortOptionChange: (sort: NoteSortOption) => void;
  counts: Record<NoteFilterTab, number>;
}

export function SavedNotesToolbar({
  searchQuery,
  onSearchQueryChange,
  activeFilterTab,
  onActiveFilterTabChange,
  sortOption,
  onSortOptionChange,
  counts,
}: SavedNotesToolbarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between shrink-0",

        // Sizing & Spacing
        "px-6 py-3 gap-3 border-b",

        // Backgrounds & Borders
        "bg-muted/5"
      )}
    >
      {/* Search Input */}
      <div
        className={cn(
          // Layout & Positioning
          "relative flex-1 max-w-full sm:max-w-sm"
        )}
      >
        <MagnifyingGlassIcon
          className={cn(
            // Layout & Positioning
            "absolute top-1/2 -translate-y-1/2 left-2.5",

            // Sizing & Spacing
            "size-3.5",

            // Typography
            "text-muted-foreground pointer-events-none"
          )}
        />
        <Input
          placeholder="Search note titles and contents..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className={cn(
            // Sizing & Spacing
            "h-8 pl-8 pr-7",

            // Typography
            "text-xs",

            // Backgrounds & Borders
            "bg-background"
          )}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            className={cn(
              // Layout & Positioning
              "absolute top-1/2 -translate-y-1/2 right-2",

              // Typography
              "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filter Pills & Sort Select */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-wrap items-center justify-between sm:justify-end",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        {/* Filter Tabs */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "p-0.5 rounded-lg border",

            // Backgrounds & Borders
            "bg-muted/40"
          )}
        >
          {NOTE_FILTER_TABS.map((tab) => {
            const count = counts[tab.id];
            const isActive = activeFilterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onActiveFilterTabChange(tab.id)}
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "px-2.5 py-1 rounded-md gap-1.5",

                  // Typography
                  "text-[11px] font-medium",

                  // Interactive & States
                  "transition-all cursor-pointer",
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-1 py-0.2 rounded-full",

                    // Typography
                    "text-[9px] font-mono",

                    // Backgrounds & Borders
                    isActive ? "bg-muted text-foreground" : "bg-muted/80 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <Select value={sortOption} onValueChange={(val) => onSortOptionChange(val as NoteSortOption)}>
          <SelectTrigger
            className={cn(
              // Sizing & Spacing
              "h-8 w-40",

              // Typography
              "text-xs",

              // Backgrounds & Borders
              "bg-background"
            )}
          >
            <SelectValue placeholder="Sort notes" />
          </SelectTrigger>
          <SelectContent>
            {NOTE_SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

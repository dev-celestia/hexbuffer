import {
  Badge,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  ScrollArea,
} from '@celestia-project/ui';
import {
  PencilIcon,
  MagnifyingGlassIcon,
  XIcon,
  TargetIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Target } from '@/types';

interface TargetSearchListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  targetCount: number;
  filteredTargets: Target[];
  onSelectTarget: (target: Target) => void;
  onEditTarget: (target: Target) => void;
  listHeight?: string;
}

export function TargetSearchList({
  searchQuery,
  setSearchQuery,
  targetCount,
  filteredTargets,
  onSelectTarget,
  onEditTarget,
  listHeight = 'h-[260px]',
}: TargetSearchListProps) {
  const showSearch = targetCount >= 5 || searchQuery.length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-3"
      )}
    >
      {showSearch && (
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <MagnifyingGlassIcon
              className={cn(
                // Sizing & Spacing
                "size-3.5",

                // Typography
                "text-muted-foreground"
              )}
            />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Filter targets by name or pattern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              // Sizing & Spacing
              "h-8 text-xs"
            )}
          />
          {searchQuery && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <XIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3"
                  )}
                />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      )}

      <div
        className={cn(
          // Layout & Positioning
          "overflow-hidden",

          // Sizing & Spacing
          "rounded-md",

          // Backgrounds & Borders
          "border border-border bg-card/50"
        )}
      >
        {filteredTargets.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center text-center",

              // Sizing & Spacing
              "px-4 py-8",

              // Typography
              "text-muted-foreground"
            )}
          >
            <TargetIcon
              className={cn(
                // Sizing & Spacing
                "mb-2 size-8",

                // Typography
                "text-muted-foreground/40"
              )}
            />
            <p
              className={cn(
                // Typography
                "text-xs font-medium"
              )}
            >
              {searchQuery ? 'No targets match your query' : 'No targets configured yet'}
            </p>
            <p
              className={cn(
                // Sizing & Spacing
                "mt-1",

                // Typography
                "text-[11px] text-muted-foreground/70"
              )}
            >
              {searchQuery
                ? 'Try typing a different keyword or create a target.'
                : 'Click below to add your first monitoring target.'}
            </p>
          </div>
        ) : (
          <ScrollArea className={listHeight}>
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "gap-1 p-1.5"
              )}
            >
              {filteredTargets.map((target) => {
                const primaryScope = target.scope[0];
                const extraScopeCount = target.scope.length - 1;

                return (
                  <div
                    key={target.id}
                    className={cn(
                      // Layout & Positioning
                      "group relative flex items-center justify-between cursor-pointer",

                      // Sizing & Spacing
                      "gap-2 rounded-md p-2",

                      // Backgrounds & Borders
                      "border border-transparent hover:border-border/60 hover:bg-accent/50",

                      // Interactive & States
                      "transition-all duration-150"
                    )}
                    onClick={() => onSelectTarget(target)}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex-1 min-w-0",

                        // Sizing & Spacing
                        "space-y-0.5"
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex items-center",

                          // Sizing & Spacing
                          "gap-2"
                        )}
                      >
                        <span
                          className={cn(
                            // Layout & Positioning
                            "truncate",

                            // Typography
                            "text-xs font-semibold text-foreground"
                          )}
                        >
                          {target.name}
                        </span>
                        {target.tabActive && (
                          <Badge
                            variant="outline"
                            className={cn(
                              // Layout & Positioning
                              "inline-flex items-center",

                              // Sizing & Spacing
                              "gap-1 px-1.5 py-0",

                              // Typography
                              "text-[10px] text-primary font-normal",

                              // Backgrounds & Borders
                              "border-primary/30 bg-primary/10"
                            )}
                          >
                            <CheckCircleIcon
                              className={cn(
                                // Sizing & Spacing
                                "size-2.5"
                              )}
                            />
                            Active
                          </Badge>
                        )}
                      </div>

                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex items-center truncate",

                          // Sizing & Spacing
                          "gap-1.5",

                          // Typography
                          "text-[11px] text-muted-foreground"
                        )}
                      >
                        {primaryScope ? (
                          <span
                            className={cn(
                              // Layout & Positioning
                              "truncate",

                              // Sizing & Spacing
                              "rounded px-1 py-0.5",

                              // Typography
                              "font-mono text-[10.5px] text-muted-foreground",

                              // Backgrounds & Borders
                              "bg-muted/60"
                            )}
                          >
                            {primaryScope}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              // Typography
                              "italic text-muted-foreground/60"
                            )}
                          >
                            No scope specified
                          </span>
                        )}

                        {extraScopeCount > 0 && (
                          <span
                            className={cn(
                              // Layout & Positioning
                              "shrink-0",

                              // Typography
                              "text-[10px] font-medium text-muted-foreground/80"
                            )}
                          >
                            +{extraScopeCount} more
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Edit ${target.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTarget(target);
                      }}
                    >
                      <PencilIcon />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

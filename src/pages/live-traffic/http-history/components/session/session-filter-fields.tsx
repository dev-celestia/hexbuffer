import {
  Badge,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@celestia-project/ui';
import {
  FunnelIcon,
  GlobeIcon,
  PlusIcon,
  TargetIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { SessionCaptureMode } from '@/types';
import { cn } from '@/lib/utils';

export interface SessionFilterFieldsProps {
  captureMode: SessionCaptureMode;
  onCaptureModeChange: (mode: SessionCaptureMode) => void;
  customHostInput: string;
  onCustomHostInputChange: (value: string) => void;
  customHosts: string[];
  onAddCustomHost: () => void;
  onRemoveCustomHost: (host: string) => void;
  excludeHostInput: string;
  onExcludeHostInputChange: (value: string) => void;
  excludeHosts: string[];
  onAddExcludeHost: () => void;
  onRemoveExcludeHost: (host: string) => void;
  showAdvancedExclude?: boolean;
  onToggleAdvancedExclude?: () => void;
  isCollapsibleExclude?: boolean;
}

export function SessionFilterFields({
  captureMode,
  onCaptureModeChange,
  customHostInput,
  onCustomHostInputChange,
  customHosts,
  onAddCustomHost,
  onRemoveCustomHost,
  excludeHostInput,
  onExcludeHostInputChange,
  excludeHosts,
  onAddExcludeHost,
  onRemoveExcludeHost,
  showAdvancedExclude = true,
  onToggleAdvancedExclude,
  isCollapsibleExclude = false,
}: SessionFilterFieldsProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-2 pt-1"
      )}
    >
      <Tabs
        value={captureMode}
        onValueChange={(val) => onCaptureModeChange(val as SessionCaptureMode)}
        className={cn(
          // Layout & Positioning
          "w-full flex flex-col",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        <TabsList
          className={cn(
            // Layout & Positioning
            "w-full grid grid-cols-3",

            // Sizing & Spacing
            "h-8 p-0.5",

            // Backgrounds & Borders
            "bg-muted/60 rounded-md"
          )}
        >
          <TabsTrigger
            value="all"
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "gap-1.5 h-7 px-2",

              // Typography
              "text-xs font-medium",

              // Interactive & States
              "transition-all"
            )}
          >
            <GlobeIcon className="size-3.5 shrink-0" />
            <span className="truncate">All Traffic</span>
          </TabsTrigger>

          <TabsTrigger
            value="target_scope"
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "gap-1.5 h-7 px-2",

              // Typography
              "text-xs font-medium",

              // Interactive & States
              "transition-all"
            )}
          >
            <TargetIcon className="size-3.5 shrink-0" />
            <span className="truncate">In-Scope Only</span>
          </TabsTrigger>

          <TabsTrigger
            value="custom"
            className={cn(
              // Layout & Positioning
              "flex items-center justify-center",

              // Sizing & Spacing
              "gap-1.5 h-7 px-2",

              // Typography
              "text-xs font-medium",

              // Interactive & States
              "transition-all"
            )}
          >
            <FunnelIcon className="size-3.5 shrink-0" />
            <span className="truncate">Custom Hosts</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {captureMode === 'all' && (
        <p
          className={cn(
            // Typography
            "text-[11px] text-muted-foreground leading-normal"
          )}
        >
          All traffic passing through the proxy will be saved into this session.
        </p>
      )}

      {captureMode === 'target_scope' && (
        <p
          className={cn(
            // Typography
            "text-[11px] text-muted-foreground leading-normal",

            // Backgrounds & Borders
            "p-2 rounded bg-muted/40 border border-border/40"
          )}
        >
          Only requests matching active <strong>Target Scope</strong> rules will be stored in SQLite. Background requests to third-party domains will be ignored.
        </p>
      )}

      {captureMode === 'custom' && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col",

            // Sizing & Spacing
            "gap-2 p-2.5 rounded",

            // Backgrounds & Borders
            "bg-muted/40 border border-border/40"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[11px] font-medium text-foreground"
              )}
            >
              Whitelist Host / URL Patterns
            </span>
            <span
              className={cn(
                // Typography
                "text-[10px] text-muted-foreground"
              )}
            >
              Enter to add
            </span>
          </div>

          <InputGroup>
            <InputGroupInput
              type="text"
              placeholder="e.g. api.example.com or *.internal.net"
              value={customHostInput}
              onChange={(e) => onCustomHostInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddCustomHost();
                }
              }}
              className={cn(
                // Sizing & Spacing
                "h-7",

                // Typography
                "text-xs"
              )}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                type="button"
                onClick={onAddCustomHost}
                aria-label="Add host pattern"
              >
                <PlusIcon className="size-3.5" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {customHosts.length > 0 ? (
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-wrap items-center",

                // Sizing & Spacing
                "gap-1 pt-1 max-h-24 overflow-y-auto"
              )}
            >
              {customHosts.map((h) => (
                <Badge
                  key={h}
                  variant="secondary"
                  className={cn(
                    // Layout & Positioning
                    "flex items-center",

                    // Sizing & Spacing
                    "gap-1 px-1.5 py-0.5",

                    // Typography
                    "text-[10px] font-mono",

                    // Backgrounds & Borders
                    "border border-primary/20 bg-primary/10 text-primary"
                  )}
                >
                  <span className="truncate max-w-[200px]">{h}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveCustomHost(h)}
                    className={cn(
                      // Typography
                      "text-muted-foreground hover:text-foreground",

                      // Interactive & States
                      "transition-colors"
                    )}
                  >
                    <XIcon className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p
              className={cn(
                // Typography
                "text-[10px] text-amber-500/90 italic"
              )}
            >
              Add at least one host pattern (e.g. *.example.com) to capture traffic.
            </p>
          )}
        </div>
      )}

      {/* Exclude Patterns */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col",

          // Sizing & Spacing
          "gap-1 pt-1"
        )}
      >
        {isCollapsibleExclude ? (
          <button
            type="button"
            onClick={onToggleAdvancedExclude}
            className={cn(
              // Layout & Positioning
              "flex items-center self-start",

              // Sizing & Spacing
              "gap-1",

              // Typography
              "text-[11px] text-muted-foreground hover:text-foreground",

              // Interactive & States
              "transition-colors"
            )}
          >
            <span>{showAdvancedExclude ? '▼' : '▶'}</span>
            <span>Exclude Host Patterns (Optional)</span>
            {excludeHosts.length > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  // Sizing & Spacing
                  "h-4 px-1 text-[9px]"
                )}
              >
                {excludeHosts.length}
              </Badge>
            )}
          </button>
        ) : (
          <span
            className={cn(
              // Typography
              "text-[11px] font-medium text-muted-foreground"
            )}
          >
            Excluded Host Patterns (Optional)
          </span>
        )}

        {showAdvancedExclude && (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col",

              // Sizing & Spacing
              "gap-2",
              isCollapsibleExclude && "p-2 rounded bg-muted/20 border border-border/30"
            )}
          >
            <InputGroup>
              <InputGroupInput
                type="text"
                placeholder="e.g. *.google.com, telemetry.*"
                value={excludeHostInput}
                onChange={(e) => onExcludeHostInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddExcludeHost();
                  }
                }}
                className={cn(
                  // Sizing & Spacing
                  "h-7",

                  // Typography
                  "text-xs"
                )}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  type="button"
                  onClick={onAddExcludeHost}
                  aria-label="Add exclude pattern"
                >
                  <PlusIcon className="size-3.5" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            {excludeHosts.length > 0 && (
              <div
                className={cn(
                  // Layout & Positioning
                  "flex flex-wrap items-center",

                  // Sizing & Spacing
                  "gap-1 pt-1 max-h-20 overflow-y-auto"
                )}
              >
                {excludeHosts.map((h) => (
                  <Badge
                    key={h}
                    variant="secondary"
                    className={cn(
                      // Layout & Positioning
                      "flex items-center",

                      // Sizing & Spacing
                      "gap-1 px-1.5 py-0.5",

                      // Typography
                      "text-[10px] font-mono",

                      // Backgrounds & Borders
                      "border border-destructive/20 bg-destructive/10 text-destructive"
                    )}
                  >
                    <span className="truncate max-w-[200px]">{h}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveExcludeHost(h)}
                      className={cn(
                        // Typography
                        "text-muted-foreground hover:text-foreground",

                        // Interactive & States
                        "transition-colors"
                      )}
                    >
                      <XIcon className="size-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

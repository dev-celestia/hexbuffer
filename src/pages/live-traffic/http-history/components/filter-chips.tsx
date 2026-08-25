import { Badge } from '@celestia-project/ui';
import { FunnelIcon, TargetIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { BlacklistRule } from '@/stores/history';
import { useHttpSessionStore } from '@/stores/history';

interface FilterChipsProps {
  blacklistRules: BlacklistRule[];
  onRemoveBlacklistRule: (id: string) => void;
  highlightedHosts: Record<string, string>;
  onRemoveHighlight: (host: string, path?: string) => void;
}

export function FilterChips({
  blacklistRules,
  onRemoveBlacklistRule,
  highlightedHosts,
  onRemoveHighlight,
}: FilterChipsProps) {
  const activeSession = useHttpSessionStore((state) => state.activeSession);
  const captureMode = activeSession?.capture_mode ?? 'all';
  let customHostsCount = 0;
  if (captureMode === 'custom' && activeSession?.capture_filter) {
    try {
      const parsed = JSON.parse(activeSession.capture_filter);
      if (Array.isArray(parsed)) customHostsCount = parsed.length;
    } catch {}
  }

  const hasBlacklist = blacklistRules.length > 0;
  const highlightEntries = Object.entries(highlightedHosts);
  const hasHighlights = highlightEntries.length > 0;
  const hasDbFilter = captureMode !== 'all';

  if (!hasBlacklist && !hasHighlights && !hasDbFilter) {
    return null;
  }

  return (
    <>
      {hasDbFilter && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center",

            // Sizing & Spacing
            "mt-1 gap-1.5"
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Typography
              "text-[10px] font-medium text-muted-foreground"
            )}
          >
            DB Recording:
          </span>
          <Badge
            variant="secondary"
            title="Only matching traffic is inserted into the database"
          >
            {captureMode === 'target_scope' ? (
              <>
                <TargetIcon className="size-3 mr-1" />
                <span>In-Scope Target Only</span>
              </>
            ) : (
              <>
                <FunnelIcon className="size-3 mr-1" />
                <span>Custom Whitelist ({customHostsCount} host{customHostsCount === 1 ? '' : 's'})</span>
              </>
            )}
          </Badge>
        </div>
      )}

      {hasBlacklist && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center",

            // Sizing & Spacing
            "mt-1 gap-1.5"
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            Hidden:
          </span>
          {blacklistRules.map((rule) => (
            <span
              key={rule.id}
              className={cn(
                // Layout & Positioning
                "inline-flex items-center",

                // Sizing & Spacing
                "gap-1 rounded px-1.5 py-0.5",

                // Typography
                "text-[10px] text-red-600 dark:text-red-400",

                // Backgrounds & Borders
                "border border-red-500/20 bg-red-500/10"
              )}
            >
              <span
                className={cn(
                  // Layout & Positioning
                  "truncate",

                  // Sizing & Spacing
                  "max-w-[200px]"
                )}
              >
                {rule.host}
                {rule.path ? rule.path : '/*'}
              </span>
              <button
                type="button"
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Sizing & Spacing
                  "ml-0.5",

                  // Interactive & States
                  "hover:text-red-800 dark:hover:text-red-200"
                )}
                onClick={() => onRemoveBlacklistRule(rule.id)}
                title="Remove blacklist rule"
              >
                <XIcon
                  className={cn(
                    // Sizing & Spacing
                    "size-3"
                  )}
                />
              </button>
            </span>
          ))}
        </div>
      )}

      {hasHighlights && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-wrap items-center",

            // Sizing & Spacing
            "mt-1 gap-1.5"
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            Highlights:
          </span>
          {highlightEntries.map(([key, color]) => {
            const separatorIdx = key.indexOf('|');
            const host = separatorIdx >= 0 ? key.slice(0, separatorIdx) : key;
            const path = separatorIdx >= 0 ? key.slice(separatorIdx + 1) : '';
            const display = path ? `${host}${path}` : host;
            return (
              <span
                key={key}
                className={cn(
                  // Layout & Positioning
                  "inline-flex items-center",

                  // Sizing & Spacing
                  "gap-1 rounded border px-1.5 py-0.5",

                  // Typography
                  "text-[10px]"
                )}
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}40`,
                  color,
                }}
              >
                <span
                  className={cn(
                    // Layout & Positioning
                    "shrink-0",

                    // Sizing & Spacing
                    "size-1.5 rounded-full"
                  )}
                  style={{ backgroundColor: color }}
                />
                <span
                  className={cn(
                    // Layout & Positioning
                    "truncate",

                    // Sizing & Spacing
                    "max-w-[200px]"
                  )}
                >
                  {display}
                </span>
                <button
                  type="button"
                  className={cn(
                    // Layout & Positioning
                    "shrink-0",

                    // Sizing & Spacing
                    "ml-0.5",

                    // Interactive & States
                    "opacity-60 hover:opacity-100"
                  )}
                  onClick={() => onRemoveHighlight(host, path)}
                  title="Remove highlight"
                >
                  <XIcon
                    className={cn(
                      // Sizing & Spacing
                      "size-3"
                    )}
                  />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}

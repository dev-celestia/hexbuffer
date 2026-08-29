import { Label } from '@celestia-project/ui';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '../lib/jwt-helpers';

const TIMESTAMP_KEYS = new Set(['iat', 'exp', 'nbf']);

function valueType(value: unknown): 'string' | 'number' | 'boolean' | 'null' | 'object' {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  return 'object';
}

const TYPE_COLORS: Record<string, string> = {
  string: 'text-green-400 dark:text-green-300',
  number: 'text-amber-400 dark:text-amber-300',
  boolean: 'text-purple-400 dark:text-purple-300',
  null: 'text-gray-400 dark:text-gray-500',
  object: 'text-cyan-400 dark:text-cyan-300',
};

function ColorizedValue({ value }: { value: unknown }) {
  const type = valueType(value);

  if (type === 'object') {
    return (
      <span
        className={cn(
          // Typography
          "font-mono break-all text-[11px] opacity-85"
        )}
      >
        {JSON.stringify(value)}
      </span>
    );
  }

  if (type === 'null') {
    return (
      <span
        className={cn(
          // Typography
          "font-mono",
          TYPE_COLORS.null
        )}
      >
        null
      </span>
    );
  }

  if (type === 'boolean') {
    return (
      <span
        className={cn(
          // Typography
          "font-mono",
          TYPE_COLORS.boolean
        )}
      >
        {String(value)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        // Typography
        "font-mono break-all",
        TYPE_COLORS[type] ?? ''
      )}
    >
      {String(value)}
    </span>
  );
}

interface DecodedSectionProps {
  title: string;
  data: Record<string, unknown>;
}

export function DecodedSection({ title, data }: DecodedSectionProps) {
  return (
    <div>
      <Label
        className={cn(
          // Typography
          "text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        )}
      >
        {title}
      </Label>
      <div
        className={cn(
          // Sizing & Spacing
          "mt-1 space-y-0.5"
        )}
      >
        {Object.entries(data).map(([key, value]) => {
          const isTimestamp =
            TIMESTAMP_KEYS.has(key) && typeof value === 'number';
          const timestampStr = isTimestamp ? formatTimestamp(value) : null;

          return (
            <div
              key={key}
              className={cn(
                // Layout & Positioning
                "flex items-baseline",

                // Sizing & Spacing
                "gap-2",

                // Typography
                "text-xs"
              )}
            >
              <span
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Typography
                  "font-mono text-blue-400 dark:text-blue-300"
                )}
              >
                {key}
              </span>
              <span
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Typography
                  "font-mono text-muted-foreground"
                )}
              >
                :
              </span>
              {isTimestamp && timestampStr ? (
                <span
                  className={cn(
                    // Typography
                    "text-xs text-muted-foreground italic"
                  )}
                >
                  {timestampStr}
                </span>
              ) : (
                <ColorizedValue value={value} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

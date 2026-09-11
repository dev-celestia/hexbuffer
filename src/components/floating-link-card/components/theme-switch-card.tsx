import { Button, Card, CardContent } from '@celestia-project/ui';
import {
  CheckIcon,
  MoonIcon,
  StackIcon,
  SunIcon,
} from '@phosphor-icons/react';
import * as React from 'react';

import { PRIMARY_COLOR_PRESETS } from '@/constants/theme';
import { cn } from '@/lib/utils';
import { useThemeSwitchCard } from '../hooks/use-theme-switch-card';
import type { FloatingCardCustomProps } from '../types';
import { Footer } from './footer';

export function ThemeSwitchCard({
  isFront,
  canCycle,
  onCycle,
  onDismiss,
}: FloatingCardCustomProps) {
  const {
    theme,
    handleSetLight,
    handleSetDark,
    primaryColor,
    handleSelectColor,
    handleCycle,
  } = useThemeSwitchCard(onDismiss, onCycle);

  return (
    <Card size="sm">
      <CardContent
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between gap-2",

          // Sizing & Spacing
          "p-2.5 pb-1"
        )}
      >
        {/* Dark / Light switcher */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-0.5 shrink-0",

            // Sizing & Spacing
            "p-0.5",

            // Backgrounds & Borders
            "rounded-md border bg-muted/40"
          )}
        >
          <Button
            type="button"
            variant={theme === 'light' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={handleSetLight}
            aria-label="Light mode"
            title="Light mode"
            className={cn(
              // Layout & Positioning
              "size-6",

              // Typography
              theme === 'light' ? "text-amber-500" : "text-muted-foreground",

              // Interactive & States
              "hover:text-amber-500"
            )}
          >
            <SunIcon className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={theme === 'dark' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={handleSetDark}
            aria-label="Dark mode"
            title="Dark mode"
            className={cn(
              // Layout & Positioning
              "size-6",

              // Typography
              theme === 'dark' ? "text-blue-400" : "text-muted-foreground",

              // Interactive & States
              "hover:text-blue-400"
            )}
          >
            <MoonIcon className="size-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Divider */}
        <div
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "h-4 w-px",

            // Backgrounds & Borders
            "bg-border"
          )}
          aria-hidden="true"
        />

        {/* Accent color palette inline */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between flex-1",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          {PRIMARY_COLOR_PRESETS.map((preset) => {
            const isSelected = primaryColor === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                onClick={() => handleSelectColor(preset.id)}
                className={cn(
                  // Layout & Positioning
                  "relative flex items-center justify-center",

                  // Sizing & Spacing
                  "size-5 rounded-full",

                  // Backgrounds & Borders
                  "shadow-xs transition-transform duration-150 ease-out",

                  // Interactive & States
                  "hover:scale-110 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                  isSelected
                    ? "ring-2 ring-foreground/40 ring-offset-1 ring-offset-card scale-110"
                    : "opacity-85 hover:opacity-100"
                )}
                style={{
                  backgroundColor: preset.swatchHex,
                }}
              >
                {isSelected && (
                  <CheckIcon
                    weight="bold"
                    className={cn(
                      // Sizing & Spacing
                      "size-2.5",

                      // Typography
                      preset.id === 'amber' || preset.id === 'purple' ? "text-stone-900" : "text-white"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>

      <Footer onDismiss={onDismiss} isFront={isFront}>
        {isFront && canCycle && onCycle && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleCycle}
            aria-label="Next card"
            title="Next card"
            className={cn(
              // Typography
              "text-muted-foreground",

              // Interactive & States
              "hover:text-foreground"
            )}
          >
            <StackIcon className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </Footer>
    </Card>
  );
}

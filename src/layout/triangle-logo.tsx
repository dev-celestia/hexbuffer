import { TriangleIcon, TriangleDashedIcon } from '@phosphor-icons/react';

import { cn } from "@/lib/utils";
import { useTriangleLogo } from "./hooks/use-triangle-logo";

type PulseTriangleSize = "small" | "medium" | "large";

const TRIANGLE_LOGO_SIZES: Record<PulseTriangleSize, string> = {
  small: "size-3",
  medium: "size-4",
  large: "size-6",
};

const PULSE_TRIANGLE_ANIMATION =
  "animate-[triangle-pulse_2.8s_cubic-bezier(0.45,0,0.2,1)_infinite] motion-reduce:animate-none";
const PULSE_TRIANGLE_ICON_BASE =
  "absolute inset-0 block origin-center stroke-current will-change-[opacity,transform]";
const PULSE_TRIANGLE_SOLID_ANIMATION =
  "animate-[triangle-solid_2.8s_cubic-bezier(0.45,0,0.2,1)_infinite] motion-reduce:animate-none";
const PULSE_TRIANGLE_DASHED_ANIMATION =
  "animate-[triangle-dashed_2.8s_cubic-bezier(0.45,0,0.2,1)_infinite] motion-reduce:animate-none";

type PulseTriangleProps = {
  size?: PulseTriangleSize;
  className?: string;
};

export function TriangleLogo({ size = "medium", className }: PulseTriangleProps) {
  const sizeClass = TRIANGLE_LOGO_SIZES[size];
  const { isConnected } = useTriangleLogo();

  return (
    <span
      className={cn(
        // Layout & Positioning
        "relative inline-flex shrink-0",

        // Sizing & Spacing
        sizeClass,

        // Typography
        isConnected ? "text-primary" : "text-muted-foreground",

        // Interactive & States
        isConnected && PULSE_TRIANGLE_ANIMATION,

        className
      )}
      aria-hidden="true"
    >
      <TriangleIcon
        className={cn(
          // Layout & Positioning
          PULSE_TRIANGLE_ICON_BASE,

          // Sizing & Spacing
          sizeClass,

          // Interactive & States
          isConnected && PULSE_TRIANGLE_SOLID_ANIMATION
        )}
      />
      <TriangleDashedIcon
        className={cn(
          // Layout & Positioning
          PULSE_TRIANGLE_ICON_BASE,

          // Sizing & Spacing
          sizeClass,

          // Interactive & States
          isConnected && PULSE_TRIANGLE_DASHED_ANIMATION
        )}
      />
    </span>
  );
}


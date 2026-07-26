import * as React from "react"

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: Readonly<React.ComponentProps<"input">>) {
  return (
    <input
      type={type}
      data-slot="input"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      className={cn(
        // Layout & Positioning
        "min-w-0 outline-none file:inline-flex",

        // Sizing & Spacing
        "h-7 w-full px-3 py-1 file:h-7",

        // Typography
        "text-base md:text-sm file:text-sm file:font-medium placeholder:text-muted-foreground file:text-foreground selection:bg-primary selection:text-primary-foreground",

        // Backgrounds & Borders
        "rounded-sm border border-input bg-background file:border-0 file:bg-transparent",

        // Interactive & States
        "transition-[color,box-shadow] focus-visible:border-primary aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

        className
      )}
      {...props}
    />
  )
}

export { Input }

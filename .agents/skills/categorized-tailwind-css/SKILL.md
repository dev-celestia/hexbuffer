---
name: categorized-tailwind-css
description: Codebase standard for organizing Tailwind CSS component classes directly within cn(...) using line-separated, commented category strings (Layout & Positioning, Sizing & Spacing, Typography, Backgrounds & Borders, Interactive & States).
---

# Categorized Tailwind CSS Pattern

When building or refactoring React components with Tailwind CSS in this repository, group class strings inside `cn(...)` into category sections preceded by descriptive comments.

## Code Pattern

```tsx
import { cn } from "@/lib/utils"

export function Component({ className, children }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col items-center justify-between relative",

        // Sizing & Spacing
        "w-full max-w-sm p-6 space-y-4",

        // Typography
        "font-sans text-base text-foreground leading-normal",

        // Backgrounds & Borders
        "bg-card text-card-foreground border rounded-xl shadow-sm",

        // Interactive & States
        "hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-ring",

        className
      )}
    >
      {children}
    </div>
  )
}
```

## Categorization Standard

Organize Tailwind class strings passed to `cn(...)` into the following 5 categories:

1. **`// Layout & Positioning`**: `flex`, `grid`, `inline-flex`, `items-center`, `justify-between`, `relative`, `absolute`, `overflow-hidden`.
2. **`// Sizing & Spacing`**: `w-full`, `h-10`, `max-w-sm`, `p-6`, `px-4`, `py-2`, `space-y-4`, `gap-2`.
3. **`// Typography`**: `font-sans`, `text-base`, `text-sm`, `font-medium`, `text-foreground`, `leading-normal`, `leading-none`.
4. **`// Backgrounds & Borders`**: `bg-card`, `bg-primary`, `text-card-foreground`, `border`, `rounded-xl`, `shadow-sm`.
5. **`// Interactive & States`**: `hover:shadow-md`, `transition-all`, `focus-within:ring-2`, `focus-visible:outline-none`, `disabled:opacity-50`.

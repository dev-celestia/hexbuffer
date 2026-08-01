---
kind: frontend_style
name: Tailwind CSS v4 + Shadcn UI Design System with CSS Variables Theming
category: frontend_style
scope:
    - '**'
source_files:
    - src/styles/globals.css
    - src/styles/overview-wallpaper.css
    - src/components/theme-provider.tsx
    - postcss.config.mjs
    - components.json
    - package.json
---

The Hexbuffer Desktop Workbench uses a modern, token-driven frontend styling system built on Tailwind CSS v4 (via `@tailwindcss/postcss`) and a shadcn/ui-style component library sourced from the local `hexbuffer-ui` package. Styling is centralized around CSS custom properties (CSS variables) that define light and dark themes, with all color, radius, and font tokens mapped through Tailwind's `@theme inline` block in `src/styles/globals.css`. The theme provider (`src/components/theme-provider.tsx`) toggles a `dark` class on `<html>` and persists the selected theme via Zustand's `app-settings-store`, enabling runtime light/dark switching across the entire app.

Key architectural decisions:
- **Tailwind v4 with CSS imports**: The build uses `@tailwindcss/postcss` as the only PostCSS plugin; styles are imported directly via `@import "tailwindcss"` in `globals.css` rather than a traditional `tailwind.config.js` file. Custom design tokens (colors, radii, fonts) are declared inline inside `@theme inline { ... }` and backed by CSS variables under `:root` and `.dark`.
- **Shadcn-style primitive layer**: The `components.json` schema declares `style: "radix-mira"`, `tsx: true`, `cssVariables: true`, and aliases pointing to `@/components/ui`, `@/lib/utils`, etc. The actual UI primitives live in `src/components/ui/` but re-export everything from the `hexbuffer-ui` package (`export * from "hexbuffer-ui"`), indicating a shared internal design-system package provides the base components while this repo composes them.
- **Theme tokens via CSS variables**: All semantic colors (`--background`, `--foreground`, `--primary`, `--muted`, `--destructive`, `--border`, `--ring`, chart colors, sidebar variants) are defined as oklch-based CSS variables under `:root` for light mode and overridden under `.dark` for dark mode. Typography tokens (`--font-sans`, `--font-mono`) point to Geist/Geist Mono variable fonts loaded via `@fontsource-variable/geist`.
- **Utility animations and overrides**: `globals.css` defines application-specific keyframes (`pulse-slow`, `ripple`, `accordion-down/up`, `nav-blink`, `border-beam`, `triangle-pulse/solid/dashed`) and utility classes under `@layer utilities`. It also includes global resets (`@layer base`) enforcing consistent borders, outlines, and transparent backgrounds for the Tauri window.
- **Third-party integration overrides**: React Flow flows (`.automation-flow`, `.regression-flow`) are styled via CSS variables to match the brand primary color. MDXEditor dark-mode variables are explicitly overridden because the editor pins its own slate/blue variables. Scrollbars are globally customized with webkit and Firefox selectors, and helper classes like `.scrollbar-thin` and `.scrollbar-hide` are provided.
- **Wallpaper and gradient system**: `src/styles/overview-wallpaper.css` defines reusable gradient classes (`gradient-default`, `gradient-midnight`, `gradient-sunset`, `gradient-ocean`, `gradient-aurora`, `gradient-cyberpunk`) with both light and dark variants using CSS variables (`--g-color-*`) and an animated `gradient-shift` keyframe.
- **Tauri-specific styling**: Title-bar drag regions use `-webkit-app-region: drag` / `no-drag`, and the body/root elements are forced transparent (`background: transparent !important`) so the desktop wallpaper shows through.

Conventions observed:
- New semantic colors should be added as CSS variables under both `:root` and `.dark` and then exposed through `@theme inline`.
- Components should consume tokens via Tailwind utility classes (e.g., `bg-background`, `text-foreground`, `border-border`) rather than direct CSS variable usage.
- Dark mode is activated solely by adding/removing the `dark` class on `<html>`; no JS-based theme engine is used beyond the provider.
- Animation keyframes are grouped under `@layer utilities` and exposed as small utility classes (e.g., `.animate-ripple`, `.animate-nav-blink`).
- Third-party visual libraries (React Flow, MDXEditor) are themed by overriding their CSS variables or selectors at the root level rather than per-component.
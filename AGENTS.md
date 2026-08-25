# Repository Guidelines

## Components Usage & Styling Rules

- **MANDATORY**: Always use pre-built UI components inside `/src/components/ui`.
- **FORBIDDEN**: Do NOT generate custom or inline `className` props when using components.
- Always rely on the original styled components from `/src/components/ui` as designed to maintain UI consistency across all files. 

## Component Styling Standard

MANDATORY: For all React component styling and Tailwind CSS classes in this project, ALWAYS follow the `categorized-tailwind-css` skill ([SKILL.md](file:///Users/arham/Desktop/project/apprecon/.agents/skills/categorized-tailwind-css/SKILL.md)). Organize classes passed to `cn(...)` or `cva(...)` into line-separated, commented category sections:
- `// Layout & Positioning`
- `// Sizing & Spacing`
- `// Typography`
- `// Backgrounds & Borders`
- `// Interactive & States`

## Project Structure & Module Organization

`src/` contains the React + TypeScript frontend. Feature pages live in `src/pages/` (for example, `http-history/`, `repeater/`, and `brute-force/`), shared UI primitives in `src/components/ui/`, stores in `src/stores/`, hooks in `src/hooks/`, and helpers in `src/lib/`. Static assets live in `public/` and `src/assets/`.

`src-tauri/` contains the Rust/Tauri backend. Core modules are under `src-tauri/src/`, including `db/` and `proxy/`. Backend test notes live in `src-tauri/tests/README.md`; generated build output such as `dist/` and `src-tauri/target/` should not be edited manually.

## Build, Test, and Development Commands

- `pnpm install` — install frontend dependencies.
- `pnpm dev` — start the Vite dev server on port `1420`.
- `pnpm dev:clean` — free port `1420` and restart the dev server.
- `pnpm build` — create a production frontend build.
- `pnpm preview` — preview the built frontend locally.
- `pnpm tauri` — run the desktop app in Tauri development mode.
- `cd src-tauri && cargo run` — run the Rust backend directly.
- `cd src-tauri && cargo test --lib -- --test-threads=1` — run proxy-focused Rust tests sequentially.

## Coding Style & Naming Conventions

Use TypeScript with React function components. Existing files use 2-space indentation, semicolons, and path aliases such as `@/components/ui/button`. Keep page folders kebab-cased (`brute-force`), React components PascalCased (`RepeaterPage`), hooks camelCased with a `use` prefix (`useTargets`), and Zustand stores short, domain-based names (`target.ts`, `filter.ts`). Always capitalize constants using UPPER_SNAKE_CASE (for example, `ROOT_BG` instead of `rootBg`).

There is no committed lint or formatting configuration yet, so match nearby code style and keep imports organized manually. Rust code should follow standard `rustfmt` conventions.

## Frontend Page Pattern

MANDATORY: ALWAYS split logic and UI. Keep all state management, event handlers, derived computations, store coordination, and side effects inside custom hooks (e.g., `hooks/use-feature-page.ts` or presentational component hooks). UI components must remain thin, declarative, and strictly presentational.

For files under `src/pages/`, prefer a thin page-entry pattern:

- Keep each page `index.tsx` focused on layout composition and wiring top-level sections together.
- Move page orchestration into page-specific hooks such as `hooks/use-http-history-page.ts` or `hooks/use-brute-force-page.ts`.
- Keep derived state, event handlers, store coordination, and side effects inside those page hooks instead of inline in JSX.
- Move static tab definitions, option lists, and long guide content into `constants.ts` files when they are not component-specific.
- Move pure data helpers such as formatting, filtering, and export utilities into `lib/` or `utils/`.
- For large pages, split the UI into small presentational components under `components/` with clear names like `*-toolbar`, `*-filters`, `*-pane`, or `*-dialog`.

For tabbed pages, reuse the shared page primitives in `src/pages/shared/` instead of creating page-local tab bar implementations:

- `src/pages/shared/tab-bar.tsx`
- `src/pages/shared/tabbed-page-layout.tsx`
- `src/pages/shared/use-tab-state.ts`

When refactoring or adding new pages, prefer this shape:

```text
src/pages/feature-name/
  index.tsx
  hooks/
    use-feature-page.ts
  components/
    feature-section.tsx
  constants.ts
  lib/
    helpers.ts
```

This repository now prefers “page entry + page hook + presentational sections” over large all-in-one page files.

## AI Agent Tools & Triggers Integration

When adding new app capabilities that AI agents can execute (or modifying existing tools), follow this standard two-step pattern across `hexbuffer-ai` and `hexbuffer`:

### 1. Rust LLM Tool Definition (`hexbuffer-ai`)
- Create a dedicated file under `/Users/arham/Desktop/project/hexbuffer-ai/src/tools/<feature>.rs` implementing Rig's `Tool` trait.
- Export args, output, and tool struct in `src/tools/mod.rs`.
- Attach the tool struct to the `AgentBuilder` in `src/chat.rs`.
- If high-risk, configure security policy in `src/policy.rs` (`SecurityApprovalPolicy`).

### 2. Frontend App Trigger Integration (`hexbuffer`)
- Define the frontend tool definition (`*_AI_TOOL_DEFINITION`) and execution handler (`execute*AiTool`) under `src/layout/assistant/lib/ai-tools/<feature>.ts`.
- Register the tool schema in `src/layout/assistant/lib/ai-tools/definitions.ts`.
- Register the tool execution case in `src/layout/assistant/lib/ai-tools/executor.ts`.
- Re-export the feature tool from `src/layout/assistant/lib/ai-tools/index.ts` and `src/triggers/<feature>/index.ts`.
- Store state manipulation or IPC calls inside `src/triggers/<feature>/` to keep UI components decoupled.


## Testing Guidelines

Frontend tests are not configured in `package.json`; when adding UI behavior, document manual verification steps in the PR. Rust tests require a running proxy before execution, as described in `src-tauri/tests/README.md`. Name new tests by behavior, for example `test_connect_tunnel_tls_upgrade_example_com`.

## Commit & Pull Request Guidelines

Recent commits use very short messages such as `update`; no stronger convention is established yet. Prefer clearer imperative summaries going forward, for example `add repeater request editor`.

Pull requests should include a concise description, the affected area (`frontend`, `proxy`, `db`, etc.), linked issues when applicable, test commands or manual verification notes, and screenshots for visible UI changes.

## Security & Configuration Notes

Treat certificate material, database files, HAR captures, and proxy logs as sensitive. Avoid committing new secrets or local runtime artifacts from `src-tauri/.hexbuffer/`, `src-tauri/data/`, or generated output directories unless intentionally required.

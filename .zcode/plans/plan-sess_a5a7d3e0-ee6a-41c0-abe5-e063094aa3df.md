## Refactor: Extract reusable Markdown Editor from notes feature

**Goal:** Move the notes markdown block editor/preview (`src/pages/notes/components/notes-preview/` + `notes-section/`, ~2200 lines) into a feature-agnostic reusable component at `src/components/markdown-editor/`, structured so it can later be lifted into `celestia-starter/packages/ui/src/components` with minimal changes. The notes page keeps a thin `NotesPreviewPane` wrapper.

### 1. Create `src/components/markdown-editor/` (moved + generalized)

```
src/components/markdown-editor/
  index.ts                     barrel
  types.ts                     ParsedBlock, TaskItem, MarkdownEditorPaneProps, SectionTemplateItem...
  markdown-parser.ts           as-is (pure, no changes)
  inline-formatter.tsx         as-is
  block-icons.tsx              as-is
  sortable-block-item.tsx      renderers swap to MarkdownSectionRenderer
  minimized-drag-pill.tsx      as-is
  add-section-menu.tsx         templates become a prop (default: DEFAULT_SECTION_TEMPLATES)
  add-section-divider.tsx      as-is
  image-utils.ts               move pure readFileAsBase64 + formatMarkdownImage out of notes/lib/image-helpers.ts
  markdown-editor-pane.tsx     orchestrator (was notes-preview-pane.tsx), generic API:
                               - content, onUpdateContent?, className?
                               - sectionTemplates?: SectionTemplateItem[]  (defaults, no "Drawing Studio")
                               - emptyState?: React.ReactNode              (generic default copy)
                               - onFilesDrop?: (files: File[]) => void     (default: embed as base64 markdown images)
                               - dropHint?: string                         (drag overlay copy)
  sections/                    (from notes-section/, renamed Notes* → Markdown*/generic)
    markdown-section-renderer.tsx  (was NotesSectionRenderer; drop unused onOpenDrawingStudio)
    heading-section.tsx, paragraph-section.tsx, quote-section.tsx,
    task-list-section.tsx, list-section.tsx, image-section.tsx, code-section.tsx
    types.ts                       (drop ImageSectionProps.onOpenDrawingStudio — declared but unused)
```

**Generalization changes (the only real logic edits):**
- `SectionTemplateItem.isDrawingAction` → generic `action?: () => void`; templates become a prop with `DEFAULT_SECTION_TEMPLATES` (typography/lists/media/formatting, minus drawing) exported for consumers.
- `MarkdownEditorPane` handles a selected template with `action` by invoking it (replaces the hard-coded drawing-studio branch).
- Toast wording made generic ("Section reordered", "Image embedded"); delete-confirmation dialog copy stays generic.
- Keep all existing categorized-Tailwind class blocks unchanged (per AGENTS.md styling standard). UI primitives keep coming from `@celestia-project/ui`.
- Portability: only external deps will be `@celestia-project/ui`, `@dnd-kit/*`, `@phosphor-icons/react`, `sonner`, and `cn` from `@/lib/utils` (single swap point for the future celestia move). No Tauri, stores, or notes imports.

### 2. Notes page becomes a thin wrapper

- `notes-preview/notes-preview-pane.tsx` → small wrapper keeping the existing `NotesPreviewPaneProps` API (`content`, `onUpdateContent`, `onOpenDrawingStudio`, `className`): renders `MarkdownEditorPane` with the Drawing Studio template appended (its `action: onOpenDrawingStudio`) and the notes-specific empty-state copy.
- Delete the now-duplicated files from `notes-preview/` and the whole `notes-section/` folder; update `notes-preview/index.ts` and `notes/components/index.ts` barrels (re-export the wrapper; point any `notes-section` consumers at `@/components/markdown-editor`).
- Grep for other importers of `readFileAsBase64`/`formatMarkdownImage` (e.g., drawing canvas) and repoint them to the new `image-utils.ts`; remove those two pure functions from `notes/lib/image-helpers.ts`, keeping the Tauri-dependent ones.

### 3. Verification
- `pnpm build` (TypeScript) passes with no unresolved imports.
- Manual check via `pnpm dev`: notes page add/edit/delete/reorder sections, task toggle, image drop, drawing-studio entry still opens the canvas.
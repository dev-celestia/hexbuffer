import * as React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@celestia-project/ui';
import {
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  TextAlignLeftIcon,
  CheckSquareIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TreeStructureIcon,
  PaintBrushIcon,
  CodeIcon,
  QuotesIcon,
  MinusIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SectionTemplateItem {
  id: string;
  category: 'Typography' | 'Lists' | 'Visual Media' | 'Formatting';
  label: string;
  description: string;
  icon: React.ReactNode;
  templateMarkdown?: string;
  isDrawingAction?: boolean;
}

export const SECTION_TEMPLATES: SectionTemplateItem[] = [
  {
    id: 'h1',
    category: 'Typography',
    label: 'Heading 1',
    description: 'Large page heading',
    icon: <TextHOneIcon className="size-4 text-primary shrink-0" />,
    templateMarkdown: '# New Heading',
  },
  {
    id: 'h2',
    category: 'Typography',
    label: 'Heading 2',
    description: 'Medium section header',
    icon: <TextHTwoIcon className="size-4 text-primary shrink-0" />,
    templateMarkdown: '## Section Title',
  },
  {
    id: 'h3',
    category: 'Typography',
    label: 'Heading 3',
    description: 'Small subsection header',
    icon: <TextHThreeIcon className="size-4 text-primary shrink-0" />,
    templateMarkdown: '### Subsection Title',
  },
  {
    id: 'p',
    category: 'Typography',
    label: 'Paragraph',
    description: 'Standard text block',
    icon: <TextAlignLeftIcon className="size-4 text-muted-foreground shrink-0" />,
    templateMarkdown: 'Enter your paragraph text here...',
  },
  {
    id: 'task',
    category: 'Lists',
    label: 'To-Do Checklist',
    description: 'Interactive checkbox list',
    icon: <CheckSquareIcon className="size-4 text-emerald-500 shrink-0" />,
    templateMarkdown: '- [ ] First task item\n- [ ] Second task item',
  },
  {
    id: 'ul',
    category: 'Lists',
    label: 'Bullet List',
    description: 'Unordered bullet points',
    icon: <ListBulletsIcon className="size-4 text-sky-500 shrink-0" />,
    templateMarkdown: '- First point\n- Second point',
  },
  {
    id: 'ol',
    category: 'Lists',
    label: 'Numbered List',
    description: 'Sequential ordered steps',
    icon: <ListNumbersIcon className="size-4 text-sky-500 shrink-0" />,
    templateMarkdown: '1. First step\n2. Second step',
  },
  {
    id: 'drawing',
    category: 'Visual Media',
    label: 'Drawing Studio',
    description: 'Open visual canvas studio',
    icon: <PaintBrushIcon className="size-4 text-purple-500 shrink-0" />,
    isDrawingAction: true,
  },
  {
    id: 'code',
    category: 'Formatting',
    label: 'Code Block',
    description: 'Syntax-highlighted code',
    icon: <CodeIcon className="size-4 text-purple-500 shrink-0" />,
    templateMarkdown: '```typescript\nfunction example() {\n  console.log("Hello, Hexbuffer!");\n}\n```',
  },
  {
    id: 'quote',
    category: 'Formatting',
    label: 'Quote / Callout',
    description: 'Indented highlighted quote',
    icon: <QuotesIcon className="size-4 text-amber-500 shrink-0" />,
    templateMarkdown: '> Important key insight or highlighted note',
  },
  {
    id: 'divider',
    category: 'Formatting',
    label: 'Divider Line',
    description: 'Horizontal separator rule',
    icon: <MinusIcon className="size-4 text-muted-foreground shrink-0" />,
    templateMarkdown: '---',
  },
];

interface AddSectionMenuProps {
  trigger: React.ReactElement;
  onSelectTemplate: (template: SectionTemplateItem) => void;
  align?: 'start' | 'center' | 'end';
}

export function AddSectionMenu({
  trigger,
  onSelectTemplate,
  align = 'center',
}: AddSectionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredTemplates = React.useMemo(() => {
    if (!search.trim()) return SECTION_TEMPLATES;
    const query = search.toLowerCase().trim();
    return SECTION_TEMPLATES.filter(
      (t) =>
        t.label.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    );
  }, [search]);

  const categories = React.useMemo(() => {
    const list: Array<{ name: string; items: SectionTemplateItem[] }> = [];
    const catMap = new Map<string, SectionTemplateItem[]>();

    filteredTemplates.forEach((item) => {
      if (!catMap.has(item.category)) {
        catMap.set(item.category, []);
      }
      catMap.get(item.category)!.push(item);
    });

    catMap.forEach((items, name) => {
      list.push({ name, items });
    });

    return list;
  }, [filteredTemplates]);

  const handleSelect = (template: SectionTemplateItem) => {
    setOpen(false);
    setSearch('');
    onSelectTemplate(template);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align={align}
        sideOffset={6}
        className={cn(
          // Layout & Positioning
          "flex flex-col overflow-hidden z-50",

          // Sizing & Spacing
          "w-72 p-0 max-h-96 rounded-xl border shadow-xl",

          // Backgrounds & Borders
          "bg-popover text-popover-foreground backdrop-blur-md"
        )}
      >
        {/* Search header */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center px-3 py-2 border-b shrink-0",

            // Sizing & Spacing
            "gap-2",

            // Backgrounds & Borders
            "bg-muted/30"
          )}
        >
          <MagnifyingGlassIcon className="size-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter section types..."
            autoFocus
            className={cn(
              // Layout & Positioning
              "flex-1 bg-transparent outline-hidden",

              // Typography
              "text-xs text-foreground placeholder:text-muted-foreground font-mono"
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Template List Items */}
        <div className="overflow-y-auto p-1.5 flex flex-col gap-2 max-h-[300px]">
          {categories.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching section types
            </div>
          ) : (
            categories.map((group) => (
              <div key={group.name} className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    // Sizing & Spacing
                    "px-2 py-1",

                    // Typography
                    "text-[10px] font-semibold tracking-wider uppercase text-muted-foreground select-none"
                  )}
                >
                  {group.name}
                </span>

                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      // Layout & Positioning
                      "flex items-center text-left rounded-lg transition-colors w-full",

                      // Sizing & Spacing
                      "px-2 py-1.5 gap-2.5",

                      // Interactive & States
                      "hover:bg-muted cursor-pointer group"
                    )}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center justify-center shrink-0",

                        // Sizing & Spacing
                        "size-7 rounded-md border shadow-2xs",

                        // Backgrounds & Borders
                        "bg-background/80 group-hover:bg-background group-hover:border-primary/40"
                      )}
                    >
                      {item.icon}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-medium text-foreground leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

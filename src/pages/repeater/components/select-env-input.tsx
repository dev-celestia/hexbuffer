import * as React from 'react';
import { Textarea } from '@celestia-project/ui';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useCollectionsStore } from '@/stores/collections';
import { cn } from '@/lib/utils';

export interface EnvVariableItem {
  key: string;
  value: string;
}

export interface ColorizedUrlInputProps
  extends Omit<React.ComponentProps<typeof Textarea>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

// ── Syntax Highlighter Helper: Colorizes {{variable_name}} tokens ──

function renderHighlightedText(value: string, envVarKeys: string[]) {
  if (!value) return null;
  const keysSet = new Set(envVarKeys.map((k) => k.toLowerCase()));
  const regex = /(\{\{[^}\s]+\}\})/g;
  const parts = value.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const key = part.slice(2, -2).trim();
      const isKnown = keysSet.has(key.toLowerCase());
      return (
        <span
          key={i}
          className={cn(
            // Typography
            'font-semibold',
            // Backgrounds & Borders
            isKnown
              ? 'text-sky-400 dark:text-sky-300 bg-sky-500/15'
              : 'text-amber-500 dark:text-amber-400 bg-amber-500/15',
          )}
        >
          {part}
        </span>
      );
    }
    return (
      <span
        key={i}
        className={cn(
          // Typography
          'text-foreground',
        )}
      >
        {part}
      </span>
    );
  });
}

// ── Watcher Hook: Watches user typing for {{ and manages available env suggestions ──

export function useEnvWatcher({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (val: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}) {
  const contexts = useCollectionsStore((s) => s.contexts);
  const activeContextId = useCollectionsStore((s) => s.activeContextId);
  const activeContext = React.useMemo(
    () => contexts.find((c) => c.id === activeContextId),
    [contexts, activeContextId],
  );

  const envVariables: EnvVariableItem[] = React.useMemo(() => {
    if (!activeContext) return [];
    try {
      const parsed = JSON.parse(activeContext.variables);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((v) => v.key?.trim() && v.enabled !== false)
          .map((v) => ({ key: String(v.key).trim(), value: String(v.value ?? '') }));
      }
    } catch {
      // ignore JSON parse errors
    }
    return [];
  }, [activeContext]);

  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const checkTrigger = React.useCallback(
    (text: string, cursorPos: number | null) => {
      if (cursorPos === null) {
        setIsOpen(false);
        return;
      }
      const beforeCursor = text.slice(0, cursorPos);
      const lastOpen = beforeCursor.lastIndexOf('{{');
      if (lastOpen === -1) {
        setIsOpen(false);
        return;
      }
      const afterOpen = beforeCursor.slice(lastOpen);
      if (afterOpen.includes('}}')) {
        setIsOpen(false);
        return;
      }
      const q = afterOpen.slice(2);
      if (/\s/.test(q)) {
        setIsOpen(false);
        return;
      }
      setQuery(q);
      setIsOpen(true);
    },
    [],
  );

  const filtered = React.useMemo(() => {
    if (!query) return envVariables;
    const lower = query.toLowerCase();
    return envVariables.filter((v) => v.key.toLowerCase().includes(lower));
  }, [envVariables, query]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, query]);

  const selectVariable = React.useCallback(
    (varKey: string) => {
      const input = inputRef.current;
      const cursorPos = input?.selectionStart ?? value.length;
      const beforeCursor = value.slice(0, cursorPos);
      const lastOpen = beforeCursor.lastIndexOf('{{');
      if (lastOpen === -1) return;

      const beforeOpen = value.slice(0, lastOpen);
      const afterCursor = value.slice(cursorPos);
      // Strip any immediately following closing braces (e.g. }} or } or }}}}) to avoid duplicate braces
      const cleanedAfterCursor = afterCursor.replace(/^}+/, '');
      const newValue = `${beforeOpen}{{${varKey}}}${cleanedAfterCursor}`;
      const newCursor = beforeOpen.length + varKey.length + 4;

      onChange(newValue);
      setIsOpen(false);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      });
    },
    [value, onChange, inputRef],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (isOpen && filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % filtered.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const item = filtered[highlightedIndex];
          if (item) {
            selectVariable(item.key);
          }
          return;
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    },
    [isOpen, filtered, highlightedIndex, selectVariable],
  );

  return {
    isOpen,
    setIsOpen,
    query,
    envVariables,
    filtered,
    highlightedIndex,
    activeContextName: activeContext?.name,
    checkTrigger,
    selectVariable,
    handleKeyDown,
  };
}

// ── Dropdown Component: Shows available environment variables ──

export interface EnvSuggestionDropdownProps {
  isOpen: boolean;
  filtered: EnvVariableItem[];
  highlightedIndex: number;
  activeContextName?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}

export function EnvSuggestionDropdown({
  isOpen,
  filtered,
  highlightedIndex,
  activeContextName,
  onSelect,
}: EnvSuggestionDropdownProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const el = listRef.current.querySelector('[data-highlighted="true"]');
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'absolute left-0 top-full z-50 mt-1',
        // Sizing & Spacing
        'w-64 max-w-sm overflow-hidden rounded-md',
        // Backgrounds & Borders
        'border border-border bg-popover text-popover-foreground shadow-lg',
        // Interactive & States
        'animate-in fade-in-0 zoom-in-95 duration-100',
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between border-b border-border/60',
          // Sizing & Spacing
          'px-2.5 py-1.5',
          // Typography
          'text-[10px] font-semibold text-muted-foreground uppercase tracking-wider',
          // Backgrounds & Borders
          'bg-muted/30',
        )}
      >
        <span>Env Variables</span>
        {activeContextName && (
          <span
            className={cn(
              // Sizing & Spacing
              'px-1.5 py-0.5 rounded',
              // Typography
              'text-[9px] font-mono lowercase',
              // Backgrounds & Borders
              'bg-sky-500/10 text-sky-400',
            )}
          >
            {activeContextName}
          </span>
        )}
      </div>

      <div
        ref={listRef}
        className={cn(
          // Layout & Positioning
          'overflow-y-auto space-y-0.5',
          // Sizing & Spacing
          'max-h-48 p-1',
        )}
      >
        {filtered.length === 0 ? (
          <div
            className={cn(
              // Sizing & Spacing
              'px-3 py-3',
              // Typography
              'text-center text-xs text-muted-foreground leading-relaxed',
            )}
          >
            {!activeContextName ? (
              <span>No active env selected</span>
            ) : (
              <span>No matching variables</span>
            )}
          </div>
        ) : (
          filtered.map((item, idx) => (
            <button
              key={item.key}
              type="button"
              data-highlighted={idx === highlightedIndex}
              className={cn(
                // Layout & Positioning
                'flex w-full items-center justify-between gap-2',
                // Sizing & Spacing
                'rounded-sm px-2 py-1.5',
                // Typography
                'text-xs text-left',
                // Interactive & States
                'transition-all duration-100 cursor-pointer',
                idx === highlightedIndex
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item.key);
              }}
            >
              <span
                className={cn(
                  // Typography
                  'text-sky-400 dark:text-sky-300 font-mono font-semibold',
                )}
              >
                {`{{${item.key}}}`}
              </span>
              {item.value && (
                <span
                  className={cn(
                    // Layout & Positioning
                    'truncate max-w-[120px]',
                    // Typography
                    'text-[10px] text-muted-foreground/70 font-mono',
                  )}
                  title={item.value}
                >
                  {item.value}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Component: Toggleable Single-line / Multi-line Textarea with Colorized Tokens ──

export function ColorizedUrlInput({
  value,
  onChange,
  placeholder,
  className,
  containerClassName,
  onKeyDown: propOnKeyDown,
  ...props
}: ColorizedUrlInputProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const watcher = useEnvWatcher({
    value,
    onChange,
    inputRef: textareaRef,
  });

  // Adjust height based on expansion mode
  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (!isExpanded) {
      el.style.height = '28px';
      return;
    }

    el.style.height = '0px';
    const scrollHeight = el.scrollHeight;
    const newHeight = Math.max(64, Math.min(scrollHeight, 180));
    el.style.height = `${newHeight}px`;
  }, [isExpanded]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleScroll = React.useCallback(() => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  React.useEffect(() => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [value, isExpanded]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        watcher.setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [watcher]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    watcher.checkTrigger(val, e.target.selectionStart);
  };

  const handleSelectOrMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    watcher.checkTrigger(target.value, target.selectionStart);
    handleScroll();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (watcher.isOpen && watcher.filtered.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab') {
        watcher.handleKeyDown(e);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        watcher.handleKeyDown(e);
        return;
      }
    }

    if (e.key === 'Enter' && (!isExpanded || !e.shiftKey)) {
      e.preventDefault();
    }

    watcher.handleKeyDown(e);
    propOnKeyDown?.(e);
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        // Layout & Positioning
        'relative flex-1 min-w-0 flex items-start',
        // Sizing & Spacing
        'w-full',
        containerClassName,
      )}
    >
      {/* Backdrop for syntax highlighted variable tags */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={cn(
          // Layout & Positioning
          'pointer-events-none absolute inset-0',
          isExpanded
            ? 'overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'overflow-hidden overflow-x-hidden overflow-y-hidden whitespace-nowrap break-normal [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // Sizing & Spacing
          'pl-2 pr-6 py-1 min-w-0',
          // Typography
          'font-mono text-xs leading-normal select-none',
          // Backgrounds & Borders
          'border border-transparent rounded-md',
        )}
      >
        {renderHighlightedText(
          value,
          watcher.envVariables.map((v) => v.key),
        )}
      </div>

      <Textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectOrMove}
        onClick={handleSelectOrMove}
        onKeyUp={handleSelectOrMove}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={cn(
          // Layout & Positioning
          isExpanded
            ? 'overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'overflow-hidden overflow-x-hidden overflow-y-hidden whitespace-nowrap break-normal [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'resize-none relative z-10',
          // Sizing & Spacing
          isExpanded ? 'min-h-16 max-h-48' : 'min-h-7 h-7',
          'pl-2 pr-6 py-1 min-w-0',
          // Typography
          'font-mono text-xs leading-normal text-transparent caret-foreground selection:bg-primary/30 selection:text-foreground placeholder:text-muted-foreground',
          // Backgrounds & Borders
          'bg-transparent',
          className,
        )}
        {...props}
      />

      {/* Caret icon at the end of input to toggle between single-line and multiline textarea */}
      <button
        type="button"
        onClick={toggleExpand}
        title={isExpanded ? 'Collapse to single line' : 'Expand to textarea'}
        aria-label={isExpanded ? 'Collapse to single line' : 'Expand to textarea'}
        className={cn(
          // Layout & Positioning
          'absolute right-1 top-1.5 z-20 flex items-center justify-center',
          // Sizing & Spacing
          'size-4 rounded-xs',
          // Backgrounds & Borders
          'hover:bg-muted/60 text-muted-foreground hover:text-foreground',
          // Interactive & States
          'transition-colors cursor-pointer',
        )}
      >
        {isExpanded ? (
          <CaretUpIcon className="size-3" />
        ) : (
          <CaretDownIcon className="size-3" />
        )}
      </button>

      <EnvSuggestionDropdown
        isOpen={watcher.isOpen}
        filtered={watcher.filtered}
        highlightedIndex={watcher.highlightedIndex}
        activeContextName={watcher.activeContextName}
        onSelect={watcher.selectVariable}
        onClose={() => watcher.setIsOpen(false)}
      />
    </div>
  );
}

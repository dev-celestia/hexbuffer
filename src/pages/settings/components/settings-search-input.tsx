import * as React from 'react';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { Input } from '@celestia-project/ui';
import { cn } from '@/lib/utils';

interface SettingsSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Names the section in the accessible label, so the field says what it is searching. */
  scopeLabel: string;
}

/**
 * Filters the settings rows of the section it sits in. Scoped on purpose: the rows of the other
 * sections are not mounted, so a page-wide search would need an index of every tab and would have
 * to answer "which section is this in?" — the sidebar already does that job.
 */
export function SettingsSearchInput({
  value,
  onChange,
  scopeLabel,
}: Readonly<SettingsSearchInputProps>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasValue = value.length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'relative flex items-center',

        // Sizing & Spacing
        'w-full sm:w-64'
      )}
    >
      <MagnifyingGlassIcon
        className={cn(
          // Layout & Positioning
          'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2',

          // Sizing & Spacing
          'size-3.5',

          // Typography & Colors
          'text-muted-foreground'
        )}
      />
      <Input
        ref={inputRef}
        // `type="search"` is avoided on purpose: WebKit/Chromium then draw a native clear button,
        // which would sit next to the custom one below. `role="searchbox"` gives the same
        // announced semantics without the duplicate widget.
        type="text"
        role="searchbox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && hasValue) {
            event.preventDefault();
            onChange('');
          }
        }}
        aria-label={`Search ${scopeLabel} settings`}
        placeholder="Search settings"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          // Sizing & Spacing
          'pl-8',
          hasValue && 'pr-8'
        )}
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className={cn(
            // Layout & Positioning
            'absolute right-2 top-1/2 -translate-y-1/2',

            // Sizing & Spacing
            'rounded p-0.5',

            // Typography & Colors
            'text-muted-foreground',

            // Interactive & States
            'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <XIcon
            className={cn(
              // Sizing & Spacing
              'size-3.5'
            )}
          />
        </button>
      )}
    </div>
  );
}

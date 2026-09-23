import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@celestia-project/ui';
import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface TreeFilterProps {
  value: string;
  onChange: (value: string) => void;
  /** Endpoints currently matched, shown only while a filter is active. */
  matchCount: number;
}

/**
 * Search box above the collections tree.
 *
 * Kept visible rather than hidden behind a toggle: a filter nobody can find is a filter nobody
 * uses, and locating one endpoint among many is the main reason to reach for this panel. It sits
 * on the same 28px control height as the rest of the page, so the extra band costs one row of
 * chrome and nothing else.
 *
 * The count is shown as a bare number rather than a sentence — at this width a phrase would
 * crowd the input, and the no-match case is spelled out by the tree's own empty state.
 */
export function TreeFilter({ value, onChange, matchCount }: Readonly<TreeFilterProps>) {
  const isActive = value.trim().length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex shrink-0 items-center',

        // Sizing & Spacing
        'h-9 px-1.5',

        // Backgrounds & Borders
        'border-b'
      )}
    >
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <MagnifyingGlassIcon />
        </InputGroupAddon>

        <InputGroupInput
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onChange('');
          }}
          placeholder="Filter collections"
          aria-label="Filter collections"
          spellCheck={false}
          autoComplete="off"
        />

        {isActive && (
          <InputGroupAddon align="inline-end">
            <span
              className={cn(
                // Typography
                'text-3xs leading-none tabular-nums',
                'text-muted-foreground'
              )}
            >
              {matchCount}
            </span>
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear filter"
              title="Clear filter"
              onClick={() => onChange('')}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}

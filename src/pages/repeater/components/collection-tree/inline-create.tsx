import { Input } from '@celestia-project/ui';
import { useRef, useEffect } from 'react';

import { PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { labelIndent } from './utils';

export interface InlineCreateProps {
  depth: number;
  type: 'endpoint' | 'collection';
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function InlineCreate({ depth, type, onSubmit, onCancel }: Readonly<InlineCreateProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const placeholder = type === 'collection' ? 'Folder name…' : 'Endpoint name…';

  const handleSubmit = () => {
    const name = inputRef.current?.value.trim();
    if (name) {
      onSubmit(name);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex items-center',

        // Sizing & Spacing
        'gap-1.5 py-0.5 pr-2'
      )}
      style={{ paddingLeft: `${labelIndent(depth)}px` }}
    >
      <form
        className={cn(
          // Layout & Positioning
          'flex min-w-0 flex-1 items-center',

          // Sizing & Spacing
          'gap-1'
        )}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Input textSize="xs"
          ref={inputRef}
          className={cn(
            // Sizing & Spacing
            'h-6'
          )}
          placeholder={placeholder}
          onBlur={() => {
            // Delay to allow submit button click to register
            setTimeout(() => {
              if (document.activeElement !== inputRef.current) {
                onCancel();
              }
            }, 200);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        <button
          type="submit"
          className={cn(
            // Layout & Positioning
            'flex shrink-0 items-center justify-center',

            // Sizing & Spacing
            'size-5 rounded',

            // Interactive & States
            'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          title={type === 'collection' ? 'Create folder' : 'Create endpoint'}
        >
          <PlusIcon className="size-3" />
        </button>
      </form>
    </div>
  );
}

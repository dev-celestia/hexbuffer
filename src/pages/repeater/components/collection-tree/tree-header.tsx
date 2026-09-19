import { Button } from '@celestia-project/ui';
import { PlusIcon, DownloadIcon, UploadIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface TreeHeaderProps {
  onExport: () => void;
  onImportClick: () => void;
  onCreateCollection: () => void;
}

/**
 * Toolbar above the collections tree.
 *
 * Sits on the same 36px band as the forge panel's toolbar row so the two panels read as one
 * surface. Actions are 24px ghost keys rather than the previous 24px `size="icon"` buttons,
 * which carried a 3D shadow that made three quiet icons compete with the tree below.
 */
export function TreeHeader({
  onExport,
  onImportClick,
  onCreateCollection,
}: Readonly<TreeHeaderProps>) {
  const actions = [
    { key: 'export', title: 'Export collections', icon: DownloadIcon, onClick: onExport },
    { key: 'import', title: 'Import collections', icon: UploadIcon, onClick: onImportClick },
    { key: 'create', title: 'New collection', icon: PlusIcon, onClick: onCreateCollection },
  ] as const;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex shrink-0 items-center justify-between',

        // Sizing & Spacing
        'h-9 px-2.5',

        // Backgrounds & Borders
        'border-b'
      )}
    >
      <span
        className={cn(
          // Typography
          'text-[11px] font-semibold tracking-wide text-muted-foreground uppercase'
        )}
      >
        Collections
      </span>

      <div
        className={cn(
          // Layout & Positioning
          'flex items-center',

          // Sizing & Spacing
          'gap-0.5'
        )}
      >
        {actions.map(({ key, title, icon: Icon, onClick }) => (
          <Button
            key={key}
            variant="ghost"
            size="icon-sm"
            className={cn(
              // Interactive & States
              'text-muted-foreground hover:text-foreground'
            )}
            title={title}
            onClick={onClick}
          >
            <Icon className="size-3.5" />
          </Button>
        ))}
      </div>
    </div>
  );
}

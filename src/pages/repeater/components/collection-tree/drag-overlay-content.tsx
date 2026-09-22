import { cn } from '@/lib/utils';
import folderIcon from '@/assets/explorer-icon/_folder.svg';
import { getMethodTreatment } from '../../lib/method-styles';
import { ROW_HEIGHT, type FlatNode } from './utils';

interface DragOverlayContentProps {
  node: FlatNode | null;
}

/**
 * The chip that follows the cursor while dragging a tree row.
 *
 * Mirrors TreeNodeRow's arrangement (method pill, then label) and reads its colours from the same
 * `getMethodTreatment` table, so the chip cannot drift from the row it represents.
 */
export function DragOverlayContent({ node }: Readonly<DragOverlayContentProps>) {
  if (!node) return null;

  const isEndpoint = node.kind === 'endpoint';
  const treatment = getMethodTreatment(node.method);

  return (
    <div
      style={{ height: ROW_HEIGHT }}
      className={cn(
        // Layout & Positioning
        'flex items-center',

        // Sizing & Spacing
        'gap-2 rounded-md border px-2 shadow-lg',

        // Typography
        'text-xs',

        // Backgrounds & Borders
        'bg-popover text-popover-foreground'
      )}
    >
      {isEndpoint && node.method && (
        <span
          className={cn(
            // Layout & Positioning
            'inline-flex shrink-0 items-center',

            // Sizing & Spacing
            'rounded border px-1',

            // Typography
            'font-mono text-4xs leading-4 font-bold uppercase',

            // Backgrounds & Borders
            treatment.pill
          )}
        >
          {node.method}
        </span>
      )}

      {!isEndpoint && <img src={folderIcon} alt="" className="size-4 shrink-0" />}

      <span className={cn('truncate')}>{node.label}</span>
    </div>
  );
}

import { cn } from '@/lib/utils';
import type { ForgeResponse } from '@/stores/collections';
import { formatBytes, getStatusTreatment } from '../../lib/status-styles';

interface MetaItemProps {
  label: string;
  value: string;
  valueClassName?: string;
  dotClassName?: string;
}

function MetaItem({ label, value, valueClassName, dotClassName }: Readonly<MetaItemProps>) {
  return (
    <span
      className={cn(
        // Layout & Positioning
        'flex items-center',

        // Sizing & Spacing
        'gap-1.5'
      )}
    >
      {dotClassName && (
        <span
          className={cn(
            // Sizing & Spacing
            'size-1.5 shrink-0',

            // Backgrounds & Borders
            'rounded-full',
            dotClassName
          )}
        />
      )}
      <span
        className={cn(
          // Typography
          'text-muted-foreground'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          // Typography
          'font-mono font-medium tabular-nums',
          valueClassName ?? 'text-foreground'
        )}
      >
        {value}
      </span>
    </span>
  );
}

/**
 * Status / time / size readout for the completed request.
 *
 * Lives on the mode-switch row so the response no longer needs a dedicated status bar of its
 * own — the compact status badge stays on the Response tab for when this strip is hidden.
 */
export function ForgeResponseMeta({ response }: Readonly<{ response: ForgeResponse }>) {
  const treatment = getStatusTreatment(response.status);
  const size = new Blob([response.body]).size;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex shrink-0 items-center',

        // Sizing & Spacing
        'gap-3',

        // Typography
        'text-xs'
      )}
    >
      <MetaItem
        label="Status"
        value={`${response.status} ${response.statusText}`}
        valueClassName={treatment.text}
        dotClassName={treatment.dot}
      />
      <MetaItem label="Time" value={`${response.timeMs} ms`} />
      <MetaItem label="Size" value={formatBytes(size)} />
    </div>
  );
}

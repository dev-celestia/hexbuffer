import { UploadSimpleIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FileDropOverlayProps {
  show: boolean;
  title: string;
}

/**
 * Visual affordance shown while files are dragged over a drop zone.
 * Pointer events stay disabled so the native drop handler is unaffected.
 */
export function FileDropOverlay({ show, title }: Readonly<FileDropOverlayProps>) {
  if (!show) return null;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "absolute inset-2 z-40 flex flex-col items-center justify-center gap-2 pointer-events-none",

        // Backgrounds & Borders
        "rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-[2px]",

        // Interactive & States
        "animate-in fade-in duration-150"
      )}
    >
      <UploadSimpleIcon className="size-8 text-primary" />
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="text-2xs text-muted-foreground">Release to add files</p>
    </div>
  );
}

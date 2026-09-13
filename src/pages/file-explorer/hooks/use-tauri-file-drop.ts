import * as React from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';

/**
 * Tracks Tauri's native file drag-and-drop over a registered drop zone.
 *
 * The webview's HTML5 drop events do not carry file data while Tauri's
 * dragDropEnabled handler is active, so this listens to the webview-level
 * drag-drop stream and hit-tests the physical event position against the
 * zone's DOM rect (scaled by devicePixelRatio).
 */
export function useTauriFileDrop(
  onDropFiles: (paths: string[]) => void,
  enabled: boolean = true,
) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dropZoneRef = React.useRef<HTMLDivElement | null>(null);
  const onDropFilesRef = React.useRef(onDropFiles);

  React.useEffect(() => {
    onDropFilesRef.current = onDropFiles;
  }, [onDropFiles]);

  React.useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    const isInsideZone = (position: { x: number; y: number }): boolean => {
      const el = dropZoneRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      return (
        position.x >= rect.left * scale &&
        position.x <= rect.right * scale &&
        position.y >= rect.top * scale &&
        position.y <= rect.bottom * scale
      );
    };

    void getCurrentWebview()
      .onDragDropEvent((event) => {
        const payload = event.payload;
        switch (payload.type) {
          case 'enter':
          case 'over':
            setIsDragOver(isInsideZone(payload.position));
            break;
          case 'drop': {
            const inside = isInsideZone(payload.position);
            setIsDragOver(false);
            if (inside && payload.paths.length > 0) {
              onDropFilesRef.current(payload.paths);
            }
            break;
          }
          default:
            setIsDragOver(false);
            break;
        }
      })
      .then((dispose) => {
        if (disposed) dispose();
        else unlisten = dispose;
      });

    return () => {
      disposed = true;
      unlisten?.();
      setIsDragOver(false);
    };
  }, [enabled]);

  return { dropZoneRef, isDragOver };
}

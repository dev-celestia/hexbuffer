import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@celestia-project/ui';
import {
  PaintBrushIcon,
  DownloadSimpleIcon,
  PlusCircleIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useDrawingCanvas } from '../../hooks/use-drawing-canvas';
import { DrawingCanvasToolbar } from './drawing-canvas-toolbar';

interface DrawingCanvasDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertIntoNote: (dataUrl: string, title?: string) => void;
}

export function DrawingCanvasDialog({
  isOpen,
  onOpenChange,
  onInsertIntoNote,
}: DrawingCanvasDialogProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const hook = useDrawingCanvas(isDarkTheme, (dataUrl) => {
    onInsertIntoNote(dataUrl, 'Scratchpad Drawing');
    onOpenChange(false);
  });

  const [textInputVal, setTextInputVal] = React.useState('');

  React.useEffect(() => {
    if (hook.editingTextElement) {
      setTextInputVal(hook.editingTextElement.text || '');
    }
  }, [hook.editingTextElement]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className={cn(
          // Layout & Positioning
          "flex flex-col p-0 overflow-hidden",

          // Sizing & Spacing
          "w-[90vw] max-w-[90vw] sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw] h-[90vh] max-h-[90vh] sm:max-h-[90vh]",

          // Backgrounds & Borders
          "bg-card border shadow-2xl rounded-xl"
        )}
      >
        {/* Main Canvas Drawing Surface */}
        <div
          tabIndex={0}
          onKeyDown={hook.handleKeyDown}
          onKeyUp={hook.handleKeyUp}
          className={cn(
            // Layout & Positioning
            "relative flex-1 min-h-0 w-full overflow-hidden select-none outline-none",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          {/* Floating Studio Controls Toolbar */}
          <DrawingCanvasToolbar hook={hook} />

          <canvas
            ref={hook.canvasRef}
            onWheel={hook.handleWheel}
            onPointerDown={hook.handlePointerDown}
            onPointerMove={hook.handlePointerMove}
            onPointerUp={hook.handlePointerUp}
            style={{
              cursor:
                hook.activeTool === 'select' || hook.activeTool === 'pan'
                  ? hook.cursorStyle
                  : undefined,
            }}
            className={cn(
              // Layout & Positioning
              "w-full h-full block touch-none",

              // Interactive & States
              hook.activeTool === 'eraser'
                ? "cursor-crosshair"
                : hook.activeTool === 'text'
                  ? "cursor-text"
                  : hook.activeTool === 'select' || hook.activeTool === 'pan'
                    ? ""
                    : "cursor-crosshair"
            )}
          />

          {/* Floating Inline Text Editor when text tool is triggered */}
          {hook.editingTextElement && (
            <div
              style={{
                position: 'absolute',
                left: Math.max(10, hook.editingTextElement.x * hook.zoom + hook.pan.x),
                top: Math.max(10, hook.editingTextElement.y * hook.zoom + hook.pan.y),
                zIndex: 40,
              }}
              className={cn(
                // Layout & Positioning
                "flex items-center shadow-lg",

                // Sizing & Spacing
                "p-1 rounded-lg border gap-1 min-w-[200px]",

                // Backgrounds & Borders
                "bg-popover border-primary/40"
              )}
            >
              <Input
                autoFocus
                placeholder="Enter node label or text..."
                value={textInputVal}
                onChange={(e) => setTextInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    hook.handleSaveText(textInputVal);
                  } else if (e.key === 'Escape') {
                    hook.handleCancelText();
                  }
                }}
                className={cn(
                  // Sizing & Spacing
                  "h-7 px-2 py-0",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "bg-background"
                )}
              />
              <Button
                size="sm"
                variant="default"
                onClick={() => hook.handleSaveText(textInputVal)}
                className="h-7 w-7 p-0 cursor-pointer"
                title="Save text"
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={hook.handleCancelText}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Cancel"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <DialogFooter
          className={cn(
            // Layout & Positioning
            "flex flex-row items-center justify-between shrink-0",

            // Sizing & Spacing
            "px-5 py-3 border-t",

            // Backgrounds & Borders
            "bg-muted/10"
          )}
        >
          {/* Left stats / quick tip */}
          <div
            className={cn(
              // Typography
              "text-xs text-muted-foreground font-mono"
            )}
          >
            {hook.elements.length} elements • Tool: <span className="font-semibold capitalize text-foreground">{hook.activeTool}</span> • Zoom: <span className="font-semibold text-foreground">{Math.round(hook.zoom * 100)}%</span>
            {hook.selectedElement && (
              <span className="ml-2 pl-2 border-l border-border text-primary font-medium">
                Selected: {hook.selectedElement.type}
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={hook.handleExportPng}
              className={cn(
                // Sizing & Spacing
                "h-8 px-3",

                // Typography
                "text-xs font-medium cursor-pointer"
              )}
              title="Download canvas as PNG file"
            >
              <DownloadSimpleIcon className="size-3.5 mr-1.5" />
              <span>Export PNG</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className={cn(
                // Sizing & Spacing
                "h-8 px-3",

                // Typography
                "text-xs font-medium cursor-pointer"
              )}
            >
              Cancel
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={hook.handleInsertIntoNote}
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5 h-8 px-4",

                // Typography
                "text-xs font-semibold cursor-pointer"
              )}
            >
              <PlusCircleIcon className="size-4" />
              <span>Insert into Note</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

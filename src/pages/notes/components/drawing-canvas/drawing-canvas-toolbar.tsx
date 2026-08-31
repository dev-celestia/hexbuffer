import * as React from 'react';
import {
  Button,
} from '@celestia-project/ui';
import {
  PencilSimpleIcon,
  SquareIcon,
  DiamondIcon,
  CircleIcon,
  ArrowRightIcon,
  LineSegmentIcon,
  TextTIcon,
  EraserIcon,
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  TrashIcon,
  GridFourIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { DrawingCanvasHookType } from '../../hooks/use-drawing-canvas';
import type { DrawingTool, StrokeWidthOption } from '../../types';

const COLOR_PALETTE = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Crimson', value: '#ef4444' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Slate', value: '#64748b' },
];

const STROKE_WIDTHS: { label: string; value: StrokeWidthOption }[] = [
  { label: '2px', value: 2 },
  { label: '4px', value: 4 },
  { label: '6px', value: 6 },
];

const TOOLS: { id: DrawingTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pen', label: 'Pen', icon: PencilSimpleIcon },
  { id: 'line', label: 'Line', icon: LineSegmentIcon },
  { id: 'arrow', label: 'Arrow', icon: ArrowRightIcon },
  { id: 'rectangle', label: 'Rectangle', icon: SquareIcon },
  { id: 'ellipse', label: 'Circle', icon: CircleIcon },
  { id: 'diamond', label: 'Diamond', icon: DiamondIcon },
  { id: 'text', label: 'Text', icon: TextTIcon },
  { id: 'eraser', label: 'Eraser', icon: EraserIcon },
];

interface DrawingCanvasToolbarProps {
  hook: DrawingCanvasHookType;
}

export function DrawingCanvasToolbar({ hook }: DrawingCanvasToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    fillMode,
    setFillMode,
    gridType,
    setGridType,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleClear,
  } = hook;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-wrap items-center justify-between shrink-0 select-none",

        // Sizing & Spacing
        "px-4 py-2 border-b gap-2",

        // Backgrounds & Borders
        "bg-muted/15"
      )}
    >
      {/* Left: Shape & Drawing Tool Selection */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center flex-wrap",

          // Sizing & Spacing
          "gap-1"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "p-0.5 rounded-lg border",

            // Backgrounds & Borders
            "bg-muted/30"
          )}
        >
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <Button
                key={t.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTool(t.id)}
                className={cn(
                  // Sizing & Spacing
                  "h-7 w-8 p-0",

                  // Typography
                  "text-xs cursor-pointer",

                  // Interactive & States
                  isActive ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                title={t.label}
              >
                <Icon className="size-4" />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Middle & Right: Color Palette, Stroke, Fill, Grid, Undo/Redo */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center flex-wrap justify-end",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        {/* Color Palette Swatches */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1 px-1.5 py-1 rounded-md border",

            // Backgrounds & Borders
            "bg-background"
          )}
        >
          {COLOR_PALETTE.map((c) => {
            const isSelected = color.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={cn(
                  // Sizing & Spacing
                  "size-4 rounded-full transition-transform cursor-pointer",

                  // Interactive & States
                  isSelected ? "ring-2 ring-foreground ring-offset-1 scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"
                )}
                title={c.label}
              />
            );
          })}
        </div>

        {/* Stroke Width Selector */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "p-0.5 rounded-md border",

            // Backgrounds & Borders
            "bg-muted/30"
          )}
        >
          {STROKE_WIDTHS.map((sw) => {
            const isActive = strokeWidth === sw.value;
            return (
              <Button
                key={sw.value}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStrokeWidth(sw.value)}
                className={cn(
                  // Sizing & Spacing
                  "h-6 px-1.5",

                  // Typography
                  "text-[10px] font-mono cursor-pointer",

                  // Interactive & States
                  isActive ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                title={`Stroke ${sw.label}`}
              >
                {sw.label}
              </Button>
            );
          })}
        </div>

        {/* Fill Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFillMode((prev) => (prev === 'translucent' ? 'solid' : prev === 'solid' ? 'none' : 'translucent'));
          }}
          className={cn(
            // Sizing & Spacing
            "h-7 px-2",

            // Typography
            "text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          )}
          title="Toggle shape fill mode (Translucent / Solid / Outline)"
        >
          <span className="text-[11px] capitalize">Fill: {fillMode}</span>
        </Button>

        {/* Grid Background Toggle */}
        <Button
          variant={gridType !== 'none' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            setGridType((prev) => (prev === 'dots' ? 'lines' : prev === 'lines' ? 'none' : 'dots'));
          }}
          className={cn(
            // Sizing & Spacing
            "h-7 px-2",

            // Typography
            "text-xs cursor-pointer"
          )}
          title={`Canvas Grid: ${gridType}`}
        >
          <GridFourIcon className="size-3.5 mr-1" />
          <span className="text-[11px] capitalize">{gridType}</span>
        </Button>

        {/* Undo / Redo / Clear Group */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-0.5 border-l pl-2"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={handleUndo}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            onClick={handleRedo}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          >
            <ArrowClockwiseIcon className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Clear canvas"
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

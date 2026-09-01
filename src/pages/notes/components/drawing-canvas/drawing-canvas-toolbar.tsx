import * as React from 'react';
import {
  Button,
} from '@celestia-project/ui';
import {
  CursorIcon,
  HandPalmIcon,
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
  CopyIcon,
  TrashSimpleIcon,
  StackIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  CornersOutIcon,
  PaletteIcon,
  CaretUpIcon,
  CaretDownIcon,
  XIcon,
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

const SHAPE_TOOLS: { id: DrawingTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: SquareIcon },
  { id: 'ellipse', label: 'Circle', icon: CircleIcon },
  { id: 'diamond', label: 'Diamond', icon: DiamondIcon },
  { id: 'line', label: 'Line', icon: LineSegmentIcon },
  { id: 'arrow', label: 'Arrow', icon: ArrowRightIcon },
];

type ActiveSubmenu = 'shapes' | 'style' | 'view' | null;

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
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitToScreen,
    selectedElementId,
    selectedElement,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleBringToFront,
    handleSendToBack,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleClear,
  } = hook;

  const [activeSubmenu, setActiveSubmenu] = React.useState<ActiveSubmenu>(null);

  // Close floating popovers when active tool switches to a non-shape tool
  const handleSelectTool = (tool: DrawingTool) => {
    setActiveTool(tool);
    if (!SHAPE_TOOLS.some((s) => s.id === tool)) {
      if (activeSubmenu === 'shapes') {
        setActiveSubmenu(null);
      }
    }
  };

  const isShapeActive = SHAPE_TOOLS.some((s) => s.id === activeTool);
  const activeShape = SHAPE_TOOLS.find((s) => s.id === activeTool) || SHAPE_TOOLS[0];
  const ActiveShapeIcon = activeShape.icon;

  const toggleSubmenu = (menu: ActiveSubmenu) => {
    setActiveSubmenu((prev) => (prev === menu ? null : menu));
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        // Layout & Positioning
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none",

        // Sizing & Spacing
        "gap-2"
      )}
    >
      {/* ========================================================================= */}
      {/* FLOATING TOP POPUPS / TOOLTIPS */}
      {/* ========================================================================= */}

      {/* 1. Contextual Selected Object Actions Bar (Floats on Top when an object is selected) */}
      {selectedElement && !activeSubmenu && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shadow-xl",

            // Sizing & Spacing
            "gap-1 px-2 py-1 rounded-xl border animate-in fade-in zoom-in-95 duration-150",

            // Backgrounds & Borders
            "bg-card/95 dark:bg-card/90 backdrop-blur-md border-primary/30"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[11px] font-medium text-primary px-1.5 py-0.5 rounded-md bg-primary/10 capitalize"
            )}
          >
            {selectedElement.type}
          </span>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-0.5 border-l pl-1 ml-0.5 border-border/60"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicateSelected}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2",

                // Typography
                "text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              )}
              title="Duplicate (Ctrl+D / Cmd+D)"
            >
              <CopyIcon className="size-3.5 mr-1" />
              <span>Duplicate</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBringToFront}
              className={cn(
                // Sizing & Spacing
                "h-7 w-7 p-0",

                // Typography
                "text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              )}
              title="Bring to Front"
            >
              <StackIcon className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSelected}
              className={cn(
                // Sizing & Spacing
                "h-7 w-7 p-0",

                // Typography
                "text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              )}
              title="Delete (Delete / Backspace)"
            >
              <TrashSimpleIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. Floating Shapes Submenu */}
      {activeSubmenu === 'shapes' && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shadow-2xl",

            // Sizing & Spacing
            "gap-1 p-1.5 rounded-xl border animate-in fade-in zoom-in-95 duration-150",

            // Backgrounds & Borders
            "bg-card/95 dark:bg-card/90 backdrop-blur-md border-border/80"
          )}
        >
          {SHAPE_TOOLS.map((st) => {
            const ShapeIcon = st.icon;
            const isSelected = activeTool === st.id;
            return (
              <Button
                key={st.id}
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTool(st.id);
                  setActiveSubmenu(null);
                }}
                className={cn(
                  // Sizing & Spacing
                  "h-8 px-2.5 gap-1.5",

                  // Typography
                  "text-xs cursor-pointer",

                  // Interactive & States
                  isSelected ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                title={st.label}
              >
                <ShapeIcon className="size-4" />
                <span className="text-[11px]">{st.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* 3. Floating Style & Colors Submenu */}
      {activeSubmenu === 'style' && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col shadow-2xl",

            // Sizing & Spacing
            "gap-2.5 p-3 rounded-xl border min-w-[260px] animate-in fade-in zoom-in-95 duration-150",

            // Backgrounds & Borders
            "bg-card/95 dark:bg-card/90 backdrop-blur-md border-border/80"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between",

              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            <span>Style & Appearance</span>
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          {/* Color Palette */}
          <div>
            <span
              className={cn(
                // Typography
                "text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1.5"
              )}
            >
              Stroke Color
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center flex-wrap",

                // Sizing & Spacing
                "gap-1.5"
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
                      "size-5 rounded-full transition-transform cursor-pointer",

                      // Interactive & States
                      isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100 hover:scale-105"
                    )}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Stroke Width & Fill Mode Row */}
          <div
            className={cn(
              // Layout & Positioning
              "grid grid-cols-2",

              // Sizing & Spacing
              "gap-2 pt-1 border-t border-border/40"
            )}
          >
            <div>
              <span
                className={cn(
                  // Typography
                  "text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1"
                )}
              >
                Stroke Width
              </span>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "p-0.5 rounded-md border gap-0.5",

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
                        "h-6 flex-1 px-1",

                        // Typography
                        "text-[10px] font-mono cursor-pointer",

                        // Interactive & States
                        isActive ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sw.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <span
                className={cn(
                  // Typography
                  "text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1"
                )}
              >
                Fill Mode
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextMode = fillMode === 'translucent' ? 'solid' : fillMode === 'solid' ? 'none' : 'translucent';
                  setFillMode(nextMode);
                }}
                className={cn(
                  // Sizing & Spacing
                  "h-7 w-full px-2 justify-center",

                  // Typography
                  "text-xs font-medium cursor-pointer capitalize"
                )}
              >
                {fillMode}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Floating View & Zoom Submenu */}
      {activeSubmenu === 'view' && (
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col shadow-2xl",

            // Sizing & Spacing
            "gap-2.5 p-3 rounded-xl border min-w-[220px] animate-in fade-in zoom-in-95 duration-150",

            // Backgrounds & Borders
            "bg-card/95 dark:bg-card/90 backdrop-blur-md border-border/80"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center justify-between",

              // Typography
              "text-xs font-semibold text-foreground"
            )}
          >
            <span>Canvas View & Zoom</span>
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div>
            <span
              className={cn(
                // Typography
                "text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1"
              )}
            >
              Zoom Controls
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between",

                // Sizing & Spacing
                "p-1 rounded-lg border",

                // Backgrounds & Borders
                "bg-muted/30"
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="h-7 w-7 p-0 cursor-pointer"
                title="Zoom Out"
              >
                <MagnifyingGlassMinusIcon className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                className={cn(
                  // Sizing & Spacing
                  "h-7 px-2",

                  // Typography
                  "text-xs font-mono font-semibold text-foreground cursor-pointer"
                )}
                title="Reset Zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3.0}
                className="h-7 w-7 p-0 cursor-pointer"
                title="Zoom In"
              >
                <MagnifyingGlassPlusIcon className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleFitToScreen}
                className={cn(
                  // Sizing & Spacing
                  "h-7 px-2 border-l ml-1 gap-1",

                  // Typography
                  "text-xs font-medium cursor-pointer"
                )}
                title="Fit to Screen"
              >
                <CornersOutIcon className="size-3.5" />
                <span>Fit</span>
              </Button>
            </div>
          </div>

          {/* Grid Options */}
          <div
            className={cn(
              // Sizing & Spacing
              "pt-1 border-t border-border/40"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1"
              )}
            >
              Background Grid
            </span>
            <div
              className={cn(
                // Layout & Positioning
                "grid grid-cols-3",

                // Sizing & Spacing
                "gap-1 p-0.5 rounded-lg border",

                // Backgrounds & Borders
                "bg-muted/30"
              )}
            >
              {(['dots', 'lines', 'none'] as const).map((g) => {
                const isActive = gridType === g;
                return (
                  <Button
                    key={g}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridType(g)}
                    className={cn(
                      // Sizing & Spacing
                      "h-6 px-1",

                      // Typography
                      "text-[11px] capitalize cursor-pointer",

                      // Interactive & States
                      isActive ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {g}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN NARROW DOCK BAR */}
      {/* ========================================================================= */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center shadow-2xl",

          // Sizing & Spacing
          "p-1.5 rounded-2xl border gap-1.5",

          // Backgrounds & Borders
          "bg-card/95 dark:bg-card/90 backdrop-blur-md border-border/80"
        )}
      >
        {/* Primary Creation & Navigation Tools */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-0.5"
          )}
        >
          {/* Select Tool */}
          <Button
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectTool('select')}
            className={cn(
              // Sizing & Spacing
              "h-8 w-8 p-0",

              // Interactive & States
              activeTool === 'select' ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Select & Move (V)"
          >
            <CursorIcon className="size-4" />
          </Button>

          {/* Pan Tool */}
          <Button
            variant={activeTool === 'pan' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectTool('pan')}
            className={cn(
              // Sizing & Spacing
              "h-8 w-8 p-0",

              // Interactive & States
              activeTool === 'pan' ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Pan Hand Tool (H / Space)"
          >
            <HandPalmIcon className="size-4" />
          </Button>

          {/* Pen Tool */}
          <Button
            variant={activeTool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectTool('pen')}
            className={cn(
              // Sizing & Spacing
              "h-8 w-8 p-0",

              // Interactive & States
              activeTool === 'pen' ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Pen (P)"
          >
            <PencilSimpleIcon className="size-4" />
          </Button>

          {/* Shapes Category Trigger */}
          <Button
            variant={isShapeActive || activeSubmenu === 'shapes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleSubmenu('shapes')}
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "h-8 px-2 gap-1",

              // Interactive & States
              isShapeActive || activeSubmenu === 'shapes'
                ? "shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Shapes Menu (Rectangle, Circle, Diamond, Line, Arrow)"
          >
            <ActiveShapeIcon className="size-4" />
            {activeSubmenu === 'shapes' ? (
              <CaretDownIcon className="size-3 opacity-70" />
            ) : (
              <CaretUpIcon className="size-3 opacity-70" />
            )}
          </Button>

          {/* Text Tool */}
          <Button
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectTool('text')}
            className={cn(
              // Sizing & Spacing
              "h-8 w-8 p-0",

              // Interactive & States
              activeTool === 'text' ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Text (T)"
          >
            <TextTIcon className="size-4" />
          </Button>

          {/* Eraser Tool */}
          <Button
            variant={activeTool === 'eraser' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleSelectTool('eraser')}
            className={cn(
              // Sizing & Spacing
              "h-8 w-8 p-0",

              // Interactive & States
              activeTool === 'eraser' ? "shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            title="Eraser (E)"
          >
            <EraserIcon className="size-4" />
          </Button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border/60 mx-0.5" />

        {/* Categorized Property Popovers: Style & View */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          {/* Style & Colors Category Button */}
          <Button
            variant={activeSubmenu === 'style' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleSubmenu('style')}
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "h-8 px-2 gap-1.5",

              // Typography
              "text-xs cursor-pointer",

              // Interactive & States
              activeSubmenu === 'style' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Style & Appearance (Colors, Stroke, Fill)"
          >
            <span
              style={{ backgroundColor: color }}
              className="size-3.5 rounded-full ring-1 ring-border shrink-0"
            />
            <span className="text-[11px] font-medium hidden sm:inline">Style</span>
            {activeSubmenu === 'style' ? (
              <CaretDownIcon className="size-3 opacity-60" />
            ) : (
              <CaretUpIcon className="size-3 opacity-60" />
            )}
          </Button>

          {/* View & Zoom Category Button */}
          <Button
            variant={activeSubmenu === 'view' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleSubmenu('view')}
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "h-8 px-2 gap-1.5",

              // Typography
              "text-xs cursor-pointer",

              // Interactive & States
              activeSubmenu === 'view' ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Canvas View & Zoom Controls"
          >
            <GridFourIcon className="size-3.5" />
            <span className="text-[11px] font-mono font-medium">{Math.round(zoom * 100)}%</span>
            {activeSubmenu === 'view' ? (
              <CaretDownIcon className="size-3 opacity-60" />
            ) : (
              <CaretUpIcon className="size-3 opacity-60" />
            )}
          </Button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border/60 mx-0.5" />

        {/* History Undo / Redo & Clear */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-0.5"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={handleUndo}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <ArrowCounterClockwiseIcon className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            onClick={handleRedo}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          >
            <ArrowClockwiseIcon className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Clear canvas"
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


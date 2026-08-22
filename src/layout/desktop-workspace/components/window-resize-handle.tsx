import * as React from "react";

export type ResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

interface WindowResizeHandlesProps {
  onMouseDown: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

export const WindowResizeHandles = React.memo(function WindowResizeHandles({
  onMouseDown,
}: WindowResizeHandlesProps) {
  return (
    <>
      {/* 4 Edge Handles */}
      <div
        onMouseDown={(e) => onMouseDown(e, "n")}
        className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-30"
      />
      <div
        onMouseDown={(e) => onMouseDown(e, "s")}
        className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-30"
      />
      <div
        onMouseDown={(e) => onMouseDown(e, "w")}
        className="absolute left-0 top-3 bottom-3 w-1.5 cursor-ew-resize z-30"
      />
      <div
        onMouseDown={(e) => onMouseDown(e, "e")}
        className="absolute right-0 top-3 bottom-3 w-1.5 cursor-ew-resize z-30"
      />

      {/* 4 Corner Handles */}
      <div
        onMouseDown={(e) => onMouseDown(e, "nw")}
        className="absolute top-0 left-0 size-3 cursor-nwse-resize z-30"
      />
      <div
        onMouseDown={(e) => onMouseDown(e, "ne")}
        className="absolute top-0 right-0 size-3 cursor-nesw-resize z-30"
      />
      <div
        onMouseDown={(e) => onMouseDown(e, "sw")}
        className="absolute bottom-0 left-0 size-3 cursor-nesw-resize z-30"
      />
      <div
        onMouseDown={(e) => onMouseDown(e, "se")}
        className="absolute bottom-0 right-0 size-4 cursor-nwse-resize z-30 flex items-end justify-end p-0.5"
      >
        <svg
          className="size-2.5 text-muted-foreground/40 pointer-events-none"
          viewBox="0 0 10 10"
        >
          <path
            d="M10,0 L0,10 M10,4 L4,10 M10,8 L8,10"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
});

// Backward-compatible alias
export const WindowResizeHandle = WindowResizeHandles;

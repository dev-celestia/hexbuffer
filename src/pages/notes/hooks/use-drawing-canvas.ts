import * as React from 'react';
import { toast } from 'sonner';
import type {
  CanvasElement,
  CanvasGridType,
  DrawingTool,
  Point,
  StrokeWidthOption,
} from '../types';
import {
  drawGrid,
  exportCanvasToDataUrl,
  renderCanvasElement,
} from '../lib/canvas-helpers';

export function useDrawingCanvas(isDarkTheme: boolean, onInsert: (dataUrl: string) => void) {
  const [elements, setElements] = React.useState<CanvasElement[]>([]);
  const [history, setHistory] = React.useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = React.useState(0);

  const [activeTool, setActiveTool] = React.useState<DrawingTool>('pen');
  const [color, setColor] = React.useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = React.useState<StrokeWidthOption>(2);
  const [fillMode, setFillMode] = React.useState<'none' | 'translucent' | 'solid'>('translucent');
  const [gridType, setGridType] = React.useState<CanvasGridType>('dots');

  // Interactive text placement / edit state
  const [editingTextElement, setEditingTextElement] = React.useState<{
    id: string;
    x: number;
    y: number;
    text: string;
    isNew: boolean;
  } | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);
  const currentElementRef = React.useRef<CanvasElement | null>(null);

  // Derive fill color based on stroke color and fill mode
  const getDerivedFillColor = React.useCallback(
    (baseColor: string, mode: 'none' | 'translucent' | 'solid') => {
      if (mode === 'none') return undefined;
      if (mode === 'solid') return baseColor;
      // Translucent
      if (baseColor.startsWith('#')) {
        const hex = baseColor.slice(1);
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, 0.15)`;
        }
      }
      return 'rgba(59, 130, 246, 0.15)';
    },
    []
  );

  // Push new state to undo/redo history
  const pushHistory = React.useCallback(
    (newElements: CanvasElement[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newElements];
      });
      setHistoryIndex((prev) => prev + 1);
      setElements(newElements);
    },
    [historyIndex]
  );

  const handleUndo = React.useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx] || []);
    }
  }, [history, historyIndex]);

  const handleRedo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx] || []);
    }
  }, [history, historyIndex]);

  const handleClear = React.useCallback(() => {
    if (elements.length === 0) return;
    pushHistory([]);
    toast.info('Canvas cleared');
  }, [elements.length, pushHistory]);

  // Redraw canvas loop
  const redrawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    drawGrid(ctx, width, height, gridType, isDarkTheme);

    // Draw existing elements
    elements.forEach((el) => {
      renderCanvasElement(ctx, el);
    });

    // Draw active in-progress element
    if (currentElementRef.current) {
      renderCanvasElement(ctx, currentElementRef.current);
    }

    ctx.restore();
  }, [elements, gridType, isDarkTheme]);

  // Adjust canvas size to parent container on mount/resize
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      redrawCanvas();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [redrawCanvas]);

  React.useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer event helpers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editingTextElement) return;

    const coords = getCanvasCoords(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (activeTool === 'eraser') {
      // Find element under cursor and erase it
      const remaining = elements.filter((el) => {
        const minX = Math.min(el.x, el.x + (el.width || 0)) - 10;
        const maxX = Math.max(el.x, el.x + (el.width || 0)) + 10;
        const minY = Math.min(el.y, el.y + (el.height || 0)) - 10;
        const maxY = Math.max(el.y, el.y + (el.height || 0)) + 10;
        return !(coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY);
      });
      if (remaining.length !== elements.length) {
        pushHistory(remaining);
      }
      return;
    }

    if (activeTool === 'text') {
      setEditingTextElement({
        id: Date.now().toString(),
        x: coords.x,
        y: coords.y,
        text: '',
        isNew: true,
      });
      return;
    }

    isDrawingRef.current = true;

    const currentFill = getDerivedFillColor(color, fillMode);

    if (activeTool === 'pen') {
      currentElementRef.current = {
        id: Date.now().toString(),
        type: 'pen',
        x: coords.x,
        y: coords.y,
        points: [coords],
        color,
        strokeWidth,
      };
    } else {
      currentElementRef.current = {
        id: Date.now().toString(),
        type: activeTool,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        color,
        fillColor: currentFill,
        strokeWidth,
      };
    }

    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentElementRef.current) return;

    const coords = getCanvasCoords(e);

    if (currentElementRef.current.type === 'pen') {
      currentElementRef.current.points?.push(coords);
    } else {
      currentElementRef.current.width = coords.x - currentElementRef.current.x;
      currentElementRef.current.height = coords.y - currentElementRef.current.y;
    }

    redrawCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentElementRef.current) return;
    isDrawingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const elem = currentElementRef.current;
    currentElementRef.current = null;

    // Filter out accidental micro clicks
    if (elem.type === 'pen' && (!elem.points || elem.points.length < 2)) {
      redrawCanvas();
      return;
    }

    if (
      elem.type !== 'pen' &&
      Math.abs(elem.width || 0) < 6 &&
      Math.abs(elem.height || 0) < 6
    ) {
      redrawCanvas();
      return;
    }

    pushHistory([...elements, elem]);
  };

  // Save text element
  const handleSaveText = (text: string) => {
    if (!editingTextElement) return;

    const trimmed = text.trim();
    if (trimmed) {
      const textElem: CanvasElement = {
        id: editingTextElement.id,
        type: 'text',
        x: editingTextElement.x,
        y: editingTextElement.y,
        color,
        strokeWidth: 1,
        text: trimmed,
        fontSize: 14,
      };
      pushHistory([...elements, textElem]);
    }
    setEditingTextElement(null);
  };

  // Export & Insert handlers
  const handleInsertIntoNote = () => {
    if (elements.length === 0) {
      toast.error('Canvas is empty', { description: 'Draw on the scratchpad first' });
      return;
    }

    const dataUrl = exportCanvasToDataUrl(elements, isDarkTheme, true);
    if (dataUrl) {
      onInsert(dataUrl);
      toast.success('Scratchpad drawing inserted into note!');
    }
  };

  const handleExportPng = () => {
    if (elements.length === 0) {
      toast.error('Canvas is empty');
      return;
    }

    const dataUrl = exportCanvasToDataUrl(elements, isDarkTheme, true);
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `scratchpad-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Scratchpad PNG downloaded');
  };

  return {
    canvasRef,
    elements,
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
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    editingTextElement,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSaveText,
    handleCancelText: () => setEditingTextElement(null),
    handleUndo,
    handleRedo,
    handleClear,
    handleInsertIntoNote,
    handleExportPng,
  };
}

export type DrawingCanvasHookType = ReturnType<typeof useDrawingCanvas>;

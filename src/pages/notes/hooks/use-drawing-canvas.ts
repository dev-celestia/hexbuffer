import * as React from 'react';
import { toast } from 'sonner';
import type {
  CanvasElement,
  CanvasGridType,
  DrawingTool,
  Point,
  StrokeWidthOption,
  ResizeHandle,
} from '../types';
import {
  drawGrid,
  exportCanvasToDataUrl,
  renderCanvasElement,
  hitTestElement,
  hitTestResizeHandle,
  drawSelectionOutline,
  translateElement,
  scaleElement,
  getElementsBoundingBox,
} from '../lib/canvas-helpers';

export function useDrawingCanvas(isDarkTheme: boolean, onInsert: (dataUrl: string) => void) {
  const [elements, setElements] = React.useState<CanvasElement[]>([]);
  const [history, setHistory] = React.useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = React.useState(0);

  const [activeTool, setActiveTool] = React.useState<DrawingTool>('select');
  const [color, setColor] = React.useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = React.useState<StrokeWidthOption>(2);
  const [fillMode, setFillMode] = React.useState<'none' | 'translucent' | 'solid'>('translucent');
  const [gridType, setGridType] = React.useState<CanvasGridType>('dots');

  // Zoom & Pan state
  const [zoom, setZoom] = React.useState<number>(1);
  const [pan, setPan] = React.useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = React.useState<boolean>(false);

  // Selected element for translation and scaling
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
  const [cursorStyle, setCursorStyle] = React.useState<string>('default');

  // Interactive text placement / edit state
  const [editingTextElement, setEditingTextElement] = React.useState<{
    id: string;
    x: number;
    y: number;
    text: string;
    isNew: boolean;
  } | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const elementsRef = React.useRef<CanvasElement[]>([]);
  elementsRef.current = elements;

  // Drag interaction state
  const dragInteractionRef = React.useRef<{
    mode: 'idle' | 'drawing' | 'moving' | 'resizing' | 'panning';
    activeHandle: ResizeHandle | null;
    startPoint: Point;
    startScreenPoint: Point;
    initialPan: Point;
    initialSnapshot: CanvasElement | null;
    hasMoved: boolean;
  }>({
    mode: 'idle',
    activeHandle: null,
    startPoint: { x: 0, y: 0 },
    startScreenPoint: { x: 0, y: 0 },
    initialPan: { x: 0, y: 0 },
    initialSnapshot: null,
    hasMoved: false,
  });

  const currentElementRef = React.useRef<CanvasElement | null>(null);

  // Derive fill color based on stroke color and fill mode
  const getDerivedFillColor = React.useCallback(
    (baseColor: string, mode: 'none' | 'translucent' | 'solid') => {
      if (mode === 'none') return undefined;
      if (mode === 'solid') return baseColor;
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
      const nextElements = history[nextIdx] || [];
      setElements(nextElements);
      setSelectedElementId((cur) => (cur && nextElements.some((e) => e.id === cur) ? cur : null));
    }
  }, [history, historyIndex]);

  const handleRedo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextElements = history[nextIdx] || [];
      setElements(nextElements);
      setSelectedElementId((cur) => (cur && nextElements.some((e) => e.id === cur) ? cur : null));
    }
  }, [history, historyIndex]);

  const handleClear = React.useCallback(() => {
    if (elements.length === 0) return;
    setSelectedElementId(null);
    pushHistory([]);
    toast.info('Canvas cleared');
  }, [elements.length, pushHistory]);

  const selectedElement = React.useMemo(() => {
    return elements.find((el) => el.id === selectedElementId) || null;
  }, [elements, selectedElementId]);

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

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Apply viewport Zoom & Pan transformation
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw background grid
    drawGrid(ctx, width, height, gridType, isDarkTheme, pan, zoom);

    // Draw elements in world coordinates
    elements.forEach((el) => {
      renderCanvasElement(ctx, el);
    });

    // Draw active in-progress drawing element
    if (currentElementRef.current) {
      renderCanvasElement(ctx, currentElementRef.current);
    }

    // Draw selection outline and transform handles
    if (selectedElement) {
      drawSelectionOutline(ctx, selectedElement, isDarkTheme);
    }

    ctx.restore(); // Restore zoom & pan
    ctx.restore(); // Restore dpr
  }, [elements, gridType, isDarkTheme, pan, selectedElement, zoom]);

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

  // World coordinate conversion from pointer screen position
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  };

  const getCursorForHandle = (handle: ResizeHandle | null): string => {
    if (!handle) return 'default';
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      case 'start':
      case 'end':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  // Zoom controls
  const handleZoomIn = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const centerX = width / 2;
    const centerY = height / 2;

    setZoom((prevZoom) => {
      const newZoom = Math.min(3.0, Math.round((prevZoom + 0.15) * 100) / 100);
      const worldX = (centerX - pan.x) / prevZoom;
      const worldY = (centerY - pan.y) / prevZoom;
      setPan({
        x: Math.round(centerX - worldX * newZoom),
        y: Math.round(centerY - worldY * newZoom),
      });
      return newZoom;
    });
  }, [pan]);

  const handleZoomOut = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const centerX = width / 2;
    const centerY = height / 2;

    setZoom((prevZoom) => {
      const newZoom = Math.max(0.25, Math.round((prevZoom - 0.15) * 100) / 100);
      const worldX = (centerX - pan.x) / prevZoom;
      const worldY = (centerY - pan.y) / prevZoom;
      setPan({
        x: Math.round(centerX - worldX * newZoom),
        y: Math.round(centerY - worldY * newZoom),
      });
      return newZoom;
    });
  }, [pan]);

  const handleResetZoom = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitToScreen = React.useCallback(() => {
    if (elements.length === 0) {
      handleResetZoom();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const bbox = getElementsBoundingBox(elements, 48);
    const scaleX = (width - 40) / bbox.width;
    const scaleY = (height - 40) / bbox.height;
    const newZoom = Math.min(2.0, Math.max(0.25, Math.min(scaleX, scaleY)));
    const roundedZoom = Math.round(newZoom * 100) / 100;

    const centerWorldX = bbox.minX + bbox.width / 2;
    const centerWorldY = bbox.minY + bbox.height / 2;

    setZoom(roundedZoom);
    setPan({
      x: Math.round(width / 2 - centerWorldX * roundedZoom),
      y: Math.round(height / 2 - centerWorldY * roundedZoom),
    });
  }, [elements, handleResetZoom]);

  // Wheel Zoom & Pan handling
  const handleWheel = React.useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.005;
        setZoom((prevZoom) => {
          const newZoom = Math.min(3.0, Math.max(0.25, Math.round((prevZoom + zoomDelta) * 100) / 100));
          const worldX = (mouseX - pan.x) / prevZoom;
          const worldY = (mouseY - pan.y) / prevZoom;
          setPan({
            x: Math.round(mouseX - worldX * newZoom),
            y: Math.round(mouseY - worldY * newZoom),
          });
          return newZoom;
        });
      } else {
        setPan((prevPan) => ({
          x: Math.round(prevPan.x - e.deltaX),
          y: Math.round(prevPan.y - e.deltaY),
        }));
      }
    },
    [pan]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editingTextElement) return;

    const coords = getCanvasCoords(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Pan Tool or Middle Click or Space+Click
    if (activeTool === 'pan' || e.button === 1 || isSpacePressed) {
      dragInteractionRef.current = {
        mode: 'panning',
        activeHandle: null,
        startPoint: coords,
        startScreenPoint: { x: e.clientX, y: e.clientY },
        initialPan: { ...pan },
        initialSnapshot: null,
        hasMoved: false,
      };
      setCursorStyle('grabbing');
      return;
    }

    // Eraser Tool
    if (activeTool === 'eraser') {
      const remaining = elements.filter((el) => !hitTestElement(el, coords, 12 / zoom));
      if (remaining.length !== elements.length) {
        if (selectedElementId && !remaining.some((el) => el.id === selectedElementId)) {
          setSelectedElementId(null);
        }
        pushHistory(remaining);
      }
      return;
    }

    // Text Tool
    if (activeTool === 'text') {
      setSelectedElementId(null);
      setEditingTextElement({
        id: Date.now().toString(),
        x: coords.x,
        y: coords.y,
        text: '',
        isNew: true,
      });
      return;
    }

    // Select Tool: check resize handles first, then elements
    if (activeTool === 'select') {
      if (selectedElement) {
        const hitHandle = hitTestResizeHandle(selectedElement, coords, 9 / zoom);
        if (hitHandle) {
          dragInteractionRef.current = {
            mode: 'resizing',
            activeHandle: hitHandle,
            startPoint: coords,
            startScreenPoint: { x: e.clientX, y: e.clientY },
            initialPan: { ...pan },
            initialSnapshot: JSON.parse(JSON.stringify(selectedElement)),
            hasMoved: false,
          };
          setCursorStyle(getCursorForHandle(hitHandle));
          return;
        }
      }

      // Hit test existing elements in top-to-bottom order (reverse array)
      const clickedElem = [...elements].reverse().find((el) => hitTestElement(el, coords, 8 / zoom));

      if (clickedElem) {
        setSelectedElementId(clickedElem.id);
        setColor(clickedElem.color);
        setStrokeWidth(clickedElem.strokeWidth as StrokeWidthOption);
        if (clickedElem.fillColor === clickedElem.color) {
          setFillMode('solid');
        } else if (clickedElem.fillColor) {
          setFillMode('translucent');
        } else {
          setFillMode('none');
        }

        dragInteractionRef.current = {
          mode: 'moving',
          activeHandle: null,
          startPoint: coords,
          startScreenPoint: { x: e.clientX, y: e.clientY },
          initialPan: { ...pan },
          initialSnapshot: JSON.parse(JSON.stringify(clickedElem)),
          hasMoved: false,
        };
        setCursorStyle('move');
        return;
      }

      // Clicked on empty space -> deselect
      setSelectedElementId(null);
      dragInteractionRef.current = {
        mode: 'idle',
        activeHandle: null,
        startPoint: coords,
        startScreenPoint: { x: e.clientX, y: e.clientY },
        initialPan: { ...pan },
        initialSnapshot: null,
        hasMoved: false,
      };
      setCursorStyle('default');
      return;
    }

    // Drawing Tools (pen, line, arrow, rectangle, ellipse, diamond)
    setSelectedElementId(null);
    dragInteractionRef.current = {
      mode: 'drawing',
      activeHandle: null,
      startPoint: coords,
      startScreenPoint: { x: e.clientX, y: e.clientY },
      initialPan: { ...pan },
      initialSnapshot: null,
      hasMoved: false,
    };

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
    const drag = dragInteractionRef.current;

    // Active Panning
    if (drag.mode === 'panning') {
      const dx = e.clientX - drag.startScreenPoint.x;
      const dy = e.clientY - drag.startScreenPoint.y;
      setPan({
        x: Math.round(drag.initialPan.x + dx),
        y: Math.round(drag.initialPan.y + dy),
      });
      return;
    }

    const coords = getCanvasCoords(e);

    // Active Resizing
    if (drag.mode === 'resizing' && drag.initialSnapshot && drag.activeHandle && selectedElementId) {
      drag.hasMoved = true;
      const scaled = scaleElement(drag.initialSnapshot, drag.activeHandle, coords, drag.startPoint);
      setElements((prev) => prev.map((el) => (el.id === selectedElementId ? scaled : el)));
      return;
    }

    // Active Moving (Translation on X & Y)
    if (drag.mode === 'moving' && drag.initialSnapshot && selectedElementId) {
      drag.hasMoved = true;
      const dx = coords.x - drag.startPoint.x;
      const dy = coords.y - drag.startPoint.y;
      const moved = translateElement(drag.initialSnapshot, dx, dy);
      setElements((prev) => prev.map((el) => (el.id === selectedElementId ? moved : el)));
      return;
    }

    // Active Drawing
    if (drag.mode === 'drawing' && currentElementRef.current) {
      if (currentElementRef.current.type === 'pen') {
        currentElementRef.current.points?.push(coords);
      } else {
        currentElementRef.current.width = coords.x - currentElementRef.current.x;
        currentElementRef.current.height = coords.y - currentElementRef.current.y;
      }
      redrawCanvas();
      return;
    }

    // Idle Hover Cursor updates
    if (drag.mode === 'idle') {
      if (activeTool === 'pan' || isSpacePressed) {
        setCursorStyle('grab');
        return;
      }

      if (activeTool === 'select') {
        if (selectedElement) {
          const handle = hitTestResizeHandle(selectedElement, coords, 9 / zoom);
          if (handle) {
            setCursorStyle(getCursorForHandle(handle));
            return;
          }
        }

        const isOverElement = elements.some((el) => hitTestElement(el, coords, 8 / zoom));
        if (isOverElement) {
          setCursorStyle('move');
        } else {
          setCursorStyle('default');
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragInteractionRef.current;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Finalize Moving / Resizing
    if ((drag.mode === 'moving' || drag.mode === 'resizing') && drag.hasMoved) {
      pushHistory(elementsRef.current);
    }

    // Finalize Drawing
    if (drag.mode === 'drawing' && currentElementRef.current) {
      const elem = currentElementRef.current;
      currentElementRef.current = null;

      if (elem.type === 'pen' && (!elem.points || elem.points.length < 2)) {
        redrawCanvas();
      } else if (
        elem.type !== 'pen' &&
        Math.abs(elem.width || 0) < 6 &&
        Math.abs(elem.height || 0) < 6
      ) {
        redrawCanvas();
      } else {
        pushHistory([...elements, elem]);
        setSelectedElementId(elem.id);
      }
    }

    dragInteractionRef.current = {
      mode: 'idle',
      activeHandle: null,
      startPoint: { x: 0, y: 0 },
      startScreenPoint: { x: 0, y: 0 },
      initialPan: { x: 0, y: 0 },
      initialSnapshot: null,
      hasMoved: false,
    };

    if (activeTool === 'pan' || isSpacePressed) {
      setCursorStyle('grab');
    }
  };

  // Property setters
  const handleUpdateColor = React.useCallback(
    (newColor: string) => {
      setColor(newColor);
      if (selectedElementId) {
        const updated = elements.map((el) => {
          if (el.id === selectedElementId) {
            const currentFill = el.fillColor ? getDerivedFillColor(newColor, fillMode) : undefined;
            return { ...el, color: newColor, fillColor: currentFill };
          }
          return el;
        });
        pushHistory(updated);
      }
    },
    [elements, fillMode, getDerivedFillColor, pushHistory, selectedElementId]
  );

  const handleUpdateStrokeWidth = React.useCallback(
    (newWidth: StrokeWidthOption) => {
      setStrokeWidth(newWidth);
      if (selectedElementId) {
        const updated = elements.map((el) =>
          el.id === selectedElementId ? { ...el, strokeWidth: newWidth } : el
        );
        pushHistory(updated);
      }
    },
    [elements, pushHistory, selectedElementId]
  );

  const handleUpdateFillMode = React.useCallback(
    (newFillMode: 'none' | 'translucent' | 'solid') => {
      setFillMode(newFillMode);
      if (selectedElementId) {
        const updated = elements.map((el) => {
          if (el.id === selectedElementId) {
            return {
              ...el,
              fillColor: getDerivedFillColor(el.color || color, newFillMode),
            };
          }
          return el;
        });
        pushHistory(updated);
      }
    },
    [color, elements, getDerivedFillColor, pushHistory, selectedElementId]
  );

  // Selected element contextual actions: Delete, Duplicate, Reorder
  const handleDeleteSelected = React.useCallback(() => {
    if (!selectedElementId) return;
    const remaining = elements.filter((el) => el.id !== selectedElementId);
    setSelectedElementId(null);
    pushHistory(remaining);
    toast.info('Object deleted');
  }, [elements, pushHistory, selectedElementId]);

  const handleDuplicateSelected = React.useCallback(() => {
    if (!selectedElement) return;
    const clone: CanvasElement = {
      ...JSON.parse(JSON.stringify(selectedElement)),
      id: Date.now().toString(),
    };
    const translated = translateElement(clone, 20, 20);
    const updated = [...elements, translated];
    pushHistory(updated);
    setSelectedElementId(translated.id);
    toast.success('Object duplicated');
  }, [elements, pushHistory, selectedElement]);

  const handleBringToFront = React.useCallback(() => {
    if (!selectedElementId) return;
    const elem = elements.find((el) => el.id === selectedElementId);
    if (!elem) return;
    const remaining = elements.filter((el) => el.id !== selectedElementId);
    const updated = [...remaining, elem];
    pushHistory(updated);
  }, [elements, pushHistory, selectedElementId]);

  const handleSendToBack = React.useCallback(() => {
    if (!selectedElementId) return;
    const elem = elements.find((el) => el.id === selectedElementId);
    if (!elem) return;
    const remaining = elements.filter((el) => el.id !== selectedElementId);
    const updated = [elem, ...remaining];
    pushHistory(updated);
  }, [elements, pushHistory, selectedElementId]);

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
      setSelectedElementId(textElem.id);
    }
    setEditingTextElement(null);
  };

  // Keyboard shortcut listener for canvas operations
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === ' ') {
        setIsSpacePressed(true);
        setCursorStyle('grab');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        if (selectedElementId) {
          e.preventDefault();
          handleDuplicateSelected();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElement) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          const moved = translateElement(selectedElement, dx, dy);
          const updated = elements.map((el) => (el.id === selectedElement.id ? moved : el));
          pushHistory(updated);
        }
      }
    },
    [
      elements,
      handleDeleteSelected,
      handleDuplicateSelected,
      handleRedo,
      handleResetZoom,
      handleUndo,
      handleZoomIn,
      handleZoomOut,
      pushHistory,
      selectedElement,
      selectedElementId,
    ]
  );

  const handleKeyUp = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') {
      setIsSpacePressed(false);
      setCursorStyle('default');
    }
  }, []);

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
    setColor: handleUpdateColor,
    strokeWidth,
    setStrokeWidth: handleUpdateStrokeWidth,
    fillMode,
    setFillMode: handleUpdateFillMode,
    gridType,
    setGridType,
    zoom,
    pan,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitToScreen,
    handleWheel,
    selectedElementId,
    setSelectedElementId,
    selectedElement,
    cursorStyle,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    editingTextElement,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleKeyUp,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleBringToFront,
    handleSendToBack,
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

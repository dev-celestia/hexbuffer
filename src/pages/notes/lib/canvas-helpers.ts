import type { CanvasElement, Point, CanvasGridType, ResizeHandle, BoundingBox } from '../types';

/**
 * Calculates bounding box of an individual canvas element
 */
export function getElementBounds(elem: CanvasElement): BoundingBox {
  if (elem.points && elem.points.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elem.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  if (elem.type === 'text') {
    const fontSize = elem.fontSize || 14;
    const lines = (elem.text || ' ').split('\n');
    const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
    const approxW = Math.max(20, maxLineLen * fontSize * 0.6);
    const approxH = Math.max(20, lines.length * fontSize * 1.35);

    return {
      minX: elem.x,
      minY: elem.y,
      maxX: elem.x + approxW,
      maxY: elem.y + approxH,
      width: approxW,
      height: approxH,
    };
  }

  const left = Math.min(elem.x, elem.x + (elem.width || 0));
  const right = Math.max(elem.x, elem.x + (elem.width || 0));
  const top = Math.min(elem.y, elem.y + (elem.height || 0));
  const bottom = Math.max(elem.y, elem.y + (elem.height || 0));

  return {
    minX: left,
    minY: top,
    maxX: right,
    maxY: bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

/**
 * Distance from point P to line segment VW
 */
function distToSegment(p: Point, v: Point, w: Point) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

/**
 * Checks whether point (x, y) hits a canvas element
 */
export function hitTestElement(elem: CanvasElement, point: Point, tolerance = 8): boolean {
  if (elem.type === 'pen' && elem.points && elem.points.length > 0) {
    if (elem.points.length === 1) {
      return Math.hypot(point.x - elem.points[0].x, point.y - elem.points[0].y) <= (elem.strokeWidth / 2 + tolerance);
    }
    for (let i = 0; i < elem.points.length - 1; i++) {
      const d = distToSegment(point, elem.points[i], elem.points[i + 1]);
      if (d <= (elem.strokeWidth / 2 + tolerance)) {
        return true;
      }
    }
    return false;
  }

  if (elem.type === 'line' || elem.type === 'arrow') {
    const start: Point = { x: elem.x, y: elem.y };
    const end: Point = { x: elem.x + (elem.width || 0), y: elem.y + (elem.height || 0) };
    const d = distToSegment(point, start, end);
    return d <= (elem.strokeWidth / 2 + tolerance);
  }

  const bounds = getElementBounds(elem);

  if (elem.type === 'ellipse') {
    const midX = bounds.minX + bounds.width / 2;
    const midY = bounds.minY + bounds.height / 2;
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;
    if (rx === 0 || ry === 0) return false;
    const normalizedDist = ((point.x - midX) ** 2) / (rx ** 2) + ((point.y - midY) ** 2) / (ry ** 2);
    // Hit inside or on border
    return normalizedDist <= 1.15;
  }

  if (elem.type === 'diamond') {
    const midX = bounds.minX + bounds.width / 2;
    const midY = bounds.minY + bounds.height / 2;
    const halfW = bounds.width / 2;
    const halfH = bounds.height / 2;
    if (halfW === 0 || halfH === 0) return false;
    const norm = Math.abs(point.x - midX) / halfW + Math.abs(point.y - midY) / halfH;
    return norm <= 1.15;
  }

  // Rectangle, text, and other elements
  return (
    point.x >= bounds.minX - tolerance &&
    point.x <= bounds.maxX + tolerance &&
    point.y >= bounds.minY - tolerance &&
    point.y <= bounds.maxY + tolerance
  );
}

/**
 * Returns interactive handles for a selected element
 */
export function getResizeHandles(elem: CanvasElement): Array<{ type: ResizeHandle; x: number; y: number }> {
  if (elem.type === 'line' || elem.type === 'arrow') {
    return [
      { type: 'start', x: elem.x, y: elem.y },
      { type: 'end', x: elem.x + (elem.width || 0), y: elem.y + (elem.height || 0) },
    ];
  }

  const b = getElementBounds(elem);
  const midX = b.minX + b.width / 2;
  const midY = b.minY + b.height / 2;

  return [
    { type: 'nw', x: b.minX, y: b.minY },
    { type: 'n', x: midX, y: b.minY },
    { type: 'ne', x: b.maxX, y: b.minY },
    { type: 'e', x: b.maxX, y: midY },
    { type: 'se', x: b.maxX, y: b.maxY },
    { type: 's', x: midX, y: b.maxY },
    { type: 'sw', x: b.minX, y: b.maxY },
    { type: 'w', x: b.minX, y: midY },
  ];
}

/**
 * Hit test resize handles
 */
export function hitTestResizeHandle(elem: CanvasElement, point: Point, radius = 7): ResizeHandle | null {
  const handles = getResizeHandles(elem);
  for (const h of handles) {
    if (Math.hypot(point.x - h.x, point.y - h.y) <= radius) {
      return h.type;
    }
  }
  return null;
}

/**
 * Draws selection bounding box and resize handles around a selected element
 */
export function drawSelectionOutline(
  ctx: CanvasRenderingContext2D,
  elem: CanvasElement,
  isDarkTheme: boolean
) {
  ctx.save();
  const accentColor = '#3b82f6';
  const handleBg = isDarkTheme ? '#1e293b' : '#ffffff';
  const handleRadius = 4.5;

  if (elem.type === 'line' || elem.type === 'arrow') {
    const startX = elem.x;
    const startY = elem.y;
    const endX = elem.x + (elem.width || 0);
    const endY = elem.y + (elem.height || 0);

    // Subtle connecting line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Start & End nodes
    [
      { x: startX, y: startY },
      { x: endX, y: endY },
    ].forEach((pt) => {
      ctx.setLineDash([]);
      ctx.fillStyle = handleBg;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
    return;
  }

  const b = getElementBounds(elem);
  const pad = 4;
  const minX = b.minX - pad;
  const minY = b.minY - pad;
  const width = b.width + pad * 2;
  const height = b.height + pad * 2;

  // Dashed selection rectangle
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(minX, minY, width, height);

  // Resize handle squares
  const handles = getResizeHandles(elem);
  ctx.setLineDash([]);

  handles.forEach((h) => {
    ctx.fillStyle = handleBg;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(h.x - handleRadius, h.y - handleRadius, handleRadius * 2, handleRadius * 2);
    ctx.strokeRect(h.x - handleRadius, h.y - handleRadius, handleRadius * 2, handleRadius * 2);
  });

  ctx.restore();
}

/**
 * Translates an element by dx and dy
 */
export function translateElement(elem: CanvasElement, dx: number, dy: number): CanvasElement {
  if (elem.points && elem.points.length > 0) {
    return {
      ...elem,
      x: elem.x + dx,
      y: elem.y + dy,
      points: elem.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    };
  }

  return {
    ...elem,
    x: elem.x + dx,
    y: elem.y + dy,
  };
}

/**
 * Scales an element based on active resize handle and pointer movement
 */
export function scaleElement(
  initialElem: CanvasElement,
  handle: ResizeHandle,
  currentPoint: Point,
  _startPoint: Point
): CanvasElement {
  // Handle Line and Arrow resizing
  if (initialElem.type === 'line' || initialElem.type === 'arrow') {
    if (handle === 'start') {
      const origEndX = initialElem.x + (initialElem.width || 0);
      const origEndY = initialElem.y + (initialElem.height || 0);
      return {
        ...initialElem,
        x: currentPoint.x,
        y: currentPoint.y,
        width: origEndX - currentPoint.x,
        height: origEndY - currentPoint.y,
      };
    } else if (handle === 'end') {
      return {
        ...initialElem,
        width: currentPoint.x - initialElem.x,
        height: currentPoint.y - initialElem.y,
      };
    }
  }

  const initialBounds = getElementBounds(initialElem);
  let newMinX = initialBounds.minX;
  let newMinY = initialBounds.minY;
  let newMaxX = initialBounds.maxX;
  let newMaxY = initialBounds.maxY;

  switch (handle) {
    case 'nw':
      newMinX = currentPoint.x;
      newMinY = currentPoint.y;
      break;
    case 'n':
      newMinY = currentPoint.y;
      break;
    case 'ne':
      newMaxX = currentPoint.x;
      newMinY = currentPoint.y;
      break;
    case 'e':
      newMaxX = currentPoint.x;
      break;
    case 'se':
      newMaxX = currentPoint.x;
      newMaxY = currentPoint.y;
      break;
    case 's':
      newMaxY = currentPoint.y;
      break;
    case 'sw':
      newMinX = currentPoint.x;
      newMaxY = currentPoint.y;
      break;
    case 'w':
      newMinX = currentPoint.x;
      break;
    default:
      break;
  }

  // Normalize bounds if flipped
  const normalizedLeft = Math.min(newMinX, newMaxX);
  const normalizedRight = Math.max(newMinX, newMaxX);
  const normalizedTop = Math.min(newMinY, newMaxY);
  const normalizedBottom = Math.max(newMinY, newMaxY);

  const newW = Math.max(10, normalizedRight - normalizedLeft);
  const newH = Math.max(10, normalizedBottom - normalizedTop);

  // Pen freehand stroke scaling
  if (initialElem.type === 'pen' && initialElem.points && initialElem.points.length > 0) {
    const origW = Math.max(1, initialBounds.width);
    const origH = Math.max(1, initialBounds.height);
    const scaleX = newW / origW;
    const scaleY = newH / origH;

    const scaledPoints = initialElem.points.map((p) => ({
      x: normalizedLeft + (p.x - initialBounds.minX) * scaleX,
      y: normalizedTop + (p.y - initialBounds.minY) * scaleY,
    }));

    return {
      ...initialElem,
      x: normalizedLeft,
      y: normalizedTop,
      points: scaledPoints,
    };
  }

  // Text scaling: scale font size proportionally
  if (initialElem.type === 'text') {
    const origH = Math.max(1, initialBounds.height);
    const scaleRatio = newH / origH;
    const currentFontSize = initialElem.fontSize || 14;
    const newFontSize = Math.max(9, Math.min(72, Math.round(currentFontSize * scaleRatio)));

    return {
      ...initialElem,
      x: normalizedLeft,
      y: normalizedTop,
      fontSize: newFontSize,
    };
  }

  // Standard geometric shapes (rectangle, ellipse, diamond)
  return {
    ...initialElem,
    x: normalizedLeft,
    y: normalizedTop,
    width: newW,
    height: newH,
  };
}

/**
 * Draws an arrow from (fromX, fromY) to (toX, toY) with a sharp arrowhead
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  strokeWidth: number
) {
  const headlen = Math.max(12, strokeWidth * 3.5);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Main line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead polygon
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 6),
    toY - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headlen * Math.cos(angle + Math.PI / 6),
    toY - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a diamond shape at (x, y) with bounding width & height
 */
export function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string,
  fillColor?: string,
  strokeWidth: number = 2
) {
  const midX = x + width / 2;
  const midY = y + height / 2;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(midX, y);
  ctx.lineTo(x + width, midY);
  ctx.lineTo(midX, y + height);
  ctx.lineTo(x, midY);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a rounded rectangle for processes and steps
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string,
  fillColor?: string,
  strokeWidth: number = 2,
  radius: number = 8
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';

  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  const minX = Math.min(x, x + width);
  const minY = Math.min(y, y + height);
  const absW = Math.abs(width);
  const absH = Math.abs(height);

  ctx.beginPath();
  ctx.moveTo(minX + r, minY);
  ctx.lineTo(minX + absW - r, minY);
  ctx.quadraticCurveTo(minX + absW, minY, minX + absW, minY + r);
  ctx.lineTo(minX + absW, minY + absH - r);
  ctx.quadraticCurveTo(minX + absW, minY + absH, minX + absW - r, minY + absH);
  ctx.lineTo(minX + r, minY + absH);
  ctx.quadraticCurveTo(minX, minY + absH, minX, minY + absH - r);
  ctx.lineTo(minX, minY + r);
  ctx.quadraticCurveTo(minX, minY, minX + r, minY);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws an ellipse for start/end terminals
 */
export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string,
  fillColor?: string,
  strokeWidth: number = 2
) {
  const midX = x + width / 2;
  const midY = y + height / 2;
  const radiusX = Math.abs(width) / 2;
  const radiusY = Math.abs(height) / 2;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  ctx.beginPath();
  ctx.ellipse(midX, midY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, 2 * Math.PI);

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Smooth quadratic curve drawing for pen strokes
 */
export function drawSmoothPen(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  strokeWidth: number
) {
  if (points.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  if (points.length > 1) {
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draws background grid (dots or lines)
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridType: CanvasGridType,
  isDarkTheme: boolean,
  pan: Point = { x: 0, y: 0 },
  zoom = 1
) {
  if (gridType === 'none') return;

  ctx.save();
  const step = 24;
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  // Calculate world coordinate bounds for the visible viewport
  const startX = Math.floor((-pan.x / zoom) / step) * step - step;
  const endX = Math.ceil(((width - pan.x) / zoom) / step) * step + step;
  const startY = Math.floor((-pan.y / zoom) / step) * step - step;
  const endY = Math.ceil(((height - pan.y) / zoom) / step) * step + step;

  if (gridType === 'dots') {
    ctx.fillStyle = gridColor;
    for (let x = startX; x <= endX; x += step) {
      for (let y = startY; y <= endY; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2 / Math.min(1.5, Math.max(0.7, zoom)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'lines') {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1 / Math.max(0.5, zoom);
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x + 0.5, startY);
      ctx.lineTo(x + 0.5, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(startX, y + 0.5);
      ctx.lineTo(endX, y + 0.5);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders a single canvas element
 */
export function renderCanvasElement(
  ctx: CanvasRenderingContext2D,
  elem: CanvasElement
) {
  switch (elem.type) {
    case 'pen':
      if (elem.points && elem.points.length > 0) {
        drawSmoothPen(ctx, elem.points, elem.color, elem.strokeWidth);
      }
      break;

    case 'line':
      ctx.save();
      ctx.strokeStyle = elem.color;
      ctx.lineWidth = elem.strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(elem.x, elem.y);
      ctx.lineTo(elem.x + (elem.width || 0), elem.y + (elem.height || 0));
      ctx.stroke();
      ctx.restore();
      break;

    case 'arrow':
      drawArrow(
        ctx,
        elem.x,
        elem.y,
        elem.x + (elem.width || 0),
        elem.y + (elem.height || 0),
        elem.color,
        elem.strokeWidth
      );
      break;

    case 'rectangle':
      drawRoundedRect(
        ctx,
        elem.x,
        elem.y,
        elem.width || 0,
        elem.height || 0,
        elem.color,
        elem.fillColor,
        elem.strokeWidth
      );
      if (elem.text) {
        drawCenteredText(ctx, elem);
      }
      break;

    case 'diamond':
      drawDiamond(
        ctx,
        elem.x,
        elem.y,
        elem.width || 0,
        elem.height || 0,
        elem.color,
        elem.fillColor,
        elem.strokeWidth
      );
      if (elem.text) {
        drawCenteredText(ctx, elem);
      }
      break;

    case 'ellipse':
      drawEllipse(
        ctx,
        elem.x,
        elem.y,
        elem.width || 0,
        elem.height || 0,
        elem.color,
        elem.fillColor,
        elem.strokeWidth
      );
      if (elem.text) {
        drawCenteredText(ctx, elem);
      }
      break;

    case 'text':
      if (elem.text) {
        ctx.save();
        ctx.fillStyle = elem.color;
        ctx.font = `${elem.fontSize || 14}px system-ui, -apple-system, sans-serif`;
        ctx.textBaseline = 'top';

        const lines = elem.text.split('\n');
        const lineHeight = (elem.fontSize || 14) * 1.35;
        lines.forEach((line, i) => {
          ctx.fillText(line, elem.x, elem.y + i * lineHeight);
        });
        ctx.restore();
      }
      break;

    default:
      break;
  }
}

/**
 * Centers text inside a geometric shape (rectangle, diamond, ellipse)
 */
function drawCenteredText(ctx: CanvasRenderingContext2D, elem: CanvasElement) {
  if (!elem.text) return;
  ctx.save();
  ctx.fillStyle = elem.color;
  ctx.font = `600 ${elem.fontSize || 13}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const midX = elem.x + (elem.width || 0) / 2;
  const midY = elem.y + (elem.height || 0) / 2;

  const lines = elem.text.split('\n');
  const lineHeight = (elem.fontSize || 13) * 1.35;
  const totalH = (lines.length - 1) * lineHeight;
  const startY = midY - totalH / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, midX, startY + i * lineHeight);
  });
  ctx.restore();
}

/**
 * Calculates bounding box of all canvas elements with padding
 */
export function getElementsBoundingBox(elements: CanvasElement[], padding = 40) {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    if (el.points && el.points.length > 0) {
      el.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    } else {
      const left = Math.min(el.x, el.x + (el.width || 0));
      const right = Math.max(el.x, el.x + (el.width || 0));
      const top = Math.min(el.y, el.y + (el.height || 0));
      const bottom = Math.max(el.y, el.y + (el.height || 0));

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }
  });

  const bMinX = Math.max(0, minX - padding);
  const bMinY = Math.max(0, minY - padding);
  const bMaxX = maxX + padding;
  const bMaxY = maxY + padding;

  return {
    minX: bMinX,
    minY: bMinY,
    maxX: bMaxX,
    maxY: bMaxY,
    width: Math.max(200, bMaxX - bMinX),
    height: Math.max(150, bMaxY - bMinY),
  };
}

/**
 * Exports elements to high-resolution PNG Data URL
 */
export function exportCanvasToDataUrl(
  elements: CanvasElement[],
  isDarkTheme: boolean,
  includeBackground = true
): string {
  const bbox = getElementsBoundingBox(elements, 32);
  const scale = 2; // 2x Retina resolution

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bbox.width * scale);
  canvas.height = Math.round(bbox.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Background
  if (includeBackground) {
    ctx.fillStyle = isDarkTheme ? '#18181b' : '#ffffff';
    ctx.fillRect(0, 0, bbox.width, bbox.height);
  }

  ctx.translate(-bbox.minX, -bbox.minY);

  elements.forEach((el) => {
    renderCanvasElement(ctx, el);
  });

  return canvas.toDataURL('image/png', 0.95);
}

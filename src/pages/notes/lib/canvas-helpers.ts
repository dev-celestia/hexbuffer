import type { CanvasElement, Point, CanvasGridType } from '../types';

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
  isDarkTheme: boolean
) {
  if (gridType === 'none') return;

  ctx.save();
  const step = 24;
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  if (gridType === 'dots') {
    ctx.fillStyle = gridColor;
    for (let x = step; x < width; x += step) {
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'lines') {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
    }
    for (let y = 0; y < height; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
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

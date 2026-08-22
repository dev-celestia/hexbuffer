import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useNavStore } from "@/stores/nav";
import type { ResizeDirection } from "../components/window-resize-handle";

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

interface UseWindowResizeProps {
  id: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  windowRef: React.RefObject<HTMLDivElement | null>;
}

export function useWindowResize({
  id,
  size,
  position,
  windowRef,
}: UseWindowResizeProps) {
  const navigate = useNavigate();
  const focusWindow = useNavStore((s) => s.focusWindow);
  const updateWindowSize = useNavStore((s) => s.updateWindowSize);
  const updateWindowPosition = useNavStore((s) => s.updateWindowPosition);

  const [isResizing, setIsResizing] = React.useState(false);
  const resizeStartRef = React.useRef({
    mouseX: 0,
    mouseY: 0,
    startW: 0,
    startH: 0,
    startX: 0,
    startY: 0,
    direction: "se" as ResizeDirection,
  });
  const resizeContainerRectRef = React.useRef<DOMRect | null>(null);
  const resizeCurrentRef = React.useRef({ size, position });
  const resizeRafIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    resizeCurrentRef.current = { size, position };
  }, [size, position]);

  const handleResizeMouseDown = React.useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      resizeContainerRectRef.current =
        windowRef.current?.parentElement?.getBoundingClientRect() ?? null;

      setIsResizing(true);
      resizeStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startW: size.width,
        startH: size.height,
        startX: position.x,
        startY: position.y,
        direction,
      };
      resizeCurrentRef.current = { size, position };
      focusWindow(id, navigate);
    },
    [id, size, position, focusWindow, navigate, windowRef]
  );

  React.useEffect(() => {
    if (!isResizing) return;

    document.body.classList.add("select-none-global");

    const handleMouseMove = (e: MouseEvent) => {
      const { mouseX, mouseY, startW, startH, startX, startY, direction } =
        resizeStartRef.current;
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;

      const raw = resizeContainerRectRef.current;
      const containerW = raw ? raw.width : window.innerWidth;
      const containerH = raw ? raw.height : window.innerHeight;

      let newWidth = startW;
      let newHeight = startH;
      let newX = startX;
      let newY = startY;

      // Horizontal resizing
      if (direction.includes("e")) {
        newWidth = Math.max(MIN_WIDTH, startW + dx);
        newWidth = Math.min(newWidth, Math.max(MIN_WIDTH, containerW - startX));
      } else if (direction.includes("w")) {
        newWidth = Math.max(MIN_WIDTH, startW - dx);
        newX = startX + (startW - newWidth);
        if (newX < 0) {
          newWidth = Math.max(MIN_WIDTH, newWidth + newX);
          newX = 0;
        }
      }

      // Vertical resizing
      if (direction.includes("s")) {
        newHeight = Math.max(MIN_HEIGHT, startH + dy);
        newHeight = Math.min(
          newHeight,
          Math.max(MIN_HEIGHT, containerH - startY)
        );
      } else if (direction.includes("n")) {
        newHeight = Math.max(MIN_HEIGHT, startH - dy);
        newY = startY + (startH - newHeight);
        if (newY < 0) {
          newHeight = Math.max(MIN_HEIGHT, newHeight + newY);
          newY = 0;
        }
      }

      resizeCurrentRef.current = {
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY },
      };

      if (resizeRafIdRef.current) cancelAnimationFrame(resizeRafIdRef.current);
      resizeRafIdRef.current = requestAnimationFrame(() => {
        if (windowRef.current) {
          windowRef.current.style.width = `${newWidth}px`;
          windowRef.current.style.height = `${newHeight}px`;
          windowRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      const { size: finalSize, position: finalPos } = resizeCurrentRef.current;
      updateWindowSize(id, finalSize);
      updateWindowPosition(id, finalPos);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.classList.remove("select-none-global");
      if (resizeRafIdRef.current) cancelAnimationFrame(resizeRafIdRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, id, updateWindowPosition, updateWindowSize, windowRef]);

  return { isResizing, handleResizeMouseDown };
}

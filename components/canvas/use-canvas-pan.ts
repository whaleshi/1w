"use client";

import { useRef, useState, type PointerEvent, type RefObject } from "react";

// Keep per-frame movement outside React; only the cursor needs a render.
export function useCanvasPan(viewport: RefObject<HTMLDivElement | null>) {
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0 || !viewport.current) return;
    suppressClick.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.current.scrollLeft,
      top: viewport.current.scrollTop,
      moved: false,
    };
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId || !viewport.current)
      return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    if (!start.moved) {
      start.moved = true;
      suppressClick.current = true;
      setDragging(true);
    }
    viewport.current.scrollTo({
      left: start.left - dx,
      top: start.top - dy,
      behavior: "instant",
    });
  }

  function finish(event: PointerEvent<HTMLCanvasElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    if (event.type === "pointercancel") suppressClick.current = true;
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function consumeDragClick() {
    const suppressed = suppressClick.current;
    suppressClick.current = false;
    return suppressed;
  }

  return {
    dragging,
    consumeDragClick,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}

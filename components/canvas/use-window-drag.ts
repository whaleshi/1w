"use client";

import { useLayoutEffect, useRef, type PointerEvent } from "react";

const EDGE = 6;
const TASKBAR_HEIGHT = 37;

export function useWindowDrag(maximized: boolean, minimized: boolean) {
  const windowRef = useRef<HTMLElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const applied = useRef({ x: 0, y: 0 });
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);

  function place(x: number, y: number) {
    const element = windowRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const baseX = bounds.left - applied.current.x;
    const baseY = bounds.top - applied.current.y;
    const maxX = Math.max(EDGE, window.innerWidth - EDGE - bounds.width);
    const maxY = Math.max(
      EDGE,
      window.innerHeight - TASKBAR_HEIGHT - EDGE - bounds.height,
    );
    const next = {
      x: Math.min(maxX, Math.max(EDGE, baseX + x)) - baseX,
      y: Math.min(maxY, Math.max(EDGE, baseY + y)) - baseY,
    };
    element.style.transform = `translate(${next.x}px, ${next.y}px)`;
    offset.current = next;
    applied.current = next;
  }

  useLayoutEffect(() => {
    const element = windowRef.current;
    if (!element) return;
    // A restored DOM node starts with no transform; keep its previous position.
    if (!element.style.transform) applied.current = { x: 0, y: 0 };
    const fit = () => {
      gesture.current = null;
      delete element.dataset.dragging;
      if (maximized || window.matchMedia("(max-width: 640px)").matches) {
        element.style.transform = "";
        applied.current = { x: 0, y: 0 };
      } else {
        place(offset.current.x, offset.current.y);
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      gesture.current = null;
    };
  }, [maximized, minimized]);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (
      maximized ||
      !event.isPrimary ||
      event.button !== 0 ||
      window.matchMedia("(max-width: 640px)").matches ||
      (event.target as HTMLElement).closest("button")
    )
      return;
    event.preventDefault();
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: offset.current.x,
      originY: offset.current.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (windowRef.current) windowRef.current.dataset.dragging = "true";
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    place(
      start.originX + event.clientX - start.x,
      start.originY + event.clientY - start.y,
    );
  }

  function finish(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    if (windowRef.current) delete windowRef.current.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    windowRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}

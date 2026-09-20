"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";

export function useCanvasPan(
  viewport: RefObject<HTMLDivElement | null>,
  zoom: number,
  onZoom: (value: number) => void,
  minimumZoom: number,
) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const pinch = useRef<{
    distance: number;
    zoom: number;
    worldX: number;
    worldY: number;
  } | null>(null);
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  const pinchZoom = useRef(false);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const target = pendingScroll.current;
    if (target && viewport.current) {
      viewport.current.scrollTo({ ...target, behavior: "instant" });
      pendingScroll.current = null;
    }
  }, [zoom, viewport]);

  function startGesture() {
    const el = viewport.current;
    if (!el) return;
    const [a, b] = [...pointers.current.values()];
    if (a && b) {
      const rect = el.getBoundingClientRect();
      pinch.current = {
        distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
        zoom,
        worldX:
          (el.scrollLeft + (a.x + b.x) / 2 - rect.left - el.clientLeft) / zoom,
        worldY:
          (el.scrollTop + (a.y + b.y) / 2 - rect.top - el.clientTop) / zoom,
      };
      gesture.current = null;
      suppressClick.current = true;
      setDragging(true);
    } else if (a) {
      pinch.current = null;
      gesture.current = {
        x: a.x,
        y: a.y,
        left: el.scrollLeft,
        top: el.scrollTop,
        moved: suppressClick.current,
      };
    } else {
      pinch.current = null;
      gesture.current = null;
      setDragging(false);
    }
  }
  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (
      (event.pointerType !== "touch" &&
        (!event.isPrimary || event.button !== 0)) ||
      !viewport.current
    )
      return;
    if (!pointers.current.size) suppressClick.current = false;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    startGesture();
  }
  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const el = viewport.current;
    if (!pointers.current.has(event.pointerId) || !el) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const [a, b] = [...pointers.current.values()];
    const start = pinch.current;
    if (start && a && b) {
      const next = Math.max(
        minimumZoom,
        Math.min(
          48,
          Math.round(
            ((start.zoom * Math.hypot(b.x - a.x, b.y - a.y)) / start.distance) *
              100,
          ) / 100,
        ),
      );
      const rect = el.getBoundingClientRect();
      const target = {
        left:
          start.worldX * next - ((a.x + b.x) / 2 - rect.left - el.clientLeft),
        top: start.worldY * next - ((a.y + b.y) / 2 - rect.top - el.clientTop),
      };
      if (next === zoom) el.scrollTo({ ...target, behavior: "instant" });
      else {
        pendingScroll.current = target;
        pinchZoom.current = true;
        onZoom(next);
      }
      return;
    }
    const pan = gesture.current;
    if (!pan) return;
    const dx = event.clientX - pan.x,
      dy = event.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) < 5) return;
    pan.moved = true;
    suppressClick.current = true;
    setDragging(true);
    el.scrollTo({
      left: pan.left - dx,
      top: pan.top - dy,
      behavior: "instant",
    });
  }
  function finish(event: PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.delete(event.pointerId)) return;
    if (event.type === "pointercancel" || event.type === "lostpointercapture")
      suppressClick.current = true;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    startGesture();
  }
  const consumePinchZoom = useCallback(() => {
    const value = pinchZoom.current;
    pinchZoom.current = false;
    return value;
  }, []);
  return {
    dragging,
    consumeDragClick: () => suppressClick.current,
    consumePinchZoom,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}

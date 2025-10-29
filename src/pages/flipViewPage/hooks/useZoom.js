import { useState, useEffect, useCallback, useRef } from 'react';
import { ZOOM_LEVELS } from '../constants/flipbookConstants';

/**
 * Custom hook for managing zoom functionality
 * Handles zoom state, pan offset, and mouse/touch interactions
 */
export const useZoom = () => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Pointer state for pinch and pan
  const activePointersRef = useRef(new Map()); // pointerId -> { x, y }
  const pinchStartDistanceRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const pinchStartPanRef = useRef({ x: 0, y: 0 });
  const pinchCenterRef = useRef({ x: 0, y: 0 });

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!isZoomed) {
      setIsZoomed(true);
      setZoomLevel(1.5);
    } else if (zoomLevel < 3) {
      setZoomLevel(prev => Math.min(prev + 0.5, 3));
    }
  }, [isZoomed, zoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (zoomLevel > 1.5) {
      setZoomLevel(prev => Math.max(prev - 0.5, 1.5));
      // Auto-center while zooming out within zoomed mode
      setPanOffset({ x: 0, y: 0 });
    } else {
      setZoomLevel(1);
      setIsZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [zoomLevel]);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setIsZoomed(false);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  // Mouse interaction handlers
  const handleMouseDown = useCallback((e, isDrawing, isCommentOpen, isEraser) => {
    if (isEraser) return; // allow eraser clicks to reach canvas
    if (isZoomed && !isDrawing && !isCommentOpen) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      e.preventDefault();
    }
  }, [isZoomed, panOffset]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && isZoomed) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      e.preventDefault();
    }
  }, [isDragging, isZoomed, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    if (!isZoomed) return;
    e.preventDefault();
    const delta = e.deltaY;
    delta < 0 ? handleZoomIn() : handleZoomOut();
  }, [isZoomed, handleZoomIn, handleZoomOut]);

  // --------------------
  // Pointer interactions (pinch to zoom + pan)
  // --------------------
  const clampZoom = useCallback((z) => {
    const min = ZOOM_LEVELS?.MIN ?? 1;
    const max = ZOOM_LEVELS?.MAX ?? 3;
    return Math.min(Math.max(z, min), max);
  }, []);

  const getDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const getCenter = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const handlePointerDown = useCallback((e, isDrawing, isCommentOpen, isEraser) => {
    if (isDrawing || isCommentOpen || isEraser) return;
    // Enable panning when zoomed
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
    try { e.currentTarget?.setPointerCapture?.(e.pointerId); } catch (_) {}
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const [p1, p2] = Array.from(activePointersRef.current.values());
      pinchStartDistanceRef.current = getDistance(p1, p2);
      pinchStartZoomRef.current = zoomLevel;
      pinchStartPanRef.current = panOffset;
      pinchCenterRef.current = getCenter(p1, p2);
      if (!isZoomed) {
        setIsZoomed(true);
      }
      // Two-finger gesture: prevent default to stop page scroll/zoom
      e.preventDefault();
      return;
    }
    // Single pointer: only prevent default if already zoomed to allow panning; otherwise allow clicks
    if (isZoomed) {
      e.preventDefault();
    }
  }, [isZoomed, panOffset, zoomLevel]);

  // rAF throttling for pointer-driven updates
  const rafIdRef = useRef(null);
  const pendingPanRef = useRef(null);
  const pendingZoomRef = useRef(null);
  const pendingIsZoomedRef = useRef(null);

  const flushRafUpdate = useCallback(() => {
    rafIdRef.current = null;
    if (pendingZoomRef.current != null) {
      setZoomLevel(pendingZoomRef.current);
      pendingZoomRef.current = null;
    }
    if (pendingIsZoomedRef.current != null) {
      setIsZoomed(pendingIsZoomedRef.current);
      pendingIsZoomedRef.current = null;
    }
    if (pendingPanRef.current != null) {
      setPanOffset(pendingPanRef.current);
      pendingPanRef.current = null;
    }
  }, []);

  const scheduleRaf = useCallback(() => {
    if (rafIdRef.current == null) {
      rafIdRef.current = window.requestAnimationFrame(flushRafUpdate);
    }
  }, [flushRafUpdate]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handlePointerMove = useCallback((e) => {
    const pointers = activePointersRef.current;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      // Pinch to zoom (keep content centered to avoid jumping)
      const [p1, p2] = Array.from(pointers.values());
      const currentDistance = getDistance(p1, p2);
      const scale = currentDistance / (pinchStartDistanceRef.current || 1);
      const nextZoom = clampZoom((pinchStartZoomRef.current || 1) * scale);

      pendingIsZoomedRef.current = nextZoom > 1;
      pendingZoomRef.current = nextZoom;

      // Keep pan steady while pinching to prevent initial corner jump
      const defaultZoom = ZOOM_LEVELS?.DEFAULT ?? 1.5;
      pendingPanRef.current = nextZoom <= defaultZoom ? { x: 0, y: 0 } : pinchStartPanRef.current;
      scheduleRaf();
      e.preventDefault();
      return;
    }

    // One pointer: pan when dragging and zoomed
    if (isDragging && isZoomed) {
      pendingPanRef.current = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      scheduleRaf();
      e.preventDefault();
    }
  }, [clampZoom, isDragging, isZoomed, dragStart, scheduleRaf]);

  const handlePointerUp = useCallback((e) => {
    activePointersRef.current.delete(e.pointerId);
    try { e.currentTarget?.releasePointerCapture?.(e.pointerId); } catch (_) {}
    if (activePointersRef.current.size < 2) {
      // reset pinch refs
      pinchStartDistanceRef.current = 0;
      pinchCenterRef.current = { x: 0, y: 0 };
    }
    setIsDragging(false);
  }, []);

  // Touch interaction handlers
  const handleTouchStart = useCallback((e, isDrawing) => {
    if (isDrawing) return; // skip if drawing
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - panOffset.x,
      y: touch.clientY - panOffset.y
    });
    setIsDragging(true);
  }, [panOffset]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault(); // prevent scroll while swiping
  }, [isDragging]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    // Only handle horizontal swipes for page turning
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      // This will be handled by the parent component
      return { deltaX };
    }

    setIsDragging(false);
    return null;
  }, [isDragging, dragStart]);

  // Event listeners setup
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Prevent scroll on touch devices
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  return {
    isZoomed,
    zoomLevel,
    isDragging,
    panOffset,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

import { useState, useEffect, useCallback } from 'react';

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
  const handleMouseDown = useCallback((e, isDrawing, isCommentOpen) => {
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

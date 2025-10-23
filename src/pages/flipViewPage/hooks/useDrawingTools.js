import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing drawing tools and interactions
 * Handles drawing states, tool activation, and brush settings
 */
export const useDrawingTools = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFreehand, setIsFreehand] = useState(false);
  const [freehandWithComment, setFreehandWithComment] = useState(true);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#fffb00");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const brushSizes = [2, 4, 8, 12, 20];
  const isInteractionActive = isDrawing || isCommentOpen;

  // Activate specific drawing tool
  const activateTool = useCallback(({ drawing = false, freehand = false, freehandWithComment = false, eraser = false } = {}) => {
    if (eraser) {
      const next = !isEraser; // toggle eraser
      setIsEraser(next);

      if (next) {
        // disable drawing states
        setIsDrawing(false);
        setIsFreehand(false);
        setFreehandWithComment(false);
        setIsCommentOpen(false);
      }
    } else {
      // eraser off, so turn off eraser state
      setIsEraser(false);

      // update drawing states
      setIsDrawing(!!drawing);
      setIsFreehand(!!freehand);
      setFreehandWithComment(!!freehandWithComment);

      if (!!drawing || !!freehand || !!freehandWithComment) {
        setIsCommentOpen(false);
      }
    }
  }, [isEraser]);

  // Toggle eraser mode
  const toggleEraser = useCallback(() => {
    const next = !isEraser;
    setIsEraser(next);
    if (next) {
      // disable drawing when erasing
      setIsDrawing(false);
      setIsFreehand(false);
    }
  }, [isEraser]);

  // Set brush size
  const setBrushSizeValue = useCallback((size) => {
    setBrushSize(size);
  }, []);

  // Set highlight color
  const setHighlightColorValue = useCallback((color) => {
    setHighlightColor(color);
  }, []);

  return {
    // States
    isDrawing,
    isFreehand,
    freehandWithComment,
    isCommentOpen,
    highlightColor,
    brushSize,
    isEraser,
    brushSizes,
    isInteractionActive,
    
    // Actions
    activateTool,
    toggleEraser,
    setBrushSize: setBrushSizeValue,
    setHighlightColor: setHighlightColorValue,
    setIsDrawing,
    setIsCommentOpen
  };
};

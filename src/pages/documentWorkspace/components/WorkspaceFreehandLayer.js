import React, { useCallback, useRef, useState } from 'react';
import styles from '../documentWorkspace.module.css';

/**
 * WorkspaceFreehandLayer
 * ----------------------
 * Provides a freehand drawing surface that covers the entire workspace pane.
 * Drawing is only enabled when the global Freehand tool is active; otherwise
 * the layer is transparent and ignores pointer events so existing workspace
 * items remain interactive.
 */
const VIEWBOX_SIZE = 1000;
const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const distanceSqPointToSegment = (point, a, b) => {
  if (!point || !a || !b) return Number.POSITIVE_INFINITY;
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const dx = bx - ax;
  const dy = by - ay;
  const segmentLengthSq = dx * dx + dy * dy;
  if (segmentLengthSq === 0) {
    const diffX = point.x - ax;
    const diffY = point.y - ay;
    return diffX * diffX + diffY * diffY;
  }
  const t = clampValue(((point.x - ax) * dx + (point.y - ay) * dy) / segmentLengthSq, 0, 1);
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const diffX = point.x - projX;
  const diffY = point.y - projY;
  return diffX * diffX + diffY * diffY;
};

const getStrokeThresholdSq = (stroke) => {
  const width = Math.max(stroke?.strokeWidth || 8, 4);
  const normalizedWidth = width / VIEWBOX_SIZE;
  const threshold = Math.max(normalizedWidth * 1.5, 0.01);
  return threshold * threshold;
};

const doesStrokeHitPoint = (stroke, point) => {
  if (!stroke?.points || stroke.points.length < 2) return false;
  const thresholdSq = getStrokeThresholdSq(stroke);
  for (let i = 1; i < stroke.points.length; i += 1) {
    const prevPoint = stroke.points[i - 1];
    const currentPoint = stroke.points[i];
    const distSq = distanceSqPointToSegment(point, prevPoint, currentPoint);
    if (distSq <= thresholdSq) {
      return true;
    }
  }
  return false;
};

const WorkspaceFreehandLayer = ({
  activeTool,
  activeColor,
  activeBrushSize,
  activeBrushOpacity,
  freehandMode = 'freehand',
  isPressureEnabled = true,
  eraserToolId = 'workspaceEraser',
}) => {
  const containerRef = useRef(null);
  const [drawingState, setDrawingState] = useState(null);
  const [strokes, setStrokes] = useState([]);

  const getNormalizedPoint = useCallback((event, element) => {
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return { x, y };
  }, []);

  const clamp = useCallback((value, min, max) => Math.min(Math.max(value, min), max), []);

  const getPointerPressure = useCallback(
    (event) => {
      if (!isPressureEnabled) return 1;
      if (!event || typeof event.pressure !== 'number') return 1;
      const raw = event.pressure > 0 ? event.pressure : 1;
      return clamp(raw, 0.25, 1.35);
    },
    [clamp, isPressureEnabled],
  );

  const eraseStrokesNearPoint = useCallback((point) => {
    if (!point) return;
    setStrokes((prev) => prev.filter((stroke) => !doesStrokeHitPoint(stroke, point)));
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      const isFreehand = activeTool === 'freehand';
      const isEraser = activeTool === eraserToolId;
      if (!isFreehand && !isEraser) return;
      const container = containerRef.current;
      if (!container) return;

      event.preventDefault();
      event.stopPropagation();

      const point = getNormalizedPoint(event, container);

      if (isEraser) {
        eraseStrokesNearPoint(point);
        setDrawingState({ type: 'eraser' });
        if (event.target?.setPointerCapture) {
          try {
            event.target.setPointerCapture(event.pointerId);
          } catch {
            // ignore
          }
        }
        return;
      }

      const baseSize = activeBrushSize || 10;
      const initialPressure = getPointerPressure(event);

      const initialPoints =
        freehandMode === 'straight'
          ? [point, point] // anchor + live endpoint
          : [point];

      setDrawingState({
        type: 'freehand',
        points: initialPoints,
        mode: freehandMode,
        brushSize: baseSize,
        pressureEnabled: isPressureEnabled,
        pressure: initialPressure,
        opacity: typeof activeBrushOpacity === 'number' ? activeBrushOpacity : 1,
      });

      if (event.target?.setPointerCapture) {
        try {
          event.target.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
    },
    [
      activeTool,
      activeBrushSize,
      activeBrushOpacity,
      freehandMode,
      isPressureEnabled,
      getNormalizedPoint,
      getPointerPressure,
      eraseStrokesNearPoint,
      eraserToolId,
    ],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!drawingState) return;
      const container = containerRef.current;
      if (!container) return;

      event.preventDefault();

      const point = getNormalizedPoint(event, container);

      if (drawingState.type === 'eraser') {
        eraseStrokesNearPoint(point);
        return;
      }

      if (drawingState.type !== 'freehand') return;

      const pressureValue = getPointerPressure(event);

      setDrawingState((prev) => {
        if (!prev) return prev;
        if (prev.mode === 'straight') {
          const anchor = prev.points[0] || point;
          return { ...prev, points: [anchor, point], pressure: pressureValue };
        }
        return { ...prev, points: [...prev.points, point], pressure: pressureValue };
      });
    },
    [drawingState, eraseStrokesNearPoint, getNormalizedPoint, getPointerPressure],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (!drawingState) {
        setDrawingState(null);
        return;
      }

      const container = containerRef.current;
      if (!container) {
        setDrawingState(null);
        return;
      }

      if (event.target?.releasePointerCapture) {
        try {
          event.target.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }

      event.preventDefault();

      const endPoint = getNormalizedPoint(event, container);

      if (drawingState.type === 'eraser') {
        eraseStrokesNearPoint(endPoint);
        setDrawingState(null);
        return;
      }

      if (drawingState.type !== 'freehand') {
        setDrawingState(null);
        return;
      }

      let mergedPoints;
      if (drawingState.mode === 'straight') {
        const anchor = drawingState.points[0] || endPoint;
        mergedPoints = [anchor, endPoint];
      } else {
        mergedPoints = [...drawingState.points, endPoint];
      }

      if (!mergedPoints || mergedPoints.length < 2) {
        setDrawingState(null);
        return;
      }

      const baseSize = drawingState.brushSize || activeBrushSize || 10;
      const pressureFactor = drawingState.pressureEnabled ? drawingState.pressure || 1 : 1;
      const strokeWidth = baseSize * pressureFactor;
      const strokeOpacity =
        typeof drawingState.opacity === 'number'
          ? drawingState.opacity
          : typeof activeBrushOpacity === 'number'
          ? activeBrushOpacity
          : 1;

      setStrokes((prev) => [
        ...prev,
        {
          id: `workspace-stroke-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          points: mergedPoints,
          color: activeColor,
          strokeWidth,
          opacity: strokeOpacity,
          createdAt: new Date().toISOString(),
        },
      ]);

      setDrawingState(null);
    },
    [drawingState, getNormalizedPoint, activeBrushSize, activeBrushOpacity, activeColor, eraseStrokesNearPoint],
  );

  const liveStrokeWidth =
    drawingState?.type === 'freehand'
      ? (drawingState.brushSize || activeBrushSize || 10) *
        (drawingState.pressureEnabled ? drawingState.pressure || 1 : 1)
      : null;

  const liveStrokeOpacity =
    drawingState?.type === 'freehand'
      ? typeof drawingState.opacity === 'number'
        ? drawingState.opacity
        : typeof activeBrushOpacity === 'number'
        ? activeBrushOpacity
        : 1
      : null;

  const isDrawingActive = activeTool === 'freehand' || activeTool === eraserToolId;

  const toSvgPoints = useCallback(
    (points = []) => points.map((p) => `${p.x * VIEWBOX_SIZE},${p.y * VIEWBOX_SIZE}`).join(' '),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={styles.workspaceDrawingLayer}
      data-active={isDrawingActive ? 'true' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <svg
        className={styles.workspaceDrawingSvg}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        preserveAspectRatio="none"
      >
        {strokes.map((stroke) => (
          <polyline
            key={stroke.id}
            className={styles.workspaceFreehandPath}
            points={toSvgPoints(stroke.points)}
            stroke={stroke.color}
            strokeOpacity={stroke.opacity}
            style={{ '--workspace-freehand-stroke-width': `${stroke.strokeWidth}` }}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {drawingState?.type === 'freehand' && drawingState.points?.length > 1 && (
          <polyline
            className={styles.workspaceFreehandPath}
            points={toSvgPoints(drawingState.points)}
            stroke={activeColor}
            strokeOpacity={liveStrokeOpacity ?? 1}
            style={{ '--workspace-freehand-stroke-width': `${liveStrokeWidth || 2.5}` }}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
};

export default WorkspaceFreehandLayer;



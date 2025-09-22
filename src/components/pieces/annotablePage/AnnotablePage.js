import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Stage, Layer, Rect, Line } from "react-konva";
import styles from "./annotablePage.module.css";

function AnnotatablePage({
  pageImage,
  pageNumber,
  isDrawing,
  isFreehand,
  highlightColor,
  setIsCommentOpen,
  brushSize
}) {
  const [annotations, setAnnotations] = useState([]);
  const [pendingHighlights, setPendingHighlights] = useState([]); // Highlights without comments
  const [newRect, setNewRect] = useState(null);
  const [newFreehand, setNewFreehand] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [activePendingIndex, setActivePendingIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const stageRef = useRef(null);
  const commentRef = useRef(null);

  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, visible: false });

  useEffect(() => {
    const saved = localStorage.getItem(`annotations-page-${pageNumber}`);
    if (saved) setAnnotations(JSON.parse(saved));
    
    const savedPending = localStorage.getItem(`pending-annotations-page-${pageNumber}`);
    if (savedPending) setPendingHighlights(JSON.parse(savedPending));
  }, [pageNumber]);

  useEffect(() => {
    localStorage.setItem(`annotations-page-${pageNumber}`, JSON.stringify(annotations));
  }, [annotations, pageNumber]);

  useEffect(() => {
    localStorage.setItem(`pending-annotations-page-${pageNumber}`, JSON.stringify(pendingHighlights));
  }, [pendingHighlights, pageNumber]);

  const updatePortalPosition = useCallback(() => {
    const stageNode = stageRef.current;
    if (!stageNode) return setPortalPos({ top: 0, left: 0, visible: false });

    const containerRect = stageNode.container().getBoundingClientRect();
    const scaleX = typeof stageNode.scaleX === "function" ? stageNode.scaleX() : 1;
    const scaleY = typeof stageNode.scaleY === "function" ? stageNode.scaleY() : 1;

    let targetAnnotation = null;

    if (activeIndex != null && annotations[activeIndex]) {
      const ann = annotations[activeIndex];
      // Handle grouped annotations - use the first highlight for positioning
      if (ann.type === "group" && ann.highlights && ann.highlights.length > 0) {
        targetAnnotation = ann.highlights[0];
      } else {
        targetAnnotation = ann;
      }
    } else if (activePendingIndex != null && pendingHighlights[activePendingIndex]) {
      targetAnnotation = pendingHighlights[activePendingIndex];
    }

    if (!targetAnnotation) {
      return setPortalPos({ top: 0, left: 0, visible: false });
    }

    if (targetAnnotation.type === "freehand") {
      const points = targetAnnotation.points;
      if (points.length < 2) return setPortalPos({ top: 0, left: 0, visible: false });

      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      const top = containerRect.top + lastY * scaleY;
      const left = containerRect.left + lastX * scaleX + 12;

      setPortalPos({ top, left, visible: true });
    } else {
      const top = containerRect.top + targetAnnotation.y * scaleY;
      const left = containerRect.left + (targetAnnotation.x + targetAnnotation.width) * scaleX + 12;
      setPortalPos({ top, left, visible: true });
    }
  }, [activeIndex, activePendingIndex, annotations, pendingHighlights]);

  useEffect(() => {
    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);
    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [updatePortalPosition]);

  useEffect(() => {
    const handleDocDown = (e) => {
      if (commentRef.current && commentRef.current.contains(e.target)) return;
      setActiveIndex(null);
      setActivePendingIndex(null);
      setIsEditing(false);
      setIsCommentOpen(false);
    };

    document.addEventListener("mousedown", handleDocDown);
    document.addEventListener("touchstart", handleDocDown);
    return () => {
      document.removeEventListener("mousedown", handleDocDown);
      document.removeEventListener("touchstart", handleDocDown);
    };
  }, [setIsCommentOpen]);

  const handleMouseDown = (e) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    if (e.target !== stage) return;

    const pos = stage.getPointerPosition();

    if (isFreehand) {
      setNewFreehand({
        points: [pos.x, pos.y],
        type: "freehand",
        color: highlightColor,
        strokeWidth: brushSize,
      });
      setActiveIndex(null);
      setActivePendingIndex(null);
      setIsEditing(false);
      setIsCommentOpen(false);
    } else {
      setNewRect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        type: "rect",
      });
      setActiveIndex(null);
      setActivePendingIndex(null);
      setIsEditing(false);
      setIsCommentOpen(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    if (e.target !== stage) return;

    const pos = stage.getPointerPosition();

    if (isFreehand && newFreehand) {
      setNewFreehand((prev) => ({
        ...prev,
        points: [...prev.points, pos.x, pos.y],
      }));
    } else if (!isFreehand && newRect) {
      setNewRect({
        ...newRect,
        width: pos.x - newRect.x,
        height: pos.y - newRect.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (isFreehand && newFreehand) {
      // Add to pending highlights
      setPendingHighlights((prev) => [...prev, newFreehand]);
      setActivePendingIndex(pendingHighlights.length);
      setIsEditing(true);
      setNewFreehand(null);
    } else if (!isFreehand && newRect) {
      if (Math.abs(newRect.width) > 5 && Math.abs(newRect.height) > 5) {
        let x = newRect.x;
        let y = newRect.y;
        let width = newRect.width;
        let height = newRect.height;

        if (width < 0) {
          x = x + width;
          width = Math.abs(width);
        }
        if (height < 0) {
          y = y + height;
          height = Math.abs(height);
        }

        const normalizedRect = { ...newRect, x, y, width, height };
        // Add to pending highlights
        setPendingHighlights((prev) => [...prev, normalizedRect]);
        setActivePendingIndex(pendingHighlights.length);
        setIsEditing(true);
      }
      setNewRect(null);
    }
  };

  const handleAnnotationClick = (index, e, isPending = false) => {
    e.cancelBubble = true;
    if (isPending) {
      setActivePendingIndex(index);
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
      setActivePendingIndex(null);
    }
    setIsEditing(true);
    setIsCommentOpen(true);
  };

  const handleCommentChange = (e) => {
    const commentText = e.target.value;
    
    // If we're editing a pending highlight and user adds text, group all pending highlights
    if (activePendingIndex != null && commentText.trim() !== "") {
      // Create a new annotation group with all pending highlights
      const newAnnotation = {
        type: "group",
        highlights: [...pendingHighlights],
        comments: [{ text: commentText, createdAt: Date.now() }],
      };
      
      setAnnotations((prev) => [...prev, newAnnotation]);
      setPendingHighlights([]); // Clear pending highlights
      setActivePendingIndex(null);
      setActiveIndex(annotations.length); // Set active to the new group
      return;
    }
    
    // Handle regular comment editing for existing annotations
    if (activeIndex != null) {
      const updatedAnnotations = [...annotations];
      updatedAnnotations[activeIndex].comments[0].text = commentText;
      setAnnotations(updatedAnnotations);
    }
  };

  const handleDelete = () => {
    if (activeIndex != null) {
      const updated = annotations.filter((_, i) => i !== activeIndex);
      setAnnotations(updated);
      setActiveIndex(null);
    } else if (activePendingIndex != null) {
      const updated = pendingHighlights.filter((_, i) => i !== activePendingIndex);
      setPendingHighlights(updated);
      setActivePendingIndex(null);
    }
    setIsEditing(false);
    setIsCommentOpen(false);
  };

  const getCurrentComment = () => {
    if (activeIndex != null && annotations[activeIndex]) {
      return annotations[activeIndex].comments[0]?.text || "";
    }
    return ""; // Pending highlights don't have comments yet
  };

  const renderHighlight = (highlight, key, onClick) => {
    if (highlight.type === "freehand") {
      return (
        <Line
          key={key}
          points={highlight.points}
          stroke={highlight.color || highlightColor}
          strokeWidth={highlight.strokeWidth || brushSize}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={0.3}
          onClick={onClick}
          onTap={onClick}
          perfectDrawEnabled={false}
        />
      );
    }
    // Rectangle highlight
    return (
      <Rect
        key={key}
        x={highlight.x}
        y={highlight.y}
        width={highlight.width}
        height={highlight.height}
        fill="rgba(255,255,0,0.3)"
        stroke="orange"
        strokeWidth={1}
        onClick={onClick}
        onTap={onClick}
        perfectDrawEnabled={false}
      />
    );
  };

  return (
    <>
      <Stage
        width={2000}
        height={700}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        style={{ backgroundImage: `url(${pageImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        className={styles.stage}
      >
        <Layer>
          {/* Render completed annotation groups */}
          {annotations.map((ann, i) => {
            if (ann.type === "group") {
              // Render all highlights in the group
              return ann.highlights.map((highlight, j) => 
                renderHighlight(
                  highlight, 
                  `group-${i}-${j}`, 
                  (e) => handleAnnotationClick(i, e, false)
                )
              );
            }
            // Handle single annotations (backward compatibility)
            return renderHighlight(
              ann, 
              `single-${i}`, 
              (e) => handleAnnotationClick(i, e, false)
            );
          })}

          {/* Render pending highlights (with dashed border to show they're pending) */}
          {pendingHighlights.map((highlight, i) => {
            if (highlight.type === "freehand") {
              return (
                <Line
                  key={`pending-${i}`}
                  points={highlight.points}
                  stroke={highlight.color || highlightColor}
                  strokeWidth={highlight.strokeWidth || brushSize}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.3}
                  onClick={(e) => handleAnnotationClick(i, e, true)}
                  onTap={(e) => handleAnnotationClick(i, e, true)}
                  perfectDrawEnabled={false}
                />
              );
            }
            return (
              <Rect
                key={`pending-${i}`}
                x={highlight.x}
                y={highlight.y}
                width={highlight.width}
                height={highlight.height}
                fill="rgba(255,255,0,0.2)"
                stroke="orange"
                strokeWidth={2}
                dash={[8, 4]}
                onClick={(e) => handleAnnotationClick(i, e, true)}
                onTap={(e) => handleAnnotationClick(i, e, true)}
                perfectDrawEnabled={false}
              />
            );
          })}

          {/* Drawing preview */}
          {newRect && !isFreehand && (
            <Rect
              x={newRect.x}
              y={newRect.y}
              width={newRect.width}
              height={newRect.height}
              fill="rgba(255,255,0,0.3)"
              stroke="orange"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}
          {newFreehand && isFreehand && (
            <Line
              points={newFreehand.points}
              stroke={newFreehand.color || highlightColor}
              strokeWidth={newFreehand.strokeWidth || brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={0.3}
            />
          )}
        </Layer>
      </Stage>

      {/* Comment bubble */}
      {portalPos.visible && (activeIndex != null || activePendingIndex != null) && (
        ReactDOM.createPortal(
          <div
            ref={commentRef}
            className={styles.commentBubble}
            style={{ position: "absolute", top: portalPos.top, left: portalPos.left, zIndex: 1000 }}
            onClick={e => e.stopPropagation()}
          >
            <textarea
              rows={3}
              placeholder={activePendingIndex != null ? "Add comment to group all highlights..." : "Add comment..."}
              value={getCurrentComment()}
              onChange={handleCommentChange}
              autoFocus={isEditing}
              className={styles.commentTextarea}
            />
            <button onClick={handleDelete} className={styles.deleteButton}>Delete</button>
            {pendingHighlights.length > 0 && (
              <div className={styles.pendingInfo}>
                {pendingHighlights.length} highlight(s) pending grouping
              </div>
            )}
          </div>,
          document.body
        )
      )}
    </>
  );
}

export default AnnotatablePage;
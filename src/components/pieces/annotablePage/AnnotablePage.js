import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Stage, Layer, Rect, Line, Image as KonvaImage } from "react-konva";
import styles from "./annotablePage.module.css";
import { BiCommentDetail } from "react-icons/bi";

function AnnotatablePage({
  pageImage,
  pageNumber,
  pdfId,
  isDrawing,
  isFreehand,
  highlightColor,
  setIsCommentOpen,
  brushSize,
  stageWidth = 500,
  stageHeight = 700,
  freehandOpensComment = true,
  serverAnnotations = [],
  onAnnotationsChange,
  eraserMode = false,
  onDeleteAnnotation,
  onUpdateHighlightComment,
}) {
  const [annotations, setAnnotations] = useState([]);
  const [pendingHighlights, setPendingHighlights] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [newFreehand, setNewFreehand] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [activePendingIndex, setActivePendingIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingComment, setPendingComment] = useState("");

  // stageSizing + image object
  const [stageDimensions, setStageDimensions] = useState({ width: stageWidth, height: stageHeight });
  const [imageObj, setImageObj] = useState(null);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const commentRef = useRef(null);

  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, visible: false });

  // --------------------
  // Helpers: normalize/denormalize (relative to displayed stage size)
  // --------------------
  const normalizeRect = (rect, w, h) => ({
    ...rect,
    x: rect.x / w,
    y: rect.y / h,
    width: rect.width / w,
    height: rect.height / h,
  });

  const normalizeFreehand = (fh, w, h) => ({
    ...fh,
    points: fh.points.map((p, i) => (i % 2 === 0 ? p / w : p / h)),
  });

  const denormalizeRect = (rect, w, h) => ({
    ...rect,
    x: rect.x * w,
    y: rect.y * h,
    width: rect.width * w,
    height: rect.height * h,
  });

  const denormalizeFreehand = (fh, w, h) => ({
    ...fh,
    points: fh.points.map((p, i) => (i % 2 === 0 ? p * w : p * h)),
  });

  useEffect(() => {
  // Do nothing if serverAnnotations doesn't have the requested page
    if (!serverAnnotations || !serverAnnotations[pdfId] || !serverAnnotations[pdfId][pageNumber]) return;

    const items = serverAnnotations[pdfId][pageNumber]; // array of shapes or group objects
    console.log(`Server items for pdf ${pdfId} page ${pageNumber}:`, items);

    // Normalize items:
    const normalized = items.map((item) => {
      // if it's a group already (highlights + comments), ensure fields are named correctly
      if (item && item.type === "group") {
        return {
          ...item,
          highlights: (item.highlights || []).map(h => ({
            ...h,
            strokeWidth: h.stroke_width ?? h.strokeWidth ?? 2,
        })),
        comments: (item.comments || []).map(c => ({
          text: c.text ?? "",
          createdAt: c.createdAt ?? c.created_at ?? Date.now(),
          id: c.id ?? undefined,
        })),
      };
    }

    // if item has comments directly attached as `comments` keep them
    if (item && Array.isArray(item.comments) && (item.type === "freehand" || item.type === "rect")) {
      return {
        ...item,
        strokeWidth: item.stroke_width ?? item.strokeWidth ?? 2,
        comments: item.comments.map(c => ({ text: c.text ?? "", createdAt: c.createdAt ?? c.created_at ?? Date.now() })),
      };
    }

    // otherwise treat as a plain shape
    return {
      ...item,
      strokeWidth: item?.stroke_width ?? item?.strokeWidth ?? 2,
    };
  });

  // Replace annotations for page with server ones (avoid duplicates)
  setAnnotations((prev) => {
    // We choose to replace — server is authoritative for initial load.
    // But if you want to merge, implement dedupe logic using id or fingerprint.
    return normalized;
  });
}, [serverAnnotations, pdfId, pageNumber]);

useEffect(() => {
  if (typeof onAnnotationsChange === "function") {
    onAnnotationsChange(pageNumber, annotations, pendingHighlights);
  }
}, [pageNumber, annotations, pendingHighlights, onAnnotationsChange]);

  // --------------------
  // Load image into an Image object (for Konva)
  // --------------------
  useEffect(() => {
    if (!pageImage) {
      setImageObj(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = pageImage;
    img.onload = () => {
      setImageObj(img);
    };
    img.onerror = () => setImageObj(null);
  }, [pageImage]);

  // --------------------
  // ResizeObserver -> keep stage size in sync with container (maintain aspect ratio)
  // --------------------
  const computeStageForContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container || !imageObj) return;

    const containerW = container.clientWidth || stageWidth;
    const containerH = container.clientHeight || window.innerHeight;
    const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;

    // Fit by width first, then clamp by height if needed
    let w = containerW;
    let h = w / imgAspect;
    if (h > containerH) {
      h = containerH;
      w = h * imgAspect;
    }
    setStageDimensions({ width: Math.round(w), height: Math.round(h) });
  }, [imageObj, stageWidth, stageHeight]);

  useEffect(() => {
    computeStageForContainer();
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => computeStageForContainer());
    ro.observe(containerRef.current);
    // also listen to window resize
    window.addEventListener("resize", computeStageForContainer);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeStageForContainer);
    };
  }, [computeStageForContainer]);

  // --------------------
  // Comment bubble positioning (denormalize to stage pixels, then to page DOM rect)
  // --------------------
  const updatePortalPosition = useCallback(() => {
    const stageNode = stageRef.current;
    if (!stageNode) return setPortalPos({ top: 0, left: 0, visible: false });

    const containerRect = stageNode.container().getBoundingClientRect();
    const w = stageDimensions.width;
    const h = stageDimensions.height;

    let target = null;
    if (activeIndex != null && annotations[activeIndex]) {
      const ann = annotations[activeIndex];
      // For groups, use the LAST highlight (most recently added)
      target = ann.type === "group" && ann.highlights?.length 
        ? ann.highlights[ann.highlights.length - 1] 
        : ann;
    } else if (activePendingIndex != null && pendingHighlights[activePendingIndex]) {
      target = pendingHighlights[activePendingIndex];
    }
    if (!target) return setPortalPos({ top: 0, left: 0, visible: false });

    let top, left;
    if (target.type === "freehand") {
      const den = denormalizeFreehand(target, w, h);
      const pts = den.points;
      const lx = pts[pts.length - 2];
      const ly = pts[pts.length - 1];
      top = containerRect.top + ly;
      left = containerRect.left + lx + 12;
    } else {
      const den = denormalizeRect(target, w, h);
      top = containerRect.top + den.y;
      left = containerRect.left + (den.x + den.width) + 12;
    }

    // clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = 320;
    const bh = 150;
    left = Math.min(Math.max(8, left), vw - bw - 8);
    top = Math.min(Math.max(8, top), vh - bh - 8);

    setPortalPos({ top, left, visible: true });
  }, [activeIndex, activePendingIndex, annotations, pendingHighlights, stageDimensions]);

  useEffect(() => {
    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);
    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [updatePortalPosition]);

  // --------------------
  // Document click to close bubble
  // --------------------
  const maybeCommitComment = () => {
    if (activeIndex != null && isEditing) {
      handleCommentBlur();
    }
  };

  useEffect(() => {
    const handleDocDown = (e) => {
      if (commentRef.current && commentRef.current.contains(e.target)) return;
      maybeCommitComment();
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
  }, [setIsCommentOpen, activeIndex, isEditing]);

  // --------------------
  // Drawing handlers (FIXED: allow clicks on Image; use stageRef for pointer during moves)
  // --------------------
  const handleMouseDown = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    if (!stage) return;

    const targetClass = e.target.getClassName ? e.target.getClassName() : null;
    // allow start when clicking the stage itself OR the background image node,
    // but ignore clicks that land on shapes (Rect/Line) / existing annotations
    if (e.target !== stage && targetClass !== "Image") return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isFreehand) {
      setNewFreehand({
        points: [pos.x, pos.y],
        type: "freehand",
        color: highlightColor,
        strokeWidth: brushSize,
      });
    } else {
      setNewRect({ x: pos.x, y: pos.y, width: 0, height: 0, type: "rect" });
    }
    setActiveIndex(null);
    setActivePendingIndex(null);
    setIsEditing(false);
    setIsCommentOpen(false);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    // use stageRef so pointer pos is available even if target changes to the preview Line/Rect
    const stage = stageRef.current || (e.target && e.target.getStage && e.target.getStage());
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (isFreehand && newFreehand) {
      setNewFreehand((prev) => ({ ...prev, points: [...prev.points, pos.x, pos.y] }));
    } else if (!isFreehand && newRect) {
      setNewRect((prev) => ({ ...prev, width: pos.x - prev.x, height: pos.y - prev.y }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    const stageNode = stageRef.current;
    if (!stageNode) return;
    const w = stageNode.width();
    const h = stageNode.height();

    if (isFreehand && newFreehand) {
      const normalized = normalizeFreehand(newFreehand, w, h);
      if (freehandOpensComment) {
        setPendingHighlights((prev) => {
          const newArr = [...prev, normalized];
          const idx = newArr.length - 1;
          setActivePendingIndex(idx);
          setIsEditing(true);
          setIsCommentOpen(true);
          return newArr;
        });
      } else {
        setAnnotations((prev) => [...prev, normalized]);
      }
      setNewFreehand(null);
    } else if (!isFreehand && newRect) {
      if (Math.abs(newRect.width) > 5 && Math.abs(newRect.height) > 5) {
        let { x, y, width, height } = newRect;
        if (width < 0) {
          x = x + width;
          width = Math.abs(width);
        }
        if (height < 0) {
          y = y + height;
          height = Math.abs(height);
        }
        const normalized = normalizeRect({ x, y, width, height, type: "rect" }, w, h);
        setPendingHighlights((prev) => {
          const newArr = [...prev, normalized];
          const idx = newArr.length - 1;
          setActivePendingIndex(idx);
          setIsEditing(true);
          return newArr;
        });
      }
      setNewRect(null);
    }
  };

  // --------------------
  // Click / comment / delete handlers
  // --------------------
  const handleAnnotationClick = (index, e, isPending = false) => {
    e.cancelBubble = true;
    // Save pending comment if switching to another annotation
    maybeCommitComment();
    if (isPending) {
      setActivePendingIndex(index);
      setActiveIndex(null);
      setPendingComment(pendingHighlights[index]?.comments?.[0]?.text || "");
    } else {
      setActiveIndex(index);
      setActivePendingIndex(null);
      setPendingComment(annotations[index]?.comments?.[0]?.text || "");
    }
    setIsEditing(true);
    setIsCommentOpen(true);
  };

  const handleCommentChange = (e) => {
    const commentText = e.target.value;
    setPendingComment(commentText);
    // Completing pending -> create group with pending highlights
    if (activePendingIndex != null && commentText.trim() !== "") {
      setAnnotations((prev) => {
        const newAnnotation = {
          type: "group",
          highlights: [...pendingHighlights],
          comments: [{ text: commentText, createdAt: Date.now() }],
        };
        const newArr = [...prev, newAnnotation];
        setPendingHighlights([]);
        setActivePendingIndex(null);
        setActiveIndex(newArr.length - 1);
        return newArr;
      });
      return;
    }
    // Editing existing annotation comment (still update React state for UI, but don't call API yet)
    if (activeIndex != null) {
      setAnnotations((prev) => {
        const copy = [...prev];
        if (!copy[activeIndex].comments) copy[activeIndex].comments = [{ text: "" }];
        copy[activeIndex].comments[0].text = commentText;
        return copy;
      });
    }
  };

  const handleCommentBlur = () => {
    if (activeIndex != null && annotations[activeIndex]) {
      const ann = annotations[activeIndex];
      const target = ann.type === 'group' && ann.highlights?.length ? ann.highlights[ann.highlights.length - 1] : ann;
      const annotationId = target?.annotationId || ann?.annotationId;
      const highlightId = target?.id;
      const text = (ann.comments && ann.comments[0]?.text) || pendingComment || "";
      if (annotationId && highlightId && typeof onUpdateHighlightComment === 'function') {
        onUpdateHighlightComment(annotationId, highlightId, text);
      }
    }
  };

  const handleDelete = () => {
    maybeCommitComment();
    if (activeIndex != null) {
      setAnnotations((prev) => prev.filter((_, i) => i !== activeIndex));
      setActiveIndex(null);
    } else if (activePendingIndex != null) {
      setPendingHighlights((prev) => prev.filter((_, i) => i !== activePendingIndex));
      setActivePendingIndex(null);
    }
    setIsEditing(false);
    setIsCommentOpen(false);
  };

   const handleErase = async (annIndex, highlightIndex = null, isPending = false) => {
    if (isPending) {
      setPendingHighlights((prev) => prev.filter((_, i) => i !== annIndex));
      if (activePendingIndex === annIndex) setActivePendingIndex(null);
      return;
    }

    setAnnotations((prev) => {
      const copy = JSON.parse(JSON.stringify(prev || []));
      const item = copy[annIndex];
      if (!item) return prev;

      let idToDelete = null;

      // --- If item is a grouped annotation ---
      if (item.type === "group" && typeof highlightIndex === "number") {
        const highlightToDelete = item.highlights[highlightIndex];
        idToDelete = highlightToDelete?.id;

        // Remove that highlight
        item.highlights.splice(highlightIndex, 1);

        if (item.comments && item.comments.length > 0) {
          item.comments = []; // Clear the group's comments
        }

        if (!item.highlights || item.highlights.length === 0) {
          copy.splice(annIndex, 1);
        }
      } 
      else if (item.type === "group" && highlightIndex == null) {
        idToDelete = item.id;
        copy.splice(annIndex, 1);
      } 
      else {
        // Single shape annotation
        idToDelete = item.id;
        copy.splice(annIndex, 1);
      }

      if (activeIndex === annIndex) setActiveIndex(null);

      // Call delete API if this annotation has a server ID
      if (idToDelete && onDeleteAnnotation) {
        onDeleteAnnotation(idToDelete).catch(err => {
          console.error('Failed to delete from server:', err);
        });
      }

      return copy;
    });
  };


  const getCurrentComment = () => {
    // Always return the pending comment for the currently open textarea
    return pendingComment;
  };

  // --------------------
  // Render helpers
  // --------------------
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
           onClick={onClick}
          onTap={onClick}
          opacity={0.3}
          perfectDrawEnabled={false}
        />
      );
    }
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

  // --------------------
  // JSX
  // --------------------
  return (
    <div ref={containerRef} className={styles.pageContainer} style={{ position: "relative", width: "100%" }}>
      <Stage
        width={stageDimensions.width}
        height={stageDimensions.height}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className={styles.stage}
        style={{ display: "block", touchAction: "none" }} // touchAction none helps mobile drawing
      >
        <Layer>
          {/* Image rendered inside Konva so coords align */}
          {imageObj && (
            <KonvaImage image={imageObj} x={0} y={0} width={stageDimensions.width} height={stageDimensions.height} />
          )}

          {/* Completed annotations */}
      {annotations.map((ann, i) => {
            if (ann.type === "group") {
              return ann.highlights.map((h, j) => {
                const renderData =
                  h.type === "freehand"
                    ? denormalizeFreehand(h, stageDimensions.width, stageDimensions.height)
                    : denormalizeRect(h, stageDimensions.width, stageDimensions.height);

                // onClick: if eraserMode -> erase this specific highlight, otherwise do nothing on shape click
                const onClick = (e) => {
                  e.cancelBubble = true;
                  if (eraserMode) {
                    handleErase(i, j, false);
                  } else {
                    // do nothing (we don't open comment box by clicking shapes)
                  }
                };

                return renderHighlight(renderData, `group-${i}-${j}`, onClick);
              });
            }

            const renderData =
              ann.type === "freehand"
                ? denormalizeFreehand(ann, stageDimensions.width, stageDimensions.height)
                : denormalizeRect(ann, stageDimensions.width, stageDimensions.height);

            const onClick = (e) => {
              e.cancelBubble = true;
              if (eraserMode) {
                handleErase(i, null, false);
              } else {
                // do nothing
              }
            };

            return renderHighlight(renderData, `single-${i}`, onClick);
          })}

          {/* Pending highlights */}
          {pendingHighlights.map((h, i) => {
            const renderData =
              h.type === "freehand"
                ? denormalizeFreehand(h, stageDimensions.width, stageDimensions.height)
                : denormalizeRect(h, stageDimensions.width, stageDimensions.height);

            const onClick = (e) => {
              e.cancelBubble = true;
              if (eraserMode) {
                handleErase(i, null, true);
              } else {
                // If pending click should open comment when not erasing, keep previous behavior:
                handleAnnotationClick(i, e, true);
              }
            };

            if (h.type === "freehand") {
              return (
                <Line
                  key={`pending-${i}`}
                  points={renderData.points}
                  stroke={renderData.color || highlightColor}
                  strokeWidth={renderData.strokeWidth || brushSize}
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
            return (
              <Rect
                key={`pending-${i}`}
                x={renderData.x}
                y={renderData.y}
                width={renderData.width}
                height={renderData.height}
                fill="rgba(255,255,0,0.2)"
                stroke="orange"
                strokeWidth={2}
                dash={[8, 4]}
                  onClick={onClick}
                  onTap={onClick}
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

        {annotations.map((ann, i) => {
        if (!ann.comments?.length) return null;
        
        // For groups, use the LAST highlight (most recently added). For single annotations with comments, use the annotation itself.
        const targetShape = ann.type === "group" && ann.highlights?.length 
          ? ann.highlights[ann.highlights.length - 1] 
          : ann;
        
        const w = stageDimensions.width;
        const h = stageDimensions.height;

        let x = 0,
          y = 0;
        if (targetShape.type === "freehand") {
          const den = denormalizeFreehand(targetShape, w, h);
          const pts = den.points;
          x = pts[pts.length - 2];
          y = pts[pts.length - 1];
        } else if (targetShape.type === "rect") {
          const den = denormalizeRect(targetShape, w, h);
          x = den.x + den.width + 5;
          y = den.y;
        } else {
          // Handle other shape types
          return null;
        }

        return (
          <BiCommentDetail
            key={`icon-${i}`}
            onClick={(e) => handleAnnotationClick(i, e, false)}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              cursor: "pointer",
              zIndex: 1000,
              fontSize: "20px",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}
          />
        );
      })}

      {/* Comment bubble portal */}
      {portalPos.visible &&
        ((activeIndex != null && annotations[activeIndex]) || (activePendingIndex != null && pendingHighlights[activePendingIndex])) &&
        ReactDOM.createPortal(
          <div
            ref={commentRef}
            className={styles.commentBubble}
            style={{ position: "absolute", top: portalPos.top, left: portalPos.left, zIndex: 2000 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => { e.stopPropagation(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
          >
            <div className={styles.commentArrow} />
            <textarea
              rows={3}
              placeholder={activePendingIndex != null ? "Add comment to group all highlights..." : "Add comment..."}
              value={getCurrentComment()}
              onChange={handleCommentChange}
              onBlur={handleCommentBlur}
              autoFocus={false}
              className={styles.commentTextarea}
            />
            {/* <button onClick={() => {
                // Add a small delay before hiding the bubble to allow React to unmount safely
                setIsEditing(false);
                setTimeout(() => {
                  setActiveIndex(null);
                  setActivePendingIndex(null);
                  setIsCommentOpen(false);
                }, 30);
              }} 
              className={styles.deleteButton}>Delete</button> */}
            {pendingHighlights.length > 0 && (
              <div className={styles.pendingInfo}>{pendingHighlights.length} highlight(s) pending grouping</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default AnnotatablePage;
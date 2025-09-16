import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Stage, Layer, Rect } from "react-konva";
import styles from "./annotablePage.module.css";

function AnnotatablePage({ pageImage, pageNumber, isDrawing }) {
  const [annotations, setAnnotations] = useState([]);
  const [newAnnotation, setNewAnnotation] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const stageRef = useRef(null);
  const commentRef = useRef(null);

  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, visible: false });

  // load saved annotations
  useEffect(() => {
    const saved = localStorage.getItem(`annotations-page-${pageNumber}`);
    if (saved) setAnnotations(JSON.parse(saved));
  }, [pageNumber]);

  // persist annotations
  useEffect(() => {
    localStorage.setItem(`annotations-page-${pageNumber}`, JSON.stringify(annotations));
  }, [annotations, pageNumber]);

  // compute viewport position for annotation
  const updatePortalPosition = useCallback(() => {
    const stageNode = stageRef.current;
    if (!stageNode) return setPortalPos({ top: 0, left: 0, visible: false });

    const containerRect = stageNode.container().getBoundingClientRect();
    const scaleX = typeof stageNode.scaleX === "function" ? stageNode.scaleX() : 1;
    const scaleY = typeof stageNode.scaleY === "function" ? stageNode.scaleY() : 1;

    if (activeIndex == null || !annotations[activeIndex]) {
      return setPortalPos({ top: 0, left: 0, visible: false });
    }

    const ann = annotations[activeIndex];
    const top = containerRect.top + ann.y * scaleY;
    const left = containerRect.left + (ann.x + ann.width) * scaleX + 12;

    setPortalPos({ top, left, visible: true });
  }, [activeIndex, annotations]);

  useEffect(() => {
    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);
    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [updatePortalPosition]);

  // close bubble on outside clicks
  useEffect(() => {
    const handleDocDown = (e) => {
      if (commentRef.current && commentRef.current.contains(e.target)) return;
      setActiveIndex(null);
      setIsEditing(false);
    };

    document.addEventListener("mousedown", handleDocDown);
    document.addEventListener("touchstart", handleDocDown);
    return () => {
      document.removeEventListener("mousedown", handleDocDown);
      document.removeEventListener("touchstart", handleDocDown);
    };
  }, []);

  // Drawing handlers
  const handleMouseDown = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    if (e.target !== stage) return;

    const { x, y } = stage.getPointerPosition();
    setNewAnnotation({
      x,
      y,
      width: 0,
      height: 0,
      comments: [{ text: "", createdAt: Date.now() }],
    });
    setActiveIndex(null);
    setIsEditing(false);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !newAnnotation) return;
    const stage = e.target.getStage();
    const { x, y } = stage.getPointerPosition();
    setNewAnnotation({ ...newAnnotation, width: x - newAnnotation.x, height: y - newAnnotation.y });
  };

  const handleMouseUp = () => {
    if (!newAnnotation) return;
    let { x, y, width, height, comments } = newAnnotation;
    if (width < 0) { x += width; width = Math.abs(width); }
    if (height < 0) { y += height; height = Math.abs(height); }

    const ann = { x, y, width, height, comments };
    setAnnotations((prev) => [...prev, ann]);

    setTimeout(() => {
      setActiveIndex((prev) => annotations.length);
      setIsEditing(true);
    }, 0);

    setNewAnnotation(null);
  };

  const updateComment = (index, commentIndex, text) => {
    setAnnotations((prev) => {
      const copy = [...prev];
      const ann = { ...copy[index] };
      ann.comments = [...ann.comments];
      ann.comments[commentIndex] = { ...ann.comments[commentIndex], text };
      copy[index] = ann;
      return copy;
    });
  };

  const addNewComment = (index) => {
    setAnnotations((prev) => {
      const copy = [...prev];
      const ann = { ...copy[index] };
      ann.comments = [...ann.comments, { text: "", createdAt: Date.now() }];
      copy[index] = ann;
      return copy;
    });
    setIsEditing(true);
  };

  const deleteComment = (index, commentIndex) => {
    setAnnotations((prev) => {
      const copy = [...prev];
      const ann = { ...copy[index] };
      ann.comments = ann.comments.filter((_, i) => i !== commentIndex);
      copy[index] = ann;
      return copy;
    });
  };

  const handleRectClick = (i, e) => {
    if (e && e.evt && e.evt.stopPropagation) e.evt.stopPropagation();
    setActiveIndex(i);
    setIsEditing(false);
  };

  // Portal content
  const portalContent =
    portalPos.visible && activeIndex !== null && annotations[activeIndex] ? (
      <div
        style={{
          position: "fixed",
          top: portalPos.top,
          left: portalPos.left,
          zIndex: 99999,
          pointerEvents: "auto",
          minWidth: 220,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          className={styles.commentBubble}
          ref={commentRef}
          style={{ position: "fixed", top: portalPos.top, left: portalPos.left }}
        >
          <div className={styles.commentArrow} />
          <div className={styles.commentHeader}>Comments</div>

          {annotations[activeIndex].comments.map((c, i) => (
            <div key={i} className={styles.commentRow}>
              {isEditing ? (
                <textarea
                  value={c.text}
                  onChange={(e) => updateComment(activeIndex, i, e.target.value)}
                  className={styles.commentInput}
                  autoFocus={i === annotations[activeIndex].comments.length - 1}
                />
              ) : (
                <div
                  className={styles.commentText}
                  onClick={() => setIsEditing(true)}
                  title={`Created at ${new Date(c.createdAt).toLocaleString()}`}
                >
                  {c.text || <span className={styles.placeholder}>Click to add comment</span>}
                </div>
              )}

              <button
                className={styles.deleteButton}
                onClick={() => deleteComment(activeIndex, i)}
                title="Delete comment"
              >
                🗑
              </button>
            </div>
          ))}

          <button
            className={styles.addCommentButton}
            onClick={() => addNewComment(activeIndex)}
            title="Add another comment"
          >
            +
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div style={{ position: "relative", width: 500, height: 700 }}>
      <Stage
        width={500}
        height={700}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{
          backgroundImage: `url(${pageImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          touchAction: isDrawing ? "none" : "auto",
        }}
      >
        <Layer>
          {annotations.map((ann, i) => (
            <Rect
              key={i}
              x={ann.x}
              y={ann.y}
              width={ann.width}
              height={ann.height}
              fill="rgba(255,255,0,0.3)"
              stroke="orange"
              strokeWidth={1}
              onClick={(e) => handleRectClick(i, e)}
              onTap={(e) => handleRectClick(i, e)}
              onMouseEnter={() => {
                const container = stageRef.current?.container();
                if (container) container.style.cursor = "pointer";
              }}
              onMouseLeave={() => {
                const container = stageRef.current?.container();
                if (container) container.style.cursor = "default";
              }}
              perfectDrawEnabled={false}
            />
          ))}

          {newAnnotation && (
            <Rect
              x={newAnnotation.x}
              y={newAnnotation.y}
              width={newAnnotation.width}
              height={newAnnotation.height}
              fill="rgba(0,0,255,0.15)"
              stroke="blue"
              dash={[4, 4]}
            />
          )}
        </Layer>
      </Stage>

      {ReactDOM.createPortal(portalContent, document.body)}
    </div>
  );
}

export default AnnotatablePage;

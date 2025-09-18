import React, { useState, useRef, useMemo } from "react";
import HTMLFlipBook from "react-pageflip";
import AnnotatablePage from "../../components/pieces/annotablePage/AnnotablePage";
import styles from "./flipView.module.css"; 
import { FaSave, FaPen, FaTimes } from "react-icons/fa";
import useScreenSize from "./use-screensize";

function FlipBook({ pages }) {
  const flipbookRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
const isInteractionActive = isDrawing || isCommentOpen;
const {
  disableFlipByClick,
  useMouseEvents,
  mobileScrollSupport,
  interactionKey,
} = useMemo(() => {
  const disable = isInteractionActive;
  return {
    disableFlipByClick: disable,
    useMouseEvents: !disable,
    mobileScrollSupport: !disable,
    interactionKey: disable ? "interaction-on" : "interaction-off",
  };
}, [isInteractionActive]);


  return (
    <div className={styles.bookContainer}>
      {/* Toolbar with three buttons */}
      <div className={styles.toolbar}>
        <button
          className={styles.iconButton}
          onClick={() => setIsDrawing(true)}
          title="Start Highlight"
        >
          <FaPen />
        </button>

        <button
          className={styles.iconButton}
          onClick={() => setIsDrawing(false)}
          title="Stop Highlight"
        >
          <FaTimes />
        </button>

        <button
          className={styles.iconButton}
          onClick={() => {
            pages.forEach((_, idx) => {
              const pageNum = idx + 1;
              const data = localStorage.getItem(`annotations-page-${pageNum}`);
              if (data) {
                console.log(`Page ${pageNum} saved`, JSON.parse(data));
              }
            });
            alert("Annotations saved (check console for each page).");
          }}
          title="Save Highlights"
        >
          <FaSave />
        </button>
      </div>

      {/* Flipbook Pages */}
      <HTMLFlipBook
        width={500}
        height={700}
        // showCover={true}
        // key={isDrawing ? "drawing" : "not-drawing"} 
        ref={flipbookRef}
        size="fixed"
        drawShadow={true}
        // disableFlipByClick={true}
          key={interactionKey}
        disableFlipByClick={disableFlipByClick}
        useMouseEvents={useMouseEvents}
        mobileScrollSupport={mobileScrollSupport}
        clickEventForward={!isInteractionActive ? "auto" : "none"}
        showPageCorners={false}
        flippingTime={700}
      >
        {pages.map((img, idx) => {
          const pageNumber = idx + 1;
          return (
            <div key={idx}>
              <AnnotatablePage
                pageImage={img}
                pageNumber={pageNumber}
                isDrawing={isDrawing}
                setIsDrawing={setIsDrawing}
                setIsCommentOpen={setIsCommentOpen}
              />
            </div>
          );
        })}
      </HTMLFlipBook>
    </div>
  );
}

export default FlipBook;

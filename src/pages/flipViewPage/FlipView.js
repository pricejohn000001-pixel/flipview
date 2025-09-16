import React, { useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import AnnotatablePage from "../../components/pieces/annotablePage/AnnotablePage";
import styles from "./flipView.module.css"; 
import { FaSave, FaPen, FaTimes } from "react-icons/fa";

function FlipBook({ pages }) {
  const flipbookRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
        showCover={false}
        key={isDrawing ? "drawing" : "not-drawing"} 
        ref={flipbookRef}
        size="fixed"
        clickEventForward={true}            // Allow child elements to receive click events
        useMouseEvents={!isDrawing}
        mobileScrollSupport={!isDrawing}
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
              />
            </div>
          );
        })}
      </HTMLFlipBook>
    </div>
  );
}

export default FlipBook;

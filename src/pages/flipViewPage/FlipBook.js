import React, { useState, useRef, useEffect } from "react";
import $ from "jquery";
import "turn.js";
import AnnotatablePage from "../../components/pieces/annotablePage/AnnotablePage";
import {
  FaSave,
  FaDrawPolygon,
  FaSquare,
  FaSearchPlus,
  FaSearchMinus,
  FaCompress,
  FaBookmark,
  FaRegBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaCircle,
} from "react-icons/fa";
import { HexColorPicker } from "react-colorful";
import styles from './flipbook.module.css';

function FlipBook({ pages }) {
  const containerRef = useRef(null);
  const flipbookRef = useRef(null);
  const zoomContainerRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isFreehand, setIsFreehand] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#fffb00");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [brushSize, setBrushSize] = useState(4);

  const brushSizes = [2, 4, 8, 12, 20];
  const isInteractionActive = isDrawing || isCommentOpen || isDragging;

  const options = {
    width: 1000,
    height: 700,
    autoCenter: true,
    display: "double",
    acceleration: true,
    elevation: 50,
    gradients: true,
    when: {
      turned: function (e, page) {
        setCurrentPage(page);
        console.log("Turned to page:", page);
      }
    }
  };

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('flipbook-bookmarks');
    if (savedBookmarks) {
      setBookmarks(new Set(JSON.parse(savedBookmarks)));
    }
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('flipbook-bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  useEffect(() => {
    if (containerRef.current) {
      $(containerRef.current).turn(options);
      flipbookRef.current = $(containerRef.current);
    }
    return () => {
      if (flipbookRef.current) {
        flipbookRef.current.turn("destroy").remove();
      }
    };
  }, []);

  useEffect(() => {
    if (flipbookRef.current) {
      flipbookRef.current.turn("disable", isInteractionActive || isZoomed);
    }
  }, [isInteractionActive, isZoomed]);

  const handleSave = () => {
    pages.forEach((_, idx) => {
      const pageNum = idx + 1;
      const data = localStorage.getItem(`annotations-page-${pageNum}`);
      if (data) {
        console.log(`Page ${pageNum} saved`, JSON.parse(data));
      }
    });
    alert("Annotations saved (check console for each page).");
  };

  const handleZoomIn = () => {
    if (!isZoomed) {
      setIsZoomed(true);
      setZoomLevel(1.5);
    } else if (zoomLevel < 3) {
      setZoomLevel(prev => Math.min(prev + 0.5, 3));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1.5) {
      setZoomLevel(prev => Math.max(prev - 0.5, 1.5));
    } else {
      setZoomLevel(1);
      setIsZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const toggleBookmark = (pageNum) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(pageNum)) {
      newBookmarks.delete(pageNum);
    } else {
      newBookmarks.add(pageNum);
    }
    setBookmarks(newBookmarks);
  };

  const goToPage = (pageNum) => {
    if (flipbookRef.current) {
      flipbookRef.current.turn("page", pageNum);
    }
  };

  const handleMouseDown = (e) => {
    if (isZoomed && !isDrawing && !isCommentOpen) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && isZoomed) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      e.preventDefault();
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    if (!isZoomed) return;
    e.preventDefault();
    const delta = e.deltaY;
    delta < 0 ? handleZoomIn() : handleZoomOut();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, panOffset]);

  useEffect(() => {
    const container = zoomContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [zoomLevel, isZoomed]);

  const getFlipbookClasses = () => {
    let classes = [styles.flipbook];
    if (isDragging) classes.push(styles.dragging);
    if (isZoomed && !isDrawing && !isCommentOpen) {
      classes.push(isDragging ? styles.zoomedGrabbing : styles.zoomedGrab);
    }
    if (isInteractionActive) classes.push(styles.interacting);
    return classes.join(' ');
  };

  const flipbookStyle = {
    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
  };

  return (
    <div className={styles.container}>
      {/* Floating Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGrid}>
          <div className={styles.toolbarSection}>
            <span className={styles.toolbarSectionTitle}>Draw</span>

            {/* Draw Rectangle Toggle */}
            <button
              className={`${styles.toolbarButton} ${(!isFreehand && isDrawing) ? styles.active : ''}`}
              onClick={() => {
                if (!isDrawing || isFreehand) {
                  setIsFreehand(false);
                  setIsDrawing(true);
                } else {
                  setIsDrawing(false);
                }
              }}
              title="Draw Rectangle"
            >
              <FaSquare />
            </button>

            {/* Freehand Toggle */}
            <button
              className={`${styles.toolbarButton} ${(isFreehand && isDrawing) ? styles.active : ''}`}
              onClick={() => {
                if (!isDrawing || !isFreehand) {
                  setIsFreehand(true);
                  setIsDrawing(true);
                } else {
                  setIsDrawing(false);
                }
              }}
              title="Draw Freehand"
            >
              <FaDrawPolygon />
            </button>

            <button
              className={styles.toolbarButton}
              onClick={handleSave}
              title="Save Highlights"
            >
              <FaSave />
            </button>
          </div>

          <div className={styles.toolbarSection}>
            <span className={styles.toolbarSectionTitle}>Zoom</span>
            <button className={styles.toolbarButton} onClick={handleZoomIn} disabled={zoomLevel >= 3} title="Zoom In">
              <FaSearchPlus />
            </button>
            <button className={styles.toolbarButton} onClick={handleZoomOut} disabled={zoomLevel <= 1} title="Zoom Out">
              <FaSearchMinus />
            </button>
            <button className={styles.toolbarButton} onClick={handleZoomReset} disabled={!isZoomed} title="Reset Zoom">
              <FaCompress />
            </button>
            {isZoomed && <span className={styles.zoomPercentage}>{Math.round(zoomLevel * 100)}%</span>}
          </div>
        </div>
      </div>

      {/* Color Palette */}
      {(isFreehand && isDrawing) && (
        <div className={styles.colorPalette}>
          <h4 className={styles.colorPaletteTitle}>Highlight Color</h4>
          <HexColorPicker className={styles.colorPicker} color={highlightColor} onChange={setHighlightColor} />
          <div className={styles.colorPreview} style={{ backgroundColor: highlightColor }} />
          <div className={styles.brushSizeSection}>
            <h4 className={styles.brushSizeTitle}>Brush Size</h4>
            <div className={styles.brushSizeContainer}>
              {brushSizes.map(size => (
                <button
                  key={size}
                  className={`${styles.brushSizeButton} ${brushSize === size ? styles.active : ""}`}
                  onClick={() => setBrushSize(size)}
                  title={`Brush size: ${size}px`}
                >
                  <FaCircle style={{ fontSize: size, color: "white" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isZoomed ? styles.zoomed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Document Viewer</h3>
        </div>

        <div className={styles.thumbnailContainer}>
          {pages.map((img, idx) => {
            const pageNumber = idx + 1;
            const isBookmarked = bookmarks.has(pageNumber);
            const isCurrentPage = currentPage === pageNumber;

            return (
              <div key={idx} className={styles.thumbnailWrapper}>
                <div
                  className={`${styles.thumbnail} ${isCurrentPage ? styles.current : ''}`}
                  onClick={() => goToPage(pageNumber)}
                  style={{ backgroundImage: `url(${img})` }}
                >
                  <div className={styles.pageNumber}>{pageNumber}</div>
                </div>

                <button
                  className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarked : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(pageNumber); }}
                  title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                </button>
              </div>
            );
          })}
        </div>

        {[...bookmarks].length > 0 && (
          <div className={styles.bookmarksSection}>
            <h4 className={styles.bookmarksTitle}>Bookmarks ({[...bookmarks].length})</h4>
            <div className={styles.bookmarksList}>
              {[...bookmarks].sort((a, b) => a - b).map(pageNum => (
                <button
                  key={pageNum}
                  className={`${styles.bookmarkPageButton} ${currentPage === pageNum ? styles.current : ''}`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating toolbar for zoomed mode */}
        {isZoomed && (
          <div className={styles.toolbarFloating}>
            <div className={styles.toolbarGrid}>
              <button
                className={`${styles.toolbarButton} ${(!isFreehand && isDrawing) ? styles.active : ''}`}
                onClick={() => {
                  if (!isDrawing || isFreehand) {
                    setIsFreehand(false);
                    setIsDrawing(true);
                  } else {
                    setIsDrawing(false);
                  }
                }}
                title="Draw Rectangle"
              >
                <FaSquare />
              </button>

              <button
                className={`${styles.toolbarButton} ${(isFreehand && isDrawing) ? styles.active : ''}`}
                onClick={() => {
                  if (!isDrawing || !isFreehand) {
                    setIsFreehand(true);
                    setIsDrawing(true);
                  } else {
                    setIsDrawing(false);
                  }
                }}
                title="Draw Freehand"
              >
                <FaDrawPolygon />
              </button>

              <button
                className={styles.toolbarButton}
                onClick={handleZoomReset}
                title="Exit Zoom"
              >
                <FaCompress />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div ref={zoomContainerRef} className={`${styles.zoomContainer} ${isZoomed ? styles.zoomed : ''}`}>
          <div
            ref={containerRef}
            className={getFlipbookClasses()}
            style={flipbookStyle}
            onMouseDown={handleMouseDown}
          >
            {pages.map((img, idx) => {
              const pageNumber = idx + 1;
              return (
                <div key={idx} className={styles.page}>
                  <AnnotatablePage
                    pageImage={img}
                    pageNumber={pageNumber}
                    isDrawing={isDrawing}
                    isFreehand={isFreehand}
                    highlightColor={highlightColor}
                    brushSize={brushSize}
                    setIsDrawing={setIsDrawing}
                    setIsCommentOpen={setIsCommentOpen}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {!isZoomed && (
          <div className={styles.pageNavigation}>
            <button
              className={styles.toolbarButton}
              onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous Page"
            >
              <FaChevronLeft />
            </button>
            <div className={styles.pageInfo}>{currentPage} / {pages.length}</div>
            <button
              className={styles.toolbarButton}
              onClick={() => currentPage < pages.length && goToPage(currentPage + 1)}
              disabled={currentPage >= pages.length}
              title="Next Page"
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        {isZoomed && (
          <div
            className={styles.zoomOverlay}
            onClick={(e) => { if (e.target === e.currentTarget && !isDragging) handleZoomReset(); }}
          />
        )}
      </div>
    </div>
  );
}

export default FlipBook;

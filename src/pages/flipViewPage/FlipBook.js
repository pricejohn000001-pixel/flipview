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
import { useLocation } from "react-router-dom/cjs/react-router-dom";

function FlipBook() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const pdfUrl = queryParams.get('pdfName');
  const containerRef = useRef(null);
  const flipbookRef = useRef(null);
  const zoomContainerRef = useRef(null);

  // UI / interaction states
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

  // PDF states
  const [pageImages, setPageImages] = useState([]); // data URLs for pages
  const [thumbnails, setThumbnails] = useState([]); // data URLs for thumbnails
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfWorkerLoaded, setPdfWorkerLoaded] = useState(false);

  const brushSizes = [2, 4, 8, 12, 20];
  const isInteractionActive = isDrawing || isCommentOpen || isDragging;

  // PDF.js worker loader
  useEffect(() => {
    const loadPdfWorker = () => {
      return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
          setPdfWorkerLoaded(true);
          resolve(window.pdfjsLib);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          if (window.pdfjsLib) {
            try {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              setPdfWorkerLoaded(true);
              resolve(window.pdfjsLib);
            } catch (err) {
              console.error('Error configuring PDF.js worker:', err);
              reject(err);
            }
          } else {
            reject(new Error('PDF.js failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js script'));
        document.head.appendChild(script);
      });
    };

    if (pdfUrl && !pdfWorkerLoaded) {
      loadPdfWorker().catch(err => {
        console.error('PDF.js loading error:', err);
        setError('Failed to load PDF viewer');
      });
    }
  }, [pdfUrl, pdfWorkerLoaded]);

  // Helper: render single PDF page to data URL
  const renderPDFPage = async (page, scale = 1.5) => {
    try {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      throw err;
    }
  };

  // Load and render the PDF (batch rendering)
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfWorkerLoaded || !window.pdfjsLib) return;
      if (!pdfUrl) return;

      try {
        setLoading(true);
        setError(null);
        setPageImages([]);
        setThumbnails([]);
        setTotalPages(0);

        const loadingTask = window.pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);

        // Batch size to reduce memory pressure
        const batchSize = 5;
        const renderedPages = [];
        const renderedThumbnails = [];

        for (let i = 0; i < pdf.numPages; i += batchSize) {
          const pagePromises = [];
          const thumbnailPromises = [];

          for (let j = i; j < Math.min(i + batchSize, pdf.numPages); j++) {
            const pageNum = j + 1;
            try {
              const page = await pdf.getPage(pageNum);
              // render full page and thumbnail in parallel for this page
              pagePromises.push(renderPDFPage(page, 1.5));
              thumbnailPromises.push(renderPDFPage(page, 0.35));
            } catch (pageErr) {
              console.error(`Error loading page ${pageNum}`, pageErr);
              // placeholder fallback images (small SVG)
              const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGxvYWRpbmcgcGFnZTwvdGV4dD4KPC9zdmc+';
              pagePromises.push(Promise.resolve(placeholder));
              thumbnailPromises.push(Promise.resolve(placeholder));
            }
          }

          const [batchPages, batchThumbs] = await Promise.all([
            Promise.all(pagePromises),
            Promise.all(thumbnailPromises),
          ]);

          renderedPages.push(...batchPages);
          renderedThumbnails.push(...batchThumbs);
        }

        setPageImages(renderedPages);
        setThumbnails(renderedThumbnails);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err?.message || err}`);
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl, pdfWorkerLoaded]);

  // flipbook options
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
        // turn.js uses 1-based page numbers
        setCurrentPage(page);
      }
    }
  };

  // bookmarks localStorage load
  useEffect(() => {
    const saved = localStorage.getItem('flipbook-bookmarks');
    if (saved) {
      try {
        setBookmarks(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Error parsing bookmarks from storage', e);
      }
    }
  }, []);

  // bookmarks save
  useEffect(() => {
    try {
      localStorage.setItem('flipbook-bookmarks', JSON.stringify([...bookmarks]));
    } catch (e) {
      console.error('Error saving bookmarks', e);
    }
  }, [bookmarks]);

  // Initialize / reinit flipbook once pageImages are ready
  useEffect(() => {
    if (pageImages.length > 0 && containerRef.current) {
      // destroy existing
      if (flipbookRef.current) {
        try {
          flipbookRef.current.turn("destroy");
        } catch (e) {
          console.warn('Error destroying flipbook:', e);
        }
        flipbookRef.current = null;
      }

      // small delay to ensure DOM updated
      setTimeout(() => {
        try {
          if (containerRef.current) {
            $(containerRef.current).turn(options);
            flipbookRef.current = $(containerRef.current);
          }
        } catch (e) {
          console.error('Error initializing flipbook:', e);
        }
      }, 100);
    }

    return () => {
      if (flipbookRef.current) {
        try {
          flipbookRef.current.turn("destroy");
        } catch (e) {
          console.warn('Error cleaning up flipbook:', e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageImages]);

  // disable flipbook when interacting or zoomed
  useEffect(() => {
    if (flipbookRef.current) {
      try {
        flipbookRef.current.turn("disable", isInteractionActive || isZoomed);
      } catch (e) {
        console.warn('Error disabling flipbook:', e);
      }
    }
  }, [isInteractionActive, isZoomed]);

  // Save annotations: look into localStorage keys `annotations-page-${n}`
  const handleSave = () => {
    pageImages.forEach((_, idx) => {
      const pageNum = idx + 1;
      const data = localStorage.getItem(`annotations-page-${pageNum}`);
      if (data) {
        console.log(`Page ${pageNum} saved`, JSON.parse(data));
      }
    });
    alert("Annotations saved (check console for each page).");
  };

  // Zoom controls
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
    if (newBookmarks.has(pageNum)) newBookmarks.delete(pageNum);
    else newBookmarks.add(pageNum);
    setBookmarks(newBookmarks);
  };

  const goToPage = (pageNum) => {
    if (flipbookRef.current) {
      try {
        flipbookRef.current.turn("page", pageNum);
      } catch (e) {
        console.warn('Error going to page:', e);
      }
    }
  };

  // drag/pan handlers
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

  // current images come only from pageImages (we no longer accept external images)
  const currentImages = pageImages;
  const currentThumbnails = thumbnails;
  const currentTotalPages = totalPages;

  // Loading / Error UI
  if (loading || (pdfUrl && currentImages.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px'
        }}>
          <div>Loading PDF...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '16px',
          color: 'red'
        }}>
          <div>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Floating Toolbar */}
      <div className={styles.toolbar} style={{ left: isZoomed?'50%' :'calc(50% + 115px)' }}>
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
      {
        !isZoomed && 
        <div className={`${styles.sidebar} ${isZoomed ? styles.zoomed : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>
              PDF Viewer
            </h3>
          </div>

          <div className={styles.thumbnailContainer}>
            {currentThumbnails.map((thumbnail, idx) => {
              const pageNumber = idx + 1;
              const isBookmarked = bookmarks.has(pageNumber);
              const isCurrentPage = currentPage === pageNumber;

              return (
                <div key={idx} className={styles.thumbnailWrapper}>
                  <div
                    className={`${styles.thumbnail} ${isCurrentPage ? styles.current : ''}`}
                    onClick={() => goToPage(pageNumber)}
                    style={{ backgroundImage: `url(${thumbnail})` }}
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
        </div>
      }

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div ref={zoomContainerRef} className={`${styles.zoomContainer} ${isZoomed ? styles.zoomed : ''}`}>
          <div
            ref={containerRef}
            className={getFlipbookClasses()}
            style={flipbookStyle}
            onMouseDown={handleMouseDown}
          >
            {currentImages.map((pageImg, idx) => {
              const pageNumber = idx + 1;
              return (
                <div key={idx} className={styles.page}>
                  <AnnotatablePage
                    pageImage={pageImg}
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
            <div className={styles.pageInfo}>{currentPage} / {currentTotalPages}</div>
            <button
              className={styles.toolbarButton}
              onClick={() => currentPage < currentTotalPages && goToPage(currentPage + 1)}
              disabled={currentPage >= currentTotalPages}
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

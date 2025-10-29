import React, { memo, useMemo, useCallback, lazy, useState, useEffect, useRef } from "react";
import $ from "jquery";
import "turn.js";

import {
  usePDFLoader,
  useAnnotations,
  useZoom,
  useBookmarks,
  useDrawingTools,
  useFlipbook
} from './hooks';

const Toolbar = lazy(() => import('./components/Toolbar'));
const ColorPalette = lazy(() => import('./components/ColorPalette'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const PageNavigation = lazy(() => import('./components/PageNavigation'));
const PageRenderer = lazy(() => import('./components/PageRenderer'));

import { LoadingSpinner, ErrorDisplay, ZoomOverlay } from './components/UIComponents';

import { isMobileDevice, getFlipbookClasses, getFlipbookStyle } from './utils/flipbookUtils';
import { MOBILE_BREAKPOINT } from './constants/flipbookConstants';

import styles from './flipbook.module.css';
import { usePdf } from "../../utils/helpers/pdfContext";

function FlipBookOptimized() {
  const { pdfUrl, pdfId } = usePdf(); 
  const token = localStorage.getItem('token');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [bookSize, setBookSize] = useState({ width: 1000, height: 700 });

  const {
    pageImages,
    thumbnails,
    loading,
    error,
    totalPages,
    pageAspectRatio
  } = usePDFLoader(pdfUrl);

  const {
    serverAnnotations,
    localAnnotationsByPage,
    handleAnnotationsChange,
    saveAnnotations,
    deleteAnnotation,
    updateHighlightComment
  } = useAnnotations(pdfId, token);

  const {
    isZoomed,
    zoomLevel,
    isDragging,
    panOffset,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleMouseDown,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useZoom();

  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    getSortedBookmarks
  } = useBookmarks();

  const {
    isDrawing,
    isFreehand,
    freehandWithComment,
    isCommentOpen,
    highlightColor,
    brushSize,
    isEraser,
    brushSizes,
    isInteractionActive,
    activateTool,
    setBrushSize,
    setHighlightColor,
    setIsDrawing,
    setIsCommentOpen
  } = useDrawingTools();

  const {
    currentPage,
    containerRef,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    setFlipbookDisabled
  } = useFlipbook(pageImages, bookSize, isMobile);

  // Refs
  const zoomContainerRef = useRef(null);

  // Memoized calculations
  const memoizedFlipbookClasses = useMemo(() => {
    return getFlipbookClasses({
      isDragging,
      isZoomed,
      isDrawing,
      isCommentOpen,
      isInteractionActive
    });
  }, [isDragging, isZoomed, isDrawing, isCommentOpen, isInteractionActive]);

  const memoizedFlipbookStyle = useMemo(() => {
    return getFlipbookStyle(zoomLevel, panOffset);
  }, [zoomLevel, panOffset]);

  const memoizedZoomContainerStyle = useMemo(() => ({
    height: isZoomed ? '100vh' : bookSize.height, 
    width: isZoomed ? '100vw' : bookSize.width
  }), [isZoomed, bookSize.height, bookSize.width]);

  const memoizedToolbarPosition = useMemo(() => ({
    left: isZoomed || isMobile ? '50%' : 'calc(50% + 100px)'
  }), [isZoomed, isMobile]);

  const memoizedPageNavigationPosition = useMemo(() => ({
    left: isZoomed || isMobile ? '50%' : 'calc(50% + 100px)'
  }), [isZoomed, isMobile]);

  // Calculate book size based on page aspect ratio - exact original logic
  const updateBookSize = useCallback(() => {
    const margin = 100; // tighter margin for mobile
    const maxWidth = isMobile ? window.innerWidth - margin : 1000;
    const maxHeight = isMobile ? window.innerHeight - margin : 900;

    const screenWidth = window.innerWidth - margin;
    const screenHeight = window.innerHeight - margin;

    if (isMobile) {
      // 📱 Single page scaling
      let width = Math.min(screenWidth, maxWidth);
      let height = Math.floor(width / pageAspectRatio);

      if (height > screenHeight) {
        height = screenHeight;
        width = Math.floor(height * pageAspectRatio);
      }

      setBookSize({ width, height });
    } else {
      // 💻 Double page scaling
      const doublePageAspectRatio = pageAspectRatio * 2;

      let width = Math.min(screenWidth, maxWidth);
      let height = Math.floor(width / doublePageAspectRatio);

      if (height > screenHeight) {
        height = screenHeight;
        width = Math.floor(height * doublePageAspectRatio);
      }

      setBookSize({ width, height });
    }
  }, [isMobile, pageAspectRatio]);

  // Update book size when dependencies change
  useEffect(() => {
    if (pageAspectRatio) {
      updateBookSize();
    }
  }, [pageAspectRatio, updateBookSize]);

  // Mobile detection resize - exact original logic
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Book size resize - exact original logic
  useEffect(() => {
    updateBookSize(); // Initial run
    window.addEventListener("resize", updateBookSize);
    return () => window.removeEventListener("resize", updateBookSize);
  }, [pageAspectRatio, updateBookSize]);

  // Touch handling - exact original logic
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoving = false;

    const handleTouchStart = (e) => {
      if (isDrawing) return; // skip if drawing
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchMoving = true;
    };

    const handleTouchMove = (e) => {
      if (!touchMoving) return;
      e.preventDefault(); // prevent scroll while swiping
    };

    const handleTouchEnd = (e) => {
      if (!touchMoving) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;

      const elWidth = el.offsetWidth;
      const threshold = Math.min(60, elWidth * 0.15); // minimum swipe distance

      if (deltaX > threshold) {
        // Swipe right → previous page
        goToPreviousPage();
      } else if (deltaX < -threshold) {
        // Swipe left → next page
        goToNextPage();
      }

      touchMoving = false;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, pageImages, goToPreviousPage, goToNextPage]);

  // Disable flipbook when interacting or zoomed
  useEffect(() => {
    setFlipbookDisabled(isInteractionActive || isZoomed);
  }, [isInteractionActive, isZoomed, setFlipbookDisabled]);

  // Handle wheel events for zoom
  useEffect(() => {
    const container = zoomContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // Memoized event handlers
  const handleSave = useCallback(() => {
    saveAnnotations(pageImages, totalPages);
  }, [saveAnnotations, pageImages, totalPages]);

  const handleMouseDownWrapper = useCallback((e) => {
    handleMouseDown(e, isDrawing, isCommentOpen, isEraser);
  }, [handleMouseDown, isDrawing, isCommentOpen, isEraser]);

  const handlePointerDownWrapper = useCallback((e) => {
    handlePointerDown(e, isDrawing, isCommentOpen, isEraser);
  }, [handlePointerDown, isDrawing, isCommentOpen, isEraser]);

  // Early returns for loading and error states
  if (loading || (pdfUrl && pageImages.length === 0)) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className={styles.container}>
      {/* Floating Toolbar */}
        <div style={memoizedToolbarPosition}>
          <Toolbar
            isDrawing={isDrawing}
            isFreehand={isFreehand}
            freehandWithComment={freehandWithComment}
            isEraser={isEraser}
            isZoomed={isZoomed}
            zoomLevel={zoomLevel}
            activateTool={activateTool}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleZoomReset={handleZoomReset}
            handleSave={handleSave}
            isMobile={isMobile}
          />
        </div>

      {/* Color Palette */}
        <ColorPalette
          isFreehand={isFreehand}
          isDrawing={isDrawing}
          highlightColor={highlightColor}
          brushSize={brushSize}
          setHighlightColor={setHighlightColor}
          setBrushSize={setBrushSize}
          isMobile={isMobile}
        />

      {/* Sidebar */}
        <Sidebar
          thumbnails={thumbnails}
          currentPage={currentPage}
          bookmarks={bookmarks}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          goToPage={goToPage}
          getSortedBookmarks={getSortedBookmarks}
          isZoomed={isZoomed}
          isMobile={isMobile}
        />

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <div 
          ref={zoomContainerRef} 
          className={`${styles.zoomContainer} ${isZoomed ? styles.zoomed : ''}`}
          style={memoizedZoomContainerStyle}
        >
          <div
            ref={containerRef}
            className={memoizedFlipbookClasses}
            style={{ ...memoizedFlipbookStyle, touchAction: 'none' }}
            onMouseDown={handleMouseDownWrapper}
            onPointerDown={handlePointerDownWrapper}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
              <PageRenderer
                pageImages={pageImages}
                pdfId={pdfId}
                isDrawing={isDrawing}
                isFreehand={isFreehand}
                highlightColor={highlightColor}
                brushSize={brushSize}
                setIsDrawing={setIsDrawing}
                setIsCommentOpen={setIsCommentOpen}
                bookSize={bookSize}
                freehandWithComment={freehandWithComment}
                serverAnnotations={serverAnnotations}
                onAnnotationsChange={handleAnnotationsChange}
                isEraser={isEraser}
                onDeleteAnnotation={deleteAnnotation}
                onUpdateHighlightComment={updateHighlightComment}
              />
          </div>
        </div>

        {/* Page Navigation */}
        <div style={memoizedPageNavigationPosition}>
          <PageNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
            isZoomed={isZoomed}
            isDrawing={isDrawing}
            isMobile={isMobile}
          />
        </div>

        {/* Zoom Overlay */}
          <ZoomOverlay
            isZoomed={isZoomed}
            isDragging={isDragging}
            handleZoomReset={handleZoomReset}
          />
      </div>
    </div>
  );
}

export default memo(FlipBookOptimized);
import { useState, useEffect, useCallback, useRef } from 'react';
import $ from 'jquery';
import 'turn.js';

/**
 * Custom hook for managing flipbook functionality
 * Handles flipbook initialization, page navigation, and touch interactions
 */
export const useFlipbook = (pageImages, bookSize, isMobile) => {
  const [currentPage, setCurrentPage] = useState(1);
  const flipbookRef = useRef(null);
  const containerRef = useRef(null);
  const prevPageImagesRef = useRef([]);
  const prevBookSizeRef = useRef(null);

  // Flipbook options - recreated each time like original
  const options = {
    width: bookSize.width,
    height: bookSize.height,
    autoCenter: true,
    display: isMobile ? "single" : "double", 
    acceleration: true,
    elevation: 50,
    cornerSize: 1000,
    gradients: true,
    when: {
      turned: function (e, page) {
        // turn.js uses 1-based page numbers
        setCurrentPage(page);
      }
    }
  };

  // Initialize / reinit flipbook once pageImages are ready - exact original logic
  useEffect(() => {
    const pageImagesChanged = JSON.stringify(prevPageImagesRef.current) !== JSON.stringify(pageImages);
    const bookSizeChanged = JSON.stringify(prevBookSizeRef.current) !== JSON.stringify(bookSize);

    if (!pageImagesChanged && !bookSizeChanged) return;

    prevPageImagesRef.current = pageImages;
    prevBookSizeRef.current = bookSize;

    if (!containerRef.current) return;

    if (flipbookRef.current && flipbookRef.current.data('turn')) {
      try {
        flipbookRef.current.turn("destroy");
      } catch (e) {
        console.warn("Error destroying flipbook:", e);
      }
      flipbookRef.current = null;
    }

    setTimeout(() => {
      try {
        if (containerRef.current && !flipbookRef.current) {
          $(containerRef.current).turn(options);
          flipbookRef.current = $(containerRef.current);
        }
      } catch (e) {
        console.error("Error initializing flipbook:", e);
      }
    }, 100);
  }, [pageImages, bookSize]); // Only depend on pageImages and bookSize like original

  // Navigate to specific page
  const goToPage = useCallback((pageNum) => {
    if (flipbookRef.current) {
      try {
        flipbookRef.current.turn("page", pageNum);
      } catch (e) {
        console.warn('Error going to page:', e);
      }
    }
  }, []);

  // Navigate to previous page
  const goToPreviousPage = useCallback(() => {
    if (flipbookRef.current && currentPage > 1) {
      try {
        flipbookRef.current.turn("previous");
      } catch (e) {
        console.warn('Error going to previous page:', e);
      }
    }
  }, [currentPage]);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    if (flipbookRef.current) {
      try {
        flipbookRef.current.turn("next");
      } catch (e) {
        console.warn('Error going to next page:', e);
      }
    }
  }, []);

  // Disable/enable flipbook interactions
  const setFlipbookDisabled = useCallback((disabled) => {
    if (flipbookRef.current) {
      try {
        flipbookRef.current.turn("disable", disabled);
      } catch (e) {
        console.warn('Error disabling flipbook:', e);
      }
    }
  }, []);

  return {
    currentPage,
    flipbookRef,
    containerRef,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    setFlipbookDisabled
  };
};

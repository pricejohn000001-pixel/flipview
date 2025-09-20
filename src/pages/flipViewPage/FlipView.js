import React, { useState, useRef, useEffect } from "react";
import $ from "jquery";
import "turn.js";
import AnnotatablePage from "../../components/pieces/annotablePage/AnnotablePage";
import {
  FaSave,
  FaTimes,
  FaDrawPolygon,
  FaSquare,
  FaSearchPlus,
  FaSearchMinus,
  FaCompress,
  FaBookmark,
  FaRegBookmark,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import styles from './flipview.module.css';
import { HexColorPicker } from "react-colorful";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      setZoomLevel((prev) => Math.min(prev + 0.5, 3));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1.5) {
      setZoomLevel((prev) => Math.max(prev - 0.5, 1.5));
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!isZoomed) return;

    e.preventDefault();
    const delta = e.deltaY;

    if (delta < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
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
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [zoomLevel, isZoomed]);

  const zoomContainerStyle = {
    position: isZoomed ? "fixed" : "relative",
    top: isZoomed ? "0" : "auto",
    left: isZoomed ? "0" : "auto",
    width: isZoomed ? "100vw" : "1000px",
    height: isZoomed ? "100vh" : "700px",
    zIndex: isZoomed ? 1000 : "auto",
    backgroundColor: isZoomed ? "rgba(0, 0, 0, 0.9)" : "transparent",
    display: isZoomed ? "flex" : "block",
    justifyContent: isZoomed ? "center" : "center",
    alignItems: isZoomed ? "center" : "center",
    overflow: isZoomed ? "auto" : "visible",
    padding: isZoomed ? "20px" : "0"
  };

  const flipbookStyle = {
    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
    transformOrigin: "center center",
    transition: isDragging ? "none" : "transform 0.3s ease-in-out",
    width: options.width,
    height: options.height,
    cursor:
      isZoomed && !isDrawing && !isCommentOpen
        ? isDragging
          ? "grabbing"
          : "grab"
        : isInteractionActive
        ? "default"
        : "pointer"
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: '#2d2d2d',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '280px',
        backgroundColor: '#3a3a3a',
        borderRight: '1px solid #555',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'relative',
        zIndex: isZoomed ? 1001 : 'auto'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #555',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <h3 style={{ color: '#e0e0e0', margin: 0, fontSize: '16px' }}>Pages</h3>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e0e0e0',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px'
            }}
          >
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Page Thumbnails */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: sidebarCollapsed ? '8px 4px' : '16px'
        }}>
          {pages.map((img, idx) => {
            const pageNumber = idx + 1;
            const isBookmarked = bookmarks.has(pageNumber);
            const isCurrentPage = currentPage === pageNumber;

            return (
              <div
                key={idx}
                style={{
                  marginBottom: '12px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <div
                  onClick={() => goToPage(pageNumber)}
                  style={{
                    width: '100%',
                    height: sidebarCollapsed ? '60px' : '120px',
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '6px',
                    border: isCurrentPage ? '2px solid #4a90e2' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentPage) {
                      e.target.style.border = '2px solid #666';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentPage) {
                      e.target.style.border = '2px solid transparent';
                    }
                  }}
                >
                  {/* Page number overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {pageNumber}
                  </div>
                </div>

                {/* Bookmark button */}
                {!sidebarCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(pageNumber);
                    }}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      color: isBookmarked ? '#ffd700' : '#ccc',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '3px',
                      fontSize: '14px',
                      transition: 'color 0.2s ease'
                    }}
                    title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bookmarked Pages Section */}
        {!sidebarCollapsed && [...bookmarks].length > 0 && (
          <div style={{
            borderTop: '1px solid #555',
            padding: '16px'
          }}>
            <h4 style={{ color: '#e0e0e0', margin: '0 0 12px 0', fontSize: '14px' }}>
              Bookmarks ({[...bookmarks].length})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[...bookmarks].sort((a, b) => a - b).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  style={{
                    background: currentPage === pageNum ? '#4a90e2' : '#555',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'background 0.2s ease'
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0',
            margin: '0',
            background: '#404040',
            padding: '8px 16px',
            borderRadius: '0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            userSelect: 'none',
            width: '100%',
            minHeight: '48px',
            borderBottom: '1px solid #555',
            position: isZoomed ? 'fixed' : 'relative',
            top: isZoomed ? '20px' : 'auto',
            left: isZoomed ? '20px' : 'auto',
            zIndex: isZoomed ? 1001 : 'auto',
            backgroundColor: isZoomed ? 'rgba(64, 64, 64, 0.95)' : '#404040',
            borderRadius: isZoomed ? '6px' : '0',
            border: isZoomed ? '1px solid #555' : 'none',
            backdropFilter: isZoomed ? 'blur(10px)' : 'none'
          }}
        >
          <button
            style={{
              background: (!isFreehand && isDrawing) ? '#4a90e2' : 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#e0e0e0',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={() => {
              setIsFreehand(false);
              setIsDrawing(true);
            }}
            title="Draw Rectangle"
          >
            <FaSquare />
          </button>

          <button
            style={{
              background: (isFreehand && isDrawing) ? '#4a90e2' : 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#e0e0e0',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={() => {
              setIsFreehand(true);
              setIsDrawing(true);
            }}
            title="Draw Freehand"
          >
            <FaDrawPolygon />
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#e0e0e0',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={() => setIsDrawing(false)}
            title="Stop Drawing"
          >
            <FaTimes />
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#e0e0e0',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={handleSave}
            title="Save Highlights"
          >
            <FaSave />
          </button>

          <div style={{ borderLeft: '1px solid #666', margin: '0 8px', height: '24px' }}></div>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
              color: zoomLevel >= 3 ? '#888' : '#e0e0e0',
              opacity: zoomLevel >= 3 ? 0.5 : 1,
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoomLevel >= 3}
          >
            <FaSearchPlus />
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: zoomLevel <= 1 ? 'not-allowed' : 'pointer',
              color: zoomLevel <= 1 ? '#888' : '#e0e0e0',
              opacity: zoomLevel <= 1 ? 0.5 : 1,
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoomLevel <= 1}
          >
            <FaSearchMinus />
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              padding: '8px 12px',
              borderRadius: '3px',
              cursor: !isZoomed ? 'not-allowed' : 'pointer',
              color: !isZoomed ? '#888' : '#e0e0e0',
              opacity: !isZoomed ? 0.5 : 1,
              transition: 'background-color 0.2s ease, color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              height: '32px',
              margin: '0 2px'
            }}
            onClick={handleZoomReset}
            title="Reset Zoom"
            disabled={!isZoomed}
          >
            <FaCompress />
          </button>

          {isZoomed && (
            <span style={{
              color: '#e0e0e0',
              fontSize: '13px',
              fontWeight: 'normal',
              marginLeft: '8px',
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              minWidth: '45px',
              textAlign: 'center'
            }}>
              {Math.round(zoomLevel * 100)}%
            </span>
          )}
        </div>

        {/* Color Palette */}
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: (isFreehand && isDrawing) ? '20px' : '-300px',
            width: '260px',
            background: '#3a3a3a',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '16px 20px',
            userSelect: 'none',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: (isFreehand && isDrawing) ? 1 : 0,
            transition: 'right 0.4s ease, opacity 0.3s ease',
            border: '1px solid #555'
          }}
        >
          <h4 style={{
            margin: '0 0 10px 0',
            fontWeight: '500',
            color: '#e0e0e0',
            fontSize: '16px',
            userSelect: 'none'
          }}>
            Pick Highlight Color
          </h4>
          <HexColorPicker color={highlightColor} onChange={setHighlightColor} />
          <div style={{
            marginTop: '12px',
            width: '60px',
            height: '30px',
            borderRadius: '4px',
            border: '1px solid #666',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            backgroundColor: highlightColor
          }} />
        </div>

        {/* Zoom Container */}
        <div ref={zoomContainerRef} style={zoomContainerStyle}>
          <div
            ref={containerRef}
            style={flipbookStyle}
            onMouseDown={handleMouseDown}
          >
            {pages.map((img, idx) => {
              const pageNumber = idx + 1;
              return (
                <div
                  key={idx}
                  style={{ width: options.width / 2, height: options.height }}
                >
                  <AnnotatablePage
                    pageImage={img}
                    pageNumber={pageNumber}
                    isDrawing={isDrawing}
                    isFreehand={isFreehand}
                    highlightColor={highlightColor}
                    setIsDrawing={setIsDrawing}
                    setIsCommentOpen={setIsCommentOpen}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {isZoomed && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999,
              cursor: "pointer"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDragging) {
                handleZoomReset();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default FlipBook;
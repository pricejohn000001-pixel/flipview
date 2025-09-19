import React, { useState, useRef, useEffect } from "react";
import $ from "jquery";
import "turn.js";
import AnnotatablePage from "../../components/pieces/annotablePage/AnnotablePage";
import styles from "./flipView.module.css";
import {
  FaSave,
  FaTimes,
  FaDrawPolygon,
  FaSquare,
  FaSearchPlus,
  FaSearchMinus,
  FaCompress
} from "react-icons/fa";
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
        console.log("Turned to page:", page);
      }
    }
  };

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
    width: isZoomed ? "100vw" : "auto",
    height: isZoomed ? "100vh" : "auto",
    zIndex: isZoomed ? 1000 : "auto",
    backgroundColor: isZoomed ? "rgba(0, 0, 0, 0.9)" : "transparent",
    display: isZoomed ? "flex" : "block",
    justifyContent: isZoomed ? "center" : "flex-start",
    alignItems: isZoomed ? "center" : "flex-start",
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
    <div className={styles.bookContainer}>
      {/* Toolbar */}
      <div
        className={styles.toolbar}
        style={{
          position: isZoomed ? "fixed" : "relative",
          top: isZoomed ? "20px" : "auto",
          left: isZoomed ? "20px" : "auto",
          zIndex: isZoomed ? 1001 : "auto",
          backgroundColor: isZoomed ? "rgba(255, 255, 255, 0.95)" : "transparent",
          borderRadius: isZoomed ? "8px" : "0",
          padding: isZoomed ? "10px" : "0",
          boxShadow: isZoomed ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "none"
        }}
      >
        <button
          className={`${styles.iconButton} ${!isFreehand && isDrawing ? styles.active : ""}`}
          onClick={() => {
            setIsFreehand(false);
            setIsDrawing(true);
          }}
          title="Draw Rectangle"
        >
          <FaSquare />
        </button>

        <button
          className={`${styles.iconButton} ${isFreehand && isDrawing ? styles.active : ""}`}
          onClick={() => {
            setIsFreehand(true);
            setIsDrawing(true);
          }}
          title="Draw Freehand"
        >
          <FaDrawPolygon />
        </button>

        <button className={styles.iconButton} onClick={() => setIsDrawing(false)} title="Stop Drawing">
          <FaTimes />
        </button>

        <button className={styles.iconButton} onClick={handleSave} title="Save Highlights">
          <FaSave />
        </button>

        <div style={{ borderLeft: "1px solid #ccc", margin: "0 10px", height: "30px" }}></div>

        <button className={styles.iconButton} onClick={handleZoomIn} title="Zoom In" disabled={zoomLevel >= 3}>
          <FaSearchPlus />
        </button>

        <button className={styles.iconButton} onClick={handleZoomOut} title="Zoom Out" disabled={zoomLevel <= 1}>
          <FaSearchMinus />
        </button>

        <button className={styles.iconButton} onClick={handleZoomReset} title="Reset Zoom" disabled={!isZoomed}>
          <FaCompress />
        </button>

        {isZoomed && (
          <span style={{ marginLeft: "10px", fontSize: "14px", color: "#666", fontWeight: "bold" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
        )}
      </div>

      {/* Color Palette */}
      <div
        className={`${styles.colorPaletteCard} ${
          isFreehand && isDrawing ? styles.colorPaletteCardVisible : ""
        }`}
      >
        <h4>Pick Highlight Color</h4>
        <HexColorPicker color={highlightColor} onChange={setHighlightColor} />
        <div className={styles.colorPreview} style={{ backgroundColor: highlightColor }} />
      </div>

      {/* Zoom Container */}
      <div ref={zoomContainerRef} style={zoomContainerStyle}>
        <div
          ref={containerRef}
          className="magazine"
          style={flipbookStyle}
          onMouseDown={handleMouseDown}
        >
          {pages.map((img, idx) => {
            const pageNumber = idx + 1;
            return (
              <div
                key={idx}
                className="page"
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
  );
}

export default FlipBook;

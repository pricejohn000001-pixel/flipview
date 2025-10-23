import React, { memo } from 'react';
import {
  FaSave,
  FaSearchPlus,
  FaSearchMinus,
  FaCompress,
  FaEraser,
} from 'react-icons/fa';
import { MdHighlightAlt } from 'react-icons/md';
import { TbHighlight } from 'react-icons/tb';
import { FaHighlighter } from 'react-icons/fa';
import styles from '../flipbook.module.css';

/**
 * Toolbar component for FlipBook
 * Contains drawing tools, zoom controls, and save functionality
 */
const Toolbar = memo(({
  // Drawing tool states
  isDrawing,
  isFreehand,
  freehandWithComment,
  isEraser,
  
  // Zoom states
  isZoomed,
  zoomLevel,
  
  // Actions
  activateTool,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  handleSave,
  
  // Layout
  isMobile
}) => {
  return (
    <div 
      className={styles.toolbar} 
      style={{ left: isZoomed || isMobile ? '50%' : 'calc(50% + 100px)' }}
    >
      <div className={styles.toolbarGrid}>
        <div className={styles.toolbarSection}>
          <span className={styles.toolbarSectionTitle}>Draw</span>

          {/* Draw Rectangle Toggle */}
          <button
            className={`${styles.toolbarButton} ${(!isFreehand && isDrawing) ? styles.active : ''}`}
            onClick={() => {
              if (!isDrawing || isFreehand) {
                activateTool({ drawing: true, freehand: false, freehandWithComment: false, eraser: false });
              } else {
                activateTool({ drawing: false });
              }
            }}
            title="Draw Rectangle"
          >
            <MdHighlightAlt />
          </button>

          {/* Freehand Toggle */}
          <button
            className={`${styles.toolbarButton} ${(isFreehand && isDrawing && freehandWithComment) ? styles.active : ''}`}
            onClick={() => {
              // if already active, toggle off; otherwise enable freehand-with-comment
              if (isFreehand && isDrawing && freehandWithComment) {
                activateTool({ drawing: false });
              } else {
                activateTool({ drawing: true, freehand: true, freehandWithComment: true });
              }
            }}
            title="Freehand (opens comment)"
          >
            <TbHighlight />
          </button>

          {/* Freehand without comment (instant save) */}
          <button
            className={`${styles.toolbarButton} ${(isFreehand && isDrawing && !freehandWithComment) ? styles.active : ''}`}
            onClick={() => {
              if (isFreehand && isDrawing && !freehandWithComment) {
                activateTool({ drawing: false });
              } else {
                activateTool({ drawing: true, freehand: true, freehandWithComment: false });
              }
            }}
            title="Freehand (save immediately, no comment box)"
          >
            <FaHighlighter />
          </button>

          <button
            className={`${styles.toolbarButton} ${isEraser ? styles.active : ''}`}
            onClick={() => activateTool({ eraser: !isEraser })}
            title="Eraser (click highlights to remove)"
          >
            <FaEraser />
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
          <button 
            className={styles.toolbarButton} 
            onClick={handleZoomIn} 
            disabled={zoomLevel >= 3} 
            title="Zoom In"
          >
            <FaSearchPlus />
          </button>
          <button 
            className={styles.toolbarButton} 
            onClick={handleZoomOut} 
            disabled={zoomLevel <= 1} 
            title="Zoom Out"
          >
            <FaSearchMinus />
          </button>
          <button 
            className={styles.toolbarButton} 
            onClick={handleZoomReset} 
            disabled={!isZoomed} 
            title="Reset Zoom"
          >
            <FaCompress />
          </button>
          {isZoomed && (
            <span className={styles.zoomPercentage}>
              {Math.round(zoomLevel * 100)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;

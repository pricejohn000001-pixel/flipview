import React, { memo } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { HexColorPicker } from 'react-colorful';
import { FaCircle } from 'react-icons/fa';
import styles from '../flipbook.module.css';
import { DEFAULT_COLORS, BRUSH_SIZES } from '../constants/flipbookConstants';

/**
 * ColorPalette component for FlipBook
 * Handles color selection and brush size controls
 */
const ColorPalette = memo(({
  isFreehand,
  isDrawing,
  highlightColor,
  brushSize,
  setHighlightColor,
  setBrushSize,
  isMobile
}) => {
  if (!(isFreehand && isDrawing)) {
    return null;
  }

  return (
    <div className={`${styles.colorPalette} ${isMobile ? styles.colorPaletteMobile : ''}`}>
      <h4 className={styles.colorPaletteTitle}>Highlight Color</h4>
      
      {isMobile ? (
        // Mobile: Compact design with preset colors and simplified controls
        <div className={styles.mobileColorControls}>
          <div className={styles.presetColors}>
            {DEFAULT_COLORS.map(color => (
              <button
                key={color}
                className={`${styles.presetColorButton} ${highlightColor === color ? styles.active : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setHighlightColor(color)}
                title={`Select ${color}`}
              />
            ))}
          </div>
          <div className={styles.mobileColorPreview} style={{ backgroundColor: highlightColor }} />
          
          <div className={styles.mobileBrushSize}>
            <span className={styles.brushSizeLabel}>Size:</span>
            <div className={styles.brushSizeSlider}>
              {BRUSH_SIZES.map(size => (
                <button
                  key={size}
                  className={`${styles.mobileBrushButton} ${brushSize === size ? styles.active : ""}`}
                  onClick={() => setBrushSize(size)}
                  title={`${size}px`}
                >
                  <FaCircle style={{ fontSize: Math.max(8, size), color: "white" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Desktop: Full color picker
        <>
          <HexColorPicker 
            className={styles.colorPicker} 
            color={highlightColor} 
            onChange={setHighlightColor} 
          />
          <div className={styles.colorPreview} style={{ backgroundColor: highlightColor }} />
          <div className={styles.brushSizeSection}>
            <h4 className={styles.brushSizeTitle}>Brush Size</h4>
            <div className={styles.brushSizeContainer}>
              {BRUSH_SIZES.map(size => (
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
        </>
      )}
    </div>
  );
});

ColorPalette.displayName = 'ColorPalette';

export default ColorPalette;

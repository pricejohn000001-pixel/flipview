import React, { useEffect, useRef } from 'react';
import {
  MdZoomIn,
  MdZoomOut,
  MdSearch,
  MdTextFields,
} from 'react-icons/md';
import styles from '../documentWorkspace.module.css';
import FreehandPalette from './FreehandPalette';

const FloatingToolbar = ({
  toolTypes,
  activeTool,
  onToolClick,
  onManualZoom,
  primaryScale,
  colorOptions,
  activeColor,
  onColorSelect,
  brushSizeOptions = [],
  activeBrushSize,
  onBrushSizeSelect,
  freehandColorOptions = colorOptions,
  freehandMode = 'freehand',
  onFreehandModeChange,
  isPressureEnabled = true,
  onTogglePressure,
  isFreehandPaletteVisible = false,
  onFreehandPaletteDismiss,
  activeBrushOpacity = 1,
  onBrushOpacityChange,
  isFreehandCommentMode = false,
  onToggleFreehandCommentMode,
  searchTerm,
  onSearchTermChange,
  onSearch,
  handleOcrCurrentPage,
  handleOcrAllPages,
  isOcrRunning,
  ocrResults,
  ocrProgress,
  primaryPage,
  numPages,
}) => {
  const ocrBadge = ocrProgress[primaryPage];
  const hasOcr = ocrResults[primaryPage];

  const progressBadgeStyle = {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 8,
    background: '#3b82f6',
    color: 'white',
    borderRadius: '50%',
    width: 14,
    height: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const successBadgeStyle = {
    ...progressBadgeStyle,
    background: '#22c55e',
  };

  const paletteRef = useRef(null);
  const freehandButtonRef = useRef(null);

  useEffect(() => {
    if (!isFreehandPaletteVisible) return;
    const handlePointerDown = (event) => {
      if (paletteRef.current?.contains(event.target)) return;
      if (freehandButtonRef.current?.contains(event.target)) return;
      onFreehandPaletteDismiss?.();
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isFreehandPaletteVisible, onFreehandPaletteDismiss]);

  return (
    <div className={styles.floatingToolbarContainer}>
      <div className={styles.floatingToolbarStack}>
        <div className={styles.floatingToolbar}>
          <div className={styles.toolbarIconGroup}>
            {toolTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.toolIconButton} ${activeTool === id ? styles.toolIconButtonActive : ''}`}
                onClick={() => onToolClick(id)}
                title={label}
                ref={id === 'freehand' ? freehandButtonRef : undefined}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          <div className={styles.toolbarDivider} />

          <div className={styles.toolbarIconGroup}>
            <div className={styles.toolbarSubGroup}>
              <button type="button" className={styles.toolIconButton} onClick={() => onManualZoom('out')} title="Zoom out">
                <MdZoomOut size={18} />
              </button>
              <span className={styles.zoomValue}>{Math.round(primaryScale * 100)}%</span>
              <button type="button" className={styles.toolIconButton} onClick={() => onManualZoom('in')} title="Zoom in">
                <MdZoomIn size={18} />
              </button>
            </div>
            <div className={styles.toolbarSubGroup}>
              <div className={styles.colorSwatches}>
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorDot} ${activeColor === color ? styles.colorDotActive : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onColorSelect(color)}
                  />
                ))}
              </div>
            </div>
            <div className={styles.toolbarSubGroup}>
              <input
                className={styles.toolbarSearchInput}
                type="search"
                placeholder="Search text…"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
              <button type="button" className={styles.toolIconButton} onClick={onSearch} title="Search document">
                <MdSearch size={18} />
              </button>
            </div>
            <div className={styles.toolbarSubGroup}>
              <button
                type="button"
                className={styles.toolIconButton}
                onClick={handleOcrCurrentPage}
                disabled={isOcrRunning}
                title={hasOcr ? `Re-run OCR on page ${primaryPage}` : `Run OCR on page ${primaryPage}`}
                style={{ position: 'relative' }}
              >
                <MdTextFields size={18} />
                {ocrBadge && ocrBadge.progress > 0 && ocrBadge.progress < 100 && (
                  <span style={progressBadgeStyle}>
                    {ocrBadge.progress}%
                  </span>
                )}
                {hasOcr && !ocrBadge && (
                  <span style={successBadgeStyle}>✓</span>
                )}
              </button>
              {numPages > 1 && (
                <button
                  type="button"
                  className={styles.toolIconButton}
                  onClick={handleOcrAllPages}
                  disabled={isOcrRunning}
                  title={`Run OCR on all ${numPages} pages`}
                >
                  <MdTextFields size={18} />
                  <span style={{ fontSize: 10, marginLeft: 2 }}>All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isFreehandPaletteVisible && (
          <FreehandPalette
            ref={paletteRef}
            freehandMode={freehandMode}
            onFreehandModeChange={onFreehandModeChange}
            freehandColorOptions={freehandColorOptions}
            activeColor={activeColor}
            onColorSelect={onColorSelect}
            brushSizeOptions={brushSizeOptions}
            activeBrushSize={activeBrushSize}
            onBrushSizeSelect={onBrushSizeSelect}
            activeBrushOpacity={activeBrushOpacity}
            onBrushOpacityChange={onBrushOpacityChange}
            isPressureEnabled={isPressureEnabled}
            onTogglePressure={onTogglePressure}
            isFreehandCommentMode={isFreehandCommentMode}
            onToggleFreehandCommentMode={onToggleFreehandCommentMode}
          />
        )}
      </div>
    </div>
  );
};

export default FloatingToolbar;


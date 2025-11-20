import React, { useEffect, useRef } from 'react';
import {
  MdZoomIn,
  MdZoomOut,
  MdSearch,
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
}) => {
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


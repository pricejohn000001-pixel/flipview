import React, { forwardRef, memo } from 'react';
import styles from '../documentWorkspace.module.css';

const FreehandPalette = forwardRef(
  (
    {
      freehandMode = 'freehand',
      onFreehandModeChange,
      freehandColorOptions = [],
      activeColor,
      onColorSelect,
      brushSizeOptions = [],
      activeBrushSize,
      onBrushSizeSelect,
      activeBrushOpacity = 1,
      onBrushOpacityChange,
      isPressureEnabled = true,
      onTogglePressure,
      isFreehandCommentMode = false,
      onToggleFreehandCommentMode,
    },
    ref,
  ) => (
    <div className={styles.freehandPalette} ref={ref}>
      <div className={styles.paletteSection}>
        <p className={styles.panelLabel}>Stroke Type</p>
        <div className={styles.freehandModeToggle}>
          {['straight', 'freehand'].map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.modeButton} ${freehandMode === mode ? styles.modeButtonActive : ''}`}
              onClick={() => onFreehandModeChange?.(mode)}
              aria-pressed={freehandMode === mode}
            >
              <span className={styles.modeIcon} aria-hidden="true" />
              {mode === 'straight' ? 'Straight' : 'Freehand'}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.paletteSection}>
        <p className={styles.panelLabel}>Colors</p>
        <div className={styles.freehandColorGrid}>
          {freehandColorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`${styles.paletteColorDot} ${activeColor === color ? styles.paletteColorDotActive : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorSelect?.(color)}
              aria-pressed={activeColor === color}
              title={`Select ${color}`}
            />
          ))}
        </div>
      </div>
      <div className={styles.paletteSection}>
        <p className={styles.panelLabel}>Brush Width</p>
        <div className={styles.brushSizePicker}>
          {brushSizeOptions.map((size) => {
            const isActive = activeBrushSize === size.value;
            return (
              <button
                key={size.id}
                type="button"
                className={`${styles.brushSizeChip} ${isActive ? styles.brushSizeChipActive : ''}`}
                onClick={() => onBrushSizeSelect?.(size.value)}
                aria-pressed={isActive}
                title={`${size.label} brush`}
              >
                <span
                  className={styles.brushSizeIndicator}
                  style={{
                    width: `${Math.max(size.preview, 6)}px`,
                    height: `${Math.max(size.preview, 6)}px`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.paletteSection}>
        <p className={styles.panelLabel}>Opacity</p>
        <div className={styles.opacityControl}>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={activeBrushOpacity}
            aria-label="Brush opacity"
            onChange={(e) => onBrushOpacityChange?.(Number(e.target.value))}
          />
          <span className={styles.opacityValue}>{Math.round((activeBrushOpacity ?? 1) * 100)}%</span>
        </div>
      </div>
      <div className={styles.paletteSection}>
        <p className={styles.panelLabel}>Comment Mode</p>
        <button
          type="button"
          className={`${styles.commentModeButton} ${isFreehandCommentMode ? styles.commentModeButtonActive : ''}`}
          onClick={() => onToggleFreehandCommentMode?.(!isFreehandCommentMode)}
        >
          {isFreehandCommentMode ? 'Linked to comment' : 'Attach next stroke'}
        </button>
      </div>
      <div className={styles.pressureToggle}>
        <div>
          <p className={styles.panelLabel}>Sense Pressure</p>
          <small>Use stylus pressure to vary width</small>
        </div>
        <button
          type="button"
          className={`${styles.pressureSwitch} ${isPressureEnabled ? styles.pressureSwitchOn : ''}`}
          onClick={() => onTogglePressure?.(!isPressureEnabled)}
          aria-pressed={isPressureEnabled}
          title="Toggle pressure sensitivity"
        >
          <span className={styles.pressureSwitchKnob} />
        </button>
      </div>
    </div>
  ),
);

export default memo(FreehandPalette);



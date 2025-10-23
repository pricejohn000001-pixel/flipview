import React, { memo } from 'react';
import styles from '../flipbook.module.css';

/**
 * LoadingSpinner component for FlipBook
 * Shows loading state while PDF is being processed
 */
const LoadingSpinner = memo(() => {
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
});

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * ErrorDisplay component for FlipBook
 * Shows error state when PDF loading fails
 */
const ErrorDisplay = memo(({ error }) => {
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
});

ErrorDisplay.displayName = 'ErrorDisplay';

/**
 * ZoomOverlay component for FlipBook
 * Provides click-to-exit functionality when zoomed
 */
const ZoomOverlay = memo(({ isZoomed, isDragging, handleZoomReset }) => {
  if (!isZoomed) return null;

  return (
    <div
      className={styles.zoomOverlay}
      onClick={(e) => { 
        if (e.target === e.currentTarget && !isDragging) {
          handleZoomReset(); 
        } 
      }}
    />
  );
});

ZoomOverlay.displayName = 'ZoomOverlay';

export { LoadingSpinner, ErrorDisplay, ZoomOverlay };

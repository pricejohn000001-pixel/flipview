import React from 'react';
import styles from '../documentWorkspace.module.css';

const ClippingsPanel = ({
  clippings,
  selectedClippings,
  onCreateClipping,
  onCombineClippings,
  onToggleClippingSelection,
  onClippingDragStart,
  onReorderClipping,
  onRemoveClipping,
  onJumpToPage,
  getPrimaryPageFromSource,
}) => (
  <aside className={styles.leftPanel}>
    <div className={styles.panelHeader}>Clippings &amp; Excerpts</div>
    <div className={styles.panelContent}>
      <div className={styles.toolbarGroup}>
        <button type="button" className={styles.primaryActionButton} onClick={onCreateClipping}>Create clipping</button>
        <button type="button" className={styles.secondaryActionButton} onClick={onCombineClippings} disabled={selectedClippings.length < 2}>Combine</button>
      </div>

      {clippings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>For text PDFs: Select text → "Create clipping"</p>
          <p style={{ fontSize: '0.85em', marginTop: 8, color: '#666' }}>
            For scanned PDFs: Use "Clip Area" tool to select region
          </p>
        </div>
      ) : (
        clippings.map((clip) => (
          <label
            key={clip.id}
            className={`${styles.clippingCard} ${selectedClippings.includes(clip.id) ? styles.clippingCardSelected : ''}`}
            draggable
            onDragStart={(e) => onClippingDragStart(e, clip.id)}
          >
            <input type="checkbox" checked={selectedClippings.includes(clip.id)} onChange={() => onToggleClippingSelection(clip.id)} />
            <small>
              Pages:{' '}
              {clip.segments
                ? Array.from(new Set(clip.segments.map(seg => getPrimaryPageFromSource(seg.sourcePage)))).join(', ')
                : clip.sourcePage}
            </small>
            {clip.segments ? (
              <div className={styles.combinedClipPreview}>
                {clip.segments.map(seg => (
                  <p key={seg.id} className={styles.combinedClipSegment}>
                    <strong>{seg.label}:</strong> {seg.content}
                  </p>
                ))}
              </div>
            ) : (
              <p style={{ whiteSpace: 'pre-wrap', maxHeight: 96, overflow: 'auto' }}>{clip.content}</p>
            )}
            <div className={styles.clippingActions}>
              <button type="button" className={styles.linkButton} onClick={() => onJumpToPage(getPrimaryPageFromSource(clip.sourcePage))}>Jump</button>
              <button type="button" className={styles.linkButton} onClick={() => onReorderClipping(clip.id, -1)}>Up</button>
              <button type="button" className={styles.linkButton} onClick={() => onReorderClipping(clip.id, 1)}>Down</button>
              <button type="button" className={styles.linkButton} onClick={() => onRemoveClipping(clip.id)}>Remove</button>
            </div>
          </label>
        ))
      )}
    </div>
  </aside>
);

export default ClippingsPanel;


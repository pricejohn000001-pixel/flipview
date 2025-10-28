import React, { memo } from 'react';
import AnnotatablePage from '../../../components/pieces/annotablePage/AnnotablePage';
import styles from '../flipbook.module.css';

/**
 * PageRenderer component for FlipBook
 * Renders individual PDF pages with annotations
 */
const PageRenderer = memo(({
  pageImages,
  pdfId,
  isDrawing,
  isFreehand,
  highlightColor,
  brushSize,
  setIsDrawing,
  setIsCommentOpen,
  bookSize,
  freehandWithComment,
  serverAnnotations,
  onAnnotationsChange,
  isEraser,
  onDeleteAnnotation,
  onUpdateHighlightComment
}) => {
  return (
    <>
      {pageImages.map((pageImg, idx) => {
        const pageNumber = idx + 1;
        return (
          <div key={idx} className={styles.page}>
            <AnnotatablePage
              pageImage={pageImg}
              pageNumber={pageNumber}
              pdfId={pdfId}
              isDrawing={isDrawing}
              isFreehand={isFreehand}
              highlightColor={highlightColor}
              brushSize={brushSize}
              setIsDrawing={setIsDrawing}
              setIsCommentOpen={setIsCommentOpen}
              stageWidth={bookSize.width}
              stageHeight={bookSize.height}
              freehandOpensComment={freehandWithComment} 
              serverAnnotations={serverAnnotations}
              onAnnotationsChange={onAnnotationsChange}
              eraserMode={isEraser}
              onDeleteAnnotation={onDeleteAnnotation}
              onUpdateHighlightComment={onUpdateHighlightComment}
            />
          </div>
        );
      })}
    </>
  );
});

PageRenderer.displayName = 'PageRenderer';

export default PageRenderer;

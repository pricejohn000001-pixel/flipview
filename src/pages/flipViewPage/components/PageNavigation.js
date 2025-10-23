import React, { memo } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from '../flipbook.module.css';
import { formatPageNumber } from '../utils/flipbookUtils';

/**
 * PageNavigation component for FlipBook
 * Contains previous/next buttons and page counter
 */
const PageNavigation = memo(({
  currentPage,
  totalPages,
  goToPreviousPage,
  goToNextPage,
  isZoomed,
  isDrawing,
  isMobile
}) => {
  if (isZoomed || isDrawing) {
    return null;
  }

  return (
    <div 
      className={styles.pageNavigation} 
      style={{ left: isZoomed || isMobile ? '50%' : 'calc(50% + 100px)' }}
    >
      <button
        className={styles.toolbarButton}
        onClick={goToPreviousPage}
        disabled={currentPage <= 1}
        title="Previous Page"
      >
        <FaChevronLeft />
      </button>
      <div className={styles.pageInfo}>
        {formatPageNumber(currentPage, totalPages)}
      </div>
      <button
        className={styles.toolbarButton}
        onClick={goToNextPage}
        disabled={currentPage >= totalPages}
        title="Next Page"
      >
        <FaChevronRight />
      </button>
    </div>
  );
});

PageNavigation.displayName = 'PageNavigation';

export default PageNavigation;

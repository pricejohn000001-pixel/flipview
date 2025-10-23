import React, { memo } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import styles from '../flipbook.module.css';

/**
 * Sidebar component for FlipBook
 * Contains thumbnails, bookmarks, and navigation
 */
const Sidebar = memo(({
  thumbnails,
  currentPage,
  bookmarks,
  isBookmarked,
  toggleBookmark,
  goToPage,
  getSortedBookmarks,
  isZoomed,
  isMobile
}) => {
  if (isZoomed || isMobile) {
    return null;
  }

  return (
    <div className={`${styles.sidebar} ${isZoomed ? styles.zoomed : ''}`}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>
          PDF Viewer
        </h3>
      </div>

      <div className={styles.thumbnailContainer}>
        {thumbnails.map((thumbnail, idx) => {
          const pageNumber = idx + 1;
          const isBookmarkedPage = isBookmarked(pageNumber);
          const isCurrentPage = currentPage === pageNumber;

          return (
            <div key={idx} className={styles.thumbnailWrapper}>
              <div
                className={`${styles.thumbnail} ${isCurrentPage ? styles.current : ''}`}
                onClick={() => goToPage(pageNumber)}
                style={{ backgroundImage: `url(${thumbnail})` }}
              >
                <div className={styles.pageNumber}>{pageNumber}</div>
              </div>

              <button
                className={`${styles.bookmarkButton} ${isBookmarkedPage ? styles.bookmarked : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleBookmark(pageNumber); }}
                title={isBookmarkedPage ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarkedPage ? <FaBookmark /> : <FaRegBookmark />}
              </button>
            </div>
          );
        })}
      </div>

      {getSortedBookmarks().length > 0 && (
        <div className={styles.bookmarksSection}>
          <h4 className={styles.bookmarksTitle}>
            Bookmarks ({getSortedBookmarks().length})
          </h4>
          <div className={styles.bookmarksList}>
            {getSortedBookmarks().map(pageNum => (
              <button
                key={pageNum}
                className={`${styles.bookmarkPageButton} ${currentPage === pageNum ? styles.current : ''}`}
                onClick={() => goToPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

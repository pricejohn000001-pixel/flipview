import React from 'react';
import styles from '../documentWorkspace.module.css';

const SearchPanel = ({ isSearching, results, onSelectResult }) => (
  <div className={styles.searchPanel}>
    <div className={styles.searchPanelHeader}>Search results</div>
    <div className={styles.searchPanelBody}>
      {isSearching ? (
        <div className={styles.emptyState}>Searching…</div>
      ) : results.length === 0 ? (
        <div className={styles.emptyState}>Enter a term.</div>
      ) : (
        <div className={styles.searchResults}>
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              className={styles.searchResultItem}
              onClick={() => onSelectResult(result.pageNumber)}
            >
              Page {result.pageNumber}{' '}
              {result.source && <span style={{ fontSize: 10, color: '#666' }}>({result.source})</span>}
              <br />
              …{result.snippet}…
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default SearchPanel;


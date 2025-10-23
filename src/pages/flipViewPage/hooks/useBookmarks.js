import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing bookmarks
 * Handles bookmark state, localStorage persistence, and bookmark operations
 */
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState(new Set());

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('flipbook-bookmarks');
    if (saved) {
      try {
        setBookmarks(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Error parsing bookmarks from storage', e);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever bookmarks change
  useEffect(() => {
    try {
      localStorage.setItem('flipbook-bookmarks', JSON.stringify([...bookmarks]));
    } catch (e) {
      console.error('Error saving bookmarks', e);
    }
  }, [bookmarks]);

  // Toggle bookmark for a specific page
  const toggleBookmark = useCallback((pageNum) => {
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(pageNum)) {
        newBookmarks.delete(pageNum);
      } else {
        newBookmarks.add(pageNum);
      }
      return newBookmarks;
    });
  }, []);

  // Check if a page is bookmarked
  const isBookmarked = useCallback((pageNum) => {
    return bookmarks.has(pageNum);
  }, [bookmarks]);

  // Get sorted bookmark list
  const getSortedBookmarks = useCallback(() => {
    return [...bookmarks].sort((a, b) => a - b);
  }, [bookmarks]);

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    setBookmarks(new Set());
  }, []);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    getSortedBookmarks,
    clearBookmarks
  };
};

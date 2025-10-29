/**
 * Utility functions for FlipBook component
 */

/**
 * Calculate book size based on page aspect ratio and screen dimensions
 * @param {number} pageAspectRatio - The aspect ratio of the page
 * @param {boolean} isMobile - Whether the device is mobile
 * @returns {Object} - Object containing width and height
 */
export const calculateBookSize = (pageAspectRatio, isMobile) => {
  const margin = 100; // tighter margin for mobile
  const maxWidth = isMobile ? window.innerWidth - margin : 1000;
  const maxHeight = isMobile ? window.innerHeight - margin : 900;

  const screenWidth = window.innerWidth - margin;
  const screenHeight = window.innerHeight - margin;

  if (isMobile) {
    // 📱 Single page scaling
    let width = Math.min(screenWidth, maxWidth);
    let height = Math.floor(width / pageAspectRatio);

    if (height > screenHeight) {
      height = screenHeight;
      width = Math.floor(height * pageAspectRatio);
    }

    return { width, height };
  } else {
    // 💻 Double page scaling
    const doublePageAspectRatio = pageAspectRatio * 2;

    let width = Math.min(screenWidth, maxWidth);
    let height = Math.floor(width / doublePageAspectRatio);

    if (height > screenHeight) {
      height = screenHeight;
      width = Math.floor(height * doublePageAspectRatio);
    }

    return { width, height };
  }
};

/**
 * Check if device is mobile based on window width
 * @param {number} breakpoint - Breakpoint for mobile detection (default: 768)
 * @returns {boolean} - Whether the device is mobile
 */
export const isMobileDevice = (breakpoint = 768) => {
  return window.innerWidth <= breakpoint;
};

/**
 * Generate CSS classes for flipbook based on current state
 * @param {Object} state - Current flipbook state
 * @returns {string} - Space-separated CSS class names
 */
export const getFlipbookClasses = (state) => {
  const { isDragging, isZoomed, isDrawing, isCommentOpen, isInteractionActive } = state;
  let classes = ['flipbook'];
  
  if (isDragging) classes.push('dragging');
  if (isZoomed && !isDrawing && !isCommentOpen) {
    classes.push(isDragging ? 'zoomedGrabbing' : 'zoomedGrab');
  }
  if (isInteractionActive) classes.push('interacting');
  
  return classes.join(' ');
};

/**
 * Generate flipbook style object for zoom and pan
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} panOffset - Current pan offset {x, y}
 * @returns {Object} - Style object for transform
 */
export const getFlipbookStyle = (zoomLevel, panOffset) => {
  return {
    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
    transformOrigin: 'center center',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    WebkitTransform: `translateZ(0)`
  };
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Create a placeholder image for error cases
 * @param {string} message - Error message to display
 * @returns {string} - Base64 encoded SVG placeholder
 */
export const createPlaceholderImage = (message = "Error loading page") => {
  const svg = `
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#999" text-anchor="middle" dy=".3em">${message}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Format page number for display
 * @param {number} current - Current page number
 * @param {number} total - Total number of pages
 * @returns {string} - Formatted page string
 */
export const formatPageNumber = (current, total) => {
  return `${current} / ${total}`;
};

/**
 * Validate PDF URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidPDFUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return url.toLowerCase().includes('.pdf') || url.includes('pdf');
  } catch {
    return false;
  }
};

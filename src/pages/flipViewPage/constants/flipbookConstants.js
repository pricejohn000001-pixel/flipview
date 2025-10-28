/**
 * Constants for FlipBook component
 */

// Drawing tool constants
export const DRAWING_TOOLS = {
  RECTANGLE: 'rectangle',
  FREEHAND: 'freehand',
  FREEHAND_WITH_COMMENT: 'freehand_with_comment',
  ERASER: 'eraser'
};

// Brush sizes
export const BRUSH_SIZES = [2, 4, 8, 12, 20];

// Default colors
export const DEFAULT_COLORS = [
  '#fffb00', // Yellow
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#ffeaa7', // Light Yellow
  '#fd79a8', // Pink
  '#fdcb6e'  // Orange
];

// Default highlight color
export const DEFAULT_HIGHLIGHT_COLOR = '#fffb00';

// Default brush size
export const DEFAULT_BRUSH_SIZE = 4;

// Zoom levels
export const ZOOM_LEVELS = {
  MIN: 1,
  MAX: 3,
  STEP: 0.5,
  DEFAULT: 1.5
};

// Page aspect ratios
export const PAGE_ASPECT_RATIOS = {
  A4: 8.5 / 11,
  LETTER: 8.5 / 11,
  LEGAL: 8.5 / 14
};

// Mobile breakpoint - matches original FlipBook
export const MOBILE_BREAKPOINT = 1200;

// PDF.js configuration
export const PDF_JS_CONFIG = {
  VERSION: '3.11.174',
  CDN_BASE: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174',
  WORKER_SRC: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  SCRIPT_SRC: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  CMAP_URL: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
  CMAP_PACKED: true
};

// Rendering configuration
export const RENDERING_CONFIG = {
  FULL_PAGE_SCALE: 1.5,
  THUMBNAIL_SCALE: 0.35,
  BATCH_SIZE: 5
};

// Touch interaction thresholds
export const TOUCH_THRESHOLDS = {
  MIN_SWIPE_DISTANCE: 60,
  SWIPE_PERCENTAGE: 0.15
};

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500
};

// Local storage keys
export const STORAGE_KEYS = {
  BOOKMARKS: 'flipbook-bookmarks',
  ANNOTATIONS: 'annotations-page-'
};

// API endpoints
export const API_ENDPOINTS = {
  GET_ANNOTATIONS: 'user/pdf-anotaion?action=get-annotations',
  STORE_ANNOTATIONS: 'user/pdf-anotaion?action=store-anotation',
  UPDATE_ANNOTATIONS: 'user/pdf-anotaion?action=update-annotation'
};

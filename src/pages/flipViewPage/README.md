# FlipBook Module - Optimized & Modular

This is an optimized and modular version of the FlipBook component, designed for better performance, maintainability, and reusability.

## 🚀 Key Improvements

### Performance Optimizations
- **Lazy Loading**: Components are loaded on-demand to reduce initial bundle size
- **Memoization**: Expensive calculations are memoized to prevent unnecessary re-renders
- **Batch Processing**: PDF pages are rendered in batches to prevent memory issues
- **Throttled Events**: Resize and scroll events are throttled for better performance
- **Memory Management**: Proper cleanup and memory monitoring utilities

### Modular Architecture
- **Custom Hooks**: Logic is extracted into reusable custom hooks
- **Component Separation**: UI is broken down into smaller, focused components
- **Utility Functions**: Common functionality is extracted into utility modules
- **Constants**: Configuration values are centralized

## 📁 File Structure

```
src/pages/flipViewPage/
├── FlipBookOptimized.js          # Main optimized component
├── FlipBook.js                    # Original component (for reference)
├── flipbook.module.css           # Styles
├── hooks/                        # Custom hooks
│   ├── index.js
│   ├── usePDFLoader.js           # PDF loading and rendering
│   ├── useAnnotations.js         # Annotation management
│   ├── useZoom.js                # Zoom and pan functionality
│   ├── useBookmarks.js           # Bookmark management
│   ├── useDrawingTools.js        # Drawing tools state
│   └── useFlipbook.js            # Flipbook core functionality
├── components/                   # UI components
│   ├── index.js
│   ├── Toolbar.js                # Drawing and zoom controls
│   ├── ColorPalette.js           # Color and brush selection
│   ├── Sidebar.js                # Thumbnails and bookmarks
│   ├── PageNavigation.js          # Page navigation controls
│   ├── PageRenderer.js           # PDF page rendering
│   └── UIComponents.js          # Loading, error, and overlay components
├── utils/                        # Utility functions
│   ├── flipbookUtils.js         # Core utility functions
│   └── performanceUtils.js       # Performance monitoring
└── constants/                    # Configuration constants
    └── flipbookConstants.js      # App constants and configuration
```

## 🎯 Custom Hooks

### usePDFLoader
Handles PDF loading, rendering, and error states.
```javascript
const {
  pageImages,
  thumbnails,
  loading,
  error,
  totalPages,
  pageAspectRatio
} = usePDFLoader(pdfUrl);
```

### useAnnotations
Manages server and local annotations, including saving functionality.
```javascript
const {
  serverAnnotations,
  localAnnotationsByPage,
  handleAnnotationsChange,
  saveAnnotations
} = useAnnotations(pdfId, token);
```

### useZoom
Handles zoom functionality, pan offset, and mouse/touch interactions.
```javascript
const {
  isZoomed,
  zoomLevel,
  isDragging,
  panOffset,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset
} = useZoom();
```

### useBookmarks
Manages bookmark state and localStorage persistence.
```javascript
const {
  bookmarks,
  toggleBookmark,
  isBookmarked,
  getSortedBookmarks
} = useBookmarks();
```

### useDrawingTools
Manages drawing tool states and brush settings.
```javascript
const {
  isDrawing,
  isFreehand,
  highlightColor,
  brushSize,
  activateTool,
  setBrushSize
} = useDrawingTools();
```

### useFlipbook
Handles flipbook initialization, page navigation, and touch interactions.
```javascript
const {
  currentPage,
  containerRef,
  goToPage,
  goToPreviousPage,
  goToNextPage
} = useFlipbook(pageImages, bookSize, isMobile);
```

## 🧩 Components

### Toolbar
Floating toolbar with drawing tools, zoom controls, and save functionality.

### ColorPalette
Color selection and brush size controls with mobile-optimized interface.

### Sidebar
Thumbnail navigation and bookmark management (hidden on mobile).

### PageNavigation
Previous/next page controls with page counter.

### PageRenderer
Renders PDF pages with annotation support.

### UIComponents
- **LoadingSpinner**: Loading state display
- **ErrorDisplay**: Error state display
- **ZoomOverlay**: Click-to-exit zoom functionality

## 🛠️ Utilities

### flipbookUtils.js
Core utility functions for:
- Book size calculations
- Mobile device detection
- CSS class generation
- Style object creation
- Debouncing and throttling

### performanceUtils.js
Performance monitoring utilities:
- Render time tracking
- Memory usage monitoring
- Performance monitoring HOC
- Memory cleanup utilities

## 📊 Performance Features

### Lazy Loading
Components are loaded on-demand using React.lazy():
```javascript
const Toolbar = lazy(() => import('./components/Toolbar'));
```

### Memoization
Expensive calculations are memoized:
```javascript
const memoizedBookSize = useMemo(() => {
  return calculateBookSize(pageAspectRatio, isMobile);
}, [pageAspectRatio, isMobile]);
```

### Batch Processing
PDF pages are rendered in batches to prevent memory issues:
```javascript
const batchSize = 5;
for (let i = 0; i < pdf.numPages; i += batchSize) {
  // Process batch of pages
}
```

### Event Throttling
Resize events are throttled for better performance:
```javascript
const handleResize = createDebouncedResizeHandler(() => {
  // Handle resize
}, 100);
```

## 🎨 Styling

The component uses CSS modules for scoped styling. All styles are contained in `flipbook.module.css` and follow a consistent naming convention.

## 📱 Mobile Support

The component is fully responsive with:
- Mobile-optimized touch interactions
- Adaptive UI layout
- Mobile-specific color palette
- Responsive book sizing

## 🔧 Configuration

Constants are centralized in `flipbookConstants.js`:
- Drawing tool configurations
- Brush sizes and colors
- Zoom levels
- PDF.js settings
- Animation durations
- API endpoints

## 🚀 Usage

```javascript
import FlipBookOptimized from './pages/flipViewPage/FlipBookOptimized';

// Use in your route or component
<FlipBookOptimized />
```

The component automatically handles:
- PDF loading from URL parameters
- Authentication token from localStorage
- Responsive layout adaptation
- Performance optimization

## 🔍 Development

### Performance Monitoring
In development mode, the component includes performance monitoring:
- Render time tracking
- Memory usage logging
- Component performance metrics

### Debugging
Use the browser's React DevTools to inspect:
- Hook states
- Component re-renders
- Performance metrics

## 📈 Benefits

1. **Better Performance**: Lazy loading, memoization, and optimized rendering
2. **Maintainability**: Modular structure with separated concerns
3. **Reusability**: Custom hooks and components can be reused
4. **Testability**: Smaller components are easier to test
5. **Scalability**: Modular architecture supports future enhancements
6. **Memory Efficiency**: Proper cleanup and batch processing
7. **Mobile Optimization**: Responsive design with touch support

## 🔄 Migration from Original

The optimized version maintains the same API as the original component, so it can be used as a drop-in replacement. The main differences are:

- Better performance through optimization
- Modular architecture for easier maintenance
- Enhanced mobile support
- Performance monitoring in development
- Improved error handling

## 🐛 Troubleshooting

### Common Issues

1. **PDF Loading Issues**: Check PDF URL and CORS settings
2. **Performance Issues**: Monitor memory usage and render times
3. **Mobile Issues**: Test touch interactions and responsive layout
4. **Annotation Issues**: Verify server endpoints and authentication

### Debug Tools

- Use React DevTools for component inspection
- Check browser console for performance logs
- Monitor memory usage in browser dev tools
- Test on different devices for mobile compatibility

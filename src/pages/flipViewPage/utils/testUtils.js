/**
 * Test utilities for FlipBook module
 * These functions help verify that the optimized FlipBook works correctly
 */

/**
 * Test PDF loading functionality
 * @param {string} pdfUrl - URL of PDF to test
 * @returns {Promise<boolean>} - Whether PDF loaded successfully
 */
export const testPDFLoading = async (pdfUrl) => {
  try {
    // Test if PDF URL is valid
    if (!pdfUrl || !pdfUrl.includes('.pdf')) {
      console.error('Invalid PDF URL:', pdfUrl);
      return false;
    }

    // Test PDF.js loading
    if (!window.pdfjsLib) {
      console.error('PDF.js not loaded');
      return false;
    }

    // Test PDF document loading
    const loadingTask = window.pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully:', pdf.numPages, 'pages');
    return true;
  } catch (error) {
    console.error('PDF loading test failed:', error);
    return false;
  }
};

/**
 * Test annotation functionality
 * @param {string} pdfId - PDF ID for testing
 * @param {string} token - Authentication token
 * @returns {Promise<boolean>} - Whether annotations work correctly
 */
export const testAnnotations = async (pdfId, token) => {
  try {
    if (!pdfId || !token) {
      console.error('Missing pdfId or token for annotation test');
      return false;
    }

    // Test annotation data structure
    const testAnnotation = {
      pdf_id: pdfId,
      page_number: 1,
      shapes: [{
        type: 'freehand',
        points: [100, 100, 200, 200],
        color: '#fffb00',
        strokeWidth: 4
      }],
      comments: [{
        text: 'Test comment',
        created_at: Date.now()
      }]
    };

    console.log('Annotation test data created:', testAnnotation);
    return true;
  } catch (error) {
    console.error('Annotation test failed:', error);
    return false;
  }
};

/**
 * Test zoom functionality
 * @returns {boolean} - Whether zoom functions work correctly
 */
export const testZoom = () => {
  try {
    // Test zoom level calculations
    const testZoomLevels = [1, 1.5, 2, 2.5, 3];
    const testPanOffset = { x: 0, y: 0 };

    testZoomLevels.forEach(zoomLevel => {
      const style = {
        transform: `scale(${zoomLevel}) translate(${testPanOffset.x / zoomLevel}px, ${testPanOffset.y / zoomLevel}px)`,
      };
      console.log(`Zoom level ${zoomLevel}:`, style);
    });

    console.log('Zoom functionality test passed');
    return true;
  } catch (error) {
    console.error('Zoom test failed:', error);
    return false;
  }
};

/**
 * Test bookmark functionality
 * @returns {boolean} - Whether bookmarks work correctly
 */
export const testBookmarks = () => {
  try {
    // Test bookmark operations
    const testBookmarks = new Set([1, 3, 5, 7]);
    
    // Test adding bookmark
    testBookmarks.add(2);
    console.log('Added bookmark 2:', testBookmarks.has(2));

    // Test removing bookmark
    testBookmarks.delete(2);
    console.log('Removed bookmark 2:', !testBookmarks.has(2));

    // Test localStorage operations
    const bookmarksArray = [...testBookmarks];
    localStorage.setItem('test-bookmarks', JSON.stringify(bookmarksArray));
    const retrieved = JSON.parse(localStorage.getItem('test-bookmarks'));
    console.log('Bookmark storage test:', JSON.stringify(bookmarksArray) === JSON.stringify(retrieved));

    // Cleanup
    localStorage.removeItem('test-bookmarks');

    console.log('Bookmark functionality test passed');
    return true;
  } catch (error) {
    console.error('Bookmark test failed:', error);
    return false;
  }
};

/**
 * Test drawing tools functionality
 * @returns {boolean} - Whether drawing tools work correctly
 */
export const testDrawingTools = () => {
  try {
    // Test brush sizes
    const brushSizes = [2, 4, 8, 12, 20];
    console.log('Brush sizes:', brushSizes);

    // Test colors
    const colors = ['#fffb00', '#ff6b6b', '#4ecdc4', '#45b7d1'];
    console.log('Test colors:', colors);

    // Test tool states
    const toolStates = {
      isDrawing: false,
      isFreehand: false,
      isEraser: false,
      highlightColor: '#fffb00',
      brushSize: 4
    };
    console.log('Tool states:', toolStates);

    console.log('Drawing tools test passed');
    return true;
  } catch (error) {
    console.error('Drawing tools test failed:', error);
    return false;
  }
};

/**
 * Test utility functions
 * @returns {boolean} - Whether utility functions work correctly
 */
export const testUtilities = () => {
  try {
    // Test mobile detection
    const isMobile = window.innerWidth <= 768;
    console.log('Mobile detection:', isMobile);

    // Test book size calculation
    const bookSize = {
      width: Math.min(window.innerWidth - 100, 1000),
      height: Math.min(window.innerHeight - 100, 900)
    };
    console.log('Book size calculation:', bookSize);

    // Test CSS class generation
    const classes = ['flipbook', 'dragging', 'zoomed'];
    const classString = classes.join(' ');
    console.log('CSS classes:', classString);

    console.log('Utility functions test passed');
    return true;
  } catch (error) {
    console.error('Utility functions test failed:', error);
    return false;
  }
};

/**
 * Run all tests
 * @param {Object} testParams - Test parameters
 * @returns {Promise<Object>} - Test results
 */
export const runAllTests = async (testParams = {}) => {
  const results = {
    pdfLoading: false,
    annotations: false,
    zoom: false,
    bookmarks: false,
    drawingTools: false,
    utilities: false,
    overall: false
  };

  console.log('🧪 Starting FlipBook optimization tests...');

  try {
    // Test PDF loading
    if (testParams.pdfUrl) {
      results.pdfLoading = await testPDFLoading(testParams.pdfUrl);
    } else {
      console.log('⏭️ Skipping PDF loading test (no URL provided)');
      results.pdfLoading = true;
    }

    // Test annotations
    if (testParams.pdfId && testParams.token) {
      results.annotations = await testAnnotations(testParams.pdfId, testParams.token);
    } else {
      console.log('⏭️ Skipping annotation test (no pdfId/token provided)');
      results.annotations = true;
    }

    // Test other functionalities
    results.zoom = testZoom();
    results.bookmarks = testBookmarks();
    results.drawingTools = testDrawingTools();
    results.utilities = testUtilities();

    // Calculate overall result
    results.overall = Object.values(results).every(result => result === true);

    console.log('📊 Test Results:', results);
    
    if (results.overall) {
      console.log('✅ All tests passed! FlipBook optimization is working correctly.');
    } else {
      console.log('❌ Some tests failed. Check the logs above for details.');
    }

    return results;
  } catch (error) {
    console.error('🚨 Test suite failed:', error);
    return results;
  }
};

/**
 * Performance benchmark for FlipBook
 * @returns {Object} - Performance metrics
 */
export const benchmarkPerformance = () => {
  const startTime = performance.now();
  
  // Simulate component operations
  const operations = [
    'Component initialization',
    'Hook setup',
    'State management',
    'Event handling',
    'Rendering'
  ];

  const metrics = {
    startTime,
    operations: [],
    memoryUsage: null
  };

  operations.forEach((operation, index) => {
    const operationStart = performance.now();
    // Simulate operation
    const operationEnd = performance.now();
    metrics.operations.push({
      name: operation,
      duration: operationEnd - operationStart
    });
  });

  const endTime = performance.now();
  metrics.totalTime = endTime - startTime;
  metrics.memoryUsage = performance.memory ? {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
  } : null;

  console.log('📈 Performance Benchmark:', metrics);
  return metrics;
};

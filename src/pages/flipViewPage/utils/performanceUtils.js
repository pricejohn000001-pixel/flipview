/**
 * Performance monitoring utilities for FlipBook
 */

/**
 * Performance monitor class for tracking component performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing a performance metric
   * @param {string} name - Name of the metric
   */
  startTiming(name) {
    if (!this.isEnabled) return;
    this.metrics.set(name, { start: performance.now() });
  }

  /**
   * End timing a performance metric
   * @param {string} name - Name of the metric
   * @returns {number} - Duration in milliseconds
   */
  endTiming(name) {
    if (!this.isEnabled) return 0;
    
    const metric = this.metrics.get(name);
    if (!metric) return 0;
    
    const duration = performance.now() - metric.start;
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    this.metrics.delete(name);
    return duration;
  }

  /**
   * Measure memory usage
   */
  measureMemory() {
    if (!this.isEnabled || !performance.memory) return null;
    
    const memory = performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }

  /**
   * Log memory usage
   */
  logMemory() {
    if (!this.isEnabled) return;
    
    const memory = this.measureMemory();
    if (memory) {
      console.log(`Memory usage: ${memory.used}MB / ${memory.total}MB (limit: ${memory.limit}MB)`);
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order component for performance monitoring
 * @param {React.Component} WrappedComponent - Component to monitor
 * @param {string} componentName - Name for logging
 * @returns {React.Component} - Wrapped component with performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const renderStart = performance.now();
    
    useEffect(() => {
      const renderEnd = performance.now();
      console.log(`${componentName} render took ${(renderEnd - renderStart).toFixed(2)}ms`);
    });

    return <WrappedComponent {...props} />;
  });
};

/**
 * Hook for measuring component render performance
 * @param {string} componentName - Name of the component
 */
export const usePerformanceMonitoring = (componentName) => {
  const renderStart = useRef(performance.now());
  
  useEffect(() => {
    const renderEnd = performance.now();
    console.log(`${componentName} render took ${(renderEnd - renderStart.current).toFixed(2)}ms`);
  });

  return {
    startTiming: (name) => performanceMonitor.startTiming(name),
    endTiming: (name) => performanceMonitor.endTiming(name),
    measureMemory: () => performanceMonitor.measureMemory(),
    logMemory: () => performanceMonitor.logMemory()
  };
};

/**
 * Debounced resize handler for better performance
 * @param {Function} callback - Callback function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const createDebouncedResizeHandler = (callback, delay = 100) => {
  let timeoutId;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

/**
 * Throttled scroll handler for better performance
 * @param {Function} callback - Callback function
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const createThrottledScrollHandler = (callback, limit = 16) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      callback.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memory cleanup utility
 */
export const memoryCleanup = {
  /**
   * Clear large objects from memory
   * @param {Object} obj - Object to clear
   */
  clearObject: (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        delete obj[key];
      });
    }
  },

  /**
   * Clear arrays from memory
   * @param {Array} arr - Array to clear
   */
  clearArray: (arr) => {
    if (Array.isArray(arr)) {
      arr.length = 0;
    }
  },

  /**
   * Force garbage collection (if available)
   */
  forceGC: () => {
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }
};

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

export interface GlobalPerformanceMetrics {
  pageLoadTime: number;
  totalApiCalls: number;
  averageApiResponseTime: number;
  slowApiCalls: number; // calls > 1000ms
  memoryUsage: number;
  renderCount: number;
  errorCount: number;
  lastUpdated: number;
}

export interface ApiCallMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  size?: number;
}

interface PerformanceContextType {
  metrics: GlobalPerformanceMetrics;
  apiCalls: ApiCallMetric[];
  recordApiCall: (call: ApiCallMetric) => void;
  recordError: (error: Error, context?: string) => void;
  recordRender: (componentName: string, duration: number) => void;
  getSlowApiCalls: () => ApiCallMetric[];
  getApiCallsByEndpoint: (endpoint: string) => ApiCallMetric[];
  clearMetrics: () => void;
  exportMetrics: () => string;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(
  undefined
);

export function PerformanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [metrics, setMetrics] = useState<GlobalPerformanceMetrics>({
    pageLoadTime: 0,
    totalApiCalls: 0,
    averageApiResponseTime: 0,
    slowApiCalls: 0,
    memoryUsage: 0,
    renderCount: 0,
    errorCount: 0,
    lastUpdated: Date.now(),
  });

  const [apiCalls, setApiCalls] = useState<ApiCallMetric[]>([]);
  const [errors, setErrors] = useState<
    Array<{ error: Error; context?: string; timestamp: number }>
  >([]);

  // Record page load time on mount
  useEffect(() => {
    const loadTime = performance.timing
      ? performance.timing.loadEventEnd - performance.timing.navigationStart
      : 0;

    setMetrics((prev) => ({
      ...prev,
      pageLoadTime: loadTime,
      lastUpdated: Date.now(),
    }));
  }, []);

  // Update memory usage periodically
  useEffect(() => {
    const updateMemoryUsage = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize,
          lastUpdated: Date.now(),
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const recordApiCall = useCallback((call: ApiCallMetric) => {
    setApiCalls((prev) => {
      const newCalls = [...prev, call];
      // Keep only last 1000 API calls to prevent memory issues
      if (newCalls.length > 1000) {
        return newCalls.slice(-1000);
      }
      return newCalls;
    });

    setMetrics((prev) => {
      const totalCalls = prev.totalApiCalls + 1;
      const currentAverage = prev.averageApiResponseTime;
      const newAverage =
        (currentAverage * (totalCalls - 1) + call.duration) / totalCalls;
      const slowCalls =
        call.duration > 1000 ? prev.slowApiCalls + 1 : prev.slowApiCalls;

      return {
        ...prev,
        totalApiCalls: totalCalls,
        averageApiResponseTime: newAverage,
        slowApiCalls: slowCalls,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const recordError = useCallback((error: Error, context?: string) => {
    setErrors((prev) => {
      const newErrors = [...prev, { error, context, timestamp: Date.now() }];
      // Keep only last 100 errors
      if (newErrors.length > 100) {
        return newErrors.slice(-100);
      }
      return newErrors;
    });

    setMetrics((prev) => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastUpdated: Date.now(),
    }));
  }, []);

  const recordRender = useCallback(
    (componentName: string, duration: number) => {
      setMetrics((prev) => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        lastUpdated: Date.now(),
      }));

      // Log slow renders
      if (duration > 16) {
        console.warn(
          `Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`
        );
      }
    },
    []
  );

  const getSlowApiCalls = useCallback(() => {
    return apiCalls.filter((call) => call.duration > 1000);
  }, [apiCalls]);

  const getApiCallsByEndpoint = useCallback(
    (endpoint: string) => {
      return apiCalls.filter((call) => call.url.includes(endpoint));
    },
    [apiCalls]
  );

  const clearMetrics = useCallback(() => {
    setMetrics({
      pageLoadTime: 0,
      totalApiCalls: 0,
      averageApiResponseTime: 0,
      slowApiCalls: 0,
      memoryUsage: 0,
      renderCount: 0,
      errorCount: 0,
      lastUpdated: Date.now(),
    });
    setApiCalls([]);
    setErrors([]);
  }, []);

  const exportMetrics = useCallback(() => {
    const exportData = {
      metrics,
      apiCalls: apiCalls.slice(-100), // Export last 100 API calls
      errors: errors.slice(-50), // Export last 50 errors
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  }, [metrics, apiCalls, errors]);

  const value: PerformanceContextType = {
    metrics,
    apiCalls,
    recordApiCall,
    recordError,
    recordRender,
    getSlowApiCalls,
    getApiCallsByEndpoint,
    clearMetrics,
    exportMetrics,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// HOC for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { recordRender } = usePerformance();
    const startTime = React.useRef<number>(0);

    React.useEffect(() => {
      startTime.current = performance.now();
    });

    React.useLayoutEffect(() => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      recordRender(componentName, duration);
    });

    return <WrappedComponent {...props} />;
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentMountTime: number;
  lastUpdateTime: number;
  totalRenders: number;
  averageRenderTime: number;
}

export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  timestamp: number;
}

export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    lastUpdateTime: 0,
    totalRenders: 0,
    averageRenderTime: 0,
  });

  const mountTimeRef = useRef<number>(Date.now());
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderStartRef = useRef<number>(0);

  // Start performance measurement
  const startMeasurement = useCallback(
    (measurementName: string) => {
      const startTime = performance.now();
      lastRenderStartRef.current = startTime;

      // Mark the start of measurement
      if (performance.mark) {
        performance.mark(`${componentName}-${measurementName}-start`);
      }

      return startTime;
    },
    [componentName]
  );

  // End performance measurement
  const endMeasurement = useCallback(
    (measurementName: string, startTime?: number) => {
      const endTime = performance.now();
      const actualStartTime = startTime || lastRenderStartRef.current;
      const duration = endTime - actualStartTime;

      // Mark the end and measure
      if (performance.mark && performance.measure) {
        performance.mark(`${componentName}-${measurementName}-end`);
        performance.measure(
          `${componentName}-${measurementName}`,
          `${componentName}-${measurementName}-start`,
          `${componentName}-${measurementName}-end`
        );
      }

      // Update render times
      renderTimesRef.current.push(duration);

      // Keep only last 100 measurements to prevent memory leaks
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current = renderTimesRef.current.slice(-100);
      }

      // Calculate metrics
      const totalRenders = renderTimesRef.current.length;
      const averageRenderTime =
        renderTimesRef.current.reduce((a, b) => a + b, 0) / totalRenders;

      setMetrics((prev) => ({
        ...prev,
        renderTime: duration,
        lastUpdateTime: endTime,
        totalRenders,
        averageRenderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      }));

      return duration;
    },
    [componentName]
  );

  // Measure component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    setMetrics((prev) => ({
      ...prev,
      componentMountTime: mountTime,
    }));
  }, []);

  // Get performance entries
  const getPerformanceEntries = useCallback((): PerformanceEntry[] => {
    if (!performance.getEntriesByName) return [];

    const entries = performance.getEntriesByName(`${componentName}-render`);
    return entries.map((entry) => ({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now(),
    }));
  }, [componentName]);

  // Clear performance data
  const clearMetrics = useCallback(() => {
    renderTimesRef.current = [];
    setMetrics({
      renderTime: 0,
      componentMountTime: 0,
      lastUpdateTime: 0,
      totalRenders: 0,
      averageRenderTime: 0,
    });

    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }, []);

  // Log performance warning if render time is too high
  useEffect(() => {
    if (metrics.renderTime > 16) {
      // 16ms = 60fps threshold
      console.warn(
        `${componentName} render time (${metrics.renderTime.toFixed(2)}ms) exceeds 16ms threshold`
      );
    }
  }, [metrics.renderTime, componentName]);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    getPerformanceEntries,
    clearMetrics,
  };
}

// Hook for measuring async operations
export function useAsyncPerformanceMonitor() {
  const [measurements, setMeasurements] = useState<
    Map<string, PerformanceEntry>
  >(new Map());

  const measureAsync = useCallback(
    async <T>(name: string, asyncOperation: () => Promise<T>): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await asyncOperation();
        const endTime = performance.now();
        const duration = endTime - startTime;

        setMeasurements(
          (prev) =>
            new Map(
              prev.set(name, {
                name,
                startTime,
                duration,
                timestamp: Date.now(),
              })
            )
        );

        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        setMeasurements(
          (prev) =>
            new Map(
              prev.set(`${name}-error`, {
                name: `${name}-error`,
                startTime,
                duration,
                timestamp: Date.now(),
              })
            )
        );

        throw error;
      }
    },
    []
  );

  const getMeasurement = useCallback(
    (name: string) => {
      return measurements.get(name);
    },
    [measurements]
  );

  const getAllMeasurements = useCallback(() => {
    return Array.from(measurements.values());
  }, [measurements]);

  const clearMeasurements = useCallback(() => {
    setMeasurements(new Map());
  }, []);

  return {
    measureAsync,
    getMeasurement,
    getAllMeasurements,
    clearMeasurements,
  };
}

import { useEffect, useState, useCallback } from 'react';
import { bundleAnalyzer } from '../utils/bundleAnalyzer';
import { apiCache } from '../utils/apiCache';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Bundle metrics
  bundleSize: {
    js: number;
    css: number;
    total: number;
  };

  // Cache metrics
  cacheStats: {
    size: number;
    hitRate: number;
    pendingRequests: number;
  };

  // Resource metrics
  resourceCount: number;
  imageCount: number;
  fontCount: number;

  // Memory usage
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
}

interface PerformanceAlert {
  type: 'warning' | 'error';
  metric: string;
  value: number;
  threshold: number;
  message: string;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance thresholds (based on Core Web Vitals)
  const thresholds = {
    lcp: 2500, // 2.5s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    fcp: 1800, // 1.8s
    ttfb: 800, // 800ms
    bundleSize: 2 * 1024 * 1024, // 2MB
    memoryUsage: 50 * 1024 * 1024, // 50MB
  };

  // Collect Core Web Vitals
  const collectWebVitals = useCallback(() => {
    return new Promise<Partial<PerformanceMetrics>>((resolve) => {
      const metrics: Partial<PerformanceMetrics> = {};

      // Use PerformanceObserver for Core Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Navigation timing for TTFB
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            metrics.ttfb = entry.responseStart - entry.requestStart;
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Resolve after a short delay to collect metrics
        setTimeout(() => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          paintObserver.disconnect();
          navObserver.disconnect();
          resolve(metrics);
        }, 3000);
      } else {
        resolve(metrics);
      }
    });
  }, []);

  // Collect bundle and resource metrics
  const collectResourceMetrics = useCallback(() => {
    const bundleMetrics = bundleAnalyzer.getMetrics();
    const cacheStats = apiCache.getStats();

    return {
      bundleSize: {
        js: bundleMetrics.totalJSSize,
        css: bundleMetrics.totalCSSSize,
        total: bundleMetrics.totalJSSize + bundleMetrics.totalCSSSize,
      },
      cacheStats: {
        size: cacheStats.size,
        hitRate: 0, // TODO: Implement hit rate tracking
        pendingRequests: cacheStats.pendingRequests,
      },
      resourceCount: bundleMetrics.resources.length,
      imageCount: bundleMetrics.imageCount,
      fontCount: bundleMetrics.fontCount,
    };
  }, []);

  // Collect memory usage
  const collectMemoryMetrics = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        memoryUsage: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      };
    }
    return {};
  }, []);

  // Check for performance alerts
  const checkAlerts = useCallback(
    (metrics: PerformanceMetrics) => {
      const newAlerts: PerformanceAlert[] = [];

      // Check Core Web Vitals
      if (metrics.lcp && metrics.lcp > thresholds.lcp) {
        newAlerts.push({
          type: 'warning',
          metric: 'LCP',
          value: metrics.lcp,
          threshold: thresholds.lcp,
          message: `Largest Contentful Paint is ${metrics.lcp}ms (threshold: ${thresholds.lcp}ms)`,
        });
      }

      if (metrics.fid && metrics.fid > thresholds.fid) {
        newAlerts.push({
          type: 'warning',
          metric: 'FID',
          value: metrics.fid,
          threshold: thresholds.fid,
          message: `First Input Delay is ${metrics.fid}ms (threshold: ${thresholds.fid}ms)`,
        });
      }

      if (metrics.cls && metrics.cls > thresholds.cls) {
        newAlerts.push({
          type: 'warning',
          metric: 'CLS',
          value: metrics.cls,
          threshold: thresholds.cls,
          message: `Cumulative Layout Shift is ${metrics.cls} (threshold: ${thresholds.cls})`,
        });
      }

      // Check bundle size
      if (metrics.bundleSize.total > thresholds.bundleSize) {
        newAlerts.push({
          type: 'error',
          metric: 'Bundle Size',
          value: metrics.bundleSize.total,
          threshold: thresholds.bundleSize,
          message: `Bundle size is ${(metrics.bundleSize.total / 1024 / 1024).toFixed(2)}MB (threshold: ${(thresholds.bundleSize / 1024 / 1024).toFixed(2)}MB)`,
        });
      }

      // Check memory usage
      if (
        metrics.memoryUsage &&
        metrics.memoryUsage.used > thresholds.memoryUsage
      ) {
        newAlerts.push({
          type: 'warning',
          metric: 'Memory Usage',
          value: metrics.memoryUsage.used,
          threshold: thresholds.memoryUsage,
          message: `Memory usage is ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(2)}MB (threshold: ${(thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB)`,
        });
      }

      setAlerts(newAlerts);
    },
    [thresholds]
  );

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    setIsMonitoring(true);

    try {
      // Collect all metrics
      const [webVitals, resourceMetrics, memoryMetrics] = await Promise.all([
        collectWebVitals(),
        Promise.resolve(collectResourceMetrics()),
        Promise.resolve(collectMemoryMetrics()),
      ]);

      const allMetrics: PerformanceMetrics = {
        ...webVitals,
        ...resourceMetrics,
        ...memoryMetrics,
      } as PerformanceMetrics;

      setMetrics(allMetrics);
      checkAlerts(allMetrics);
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, [
    collectWebVitals,
    collectResourceMetrics,
    collectMemoryMetrics,
    checkAlerts,
  ]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setMetrics(null);
    setAlerts([]);
  }, []);

  // Get performance score (0-100)
  const getPerformanceScore = useCallback(
    (metrics: PerformanceMetrics): number => {
      let score = 100;

      // Deduct points for poor Core Web Vitals
      if (metrics.lcp && metrics.lcp > thresholds.lcp) {
        score -= 20;
      }
      if (metrics.fid && metrics.fid > thresholds.fid) {
        score -= 20;
      }
      if (metrics.cls && metrics.cls > thresholds.cls) {
        score -= 20;
      }
      if (metrics.fcp && metrics.fcp > thresholds.fcp) {
        score -= 15;
      }
      if (metrics.ttfb && metrics.ttfb > thresholds.ttfb) {
        score -= 15;
      }

      // Deduct points for large bundle size
      if (metrics.bundleSize.total > thresholds.bundleSize) {
        score -= 10;
      }

      return Math.max(0, score);
    },
    [thresholds]
  );

  // Auto-start monitoring on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startMonitoring();
    }, 1000); // Wait 1s after mount

    return () => clearTimeout(timer);
  }, [startMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getPerformanceScore: metrics ? getPerformanceScore(metrics) : null,
  };
}

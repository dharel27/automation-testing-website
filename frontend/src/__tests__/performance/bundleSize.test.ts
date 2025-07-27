import { describe, it, expect, beforeAll } from 'vitest';
import { bundleAnalyzer } from '../../utils/bundleAnalyzer';

describe('Bundle Size Performance Tests', () => {
  beforeAll(() => {
    // Start monitoring for tests
    bundleAnalyzer.startMonitoring();
  });

  it('should have reasonable JavaScript bundle size', () => {
    const metrics = bundleAnalyzer.getMetrics();

    // JS bundle should be under 2MB for good performance
    expect(metrics.totalJSSize).toBeLessThan(2 * 1024 * 1024);
  });

  it('should have reasonable CSS bundle size', () => {
    const metrics = bundleAnalyzer.getMetrics();

    // CSS bundle should be under 1MB
    expect(metrics.totalCSSSize).toBeLessThan(1024 * 1024);
  });

  it('should not load excessive number of resources', () => {
    const metrics = bundleAnalyzer.getMetrics();

    // Should not load more than 50 resources on initial page load
    expect(metrics.resources.length).toBeLessThan(50);
  });

  it('should provide performance recommendations when needed', () => {
    const recommendations = bundleAnalyzer.getRecommendations();

    // Recommendations should be an array
    expect(Array.isArray(recommendations)).toBe(true);

    // Each recommendation should be a string
    recommendations.forEach((rec) => {
      expect(typeof rec).toBe('string');
      expect(rec.length).toBeGreaterThan(0);
    });
  });

  it('should format bytes correctly', () => {
    const analyzer = bundleAnalyzer as any;

    expect(analyzer.formatBytes(0)).toBe('0 Bytes');
    expect(analyzer.formatBytes(1024)).toBe('1 KB');
    expect(analyzer.formatBytes(1024 * 1024)).toBe('1 MB');
    expect(analyzer.formatBytes(1536)).toBe('1.5 KB');
  });

  it('should track performance entries', () => {
    const metrics = bundleAnalyzer.getMetrics();

    // Should have some performance entries
    expect(metrics.resources).toBeDefined();
    expect(metrics.navigation).toBeDefined();
    expect(Array.isArray(metrics.resources)).toBe(true);
    expect(Array.isArray(metrics.navigation)).toBe(true);
  });
});

// Bundle analysis utilities for performance monitoring

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  assets: AssetInfo[];
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
}

interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
}

/**
 * Analyze bundle performance in development
 */
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private performanceEntries: PerformanceEntry[] = [];

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  /**
   * Monitor resource loading performance
   */
  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      this.performanceEntries.push(...list.getEntries());
    });

    observer.observe({ entryTypes: ['resource', 'navigation', 'measure'] });

    // Monitor bundle size changes
    this.monitorBundleSize();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    resources: PerformanceResourceTiming[];
    navigation: PerformanceNavigationTiming[];
    totalJSSize: number;
    totalCSSSize: number;
    imageCount: number;
    fontCount: number;
  } {
    const resources = this.performanceEntries.filter(
      (entry) => entry.entryType === 'resource'
    ) as PerformanceResourceTiming[];

    const navigation = this.performanceEntries.filter(
      (entry) => entry.entryType === 'navigation'
    ) as PerformanceNavigationTiming[];

    const jsResources = resources.filter((r) => r.name.includes('.js'));
    const cssResources = resources.filter((r) => r.name.includes('.css'));
    const imageResources = resources.filter((r) =>
      /\.(jpg|jpeg|png|gif|webp|svg)/.test(r.name)
    );
    const fontResources = resources.filter((r) =>
      /\.(woff|woff2|ttf|eot)/.test(r.name)
    );

    return {
      resources,
      navigation,
      totalJSSize: jsResources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      ),
      totalCSSSize: cssResources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      ),
      imageCount: imageResources.length,
      fontCount: fontResources.length,
    };
  }

  /**
   * Monitor bundle size changes
   */
  private monitorBundleSize(): void {
    if (typeof window === 'undefined') return;

    // Check for webpack bundle analyzer data
    if ((window as any).__webpack_require__) {
      this.analyzeWebpackBundle();
    }

    // Monitor dynamic imports
    this.monitorDynamicImports();
  }

  /**
   * Analyze webpack bundle (if available)
   */
  private analyzeWebpackBundle(): void {
    try {
      const webpackRequire = (window as any).__webpack_require__;
      if (webpackRequire && webpackRequire.cache) {
        const modules = Object.keys(webpackRequire.cache);
        console.log(`Loaded modules: ${modules.length}`);
      }
    } catch (error) {
      console.warn('Could not analyze webpack bundle:', error);
    }
  }

  /**
   * Monitor dynamic imports
   */
  private monitorDynamicImports(): void {
    const originalImport =
      window.import || ((specifier: string) => import(specifier));

    (window as any).import = async (specifier: string) => {
      const startTime = performance.now();

      try {
        const module = await originalImport(specifier);
        const endTime = performance.now();

        console.log(
          `Dynamic import "${specifier}" took ${endTime - startTime}ms`
        );

        return module;
      } catch (error) {
        console.error(`Failed to import "${specifier}":`, error);
        throw error;
      }
    };
  }

  /**
   * Get bundle recommendations
   */
  getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    // Check JS bundle size
    if (metrics.totalJSSize > 1024 * 1024) {
      // 1MB
      recommendations.push('Consider code splitting - JS bundle is over 1MB');
    }

    // Check CSS bundle size
    if (metrics.totalCSSSize > 512 * 1024) {
      // 512KB
      recommendations.push(
        'Consider CSS optimization - CSS bundle is over 512KB'
      );
    }

    // Check image optimization
    if (metrics.imageCount > 20) {
      recommendations.push(
        'Consider image lazy loading - many images detected'
      );
    }

    // Check font loading
    if (metrics.fontCount > 5) {
      recommendations.push('Consider font optimization - many fonts detected');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generateReport(): void {
    const metrics = this.getMetrics();
    const recommendations = this.getRecommendations();

    console.group('📊 Bundle Performance Report');
    console.log('JavaScript Size:', this.formatBytes(metrics.totalJSSize));
    console.log('CSS Size:', this.formatBytes(metrics.totalCSSSize));
    console.log('Images:', metrics.imageCount);
    console.log('Fonts:', metrics.fontCount);
    console.log('Total Resources:', metrics.resources.length);

    if (recommendations.length > 0) {
      console.group('💡 Recommendations');
      recommendations.forEach((rec) => console.log(`• ${rec}`));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const bundleAnalyzer = BundleAnalyzer.getInstance();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  bundleAnalyzer.startMonitoring();

  // Generate report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      bundleAnalyzer.generateReport();
    }, 2000);
  });
}

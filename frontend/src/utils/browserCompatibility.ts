/**
 * Browser Compatibility Testing Utilities
 * Comprehensive browser and device compatibility checks
 */

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  supported: boolean;
  features: FeatureSupport;
}

interface FeatureSupport {
  es6: boolean;
  webgl: boolean;
  webWorkers: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webSockets: boolean;
  geolocation: boolean;
  notifications: boolean;
  serviceWorker: boolean;
  webAssembly: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  fetch: boolean;
  promises: boolean;
  asyncAwait: boolean;
  modules: boolean;
  customElements: boolean;
  shadowDOM: boolean;
  css: {
    grid: boolean;
    flexbox: boolean;
    customProperties: boolean;
    animations: boolean;
    transforms: boolean;
  };
}

interface CompatibilityReport {
  browser: BrowserInfo;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    orientation: string;
  };
  performance: {
    memory?: {
      used: number;
      total: number;
      limit: number;
    };
    timing: {
      domContentLoaded: number;
      loadComplete: number;
      firstPaint?: number;
      firstContentfulPaint?: number;
    };
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    forcedColors: boolean;
  };
  network: {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  issues: string[];
  recommendations: string[];
  score: number;
}

class BrowserCompatibilityTester {
  private userAgent: string;
  private features: FeatureSupport;

  constructor() {
    this.userAgent = navigator.userAgent;
    this.features = this.detectFeatures();
  }

  /**
   * Get comprehensive browser information
   */
  getBrowserInfo(): BrowserInfo {
    const browser = this.parseBrowser();
    const supported = this.isBrowserSupported(browser);

    return {
      ...browser,
      supported,
      features: this.features,
    };
  }

  /**
   * Parse browser information from user agent
   */
  private parseBrowser(): Omit<BrowserInfo, 'supported' | 'features'> {
    const ua = this.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';
    let platform = 'Unknown';
    let mobile = false;

    // Detect mobile
    mobile =
      /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        ua
      );

    // Detect platform
    if (/Windows/i.test(ua)) platform = 'Windows';
    else if (/Mac OS X/i.test(ua)) platform = 'macOS';
    else if (/Linux/i.test(ua)) platform = 'Linux';
    else if (/Android/i.test(ua)) platform = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS';

    // Detect browser and version
    if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) {
      name = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (/Firefox/i.test(ua)) {
      name = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      name = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    } else if (/Edge|Edg/i.test(ua)) {
      name = 'Edge';
      const match = ua.match(/(?:Edge|Edg)\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (/MSIE|Trident/i.test(ua)) {
      name = 'Internet Explorer';
      const match = ua.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Trident';
    }

    return { name, version, engine, platform, mobile };
  }

  /**
   * Check if browser is supported
   */
  private isBrowserSupported(
    browser: Omit<BrowserInfo, 'supported' | 'features'>
  ): boolean {
    const minVersions: Record<string, number> = {
      Chrome: 70,
      Firefox: 65,
      Safari: 12,
      Edge: 79,
    };

    const minVersion = minVersions[browser.name];
    if (!minVersion) return false;

    const version = parseInt(browser.version);
    return !isNaN(version) && version >= minVersion;
  }

  /**
   * Detect feature support
   */
  private detectFeatures(): FeatureSupport {
    return {
      es6: this.supportsES6(),
      webgl: this.supportsWebGL(),
      webWorkers: typeof Worker !== 'undefined',
      localStorage: this.supportsLocalStorage(),
      sessionStorage: this.supportsSessionStorage(),
      indexedDB: 'indexedDB' in window,
      webSockets: 'WebSocket' in window,
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webAssembly: 'WebAssembly' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      fetch: 'fetch' in window,
      promises: 'Promise' in window,
      asyncAwait: this.supportsAsyncAwait(),
      modules: this.supportsModules(),
      customElements: 'customElements' in window,
      shadowDOM: 'attachShadow' in Element.prototype,
      css: {
        grid: this.supportsCSSGrid(),
        flexbox: this.supportsCSSFlexbox(),
        customProperties: this.supportsCSSCustomProperties(),
        animations: this.supportsCSSAnimations(),
        transforms: this.supportsCSSTransforms(),
      },
    };
  }

  /**
   * Feature detection methods
   */
  private supportsES6(): boolean {
    try {
      return (
        typeof Symbol !== 'undefined' &&
        eval('class Foo {}; typeof Foo === "function"')
      );
    } catch {
      return false;
    }
  }

  private supportsWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      );
    } catch {
      return false;
    }
  }

  private supportsLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private supportsSessionStorage(): boolean {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private supportsAsyncAwait(): boolean {
    try {
      return (
        eval('(async function() {})').constructor ===
        async function () {}.constructor
      );
    } catch {
      return false;
    }
  }

  private supportsModules(): boolean {
    const script = document.createElement('script');
    return 'noModule' in script;
  }

  private supportsCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }

  private supportsCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }

  private supportsCSSCustomProperties(): boolean {
    return CSS.supports('--custom', 'property');
  }

  private supportsCSSAnimations(): boolean {
    return CSS.supports('animation', 'none');
  }

  private supportsCSSTransforms(): boolean {
    return CSS.supports('transform', 'none');
  }

  /**
   * Generate comprehensive compatibility report
   */
  generateReport(): CompatibilityReport {
    const browser = this.getBrowserInfo();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for critical issues
    if (!browser.supported) {
      issues.push(
        `Browser ${browser.name} ${browser.version} is not officially supported`
      );
      recommendations.push('Please update to a newer browser version');
    }

    if (!browser.features.es6) {
      issues.push('ES6 features not supported');
      recommendations.push('Enable JavaScript or update browser');
    }

    if (!browser.features.fetch) {
      issues.push('Fetch API not supported');
      recommendations.push('Some network requests may fail');
    }

    if (!browser.features.localStorage) {
      issues.push('Local storage not available');
      recommendations.push('Some features may not persist between sessions');
    }

    if (!browser.features.css.flexbox) {
      issues.push('CSS Flexbox not supported');
      recommendations.push('Layout may appear broken');
    }

    if (!browser.features.css.grid) {
      issues.push('CSS Grid not supported');
      recommendations.push('Some layouts may not display correctly');
    }

    // Performance checks
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize > 50 * 1024 * 1024) {
      issues.push('High memory usage detected');
      recommendations.push('Close other tabs or restart browser');
    }

    // Calculate compatibility score
    const totalFeatures =
      Object.keys(browser.features).length +
      Object.keys(browser.features.css).length;
    const supportedFeatures =
      Object.values(browser.features).filter(Boolean).length +
      Object.values(browser.features.css).filter(Boolean).length;
    const score = Math.round((supportedFeatures / totalFeatures) * 100);

    return {
      browser,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation: screen.orientation?.type || 'unknown',
      },
      performance: {
        memory: memory
          ? {
              used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
              limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
            }
          : undefined,
        timing: {
          domContentLoaded:
            performance.timing.domContentLoadedEventEnd -
            performance.timing.navigationStart,
          loadComplete:
            performance.timing.loadEventEnd -
            performance.timing.navigationStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
        },
      },
      accessibility: {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
          .matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        forcedColors: window.matchMedia('(forced-colors: active)').matches,
      },
      network: {
        online: navigator.onLine,
        effectiveType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink,
        rtt: (navigator as any).connection?.rtt,
      },
      issues,
      recommendations,
      score,
    };
  }

  /**
   * Get First Paint timing
   */
  private getFirstPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(
      (entry) => entry.name === 'first-paint'
    );
    return firstPaint?.startTime;
  }

  /**
   * Get First Contentful Paint timing
   */
  private getFirstContentfulPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    );
    return firstContentfulPaint?.startTime;
  }

  /**
   * Test specific functionality
   */
  async testFunctionality(): Promise<{ [key: string]: boolean }> {
    const tests: { [key: string]: boolean } = {};

    // Test basic DOM manipulation
    try {
      const testElement = document.createElement('div');
      testElement.innerHTML = '<span>test</span>';
      tests.domManipulation = testElement.querySelector('span') !== null;
    } catch {
      tests.domManipulation = false;
    }

    // Test event handling
    try {
      const testElement = document.createElement('div');
      let eventFired = false;
      testElement.addEventListener('click', () => {
        eventFired = true;
      });
      testElement.click();
      tests.eventHandling = eventFired;
    } catch {
      tests.eventHandling = false;
    }

    // Test async operations
    try {
      await new Promise((resolve) => setTimeout(resolve, 1));
      tests.asyncOperations = true;
    } catch {
      tests.asyncOperations = false;
    }

    // Test network requests
    try {
      const response = await fetch('/api/test/health').catch(() => null);
      tests.networkRequests = response !== null;
    } catch {
      tests.networkRequests = false;
    }

    return tests;
  }

  /**
   * Generate detailed HTML report
   */
  generateHTMLReport(): string {
    const report = this.generateReport();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Compatibility Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .score { font-size: 2em; font-weight: bold; color: ${report.score >= 80 ? 'green' : report.score >= 60 ? 'orange' : 'red'}; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .supported { color: green; }
        .not-supported { color: red; }
        .issue { color: red; margin: 5px 0; }
        .recommendation { color: blue; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Browser Compatibility Report</h1>
    <div class="score">Compatibility Score: ${report.score}%</div>
    
    <div class="section">
        <h2>Browser Information</h2>
        <table>
            <tr><td>Name:</td><td>${report.browser.name}</td></tr>
            <tr><td>Version:</td><td>${report.browser.version}</td></tr>
            <tr><td>Engine:</td><td>${report.browser.engine}</td></tr>
            <tr><td>Platform:</td><td>${report.browser.platform}</td></tr>
            <tr><td>Mobile:</td><td>${report.browser.mobile ? 'Yes' : 'No'}</td></tr>
            <tr><td>Supported:</td><td class="${report.browser.supported ? 'supported' : 'not-supported'}">${report.browser.supported ? 'Yes' : 'No'}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Feature Support</h2>
        <table>
            ${Object.entries(report.browser.features)
              .map(([feature, supported]) => {
                if (typeof supported === 'object') {
                  return Object.entries(supported)
                    .map(
                      ([subFeature, subSupported]) =>
                        `<tr><td>${feature}.${subFeature}:</td><td class="${subSupported ? 'supported' : 'not-supported'}">${subSupported ? 'Yes' : 'No'}</td></tr>`
                    )
                    .join('');
                }
                return `<tr><td>${feature}:</td><td class="${supported ? 'supported' : 'not-supported'}">${supported ? 'Yes' : 'No'}</td></tr>`;
              })
              .join('')}
        </table>
    </div>

    ${
      report.issues.length > 0
        ? `
    <div class="section">
        <h2>Issues Found</h2>
        ${report.issues.map((issue) => `<div class="issue">⚠️ ${issue}</div>`).join('')}
    </div>
    `
        : ''
    }

    ${
      report.recommendations.length > 0
        ? `
    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map((rec) => `<div class="recommendation">💡 ${rec}</div>`).join('')}
    </div>
    `
        : ''
    }

    <div class="section">
        <h2>Performance Metrics</h2>
        <table>
            <tr><td>DOM Content Loaded:</td><td>${report.performance.timing.domContentLoaded}ms</td></tr>
            <tr><td>Load Complete:</td><td>${report.performance.timing.loadComplete}ms</td></tr>
            ${report.performance.timing.firstPaint ? `<tr><td>First Paint:</td><td>${report.performance.timing.firstPaint}ms</td></tr>` : ''}
            ${report.performance.timing.firstContentfulPaint ? `<tr><td>First Contentful Paint:</td><td>${report.performance.timing.firstContentfulPaint}ms</td></tr>` : ''}
            ${report.performance.memory ? `<tr><td>Memory Used:</td><td>${report.performance.memory.used}MB</td></tr>` : ''}
        </table>
    </div>

    <div class="section">
        <h2>Viewport Information</h2>
        <table>
            <tr><td>Width:</td><td>${report.viewport.width}px</td></tr>
            <tr><td>Height:</td><td>${report.viewport.height}px</td></tr>
            <tr><td>Device Pixel Ratio:</td><td>${report.viewport.devicePixelRatio}</td></tr>
            <tr><td>Orientation:</td><td>${report.viewport.orientation}</td></tr>
        </table>
    </div>

    <p><small>Generated on ${new Date().toISOString()}</small></p>
</body>
</html>
    `;
  }
}

// Create singleton instance
const compatibilityTester = new BrowserCompatibilityTester();

// Export convenience functions
export const getBrowserInfo = () => compatibilityTester.getBrowserInfo();
export const generateCompatibilityReport = () =>
  compatibilityTester.generateReport();
export const generateHTMLReport = () =>
  compatibilityTester.generateHTMLReport();
export const testBrowserFunctionality = () =>
  compatibilityTester.testFunctionality();

// Export the tester for advanced usage
export { compatibilityTester };

// Auto-run compatibility check in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Browser Compatibility Check:');
  const report = compatibilityTester.generateReport();
  console.log(`Browser: ${report.browser.name} ${report.browser.version}`);
  console.log(`Compatibility Score: ${report.score}%`);

  if (report.issues.length > 0) {
    console.warn('Issues found:', report.issues);
  }

  if (report.recommendations.length > 0) {
    console.info('Recommendations:', report.recommendations);
  }
}

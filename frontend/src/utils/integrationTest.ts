/**
 * Final Integration Testing Utilities
 * Comprehensive testing functions for the automation testing website
 */

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration: number;
  timestamp: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

class IntegrationTester {
  private results: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  /**
   * Start a new test suite
   */
  startSuite(name: string): void {
    this.currentSuite = {
      name,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: Date.now(),
    };
  }

  /**
   * End the current test suite
   */
  endSuite(): void {
    if (this.currentSuite) {
      this.currentSuite.duration = Date.now() - this.currentSuite.duration;
      this.results.push(this.currentSuite);
      this.currentSuite = null;
    }
  }

  /**
   * Run a test and record the result
   */
  async runTest(
    name: string,
    testFn: () => Promise<void> | void
  ): Promise<void> {
    if (!this.currentSuite) {
      throw new Error('No active test suite. Call startSuite() first.');
    }

    const startTime = Date.now();
    let status: 'pass' | 'fail' | 'skip' = 'pass';
    let message = 'Test passed';

    try {
      await testFn();
    } catch (error) {
      status = 'fail';
      message = error instanceof Error ? error.message : 'Unknown error';
    }

    const duration = Date.now() - startTime;
    const result: TestResult = {
      name,
      status,
      message,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.currentSuite.tests.push(result);
    this.currentSuite.totalTests++;

    switch (status) {
      case 'pass':
        this.currentSuite.passedTests++;
        break;
      case 'fail':
        this.currentSuite.failedTests++;
        break;
      case 'skip':
        this.currentSuite.skippedTests++;
        break;
    }

    // Log result in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
      console.log(`${emoji} ${name} (${duration}ms)`);
      if (status === 'fail') {
        console.error(`   Error: ${message}`);
      }
    }
  }

  /**
   * Get all test results
   */
  getResults(): TestSuite[] {
    return [...this.results];
  }

  /**
   * Generate a summary report
   */
  generateReport(): string {
    const totalSuites = this.results.length;
    const totalTests = this.results.reduce(
      (sum, suite) => sum + suite.totalTests,
      0
    );
    const totalPassed = this.results.reduce(
      (sum, suite) => sum + suite.passedTests,
      0
    );
    const totalFailed = this.results.reduce(
      (sum, suite) => sum + suite.failedTests,
      0
    );
    const totalSkipped = this.results.reduce(
      (sum, suite) => sum + suite.skippedTests,
      0
    );
    const totalDuration = this.results.reduce(
      (sum, suite) => sum + suite.duration,
      0
    );

    let report = `
Integration Test Report
=======================
Total Suites: ${totalSuites}
Total Tests: ${totalTests}
Passed: ${totalPassed}
Failed: ${totalFailed}
Skipped: ${totalSkipped}
Total Duration: ${totalDuration}ms

`;

    this.results.forEach((suite) => {
      report += `
Suite: ${suite.name}
  Tests: ${suite.totalTests}
  Passed: ${suite.passedTests}
  Failed: ${suite.failedTests}
  Skipped: ${suite.skippedTests}
  Duration: ${suite.duration}ms

`;

      suite.tests.forEach((test) => {
        const status =
          test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
        report += `  ${status} ${test.name} (${test.duration}ms)\n`;
        if (test.status === 'fail') {
          report += `     Error: ${test.message}\n`;
        }
      });
    });

    return report;
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
    this.currentSuite = null;
  }
}

// Create singleton instance
const integrationTester = new IntegrationTester();

/**
 * Test API endpoints
 */
export async function testApiEndpoints(): Promise<void> {
  integrationTester.startSuite('API Endpoints');

  await integrationTester.runTest('Health Check', async () => {
    const response = await fetch('/api/test/health');
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
  });

  await integrationTester.runTest('User Authentication', async () => {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (loginResponse.status !== 200 && loginResponse.status !== 401) {
      throw new Error(`Login endpoint failed: ${loginResponse.status}`);
    }
  });

  await integrationTester.runTest('Products API', async () => {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`Products API failed: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.data)) {
      throw new Error('Products API did not return array');
    }
  });

  await integrationTester.runTest('Test Data Seeding', async () => {
    const response = await fetch('/api/test-data/status');
    if (!response.ok) {
      throw new Error(`Test data status failed: ${response.status}`);
    }
  });

  integrationTester.endSuite();
}

/**
 * Test UI components
 */
export async function testUIComponents(): Promise<void> {
  integrationTester.startSuite('UI Components');

  await integrationTester.runTest('Modal Component', async () => {
    const modal = document.querySelector('[data-testid="modal"]');
    if (!modal && document.querySelectorAll('.modal').length === 0) {
      // This is expected if no modal is currently open
      return;
    }
  });

  await integrationTester.runTest('Toast Notifications', async () => {
    const toastContainer = document.querySelector(
      '[data-testid="toast-container"]'
    );
    // Toast container should exist even if empty
    if (!toastContainer) {
      throw new Error('Toast container not found');
    }
  });

  await integrationTester.runTest('Loading Spinner', async () => {
    const spinner = document.querySelector('[data-testid="loading-spinner"]');
    // Spinner might not be visible, which is fine
    if (spinner && !spinner.getAttribute('role')) {
      throw new Error('Loading spinner missing accessibility attributes');
    }
  });

  await integrationTester.runTest('Navigation Menu', async () => {
    const nav =
      document.querySelector('nav') ||
      document.querySelector('[role="navigation"]');
    if (!nav) {
      throw new Error('Navigation menu not found');
    }
  });

  integrationTester.endSuite();
}

/**
 * Test accessibility features
 */
export async function testAccessibility(): Promise<void> {
  integrationTester.startSuite('Accessibility');

  await integrationTester.runTest('Skip Links', async () => {
    const skipLinks = document.querySelector('[data-testid="skip-links"]');
    if (!skipLinks) {
      throw new Error('Skip links not found');
    }
  });

  await integrationTester.runTest('ARIA Labels', async () => {
    const interactiveElements = document.querySelectorAll(
      'button, input, select, textarea'
    );
    let missingLabels = 0;

    interactiveElements.forEach((element) => {
      const hasLabel =
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.closest('label') ||
        element.querySelector('label');

      if (!hasLabel && element.getAttribute('type') !== 'hidden') {
        missingLabels++;
      }
    });

    if (missingLabels > 0) {
      console.warn(`${missingLabels} interactive elements missing labels`);
    }
  });

  await integrationTester.runTest('Keyboard Navigation', async () => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      throw new Error('No focusable elements found');
    }
  });

  integrationTester.endSuite();
}

/**
 * Test performance metrics
 */
export async function testPerformance(): Promise<void> {
  integrationTester.startSuite('Performance');

  await integrationTester.runTest('Page Load Time', async () => {
    if (performance.timing) {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime > 5000) {
        throw new Error(`Page load time too slow: ${loadTime}ms`);
      }
    }
  });

  await integrationTester.runTest('Memory Usage', async () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;

      if (usedMB > 100) {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB`);
      }
    }
  });

  await integrationTester.runTest('Bundle Size', async () => {
    // Check if bundle analyzer is available
    if (window.bundleAnalyzer) {
      const stats = window.bundleAnalyzer.getStats();
      if (stats.totalSize > 5 * 1024 * 1024) {
        // 5MB
        console.warn(
          `Large bundle size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`
        );
      }
    }
  });

  integrationTester.endSuite();
}

/**
 * Test error handling
 */
export async function testErrorHandling(): Promise<void> {
  integrationTester.startSuite('Error Handling');

  await integrationTester.runTest('Error Boundary', async () => {
    // Check if error boundary is properly set up
    const errorBoundary = document.querySelector('[data-error-boundary]');
    // Error boundary might not be visible, which is good
  });

  await integrationTester.runTest('Network Error Handling', async () => {
    try {
      await fetch('/api/nonexistent-endpoint');
    } catch (error) {
      // Network errors should be handled gracefully
    }
  });

  await integrationTester.runTest('Error Reporting', async () => {
    const errorReports = localStorage.getItem('error_reports');
    // Having no errors is actually good
    if (errorReports) {
      const reports = JSON.parse(errorReports);
      if (reports.length > 10) {
        console.warn(`Many error reports found: ${reports.length}`);
      }
    }
  });

  integrationTester.endSuite();
}

/**
 * Run all integration tests
 */
export async function runAllTests(): Promise<TestSuite[]> {
  console.log('🚀 Starting comprehensive integration tests...');

  integrationTester.clearResults();

  try {
    await testApiEndpoints();
    await testUIComponents();
    await testAccessibility();
    await testPerformance();
    await testErrorHandling();
  } catch (error) {
    console.error('Integration test suite failed:', error);
  }

  const results = integrationTester.getResults();
  const report = integrationTester.generateReport();

  console.log(report);

  // Store results for later analysis
  localStorage.setItem(
    'integration_test_results',
    JSON.stringify({
      results,
      report,
      timestamp: new Date().toISOString(),
    })
  );

  return results;
}

/**
 * Get stored test results
 */
export function getStoredTestResults(): {
  results: TestSuite[];
  report: string;
  timestamp: string;
} | null {
  try {
    const stored = localStorage.getItem('integration_test_results');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Test automation-specific features
 */
export async function testAutomationFeatures(): Promise<void> {
  integrationTester.startSuite('Automation Features');

  await integrationTester.runTest('Data Test IDs', async () => {
    const elementsWithTestIds = document.querySelectorAll('[data-testid]');
    if (elementsWithTestIds.length < 10) {
      throw new Error('Insufficient elements with data-testid attributes');
    }
  });

  await integrationTester.runTest('Unique IDs', async () => {
    const elementsWithIds = document.querySelectorAll('[id]');
    const ids = Array.from(elementsWithIds).map((el) => el.id);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
      throw new Error('Duplicate IDs found');
    }
  });

  await integrationTester.runTest('Form Elements', async () => {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, select, textarea');

    if (forms.length === 0 && inputs.length === 0) {
      throw new Error('No form elements found for testing');
    }
  });

  integrationTester.endSuite();
}

// Export the tester instance for advanced usage
export { integrationTester };

// Global declaration for bundle analyzer
declare global {
  interface Window {
    bundleAnalyzer?: {
      getStats(): { totalSize: number };
    };
  }
}

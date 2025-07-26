import React, { useState } from 'react';
import {
  simulateError,
  reportError,
  reportNetworkError,
} from '../utils/errorReporting';

const ErrorTestPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testJavaScriptError = () => {
    try {
      addResult('Testing JavaScript error...');
      simulateError('javascript');
    } catch (error) {
      addResult('JavaScript error caught and reported');
    }
  };

  const testNetworkError = async () => {
    setIsLoading(true);
    addResult('Testing network error...');

    try {
      const response = await fetch('/api/test/error/500');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      reportNetworkError({
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statusCode: 500,
        endpoint: '/api/test/error/500',
        method: 'GET',
        severity: 'high',
      });
      addResult('Network error simulated and reported');
    } finally {
      setIsLoading(false);
    }
  };

  const testBoundaryError = () => {
    addResult('Testing boundary error...');
    simulateError('boundary');
  };

  const testCustomError = () => {
    addResult('Testing custom error report...');
    reportError({
      message: 'Custom test error for automation testing',
      errorType: 'javascript',
      severity: 'medium',
      context: {
        testType: 'manual',
        feature: 'error-reporting',
        userAction: 'button-click',
      },
    });
    addResult('Custom error reported successfully');
  };

  const testHttpErrors = async (statusCode: number) => {
    setIsLoading(true);
    addResult(`Testing HTTP ${statusCode} error...`);

    try {
      const response = await fetch(`/api/test/error/${statusCode}`);
      const data = await response.json();

      if (!response.ok) {
        reportNetworkError({
          message: data.error?.message || `HTTP ${statusCode} error`,
          statusCode,
          endpoint: `/api/test/error/${statusCode}`,
          method: 'GET',
          severity: statusCode >= 500 ? 'high' : 'medium',
        });
        addResult(`HTTP ${statusCode} error simulated and reported`);
      }
    } catch (error) {
      addResult(`Failed to simulate HTTP ${statusCode} error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testOfflineSimulation = () => {
    addResult('Simulating offline state...');

    // Temporarily override navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Dispatch offline event
    window.dispatchEvent(new Event('offline'));

    setTimeout(() => {
      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
      addResult('Online state restored');
    }, 3000);

    addResult('Offline state simulated for 3 seconds');
  };

  const testUnhandledPromiseRejection = () => {
    addResult('Testing unhandled promise rejection...');

    // Create an unhandled promise rejection
    Promise.reject(new Error('Unhandled promise rejection for testing'));

    addResult('Unhandled promise rejection triggered');
  };

  const testMemoryError = async () => {
    setIsLoading(true);
    addResult('Testing memory-intensive operation...');

    try {
      const response = await fetch('/api/test/memory-intensive?size=5000000');
      const data = await response.json();

      if (data.success) {
        addResult('Memory-intensive operation completed successfully');
      }
    } catch (error) {
      reportNetworkError({
        message: `Memory test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        endpoint: '/api/test/memory-intensive',
        method: 'GET',
        severity: 'medium',
      });
      addResult('Memory test error reported');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="error-test-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Error Handling Test Page
        </h1>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="text-yellow-600 dark:text-yellow-400 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Testing Environment
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                This page is designed for testing error handling mechanisms.
                Errors generated here are intentional and will be logged for
                testing purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Error Testing Controls */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                JavaScript Errors
              </h2>
              <div className="space-y-3">
                <button
                  onClick={testJavaScriptError}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-javascript-error"
                  disabled={isLoading}
                >
                  Test JavaScript Error
                </button>

                <button
                  onClick={testBoundaryError}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-boundary-error"
                  disabled={isLoading}
                >
                  Test Error Boundary
                </button>

                <button
                  onClick={testUnhandledPromiseRejection}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-promise-rejection"
                  disabled={isLoading}
                >
                  Test Promise Rejection
                </button>

                <button
                  onClick={testCustomError}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-custom-error"
                  disabled={isLoading}
                >
                  Test Custom Error Report
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Network Errors
              </h2>
              <div className="space-y-3">
                <button
                  onClick={testNetworkError}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-network-error"
                  disabled={isLoading}
                >
                  Test Network Error (500)
                </button>

                <button
                  onClick={() => testHttpErrors(404)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-404-error"
                  disabled={isLoading}
                >
                  Test 404 Error
                </button>

                <button
                  onClick={() => testHttpErrors(403)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-403-error"
                  disabled={isLoading}
                >
                  Test 403 Error
                </button>

                <button
                  onClick={testOfflineSimulation}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-offline-simulation"
                  disabled={isLoading}
                >
                  Simulate Offline State
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Performance Errors
              </h2>
              <div className="space-y-3">
                <button
                  onClick={testMemoryError}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  data-testid="test-memory-error"
                  disabled={isLoading}
                >
                  Test Memory-Intensive Operation
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Test Results
                </h2>
                <button
                  onClick={clearResults}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  data-testid="clear-results"
                >
                  Clear
                </button>
              </div>

              <div
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto"
                data-testid="test-results"
              >
                {testResults.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No test results yet. Click a test button to see results
                    here.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="text-sm font-mono text-gray-700 dark:text-gray-300"
                        data-testid={`test-result-${index}`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Error Navigation Links
              </h2>
              <div className="space-y-3">
                <a
                  href="/non-existent-page"
                  className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
                  data-testid="navigate-404"
                >
                  Navigate to 404 Page
                </a>

                <button
                  onClick={() => (window.location.href = '/api/test/error/500')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  data-testid="navigate-500"
                >
                  Navigate to 500 Error
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            data-testid="loading-overlay"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">
                Testing in progress...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorTestPage;

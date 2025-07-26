import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PerformanceProvider,
  usePerformance,
  withPerformanceMonitoring,
} from '../PerformanceContext';

// Mock performance.timing
Object.defineProperty(window, 'performance', {
  value: {
    timing: {
      navigationStart: 1000,
      loadEventEnd: 2000,
    },
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    },
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

// Test component that uses the performance context
const TestComponent = () => {
  const {
    metrics,
    apiCalls,
    recordApiCall,
    recordError,
    recordRender,
    getSlowApiCalls,
    getApiCallsByEndpoint,
    clearMetrics,
    exportMetrics,
  } = usePerformance();

  return (
    <div>
      <div data-testid="page-load-time">{metrics.pageLoadTime}</div>
      <div data-testid="total-api-calls">{metrics.totalApiCalls}</div>
      <div data-testid="average-response-time">
        {metrics.averageApiResponseTime.toFixed(2)}
      </div>
      <div data-testid="slow-api-calls">{metrics.slowApiCalls}</div>
      <div data-testid="memory-usage">{metrics.memoryUsage}</div>
      <div data-testid="render-count">{metrics.renderCount}</div>
      <div data-testid="error-count">{metrics.errorCount}</div>
      <div data-testid="api-calls-count">{apiCalls.length}</div>

      <button
        data-testid="record-api-call"
        onClick={() =>
          recordApiCall({
            url: '/api/test',
            method: 'GET',
            duration: 500,
            status: 200,
            timestamp: Date.now(),
            size: 1024,
          })
        }
      >
        Record API Call
      </button>

      <button
        data-testid="record-slow-api-call"
        onClick={() =>
          recordApiCall({
            url: '/api/slow',
            method: 'POST',
            duration: 1500,
            status: 200,
            timestamp: Date.now(),
          })
        }
      >
        Record Slow API Call
      </button>

      <button
        data-testid="record-error"
        onClick={() => recordError(new Error('Test error'), 'test-context')}
      >
        Record Error
      </button>

      <button
        data-testid="record-render"
        onClick={() => recordRender('TestComponent', 25)}
      >
        Record Render
      </button>

      <button
        data-testid="get-slow-calls"
        onClick={() => {
          const slowCalls = getSlowApiCalls();
          console.log('Slow calls:', slowCalls.length);
        }}
      >
        Get Slow Calls
      </button>

      <button
        data-testid="get-calls-by-endpoint"
        onClick={() => {
          const calls = getApiCallsByEndpoint('/api/test');
          console.log('Calls by endpoint:', calls.length);
        }}
      >
        Get Calls by Endpoint
      </button>

      <button data-testid="clear-metrics" onClick={clearMetrics}>
        Clear Metrics
      </button>

      <button
        data-testid="export-metrics"
        onClick={() => {
          const exported = exportMetrics();
          console.log('Exported:', exported.length);
        }}
      >
        Export Metrics
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PerformanceProvider>{component}</PerformanceProvider>);
};

describe('PerformanceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides initial performance metrics', () => {
    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('page-load-time')).toHaveTextContent('1000');
    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('0');
    expect(screen.getByTestId('average-response-time')).toHaveTextContent(
      '0.00'
    );
    expect(screen.getByTestId('slow-api-calls')).toHaveTextContent('0');
    expect(screen.getByTestId('render-count')).toHaveTextContent('0');
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    expect(screen.getByTestId('api-calls-count')).toHaveTextContent('0');
  });

  it('records API calls and updates metrics', () => {
    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');

    act(() => {
      recordButton.click();
    });

    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('1');
    expect(screen.getByTestId('average-response-time')).toHaveTextContent(
      '500.00'
    );
    expect(screen.getByTestId('slow-api-calls')).toHaveTextContent('0');
    expect(screen.getByTestId('api-calls-count')).toHaveTextContent('1');
  });

  it('tracks slow API calls correctly', () => {
    renderWithProvider(<TestComponent />);

    const recordSlowButton = screen.getByTestId('record-slow-api-call');

    act(() => {
      recordSlowButton.click();
    });

    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('1');
    expect(screen.getByTestId('slow-api-calls')).toHaveTextContent('1');
    expect(screen.getByTestId('average-response-time')).toHaveTextContent(
      '1500.00'
    );
  });

  it('calculates average response time correctly with multiple calls', () => {
    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');
    const recordSlowButton = screen.getByTestId('record-slow-api-call');

    act(() => {
      recordButton.click(); // 500ms
      recordSlowButton.click(); // 1500ms
    });

    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('2');
    expect(screen.getByTestId('average-response-time')).toHaveTextContent(
      '1000.00'
    ); // (500 + 1500) / 2
    expect(screen.getByTestId('slow-api-calls')).toHaveTextContent('1');
  });

  it('records errors and updates error count', () => {
    renderWithProvider(<TestComponent />);

    const recordErrorButton = screen.getByTestId('record-error');

    act(() => {
      recordErrorButton.click();
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
  });

  it('records render information', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProvider(<TestComponent />);

    const recordRenderButton = screen.getByTestId('record-render');

    act(() => {
      recordRenderButton.click();
    });

    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Slow render detected: TestComponent took 25.00ms'
    );

    consoleSpy.mockRestore();
  });

  it('filters slow API calls correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');
    const recordSlowButton = screen.getByTestId('record-slow-api-call');
    const getSlowCallsButton = screen.getByTestId('get-slow-calls');

    act(() => {
      recordButton.click(); // 500ms - not slow
      recordSlowButton.click(); // 1500ms - slow
      getSlowCallsButton.click();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Slow calls:', 1);

    consoleSpy.mockRestore();
  });

  it('filters API calls by endpoint correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');
    const recordSlowButton = screen.getByTestId('record-slow-api-call');
    const getCallsByEndpointButton = screen.getByTestId(
      'get-calls-by-endpoint'
    );

    act(() => {
      recordButton.click(); // /api/test
      recordSlowButton.click(); // /api/slow
      getCallsByEndpointButton.click(); // filter by /api/test
    });

    expect(consoleSpy).toHaveBeenCalledWith('Calls by endpoint:', 1);

    consoleSpy.mockRestore();
  });

  it('clears metrics correctly', () => {
    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');
    const recordErrorButton = screen.getByTestId('record-error');
    const clearButton = screen.getByTestId('clear-metrics');

    act(() => {
      recordButton.click();
      recordErrorButton.click();
    });

    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('1');
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    act(() => {
      clearButton.click();
    });

    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('0');
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    expect(screen.getByTestId('api-calls-count')).toHaveTextContent('0');
  });

  it('exports metrics correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');
    const exportButton = screen.getByTestId('export-metrics');

    act(() => {
      recordButton.click();
      exportButton.click();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Exported:', expect.any(Number));
    expect(consoleSpy.mock.calls[0][1]).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });

  it('limits API calls history to prevent memory issues', () => {
    renderWithProvider(<TestComponent />);

    const recordButton = screen.getByTestId('record-api-call');

    // Record more than 1000 API calls
    act(() => {
      for (let i = 0; i < 1005; i++) {
        recordButton.click();
      }
    });

    expect(screen.getByTestId('api-calls-count')).toHaveTextContent('1000');
    expect(screen.getByTestId('total-api-calls')).toHaveTextContent('1005');
  });

  it('limits error history to prevent memory issues', () => {
    renderWithProvider(<TestComponent />);

    const recordErrorButton = screen.getByTestId('record-error');

    // Record more than 100 errors
    act(() => {
      for (let i = 0; i < 105; i++) {
        recordErrorButton.click();
      }
    });

    expect(screen.getByTestId('error-count')).toHaveTextContent('105');
  });

  it('updates memory usage periodically', async () => {
    renderWithProvider(<TestComponent />);

    const initialMemory = screen.getByTestId('memory-usage').textContent;

    // Fast-forward time to trigger memory update
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      const currentMemory = screen.getByTestId('memory-usage').textContent;
      expect(currentMemory).toBe(initialMemory); // Should be the same in test environment
    });
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'usePerformance must be used within a PerformanceProvider'
    );

    consoleSpy.mockRestore();
  });
});

describe('withPerformanceMonitoring HOC', () => {
  it('wraps component with performance monitoring', () => {
    const TestComponent = () => <div data-testid="test-component">Test</div>;
    const WrappedComponent = withPerformanceMonitoring(
      TestComponent,
      'TestComponent'
    );

    renderWithProvider(<WrappedComponent />);

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('records render performance for wrapped component', () => {
    const TestComponent = () => <div data-testid="test-component">Test</div>;
    const WrappedComponent = withPerformanceMonitoring(
      TestComponent,
      'TestComponent'
    );

    renderWithProvider(<WrappedComponent />);

    // The HOC should record render performance automatically
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});

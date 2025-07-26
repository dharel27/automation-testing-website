import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  usePerformanceMonitor,
  useAsyncPerformanceMonitor,
} from '../usePerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 20, // 20MB
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('usePerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockPerformance.now.mockReturnValue(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default metrics', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    expect(result.current.metrics).toEqual({
      renderTime: 0,
      componentMountTime: 0,
      lastUpdateTime: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      memoryUsage: 1024 * 1024 * 20,
    });
  });

  it('starts and ends measurements correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    act(() => {
      const startTime = result.current.startMeasurement('test-operation');
      expect(startTime).toBe(1000);
      expect(mockPerformance.mark).toHaveBeenCalledWith(
        'TestComponent-test-operation-start'
      );
    });

    mockPerformance.now.mockReturnValue(1050); // 50ms later

    act(() => {
      const duration = result.current.endMeasurement('test-operation');
      expect(duration).toBe(50);
      expect(mockPerformance.mark).toHaveBeenCalledWith(
        'TestComponent-test-operation-end'
      );
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'TestComponent-test-operation',
        'TestComponent-test-operation-start',
        'TestComponent-test-operation-end'
      );
    });

    expect(result.current.metrics.renderTime).toBe(50);
    expect(result.current.metrics.totalRenders).toBe(1);
    expect(result.current.metrics.averageRenderTime).toBe(50);
  });

  it('calculates average render time correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    // First measurement: 50ms
    mockPerformance.now.mockReturnValue(1000);
    act(() => {
      result.current.startMeasurement('render-1');
    });

    mockPerformance.now.mockReturnValue(1050);
    act(() => {
      result.current.endMeasurement('render-1');
    });

    expect(result.current.metrics.averageRenderTime).toBe(50);

    // Second measurement: 30ms
    mockPerformance.now.mockReturnValue(1100);
    act(() => {
      result.current.startMeasurement('render-2');
    });

    mockPerformance.now.mockReturnValue(1130);
    act(() => {
      result.current.endMeasurement('render-2');
    });

    expect(result.current.metrics.totalRenders).toBe(2);
    expect(result.current.metrics.averageRenderTime).toBe(40); // (50 + 30) / 2
  });

  it('limits render times history to 100 measurements', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    // Record 105 measurements
    for (let i = 0; i < 105; i++) {
      mockPerformance.now.mockReturnValue(1000 + i * 10);
      act(() => {
        result.current.startMeasurement(`render-${i}`);
      });

      mockPerformance.now.mockReturnValue(1000 + i * 10 + 5);
      act(() => {
        result.current.endMeasurement(`render-${i}`);
      });
    }

    // Should only keep last 100 measurements
    expect(result.current.metrics.totalRenders).toBe(100);
  });

  it('warns about slow renders', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    mockPerformance.now.mockReturnValue(1000);
    act(() => {
      result.current.startMeasurement('slow-render');
    });

    mockPerformance.now.mockReturnValue(1020); // 20ms - exceeds 16ms threshold
    act(() => {
      result.current.endMeasurement('slow-render');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'TestComponent render time (20.00ms) exceeds 16ms threshold'
    );

    consoleSpy.mockRestore();
  });

  it('gets performance entries correctly', () => {
    const mockEntries = [
      { name: 'TestComponent-render', startTime: 100, duration: 50 },
      { name: 'TestComponent-render', startTime: 200, duration: 30 },
    ];

    mockPerformance.getEntriesByName.mockReturnValue(mockEntries);

    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    const entries = result.current.getPerformanceEntries();

    expect(mockPerformance.getEntriesByName).toHaveBeenCalledWith(
      'TestComponent-render'
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      name: 'TestComponent-render',
      startTime: 100,
      duration: 50,
      timestamp: expect.any(Number),
    });
  });

  it('clears metrics correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    // Record some measurements first
    mockPerformance.now.mockReturnValue(1000);
    act(() => {
      result.current.startMeasurement('test');
    });

    mockPerformance.now.mockReturnValue(1050);
    act(() => {
      result.current.endMeasurement('test');
    });

    expect(result.current.metrics.totalRenders).toBe(1);

    act(() => {
      result.current.clearMetrics();
    });

    expect(result.current.metrics).toEqual({
      renderTime: 0,
      componentMountTime: 0,
      lastUpdateTime: 0,
      totalRenders: 0,
      averageRenderTime: 0,
    });

    expect(mockPerformance.clearMarks).toHaveBeenCalled();
    expect(mockPerformance.clearMeasures).toHaveBeenCalled();
  });

  it('handles missing performance API gracefully', () => {
    // Temporarily remove performance API methods
    const originalMark = mockPerformance.mark;
    const originalMeasure = mockPerformance.measure;

    delete (mockPerformance as any).mark;
    delete (mockPerformance as any).measure;

    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    // Should not throw errors
    act(() => {
      result.current.startMeasurement('test');
      result.current.endMeasurement('test');
    });

    expect(result.current.metrics.renderTime).toBeGreaterThan(0);

    // Restore methods
    mockPerformance.mark = originalMark;
    mockPerformance.measure = originalMeasure;
  });

  it('calculates component mount time', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));

    // Mount time should be calculated automatically
    expect(result.current.metrics.componentMountTime).toBeGreaterThanOrEqual(0);
  });
});

describe('useAsyncPerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('measures async operations successfully', async () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitor());

    const asyncOperation = vi.fn().mockResolvedValue('test-result');

    mockPerformance.now
      .mockReturnValueOnce(1000) // start time
      .mockReturnValueOnce(1150); // end time

    const resultValue = await act(async () => {
      return result.current.measureAsync('test-operation', asyncOperation);
    });

    expect(resultValue).toBe('test-result');
    expect(asyncOperation).toHaveBeenCalled();

    const measurement = result.current.getMeasurement('test-operation');
    expect(measurement).toEqual({
      name: 'test-operation',
      startTime: 1000,
      duration: 150,
      timestamp: expect.any(Number),
    });
  });

  it('measures async operations that throw errors', async () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitor());

    const asyncOperation = vi.fn().mockRejectedValue(new Error('Test error'));

    mockPerformance.now
      .mockReturnValueOnce(1000) // start time
      .mockReturnValueOnce(1100); // end time

    await act(async () => {
      try {
        await result.current.measureAsync('error-operation', asyncOperation);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    const measurement = result.current.getMeasurement('error-operation-error');
    expect(measurement).toEqual({
      name: 'error-operation-error',
      startTime: 1000,
      duration: 100,
      timestamp: expect.any(Number),
    });
  });

  it('gets specific measurements', async () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitor());

    const asyncOperation = vi.fn().mockResolvedValue('result');

    await act(async () => {
      await result.current.measureAsync('operation-1', asyncOperation);
      await result.current.measureAsync('operation-2', asyncOperation);
    });

    const measurement1 = result.current.getMeasurement('operation-1');
    const measurement2 = result.current.getMeasurement('operation-2');
    const nonExistent = result.current.getMeasurement('non-existent');

    expect(measurement1).toBeDefined();
    expect(measurement2).toBeDefined();
    expect(nonExistent).toBeUndefined();
  });

  it('gets all measurements', async () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitor());

    const asyncOperation = vi.fn().mockResolvedValue('result');

    await act(async () => {
      await result.current.measureAsync('operation-1', asyncOperation);
      await result.current.measureAsync('operation-2', asyncOperation);
    });

    const allMeasurements = result.current.getAllMeasurements();
    expect(allMeasurements).toHaveLength(2);
    expect(allMeasurements.map((m) => m.name)).toEqual([
      'operation-1',
      'operation-2',
    ]);
  });

  it('clears measurements', async () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitor());

    const asyncOperation = vi.fn().mockResolvedValue('result');

    await act(async () => {
      await result.current.measureAsync('operation-1', asyncOperation);
    });

    expect(result.current.getAllMeasurements()).toHaveLength(1);

    act(() => {
      result.current.clearMeasurements();
    });

    expect(result.current.getAllMeasurements()).toHaveLength(0);
    expect(result.current.getMeasurement('operation-1')).toBeUndefined();
  });

  it('handles multiple concurrent measurements', async () => {
    const { result } = renderHook(() => useAsyncPerformanceMonitor());

    const slowOperation = () =>
      new Promise((resolve) => setTimeout(() => resolve('slow'), 100));
    const fastOperation = () =>
      new Promise((resolve) => setTimeout(() => resolve('fast'), 50));

    await act(async () => {
      const promises = [
        result.current.measureAsync('slow-op', slowOperation),
        result.current.measureAsync('fast-op', fastOperation),
      ];

      await Promise.all(promises);
    });

    const slowMeasurement = result.current.getMeasurement('slow-op');
    const fastMeasurement = result.current.getMeasurement('fast-op');

    expect(slowMeasurement).toBeDefined();
    expect(fastMeasurement).toBeDefined();
    expect(slowMeasurement!.duration).toBeGreaterThan(
      fastMeasurement!.duration
    );
  });
});

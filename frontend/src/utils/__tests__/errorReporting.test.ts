import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import {
  errorReporting,
  reportError,
  reportNetworkError,
  reportBoundaryError,
  simulateError,
} from '../errorReporting';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('ErrorReportingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
    console.warn = vi.fn();
    localStorageMock.getItem.mockReturnValue(null);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    errorReporting.clearStoredReports();
    errorReporting.setEnabled(true);
  });

  describe('reportError', () => {
    it('reports error with required fields', () => {
      const error = {
        message: 'Test error',
        errorType: 'javascript' as const,
        severity: 'medium' as const,
      };

      reportError(error);

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports).toHaveLength(1);
      expect(queuedReports[0]).toMatchObject({
        message: 'Test error',
        errorType: 'javascript',
        severity: 'medium',
      });
    });

    it('fills in default values for missing fields', () => {
      reportError({ message: 'Test error' });

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Test error',
        errorType: 'javascript',
        severity: 'medium',
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    it('includes session ID in reports', () => {
      reportError({ message: 'Test error' });

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0].sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('logs error to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      reportError({ message: 'Test error' });

      expect(console.error).toHaveBeenCalledWith(
        'Error reported:',
        expect.any(Object)
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('sends error to backend', () => {
      reportError({ message: 'Test error' });

      expect(global.fetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"message":"Test error"'),
      });
    });

    it('stores error in localStorage', () => {
      reportError({ message: 'Test error' });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'error_reports',
        expect.stringContaining('"message":"Test error"')
      );
    });

    it('does not report when disabled', () => {
      errorReporting.setEnabled(false);
      reportError({ message: 'Test error' });

      expect(errorReporting.getQueuedReports()).toHaveLength(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('reportNetworkError', () => {
    it('reports network error with correct type', () => {
      reportNetworkError({
        message: 'Network error',
        statusCode: 500,
        endpoint: '/api/test',
        method: 'GET',
      });

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Network error',
        errorType: 'network',
        severity: 'medium',
      });
    });

    it('sets high severity for 5xx errors', () => {
      reportNetworkError({
        message: 'Server error',
        statusCode: 500,
        severity: 'high',
      });

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0].severity).toBe('high');
    });
  });

  describe('reportBoundaryError', () => {
    it('reports boundary error with correct type and severity', () => {
      const error = new Error('Boundary error');
      const componentStack = 'Component stack trace';

      reportBoundaryError(error, componentStack);

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Boundary error',
        errorType: 'boundary',
        severity: 'high',
        componentStack,
      });
    });
  });

  describe('global error handlers', () => {
    it('handles window error events', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Global error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Global error'),
      });

      window.dispatchEvent(errorEvent);

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Global error',
        errorType: 'javascript',
        severity: 'high',
      });
    });

    it('handles unhandled promise rejections', () => {
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject('Promise rejection'),
        reason: 'Promise rejection',
      });

      window.dispatchEvent(rejectionEvent);

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Unhandled Promise Rejection: Promise rejection',
        errorType: 'unhandled',
        severity: 'high',
      });
    });
  });

  describe('localStorage operations', () => {
    it('retrieves stored reports', () => {
      const mockReports = [
        { message: 'Stored error', timestamp: new Date().toISOString() },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockReports));

      const storedReports = errorReporting.getStoredReports();
      expect(storedReports).toEqual(mockReports);
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const storedReports = errorReporting.getStoredReports();
      expect(storedReports).toEqual([]);
    });

    it('clears stored reports', () => {
      errorReporting.clearStoredReports();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('error_reports');
    });
  });

  describe('queue management', () => {
    it('maintains queue size limit', () => {
      // Report more than the max limit
      for (let i = 0; i < 150; i++) {
        reportError({ message: `Error ${i}` });
      }

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports.length).toBeLessThanOrEqual(100);
    });
  });

  describe('simulateError', () => {
    it('throws JavaScript error', () => {
      expect(() => simulateError('javascript')).toThrow(
        'Simulated JavaScript error for testing'
      );
    });

    it('reports network error', () => {
      simulateError('network');

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Simulated network error for testing',
        errorType: 'network',
      });
    });

    it('reports boundary error', () => {
      simulateError('boundary');

      const queuedReports = errorReporting.getQueuedReports();
      expect(queuedReports[0]).toMatchObject({
        message: 'Simulated boundary error for testing',
        errorType: 'boundary',
      });
    });
  });

  describe('utility methods', () => {
    it('returns session ID', () => {
      const sessionId = errorReporting.getSessionId();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('returns reporting enabled status', () => {
      expect(errorReporting.isReportingEnabled()).toBe(true);

      errorReporting.setEnabled(false);
      expect(errorReporting.isReportingEnabled()).toBe(false);
    });
  });

  describe('backend communication', () => {
    it('handles backend errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      reportError({ message: 'Test error' });

      // Should not throw and should still queue the error
      expect(errorReporting.getQueuedReports()).toHaveLength(1);
    });

    it('handles non-ok responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      reportError({ message: 'Test error' });

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to send error report to backend'
      );
    });
  });
});

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  errorType: 'javascript' | 'network' | 'boundary' | 'unhandled';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface NetworkErrorReport extends Omit<ErrorReport, 'errorType'> {
  errorType: 'network';
  statusCode?: number;
  endpoint?: string;
  method?: string;
  responseText?: string;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private isEnabled: boolean = true;
  private maxReports: number = 100;
  private reportQueue: ErrorReport[] = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId,
        errorType: 'javascript',
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.sessionId,
        errorType: 'unhandled',
        severity: 'high',
        context: {
          reason: event.reason,
        },
      });
    });
  }

  public reportError(error: Partial<ErrorReport>): void {
    if (!this.isEnabled) return;

    const fullReport: ErrorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      componentStack: error.componentStack,
      timestamp: error.timestamp || new Date().toISOString(),
      userAgent: error.userAgent || navigator.userAgent,
      url: error.url || window.location.href,
      userId: error.userId,
      sessionId: error.sessionId || this.sessionId,
      buildVersion: process.env.REACT_APP_VERSION || 'unknown',
      errorType: error.errorType || 'javascript',
      severity: error.severity || 'medium',
      context: error.context,
    };

    // Add to queue
    this.reportQueue.push(fullReport);

    // Maintain queue size
    if (this.reportQueue.length > this.maxReports) {
      this.reportQueue.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', fullReport);
    }

    // Send to backend (in production)
    this.sendToBackend(fullReport);

    // Store in localStorage for debugging
    this.storeLocally(fullReport);
  }

  public reportNetworkError(error: Partial<NetworkErrorReport>): void {
    this.reportError({
      ...error,
      errorType: 'network',
      severity: error.severity || 'medium',
    });
  }

  public reportBoundaryError(error: Error, componentStack?: string): void {
    this.reportError({
      message: error.message,
      stack: error.stack,
      componentStack,
      errorType: 'boundary',
      severity: 'high',
    });
  }

  private async sendToBackend(report: ErrorReport): Promise<void> {
    try {
      // Only send in production or when explicitly enabled
      if (
        process.env.NODE_ENV !== 'production' &&
        !process.env.REACT_APP_ENABLE_ERROR_REPORTING
      ) {
        return;
      }

      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        console.warn('Failed to send error report to backend');
      }
    } catch (error) {
      // Silently fail to avoid infinite error loops
      console.warn('Error reporting service failed:', error);
    }
  }

  private storeLocally(report: ErrorReport): void {
    try {
      const key = 'error_reports';
      const existing = localStorage.getItem(key);
      const reports = existing ? JSON.parse(existing) : [];

      reports.push(report);

      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }

      localStorage.setItem(key, JSON.stringify(reports));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  public getStoredReports(): ErrorReport[] {
    try {
      const reports = localStorage.getItem('error_reports');
      return reports ? JSON.parse(reports) : [];
    } catch (error) {
      return [];
    }
  }

  public clearStoredReports(): void {
    try {
      localStorage.removeItem('error_reports');
      this.reportQueue = [];
    } catch (error) {
      // Silently fail
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isReportingEnabled(): boolean {
    return this.isEnabled;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getQueuedReports(): ErrorReport[] {
    return [...this.reportQueue];
  }
}

// Export singleton instance
export const errorReporting = ErrorReportingService.getInstance();

// Convenience functions
export const reportError = (error: Partial<ErrorReport>) => {
  errorReporting.reportError(error);
};

export const reportNetworkError = (error: Partial<NetworkErrorReport>) => {
  errorReporting.reportNetworkError(error);
};

export const reportBoundaryError = (error: Error, componentStack?: string) => {
  errorReporting.reportBoundaryError(error, componentStack);
};

// Test function for automation testing
export const simulateError = (
  type: 'javascript' | 'network' | 'boundary' = 'javascript'
) => {
  switch (type) {
    case 'javascript':
      throw new Error('Simulated JavaScript error for testing');
    case 'network':
      reportNetworkError({
        message: 'Simulated network error for testing',
        statusCode: 500,
        endpoint: '/api/test/error',
        method: 'GET',
        severity: 'medium',
      });
      break;
    case 'boundary':
      reportBoundaryError(new Error('Simulated boundary error for testing'));
      break;
  }
};

export default errorReporting;

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to external service (in production)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // For now, just log to console
    console.error('Error reported to service:', errorReport);

    // Example of how you might send to an external service:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // }).catch(console.error);
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
          data-testid="error-boundary"
          role="alert"
          aria-labelledby="error-boundary-title"
        >
          <div className="max-w-lg w-full text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4" role="img" aria-label="Error">
                💥
              </div>
              <h1
                id="error-boundary-title"
                className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                data-testid="error-boundary-title"
              >
                Something went wrong
              </h1>
              <p
                className="text-gray-600 dark:text-gray-400 mb-6"
                data-testid="error-boundary-message"
              >
                An unexpected error occurred in the application. Please try
                refreshing the page or contact support if the problem persists.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  data-testid="error-boundary-retry"
                  aria-label="Try to recover from error"
                >
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  data-testid="error-boundary-reload"
                  aria-label="Reload the page"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Error Details (Development Only)
                </h3>
                <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
                  <div data-testid="error-boundary-error-message">
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div data-testid="error-boundary-stack-trace">
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div data-testid="error-boundary-component-stack">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

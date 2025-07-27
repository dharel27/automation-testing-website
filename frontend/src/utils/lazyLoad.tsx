import React, { Suspense, ComponentType } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorBoundary from '../components/error/ErrorBoundary';

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Higher-order component for lazy loading with error handling
 */
export function withLazyLoad<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  options: LazyLoadOptions = {}
) {
  const { fallback: Fallback = LoadingSpinner, errorFallback: ErrorFallback } =
    options;

  return function LazyLoadedComponent(props: P) {
    const [retryKey, setRetryKey] = React.useState(0);

    const retry = () => {
      setRetryKey((prev) => prev + 1);
    };

    const DefaultErrorFallback = ({
      error,
    }: {
      error: Error;
      retry: () => void;
    }) => (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load component
        </h3>
        <p className="text-gray-600 mb-4">
          There was an error loading this page component.
        </p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          data-testid="retry-button"
        >
          Try Again
        </button>
      </div>
    );

    return (
      <ErrorBoundary
        fallback={ErrorFallback || DefaultErrorFallback}
        onError={(error) => {
          console.error('Lazy loading error:', error);
        }}
      >
        <Suspense fallback={<Fallback />} key={retryKey}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

/**
 * Preload a lazy component
 */
export function preloadComponent<P>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>
) {
  // Trigger the lazy loading
  LazyComponent();
}

/**
 * Create a lazy component with retry functionality
 */
export function createLazyComponent<P>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<ComponentType<P>> {
  return React.lazy(async () => {
    let lastError: Error;

    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;

        if (i < retries - 1) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError!;
  });
}

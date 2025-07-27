import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  withLazyLoad,
  createLazyComponent,
  preloadComponent,
} from '../../utils/lazyLoad';
import React from 'react';

// Mock component for testing
const MockComponent = ({ message }: { message: string }) => (
  <div data-testid="mock-component">{message}</div>
);

describe('Lazy Loading Performance Tests', () => {
  it('should render lazy component with loading state', async () => {
    const LazyMockComponent = React.lazy(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ default: MockComponent }), 100)
        )
    );

    const WrappedComponent = withLazyLoad(LazyMockComponent);

    render(<WrappedComponent message="test" />);

    // Should show loading spinner initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Should show component after loading
    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });

    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should handle lazy loading errors', async () => {
    const FailingLazyComponent = React.lazy(() =>
      Promise.reject(new Error('Loading failed'))
    );

    const WrappedComponent = withLazyLoad(FailingLazyComponent);

    render(<WrappedComponent />);

    // Should show error fallback
    await waitFor(() => {
      expect(screen.getByText('Failed to load component')).toBeInTheDocument();
    });

    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('should support custom loading fallback', async () => {
    const CustomLoader = () => (
      <div data-testid="custom-loader">Custom Loading...</div>
    );

    const LazyMockComponent = React.lazy(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ default: MockComponent }), 100)
        )
    );

    const WrappedComponent = withLazyLoad(LazyMockComponent, {
      fallback: CustomLoader,
    });

    render(<WrappedComponent message="test" />);

    expect(screen.getByTestId('custom-loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should create lazy component with retry functionality', async () => {
    let attemptCount = 0;

    const LazyComponentWithRetry = createLazyComponent(
      () => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve({ default: MockComponent });
      },
      3, // retries
      10 // delay
    );

    const WrappedComponent = withLazyLoad(LazyComponentWithRetry);

    render(<WrappedComponent message="retry test" />);

    // Should eventually succeed after retry
    await waitFor(
      () => {
        expect(screen.getByTestId('mock-component')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    expect(attemptCount).toBe(2);
  });

  it('should preload components', () => {
    const LazyMockComponent = React.lazy(() =>
      Promise.resolve({ default: MockComponent })
    );

    // Should not throw when preloading
    expect(() => preloadComponent(LazyMockComponent)).not.toThrow();
  });

  it('should handle retry button click', async () => {
    let shouldFail = true;

    const ConditionalFailingComponent = React.lazy(() => {
      if (shouldFail) {
        return Promise.reject(new Error('Loading failed'));
      }
      return Promise.resolve({ default: MockComponent });
    });

    const WrappedComponent = withLazyLoad(ConditionalFailingComponent);

    render(<WrappedComponent message="retry test" />);

    // Should show error initially
    await waitFor(() => {
      expect(screen.getByText('Failed to load component')).toBeInTheDocument();
    });

    // Change condition and retry
    shouldFail = false;
    const retryButton = screen.getByTestId('retry-button');
    retryButton.click();

    // Should succeed after retry
    await waitFor(() => {
      expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    });
  });

  it('should handle multiple retry attempts', async () => {
    const LazyFailingComponent = React.lazy(() =>
      Promise.reject(new Error('Always fails'))
    );

    const WrappedComponent = withLazyLoad(LazyFailingComponent);

    render(<WrappedComponent />);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Failed to load component')).toBeInTheDocument();
    });

    // Multiple retry clicks should work
    const retryButton = screen.getByTestId('retry-button');
    retryButton.click();
    retryButton.click();

    // Should still show error after retries
    await waitFor(() => {
      expect(screen.getByText('Failed to load component')).toBeInTheDocument();
    });
  });
});

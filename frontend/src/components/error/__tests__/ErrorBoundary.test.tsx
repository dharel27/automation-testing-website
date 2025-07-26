import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="normal-component">Normal component</div>;
};

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('normal-component')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-title')).toHaveTextContent(
      'Something went wrong'
    );
    expect(screen.getByTestId('error-boundary-message')).toBeInTheDocument();
    expect(screen.queryByTestId('normal-component')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = (
      <div data-testid="custom-fallback">Custom error UI</div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('handles retry button click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

    const retryButton = screen.getByTestId('error-boundary-retry');
    fireEvent.click(retryButton);

    // After retry, render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('normal-component')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('handles reload button click', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByTestId('error-boundary-reload');
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByTestId('error-boundary-error-message')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('error-boundary-stack-trace')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('error-boundary-component-stack')
    ).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.queryByTestId('error-boundary-error-message')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('error-boundary-stack-trace')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('error-boundary-component-stack')
    ).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('has proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toHaveAttribute('role', 'alert');
    expect(errorBoundary).toHaveAttribute(
      'aria-labelledby',
      'error-boundary-title'
    );

    const retryButton = screen.getByTestId('error-boundary-retry');
    expect(retryButton).toHaveAttribute(
      'aria-label',
      'Try to recover from error'
    );

    const reloadButton = screen.getByTestId('error-boundary-reload');
    expect(reloadButton).toHaveAttribute('aria-label', 'Reload the page');
  });

  it('logs error to console in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );

    process.env.NODE_ENV = originalEnv;
  });
});

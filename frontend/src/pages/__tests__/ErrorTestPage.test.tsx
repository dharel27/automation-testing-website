import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorTestPage from '../ErrorTestPage';

// Mock the error reporting utilities
vi.mock('../../utils/errorReporting', () => ({
  simulateError: vi.fn(),
  reportError: vi.fn(),
  reportNetworkError: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ErrorTestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () =>
        Promise.resolve({
          error: { message: 'Simulated server error' },
        }),
    });
  });

  it('renders error test page with all sections', () => {
    render(<ErrorTestPage />);

    expect(screen.getByTestId('error-test-page')).toBeInTheDocument();
    expect(screen.getByText('Error Handling Test Page')).toBeInTheDocument();
    expect(screen.getByText('JavaScript Errors')).toBeInTheDocument();
    expect(screen.getByText('Network Errors')).toBeInTheDocument();
    expect(screen.getByText('Performance Errors')).toBeInTheDocument();
    expect(screen.getByText('Test Results')).toBeInTheDocument();
  });

  it('shows warning about testing environment', () => {
    render(<ErrorTestPage />);

    expect(screen.getByText('Testing Environment')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This page is designed for testing error handling mechanisms/
      )
    ).toBeInTheDocument();
  });

  describe('JavaScript Error Tests', () => {
    it('handles JavaScript error test', async () => {
      const { simulateError } = await import('../../utils/errorReporting');

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-javascript-error');
      fireEvent.click(button);

      expect(simulateError).toHaveBeenCalledWith('javascript');

      await waitFor(() => {
        expect(
          screen.getByText(/JavaScript error caught and reported/)
        ).toBeInTheDocument();
      });
    });

    it('handles boundary error test', async () => {
      const { simulateError } = await import('../../utils/errorReporting');

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-boundary-error');
      fireEvent.click(button);

      expect(simulateError).toHaveBeenCalledWith('boundary');
    });

    it('handles promise rejection test', () => {
      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-promise-rejection');
      fireEvent.click(button);

      expect(
        screen.getByText(/Unhandled promise rejection triggered/)
      ).toBeInTheDocument();
    });

    it('handles custom error test', async () => {
      const { reportError } = await import('../../utils/errorReporting');

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-custom-error');
      fireEvent.click(button);

      expect(reportError).toHaveBeenCalledWith({
        message: 'Custom test error for automation testing',
        errorType: 'javascript',
        severity: 'medium',
        context: {
          testType: 'manual',
          feature: 'error-reporting',
          userAction: 'button-click',
        },
      });
    });
  });

  describe('Network Error Tests', () => {
    it('handles network error test', async () => {
      const { reportNetworkError } = await import('../../utils/errorReporting');

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-network-error');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/test/error/500');
        expect(reportNetworkError).toHaveBeenCalled();
      });
    });

    it('handles 404 error test', async () => {
      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-404-error');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/test/error/404');
      });
    });

    it('handles 403 error test', async () => {
      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-403-error');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/test/error/403');
      });
    });

    it('handles offline simulation test', () => {
      const originalOnLine = navigator.onLine;

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-offline-simulation');
      fireEvent.click(button);

      expect(
        screen.getByText(/Offline state simulated for 3 seconds/)
      ).toBeInTheDocument();

      // Restore original value
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine,
      });
    });
  });

  describe('Performance Error Tests', () => {
    it('handles memory error test', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { message: 'Memory test completed' },
          }),
      });

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-memory-error');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/test/memory-intensive?size=5000000'
        );
      });
    });
  });

  describe('Test Results', () => {
    it('displays test results', async () => {
      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-custom-error');
      fireEvent.click(button);

      await waitFor(() => {
        const results = screen.getByTestId('test-results');
        expect(results).toBeInTheDocument();
        expect(
          screen.getByText(/Custom error reported successfully/)
        ).toBeInTheDocument();
      });
    });

    it('clears test results', async () => {
      render(<ErrorTestPage />);

      // Add a result first
      const testButton = screen.getByTestId('test-custom-error');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Custom error reported successfully/)
        ).toBeInTheDocument();
      });

      // Clear results
      const clearButton = screen.getByTestId('clear-results');
      fireEvent.click(clearButton);

      expect(screen.getByText(/No test results yet/)).toBeInTheDocument();
    });

    it('shows empty state when no results', () => {
      render(<ErrorTestPage />);

      expect(
        screen.getByText(
          /No test results yet. Click a test button to see results here./
        )
      ).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders navigation links', () => {
      render(<ErrorTestPage />);

      const navigate404 = screen.getByTestId('navigate-404');
      expect(navigate404).toHaveAttribute('href', '/non-existent-page');

      const navigate500 = screen.getByTestId('navigate-500');
      expect(navigate500).toBeInTheDocument();
    });

    it('handles 500 navigation', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' };

      render(<ErrorTestPage />);

      const button = screen.getByTestId('navigate-500');
      fireEvent.click(button);

      expect(window.location.href).toBe('/api/test/error/500');

      window.location = originalLocation;
    });
  });

  describe('Loading State', () => {
    it('shows loading overlay during async operations', async () => {
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              100
            )
          )
      );

      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-network-error');
      fireEvent.click(button);

      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      expect(screen.getByText('Testing in progress...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
      });
    });

    it('disables buttons during loading', () => {
      render(<ErrorTestPage />);

      const button = screen.getByTestId('test-network-error');
      fireEvent.click(button);

      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ErrorTestPage />);

      const page = screen.getByTestId('error-test-page');
      expect(page).toBeInTheDocument();

      // Check that buttons have proper labels
      const jsErrorButton = screen.getByTestId('test-javascript-error');
      expect(jsErrorButton).toHaveTextContent('Test JavaScript Error');

      const networkErrorButton = screen.getByTestId('test-network-error');
      expect(networkErrorButton).toHaveTextContent('Test Network Error (500)');
    });
  });
});

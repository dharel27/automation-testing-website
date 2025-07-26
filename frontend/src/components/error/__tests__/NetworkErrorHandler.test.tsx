import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import NetworkErrorHandler from '../NetworkErrorHandler';

// Mock navigator.onLine
const mockNavigatorOnLine = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: isOnline,
  });
};

describe('NetworkErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigatorOnLine(true);
  });

  it('renders children normally when online', () => {
    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('shows offline banner when navigator.onLine is false initially', () => {
    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    expect(screen.getByTestId('offline-title')).toHaveTextContent(
      'No Internet Connection'
    );
    expect(screen.getByTestId('offline-message')).toHaveTextContent(
      'Please check your internet connection and try again.'
    );
  });

  it('shows offline banner when offline event is fired', async () => {
    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    // Simulate going offline
    mockNavigatorOnLine(false);
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });
  });

  it('hides offline banner when online event is fired', async () => {
    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    // Simulate going online
    mockNavigatorOnLine(true);
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });
  });

  it('handles dismiss button click', async () => {
    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    const dismissButton = screen.getByTestId('offline-dismiss-button');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });
  });

  it('shows retry button when back online', async () => {
    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    expect(
      screen.queryByTestId('offline-retry-button')
    ).not.toBeInTheDocument();

    // Go back online
    mockNavigatorOnLine(true);
    fireEvent(window, new Event('online'));

    // Banner should still be visible but now with retry button
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    expect(screen.getByTestId('offline-retry-button')).toBeInTheDocument();
  });

  it('handles retry button click', async () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    // Go back online to show retry button
    mockNavigatorOnLine(true);
    fireEvent(window, new Event('online'));

    const retryButton = screen.getByTestId('offline-retry-button');
    fireEvent.click(retryButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('does not reload when retry is clicked while offline', async () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    // Simulate clicking retry while still offline
    mockNavigatorOnLine(false);

    // Go online first to show retry button
    mockNavigatorOnLine(true);
    fireEvent(window, new Event('online'));

    // Then go offline again
    mockNavigatorOnLine(false);

    const retryButton = screen.getByTestId('offline-retry-button');
    fireEvent.click(retryButton);

    expect(mockReload).not.toHaveBeenCalled();
  });

  it('shows connection status indicator', () => {
    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    const statusIndicator = screen.getByTestId('connection-status');
    expect(statusIndicator).toBeInTheDocument();
    expect(screen.getByTestId('connection-status-text')).toHaveTextContent(
      'Online'
    );
  });

  it('updates connection status when going offline', async () => {
    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByTestId('connection-status-text')).toHaveTextContent(
      'Online'
    );

    // Go offline
    mockNavigatorOnLine(false);
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByTestId('connection-status-text')).toHaveTextContent(
        'Offline'
      );
    });
  });

  it('has proper accessibility attributes', () => {
    mockNavigatorOnLine(false);

    render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    const offlineBanner = screen.getByTestId('offline-banner');
    expect(offlineBanner).toHaveAttribute('role', 'alert');
    expect(offlineBanner).toHaveAttribute('aria-live', 'assertive');

    const connectionStatus = screen.getByTestId('connection-status');
    expect(connectionStatus).toHaveAttribute('role', 'status');
    expect(connectionStatus).toHaveAttribute('aria-live', 'polite');

    const dismissButton = screen.getByTestId('offline-dismiss-button');
    expect(dismissButton).toHaveAttribute(
      'aria-label',
      'Dismiss offline message'
    );
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <NetworkErrorHandler>
        <div data-testid="child-component">Child content</div>
      </NetworkErrorHandler>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});

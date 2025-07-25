import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  NotificationProvider,
  useNotifications,
  NotificationType,
} from '../NotificationContext';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  close: vi.fn(),
  join: vi.fn(),
  leave: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Test component that uses the notification context
const TestComponent: React.FC = () => {
  const {
    notifications,
    toasts,
    socket,
    isConnected,
    addToast,
    removeToast,
    clearNotifications,
    simulateNotifications,
  } = useNotifications();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="toasts-count">{toasts.length}</div>

      <button
        onClick={() =>
          addToast({
            type: NotificationType.INFO,
            title: 'Test Notification',
            message: 'This is a test message',
          })
        }
        data-testid="add-toast-button"
      >
        Add Toast
      </button>

      <button
        onClick={() => removeToast('test-id')}
        data-testid="remove-toast-button"
      >
        Remove Toast
      </button>

      <button
        onClick={clearNotifications}
        data-testid="clear-notifications-button"
      >
        Clear Notifications
      </button>

      <button
        onClick={simulateNotifications}
        data-testid="simulate-notifications-button"
      >
        Simulate Notifications
      </button>

      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          {toast.title}: {toast.message}
        </div>
      ))}
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide notification context values', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'disconnected'
    );
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    expect(screen.getByTestId('toasts-count')).toHaveTextContent('0');
  });

  it('should add toast notifications', async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const addButton = screen.getByTestId('add-toast-button');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.getByTestId('toasts-count')).toHaveTextContent('1');
    });

    expect(
      screen.getByText('Test Notification: This is a test message')
    ).toBeInTheDocument();
  });

  it('should handle WebSocket connection events', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'connected'
    );

    // Simulate disconnection
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      if (disconnectHandler) disconnectHandler();
    });

    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'disconnected'
    );
  });

  it('should handle incoming WebSocket notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const mockNotification = {
      id: 'test-notification-1',
      type: NotificationType.SUCCESS,
      title: 'WebSocket Notification',
      message: 'This came from WebSocket',
      timestamp: new Date(),
    };

    // Simulate receiving a notification via WebSocket
    act(() => {
      const notificationHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'notification'
      )?.[1];
      if (notificationHandler) notificationHandler(mockNotification);
    });

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.getByTestId('toasts-count')).toHaveTextContent('1');
    });

    expect(
      screen.getByText('WebSocket Notification: This came from WebSocket')
    ).toBeInTheDocument();
  });

  it('should clear notifications via API call', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification first
    const addButton = screen.getByTestId('add-toast-button');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    });

    // Clear notifications
    const clearButton = screen.getByTestId('clear-notifications-button');
    await user.click(clearButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/notifications',
        {
          method: 'DELETE',
        }
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
      expect(screen.getByTestId('toasts-count')).toHaveTextContent('0');
    });
  });

  it('should simulate notifications via API call', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const simulateButton = screen.getByTestId('simulate-notifications-button');
    await user.click(simulateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/notifications/simulate',
        {
          method: 'POST',
        }
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock API error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const simulateButton = screen.getByTestId('simulate-notifications-button');
    await user.click(simulateButton);

    // Should add an error toast
    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    });

    expect(
      screen.getByText(
        'Simulation Error: Failed to start notification simulation'
      )
    ).toBeInTheDocument();
  });

  it('should auto-remove toasts after duration', async () => {
    vi.useFakeTimers();

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const addButton = screen.getByTestId('add-toast-button');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('toasts-count')).toHaveTextContent('1');
    });

    // Fast-forward time to trigger auto-removal (INFO notifications have 5s duration)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('toasts-count')).toHaveTextContent('0');
    });

    // Notification should still be in the list
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');

    vi.useRealTimers();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotifications must be used within a NotificationProvider');

    consoleSpy.mockRestore();
  });
});

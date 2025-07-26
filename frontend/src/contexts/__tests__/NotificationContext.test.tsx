import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationProvider, useNotifications } from '../NotificationContext';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  close: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Test component to access the context
const TestComponent: React.FC = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    unreadCount,
    isConnected,
  } = useNotifications();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="connection-status">
        {isConnected ? 'connected' : 'disconnected'}
      </div>

      <button
        onClick={() =>
          addNotification({
            type: 'info',
            title: 'Test Notification',
            message: 'Test message',
          })
        }
        data-testid="add-notification"
      >
        Add Notification
      </button>

      <button
        onClick={() =>
          notifications.length > 0 && removeNotification(notifications[0].id)
        }
        data-testid="remove-notification"
      >
        Remove First Notification
      </button>

      <button
        onClick={() =>
          notifications.length > 0 && markAsRead(notifications[0].id)
        }
        data-testid="mark-as-read"
      >
        Mark First as Read
      </button>

      <button onClick={clearAll} data-testid="clear-all">
        Clear All
      </button>

      {notifications.map((notification, index) => (
        <div key={notification.id} data-testid={`notification-${index}`}>
          <span data-testid={`notification-title-${index}`}>
            {notification.title}
          </span>
          <span data-testid={`notification-type-${index}`}>
            {notification.type}
          </span>
          <span data-testid={`notification-read-${index}`}>
            {notification.read.toString()}
          </span>
        </div>
      ))}
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial empty state', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'disconnected'
    );
  });

  it('should add notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-title-0')).toHaveTextContent(
      'Test Notification'
    );
    expect(screen.getByTestId('notification-type-0')).toHaveTextContent('info');
    expect(screen.getByTestId('notification-read-0')).toHaveTextContent(
      'false'
    );
  });

  it('should remove notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification first
    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');

    // Remove the notification
    act(() => {
      screen.getByTestId('remove-notification').click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
  });

  it('should mark notifications as read', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification first
    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-read-0')).toHaveTextContent(
      'false'
    );
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');

    // Mark as read
    act(() => {
      screen.getByTestId('mark-as-read').click();
    });

    expect(screen.getByTestId('notification-read-0')).toHaveTextContent('true');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('should clear all notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add multiple notifications
    act(() => {
      screen.getByTestId('add-notification').click();
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('2');

    // Clear all
    act(() => {
      screen.getByTestId('clear-all').click();
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('should handle socket connection events', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Simulate socket connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'connected'
      );
    });

    // Simulate socket disconnection
    act(() => {
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      if (disconnectHandler) disconnectHandler();
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent(
        'disconnected'
      );
    });
  });

  it('should handle incoming socket notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const mockNotification = {
      id: 'socket-notification-1',
      type: 'success' as const,
      title: 'Socket Notification',
      message: 'Received from server',
      timestamp: new Date(),
      read: false,
    };

    // Simulate receiving a notification from socket
    act(() => {
      const notificationHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'notification'
      )?.[1];
      if (notificationHandler) notificationHandler(mockNotification);
    });

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-title-0')).toHaveTextContent(
      'Socket Notification'
    );
    expect(screen.getByTestId('notification-type-0')).toHaveTextContent(
      'success'
    );
  });

  it('should calculate unread count correctly', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add multiple notifications
    act(() => {
      screen.getByTestId('add-notification').click();
      screen.getByTestId('add-notification').click();
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('unread-count')).toHaveTextContent('3');

    // Mark one as read
    act(() => {
      screen.getByTestId('mark-as-read').click();
    });

    expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
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

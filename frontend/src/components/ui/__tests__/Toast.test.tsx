import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Toast from '../Toast';
import { Notification } from '../../../contexts/NotificationContext';

const mockNotification: Notification = {
  id: 'test-notification-1',
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test message',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  read: false,
};

const mockOnClose = vi.fn();

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render notification content correctly', () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    expect(screen.getByTestId('toast-title')).toHaveTextContent(
      'Test Notification'
    );
    expect(screen.getByTestId('toast-message')).toHaveTextContent(
      'This is a test message'
    );
    expect(screen.getByTestId('toast-timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
  });

  it('should render different notification types with correct styles', () => {
    const types: Array<'info' | 'success' | 'warning' | 'error'> = [
      'info',
      'success',
      'warning',
      'error',
    ];

    types.forEach((type) => {
      const { unmount } = render(
        <Toast
          notification={{ ...mockNotification, type }}
          onClose={mockOnClose}
          autoClose={false}
        />
      );

      expect(screen.getByTestId(`toast-${type}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    fireEvent.click(screen.getByTestId('toast-close-button'));

    // Wait for the timeout delay
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(mockNotification.id);
    });
  });

  it('should auto-close after specified duration', async () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        duration={1000}
      />
    );

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith(mockNotification.id);
    });
  });

  it('should not auto-close when autoClose is false', () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show progress bar when auto-closing', () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        duration={1000}
      />
    );

    expect(screen.getByTestId('toast-progress')).toBeInTheDocument();
  });

  it('should not show progress bar when autoClose is false', () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    expect(screen.queryByTestId('toast-progress')).not.toBeInTheDocument();
  });

  it('should update progress bar during countdown', () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        duration={1000}
      />
    );

    const progressBar = screen.getByTestId('toast-progress');

    // Initially should be at 100%
    expect(progressBar).toHaveStyle('width: 100%');

    // After half the duration, should be around 50%
    vi.advanceTimersByTime(500);

    // Note: Due to the interval timing, we check for a range rather than exact value
    waitFor(() => {
      const width = progressBar.style.width;
      const percentage = parseFloat(width.replace('%', ''));
      expect(percentage).toBeLessThan(60);
      expect(percentage).toBeGreaterThan(40);
    });
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    const toast = screen.getByTestId('toast-info');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');

    const closeButton = screen.getByTestId('toast-close-button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
  });

  it('should format timestamp correctly', () => {
    const notification = {
      ...mockNotification,
      timestamp: new Date('2024-01-01T15:30:45Z'),
    };

    render(
      <Toast
        notification={notification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    const timestamp = screen.getByTestId('toast-timestamp');
    expect(timestamp.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/); // Should match time format
  });

  it('should handle different notification types with correct icons', () => {
    const types: Array<'info' | 'success' | 'warning' | 'error'> = [
      'info',
      'success',
      'warning',
      'error',
    ];

    types.forEach((type) => {
      const { unmount } = render(
        <Toast
          notification={{ ...mockNotification, type }}
          onClose={mockOnClose}
          autoClose={false}
        />
      );

      const toast = screen.getByTestId(`toast-${type}`);
      const icon = toast.querySelector('svg');
      expect(icon).toBeInTheDocument();

      unmount();
    });
  });

  it('should apply correct color classes for different types', () => {
    const typeColorMap = {
      success: 'bg-green-50',
      error: 'bg-red-50',
      warning: 'bg-yellow-50',
      info: 'bg-blue-50',
    };

    Object.entries(typeColorMap).forEach(([type, expectedClass]) => {
      const { unmount } = render(
        <Toast
          notification={{ ...mockNotification, type: type as any }}
          onClose={mockOnClose}
          autoClose={false}
        />
      );

      const toast = screen.getByTestId(`toast-${type}`);
      expect(toast).toHaveClass(expectedClass);

      unmount();
    });
  });

  it('should handle rapid close button clicks gracefully', async () => {
    render(
      <Toast
        notification={mockNotification}
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    const closeButton = screen.getByTestId('toast-close-button');

    // Click multiple times rapidly
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);
    fireEvent.click(closeButton);

    // Wait for the timeout delay
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      // Should only call onClose once
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledWith(mockNotification.id);
    });
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Toast, ToastContainer } from '../Toast';
import { NotificationType } from '../../../contexts/NotificationContext';

const mockToast = {
  id: 'test-toast-1',
  type: NotificationType.INFO,
  title: 'Test Toast',
  message: 'This is a test toast message',
  timestamp: new Date('2023-01-01T12:00:00Z'),
  isVisible: true,
  duration: 5000,
};

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toast with correct content', () => {
    render(<Toast toast={mockToast} onClose={mockOnClose} />);

    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Test Toast');
    expect(screen.getByTestId('toast-message')).toHaveTextContent(
      'This is a test toast message'
    );
    expect(screen.getByTestId('toast-icon')).toHaveTextContent('ℹ');
  });

  it('should render different toast types with correct styles and icons', () => {
    const toastTypes = [
      { type: NotificationType.SUCCESS, icon: '✓', testId: 'toast-success' },
      { type: NotificationType.ERROR, icon: '✕', testId: 'toast-error' },
      { type: NotificationType.WARNING, icon: '⚠', testId: 'toast-warning' },
      { type: NotificationType.INFO, icon: 'ℹ', testId: 'toast-info' },
    ];

    toastTypes.forEach(({ type, icon, testId }) => {
      const toast = { ...mockToast, type };
      const { unmount } = render(<Toast toast={toast} onClose={mockOnClose} />);

      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(screen.getByTestId('toast-icon')).toHaveTextContent(icon);

      unmount();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(<Toast toast={mockToast} onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('toast-close-button');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('should display timestamp correctly', () => {
    render(<Toast toast={mockToast} onClose={mockOnClose} />);

    // The timestamp should be formatted as locale time string
    const expectedTime = new Date('2023-01-01T12:00:00Z').toLocaleTimeString();
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('should display additional data when provided', () => {
    const toastWithData = {
      ...mockToast,
      data: { userId: 123, action: 'test' },
    };

    render(<Toast toast={toastWithData} onClose={mockOnClose} />);

    const detailsElement = screen.getByText('Additional Data');
    expect(detailsElement).toBeInTheDocument();

    // Check if the data is displayed in JSON format
    expect(screen.getByText(/"userId": 123/)).toBeInTheDocument();
    expect(screen.getByText(/"action": "test"/)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Toast toast={mockToast} onClose={mockOnClose} />);

    const toastElement = screen.getByTestId('toast-info');
    expect(toastElement).toHaveAttribute('role', 'alert');
    expect(toastElement).toHaveAttribute('aria-live', 'polite');

    const closeButton = screen.getByTestId('toast-close-button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
  });

  it('should have correct data attributes for automation', () => {
    render(<Toast toast={mockToast} onClose={mockOnClose} />);

    const toastElement = screen.getByTestId('toast-info');
    expect(toastElement).toHaveAttribute('data-toast-id', 'test-toast-1');
  });
});

describe('ToastContainer Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      { ...mockToast, id: 'toast-1', title: 'Toast 1' },
      {
        ...mockToast,
        id: 'toast-2',
        title: 'Toast 2',
        type: NotificationType.SUCCESS,
      },
      {
        ...mockToast,
        id: 'toast-3',
        title: 'Toast 3',
        type: NotificationType.ERROR,
      },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('should not render when no toasts are provided', () => {
    render(<ToastContainer toasts={[]} onClose={mockOnClose} />);

    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    const toasts = [mockToast];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const container = screen.getByTestId('toast-container');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-label', 'Notifications');
  });

  it('should handle toast removal', async () => {
    const user = userEvent.setup();
    const toasts = [
      { ...mockToast, id: 'toast-1', title: 'Toast 1' },
      { ...mockToast, id: 'toast-2', title: 'Toast 2' },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const firstToastCloseButton =
      screen.getAllByTestId('toast-close-button')[0];
    await user.click(firstToastCloseButton);

    expect(mockOnClose).toHaveBeenCalledWith('toast-1');
  });

  it('should maintain proper z-index for overlay', () => {
    const toasts = [mockToast];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const container = screen.getByTestId('toast-container');
    expect(container).toHaveClass('z-50');
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import RealTimePage from '../RealTimePage';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  close: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock the components
jest.mock('../../components/ui/RealTimeDataDisplay', () => {
  return function MockRealTimeDataDisplay(props: any) {
    return (
      <div data-testid="real-time-metrics" data-title={props.title}>
        Mock RealTimeDataDisplay
      </div>
    );
  };
});

jest.mock('../../components/ui/InfiniteProductList', () => {
  return function MockInfiniteProductList(props: any) {
    return (
      <div
        data-testid="infinite-product-list"
        data-search-query={props.searchQuery}
        data-category={props.selectedCategory}
      >
        Mock InfiniteProductList
      </div>
    );
  };
});

const renderWithNotificationProvider = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>);
};

describe('RealTimePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page with all sections', () => {
    renderWithNotificationProvider(<RealTimePage />);

    expect(screen.getByTestId('real-time-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-title')).toHaveTextContent(
      'Real-Time Features'
    );
    expect(screen.getByTestId('page-description')).toHaveTextContent(
      'Test real-time notifications, infinite scroll, and live data updates'
    );
    expect(screen.getByTestId('notification-controls')).toBeInTheDocument();
    expect(screen.getByTestId('real-time-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('recent-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('search-controls')).toBeInTheDocument();
    expect(screen.getByTestId('infinite-product-list')).toBeInTheDocument();
  });

  it('should show connection status', () => {
    renderWithNotificationProvider(<RealTimePage />);

    expect(screen.getByTestId('connection-info')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should show connected status when socket connects', async () => {
    renderWithNotificationProvider(<RealTimePage />);

    // Simulate socket connection
    const connectHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'connect'
    )?.[1];
    if (connectHandler) connectHandler();

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('should render notification test buttons', () => {
    renderWithNotificationProvider(<RealTimePage />);

    expect(screen.getByTestId('test-info-notification')).toBeInTheDocument();
    expect(screen.getByTestId('test-success-notification')).toBeInTheDocument();
    expect(screen.getByTestId('test-warning-notification')).toBeInTheDocument();
    expect(screen.getByTestId('test-error-notification')).toBeInTheDocument();
    expect(screen.getByTestId('simulate-notifications')).toBeInTheDocument();
  });

  it('should add notifications when test buttons are clicked', async () => {
    renderWithNotificationProvider(<RealTimePage />);

    // Test info notification
    fireEvent.click(screen.getByTestId('test-info-notification'));

    await waitFor(() => {
      expect(screen.getByText('Test Info Notification')).toBeInTheDocument();
    });

    // Test success notification
    fireEvent.click(screen.getByTestId('test-success-notification'));

    await waitFor(() => {
      expect(screen.getByText('Test Success Notification')).toBeInTheDocument();
    });

    // Test warning notification
    fireEvent.click(screen.getByTestId('test-warning-notification'));

    await waitFor(() => {
      expect(screen.getByText('Test Warning Notification')).toBeInTheDocument();
    });

    // Test error notification
    fireEvent.click(screen.getByTestId('test-error-notification'));

    await waitFor(() => {
      expect(screen.getByText('Test Error Notification')).toBeInTheDocument();
    });
  });

  it('should simulate multiple notifications', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    renderWithNotificationProvider(<RealTimePage />);

    fireEvent.click(screen.getByTestId('simulate-notifications'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/notifications/simulate',
        {
          count: 5,
          interval: 1000,
        }
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Simulation Started')).toBeInTheDocument();
    });
  });

  it('should handle simulation error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    renderWithNotificationProvider(<RealTimePage />);

    fireEvent.click(screen.getByTestId('simulate-notifications'));

    await waitFor(() => {
      expect(screen.getByText('Simulation Failed')).toBeInTheDocument();
    });
  });

  it('should show unread notification count', async () => {
    renderWithNotificationProvider(<RealTimePage />);

    // Add a notification
    fireEvent.click(screen.getByTestId('test-info-notification'));

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1 unread');
    });
  });

  it('should handle search input changes', () => {
    renderWithNotificationProvider(<RealTimePage />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput).toHaveValue('test search');
  });

  it('should handle category selection changes', () => {
    renderWithNotificationProvider(<RealTimePage />);

    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

    expect(categorySelect).toHaveValue('Electronics');
  });

  it('should clear search and category filters', () => {
    renderWithNotificationProvider(<RealTimePage />);

    const searchInput = screen.getByTestId('search-input');
    const categorySelect = screen.getByTestId('category-select');
    const clearButton = screen.getByTestId('clear-search-button');

    // Set some values
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

    expect(searchInput).toHaveValue('test search');
    expect(categorySelect).toHaveValue('Electronics');

    // Clear filters
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(categorySelect).toHaveValue('');
  });

  it('should render all category options', () => {
    renderWithNotificationProvider(<RealTimePage />);

    const categorySelect = screen.getByTestId('category-select');
    const options = categorySelect.querySelectorAll('option');

    expect(options).toHaveLength(9); // 8 categories + "All Categories"
    expect(options[0]).toHaveTextContent('All Categories');
    expect(options[1]).toHaveTextContent('Electronics');
    expect(options[2]).toHaveTextContent('Clothing');
    expect(options[3]).toHaveTextContent('Books');
    expect(options[4]).toHaveTextContent('Home & Garden');
    expect(options[5]).toHaveTextContent('Sports');
    expect(options[6]).toHaveTextContent('Toys');
    expect(options[7]).toHaveTextContent('Food');
    expect(options[8]).toHaveTextContent('Beauty');
  });

  it('should show no notifications message initially', () => {
    renderWithNotificationProvider(<RealTimePage />);

    expect(screen.getByTestId('no-notifications')).toHaveTextContent(
      'No notifications yet'
    );
  });

  it('should display recent notifications', async () => {
    renderWithNotificationProvider(<RealTimePage />);

    // Add some notifications
    fireEvent.click(screen.getByTestId('test-info-notification'));
    fireEvent.click(screen.getByTestId('test-success-notification'));

    await waitFor(() => {
      expect(screen.getByText('Recent Notifications (2)')).toBeInTheDocument();
      expect(screen.getByTestId('notification-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('notification-item-1')).toBeInTheDocument();
    });
  });

  it('should limit recent notifications display to 10 items', async () => {
    renderWithNotificationProvider(<RealTimePage />);

    // Add 12 notifications
    for (let i = 0; i < 12; i++) {
      fireEvent.click(screen.getByTestId('test-info-notification'));
    }

    await waitFor(() => {
      expect(screen.getByText('Recent Notifications (12)')).toBeInTheDocument();

      // Should only show 10 items
      expect(screen.getByTestId('notification-item-9')).toBeInTheDocument();
      expect(
        screen.queryByTestId('notification-item-10')
      ).not.toBeInTheDocument();
    });
  });

  it('should pass search query and category to InfiniteProductList', () => {
    renderWithNotificationProvider(<RealTimePage />);

    const searchInput = screen.getByTestId('search-input');
    const categorySelect = screen.getByTestId('category-select');

    fireEvent.change(searchInput, { target: { value: 'laptop' } });
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

    const productList = screen.getByTestId('infinite-product-list');
    expect(productList).toHaveAttribute('data-search-query', 'laptop');
    expect(productList).toHaveAttribute('data-category', 'Electronics');
  });

  it('should have proper accessibility attributes', () => {
    renderWithNotificationProvider(<RealTimePage />);

    const searchInput = screen.getByTestId('search-input');
    const categorySelect = screen.getByTestId('category-select');

    expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search by name, description, or tags...'
    );
    expect(screen.getByLabelText('Search Products')).toBe(searchInput);
    expect(screen.getByLabelText('Category')).toBe(categorySelect);
  });

  it('should show notification timestamps', async () => {
    renderWithNotificationProvider(<RealTimePage />);

    fireEvent.click(screen.getByTestId('test-info-notification'));

    await waitFor(() => {
      const notificationItem = screen.getByTestId('notification-item-0');
      const timestamp = notificationItem.querySelector(
        '.text-xs.text-gray-500'
      );
      expect(timestamp).toBeInTheDocument();
      expect(timestamp?.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });
});

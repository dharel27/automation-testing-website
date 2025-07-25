import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RealTimePage } from '../RealTimePage';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  close: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock the child components
jest.mock('../../components/ui/InfiniteProductList', () => ({
  InfiniteProductList: ({ searchQuery, category, className }: any) => (
    <div
      data-testid="infinite-product-list"
      data-search-query={searchQuery}
      data-category={category}
      className={className}
    >
      Infinite Product List Component
    </div>
  ),
}));

jest.mock('../../components/ui/RealTimeDataDisplay', () => ({
  RealTimeDataDisplay: ({ title, updateInterval, className }: any) => (
    <div
      data-testid="real-time-data-display"
      data-title={title}
      data-update-interval={updateInterval}
      className={className}
    >
      Real Time Data Display Component
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <NotificationProvider>{component}</NotificationProvider>
    </BrowserRouter>
  );
};

describe('RealTimePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render the page with all main sections', () => {
    renderWithProviders(<RealTimePage />);

    expect(screen.getByText('Real-Time Features Demo')).toBeInTheDocument();
    expect(
      screen.getByText(/This page demonstrates real-time features/)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('websocket-status-indicator')
    ).toBeInTheDocument();
    expect(screen.getByText('Notification Testing')).toBeInTheDocument();
    expect(
      screen.getByText('Infinite Scroll Product List')
    ).toBeInTheDocument();
  });

  it('should display WebSocket connection status', () => {
    renderWithProviders(<RealTimePage />);

    expect(
      screen.getByText('WebSocket Status: Disconnected')
    ).toBeInTheDocument();
    expect(screen.getByText('Notifications received: 0')).toBeInTheDocument();
  });

  it('should render notification test buttons', () => {
    renderWithProviders(<RealTimePage />);

    expect(screen.getByTestId('test-info-notification')).toBeInTheDocument();
    expect(screen.getByTestId('test-success-notification')).toBeInTheDocument();
    expect(screen.getByTestId('test-warning-notification')).toBeInTheDocument();
    expect(screen.getByTestId('test-error-notification')).toBeInTheDocument();
    expect(screen.getByTestId('simulate-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('clear-notifications')).toBeInTheDocument();
  });

  it('should handle test notification button clicks', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RealTimePage />);

    // Test info notification
    const infoButton = screen.getByTestId('test-info-notification');
    await user.click(infoButton);

    // Test success notification
    const successButton = screen.getByTestId('test-success-notification');
    await user.click(successButton);

    // Test warning notification
    const warningButton = screen.getByTestId('test-warning-notification');
    await user.click(warningButton);

    // Test error notification
    const errorButton = screen.getByTestId('test-error-notification');
    await user.click(errorButton);

    // Should have created notifications (tested via context)
    expect(screen.getByText('Notifications received: 4')).toBeInTheDocument();
  });

  it('should handle simulate notifications button', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders(<RealTimePage />);

    const simulateButton = screen.getByTestId('simulate-notifications');
    await user.click(simulateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/notifications/simulate',
        { method: 'POST' }
      );
    });
  });

  it('should handle clear notifications button', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders(<RealTimePage />);

    const clearButton = screen.getByTestId('clear-notifications');
    await user.click(clearButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/notifications',
        { method: 'DELETE' }
      );
    });
  });

  it('should handle API errors for simulate notifications', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithProviders(<RealTimePage />);

    const simulateButton = screen.getByTestId('simulate-notifications');
    await user.click(simulateButton);

    await waitFor(() => {
      // Should show error notification
      expect(screen.getByText('Notifications received: 1')).toBeInTheDocument();
    });
  });

  it('should render search and category controls', () => {
    renderWithProviders(<RealTimePage />);

    expect(screen.getByTestId('product-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('category-select')).toBeInTheDocument();

    // Check category options
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('should update search query when input changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RealTimePage />);

    const searchInput = screen.getByTestId('product-search-input');
    await user.type(searchInput, 'test search');

    expect(searchInput).toHaveValue('test search');

    // Check that the InfiniteProductList receives the search query
    const productList = screen.getByTestId('infinite-product-list');
    expect(productList).toHaveAttribute('data-search-query', 'test search');
  });

  it('should update category when select changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RealTimePage />);

    const categorySelect = screen.getByTestId('category-select');
    await user.selectOptions(categorySelect, 'Electronics');

    expect(categorySelect).toHaveValue('Electronics');

    // Check that the InfiniteProductList receives the category
    const productList = screen.getByTestId('infinite-product-list');
    expect(productList).toHaveAttribute('data-category', 'Electronics');
  });

  it('should handle "All Categories" selection', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RealTimePage />);

    const categorySelect = screen.getByTestId('category-select');

    // First select a specific category
    await user.selectOptions(categorySelect, 'Electronics');
    expect(categorySelect).toHaveValue('Electronics');

    // Then select "All Categories"
    await user.selectOptions(categorySelect, 'All Categories');
    expect(categorySelect).toHaveValue('All Categories');

    // Should pass empty string to the component
    const productList = screen.getByTestId('infinite-product-list');
    expect(productList).toHaveAttribute('data-category', '');
  });

  it('should render child components with correct props', () => {
    renderWithProviders(<RealTimePage />);

    // Check RealTimeDataDisplay props
    const dataDisplay = screen.getByTestId('real-time-data-display');
    expect(dataDisplay).toHaveAttribute('data-title', 'Live System Metrics');
    expect(dataDisplay).toHaveAttribute('data-update-interval', '2000');
    expect(dataDisplay).toHaveClass('w-full');

    // Check InfiniteProductList props
    const productList = screen.getByTestId('infinite-product-list');
    expect(productList).toHaveAttribute('data-search-query', '');
    expect(productList).toHaveAttribute('data-category', '');
    expect(productList).toHaveClass('mb-8');
  });

  it('should render automation testing notes', () => {
    renderWithProviders(<RealTimePage />);

    expect(screen.getByText('Automation Testing Notes')).toBeInTheDocument();
    expect(
      screen.getByText(/WebSocket connection status is indicated/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Toast notifications appear in the top-right/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Infinite scroll triggers when scrolling/)
    ).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<RealTimePage />);

    const searchInput = screen.getByTestId('product-search-input');
    expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search by name, description, or tags...'
    );

    const categorySelect = screen.getByTestId('category-select');
    expect(categorySelect).toHaveAccessibleName('Category');

    const searchLabel = screen.getByText('Search Products');
    expect(searchLabel).toBeInTheDocument();
  });

  it('should handle failed API response for simulate notifications', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderWithProviders(<RealTimePage />);

    const simulateButton = screen.getByTestId('simulate-notifications');
    await user.click(simulateButton);

    await waitFor(() => {
      // Should show error notification
      expect(screen.getByText('Notifications received: 1')).toBeInTheDocument();
    });
  });

  it('should clear search input correctly', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RealTimePage />);

    const searchInput = screen.getByTestId('product-search-input');

    // Type and then clear
    await user.type(searchInput, 'test');
    expect(searchInput).toHaveValue('test');

    await user.clear(searchInput);
    expect(searchInput).toHaveValue('');
  });

  it('should maintain state between interactions', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RealTimePage />);

    // Set search query
    const searchInput = screen.getByTestId('product-search-input');
    await user.type(searchInput, 'laptop');

    // Set category
    const categorySelect = screen.getByTestId('category-select');
    await user.selectOptions(categorySelect, 'Electronics');

    // Add a notification
    const infoButton = screen.getByTestId('test-info-notification');
    await user.click(infoButton);

    // Verify all states are maintained
    expect(searchInput).toHaveValue('laptop');
    expect(categorySelect).toHaveValue('Electronics');
    expect(screen.getByText('Notifications received: 1')).toBeInTheDocument();
  });
});

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import RealTimeDataDisplay from '../RealTimeDataDisplay';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  close: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

const renderWithNotificationProvider = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>);
};

describe('RealTimeDataDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with default props', () => {
    renderWithNotificationProvider(<RealTimeDataDisplay />);

    expect(screen.getByTestId('real-time-data-display')).toBeInTheDocument();
    expect(screen.getByTestId('display-title')).toHaveTextContent(
      'Real-Time Data'
    );
    expect(
      screen.getByTestId('connection-status-disconnected')
    ).toBeInTheDocument();
    expect(screen.getByTestId('toggle-stream-button')).toHaveTextContent(
      'Start'
    );
    expect(screen.getByTestId('no-data-message')).toBeInTheDocument();
  });

  it('should render with custom props', () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay
        title="Custom Title"
        maxItems={10}
        updateInterval={1000}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('display-title')).toHaveTextContent(
      'Custom Title'
    );
    expect(screen.getByTestId('real-time-data-display')).toHaveClass(
      'custom-class'
    );
    expect(screen.getByTestId('max-items')).toHaveTextContent('Max: 10');
    expect(screen.getByTestId('update-interval')).toHaveTextContent(
      'Update: 1000ms'
    );
  });

  it('should start and stop data stream', () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={100} />
    );

    const toggleButton = screen.getByTestId('toggle-stream-button');

    // Start the stream
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Stop');
    expect(
      screen.getByTestId('connection-status-connecting')
    ).toBeInTheDocument();

    // Stop the stream
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Start');
  });

  it('should generate data when stream is active and connected', async () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={100} />
    );

    // Simulate socket connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    // Start the stream
    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    // Fast-forward time to generate data
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('connection-status-connected')
      ).toBeInTheDocument();
      expect(screen.getByTestId('data-count')).not.toHaveTextContent(
        'Items: 0'
      );
    });
  });

  it('should clear data when clear button is clicked', async () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={100} />
    );

    // Simulate connection and start stream
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    // Generate some data
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByTestId('data-count')).not.toHaveTextContent(
        'Items: 0'
      );
    });

    // Clear data
    fireEvent.click(screen.getByTestId('clear-data-button'));

    expect(screen.getByTestId('data-count')).toHaveTextContent('Items: 0');
    expect(screen.getByTestId('no-data-message')).toBeInTheDocument();
  });

  it('should limit data items to maxItems', async () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={50} maxItems={3} />
    );

    // Simulate connection and start stream
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    // Generate more data than maxItems
    act(() => {
      jest.advanceTimersByTime(300); // Should generate 6 items
    });

    await waitFor(() => {
      const dataCount = screen.getByTestId('data-count').textContent;
      expect(dataCount).toBe('Items: 3');
    });
  });

  it('should show different data types and statuses', async () => {
    renderWithNotificationProvider(<RealTimeDataDisplay updateInterval={50} />);

    // Simulate connection and start stream
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    // Generate multiple data points
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      // Should have at least one data item
      expect(screen.getByTestId('data-item-0')).toBeInTheDocument();
    });

    // Check that data items have required elements
    const firstItem = screen.getByTestId('data-item-0');
    expect(
      firstItem.querySelector('[data-testid="item-label"]')
    ).toBeInTheDocument();
    expect(
      firstItem.querySelector('[data-testid="item-value"]')
    ).toBeInTheDocument();
    expect(
      firstItem.querySelector('[data-testid="item-type"]')
    ).toBeInTheDocument();
    expect(
      firstItem.querySelector('[data-testid="item-timestamp"]')
    ).toBeInTheDocument();
  });

  it('should highlight newest item', async () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={100} />
    );

    // Simulate connection and start stream
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    // Generate first item
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      const firstItem = screen.getByTestId('data-item-0');
      expect(firstItem).toHaveClass('bg-blue-50');
    });

    // Generate second item
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      // New item should be highlighted
      const newFirstItem = screen.getByTestId('data-item-0');
      expect(newFirstItem).toHaveClass('bg-blue-50');

      // Previous item should not be highlighted
      const secondItem = screen.getByTestId('data-item-1');
      expect(secondItem).not.toHaveClass('bg-blue-50');
    });
  });

  it('should show disconnected status when socket is not connected', () => {
    renderWithNotificationProvider(<RealTimeDataDisplay />);

    expect(
      screen.getByTestId('connection-status-disconnected')
    ).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should show connecting status when stream starts but socket not connected', () => {
    renderWithNotificationProvider(<RealTimeDataDisplay />);

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    expect(
      screen.getByTestId('connection-status-connecting')
    ).toBeInTheDocument();
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should show connected status when socket is connected', async () => {
    renderWithNotificationProvider(<RealTimeDataDisplay />);

    // Simulate socket connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('connection-status-connected')
      ).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('should display stats correctly', () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={2000} maxItems={50} />
    );

    expect(screen.getByTestId('data-count')).toHaveTextContent('Items: 0');
    expect(screen.getByTestId('update-interval')).toHaveTextContent(
      'Update: 2000ms'
    );
    expect(screen.getByTestId('max-items')).toHaveTextContent('Max: 50');
  });

  it('should clear data when stream is stopped and restarted', async () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={100} />
    );

    // Simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    const toggleButton = screen.getByTestId('toggle-stream-button');

    // Start stream and generate data
    fireEvent.click(toggleButton);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByTestId('data-count')).not.toHaveTextContent(
        'Items: 0'
      );
    });

    // Stop stream
    fireEvent.click(toggleButton);

    // Start stream again - data should be cleared
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('data-count')).toHaveTextContent('Items: 0');
  });

  it('should format timestamps correctly', async () => {
    renderWithNotificationProvider(
      <RealTimeDataDisplay updateInterval={100} />
    );

    // Simulate connection and start stream
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      if (connectHandler) connectHandler();
    });

    fireEvent.click(screen.getByTestId('toggle-stream-button'));

    // Generate data
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      const timestamp = screen.getByTestId('item-timestamp');
      expect(timestamp.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });
});

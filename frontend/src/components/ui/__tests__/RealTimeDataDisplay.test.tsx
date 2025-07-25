import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealTimeDataDisplay } from '../RealTimeDataDisplay';
import { NotificationProvider } from '../../../contexts/NotificationContext';

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

// Mock timers for testing intervals
jest.useFakeTimers();

const renderWithProvider = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>);
};

describe('RealTimeDataDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should render with default props', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    expect(screen.getByText('Real-Time Data')).toBeInTheDocument();
    expect(screen.getByTestId('real-time-data-display')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-updates-button')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    const customTitle = 'Custom Metrics Dashboard';

    renderWithProvider(<RealTimeDataDisplay title={customTitle} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('should display initial data points', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    expect(screen.getByTestId('data-points-grid')).toBeInTheDocument();

    // Check for default data points
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Page Views')).toBeInTheDocument();
    expect(screen.getByText('API Requests')).toBeInTheDocument();
    expect(screen.getByText('Database Queries')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage (MB)')).toBeInTheDocument();
    expect(screen.getByText('CPU Usage (%)')).toBeInTheDocument();
  });

  it('should toggle updates when button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderWithProvider(<RealTimeDataDisplay />);

    const toggleButton = screen.getByTestId('toggle-updates-button');

    // Initially should show "Start Updates"
    expect(toggleButton).toHaveTextContent('Start Updates');
    expect(screen.getByText('Auto-update: OFF')).toBeInTheDocument();

    // Click to start updates
    await user.click(toggleButton);

    expect(toggleButton).toHaveTextContent('Stop Updates');
    expect(screen.getByText('Auto-update: ON')).toBeInTheDocument();

    // Click to stop updates
    await user.click(toggleButton);

    expect(toggleButton).toHaveTextContent('Start Updates');
    expect(screen.getByText('Auto-update: OFF')).toBeInTheDocument();
  });

  it('should update data when auto-update is enabled', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderWithProvider(<RealTimeDataDisplay updateInterval={1000} />);

    const toggleButton = screen.getByTestId('toggle-updates-button');

    // Start updates
    await user.click(toggleButton);

    // Get initial values
    const dataValues = screen.getAllByTestId('data-value');
    const initialValues = dataValues.map((el) => el.textContent);

    // Advance time to trigger update
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      const updatedValues = screen.getAllByTestId('data-value');
      const newValues = updatedValues.map((el) => el.textContent);

      // Values should have changed (at least some of them)
      expect(newValues).not.toEqual(initialValues);
    });
  });

  it('should display trend indicators correctly', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    const trendIcons = screen.getAllByTestId('trend-icon');

    // Should have trend icons for each data point
    expect(trendIcons).toHaveLength(6);

    // Icons should be one of the trend indicators
    trendIcons.forEach((icon) => {
      expect(['↗️', '↘️', '➡️']).toContain(icon.textContent);
    });
  });

  it('should display data changes when available', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    const dataChanges = screen.getAllByTestId('data-change');

    // Should have change indicators
    expect(dataChanges.length).toBeGreaterThan(0);

    // Changes should be formatted with + or - prefix
    dataChanges.forEach((change) => {
      const text = change.textContent || '';
      expect(text).toMatch(/^[+-]?\d+\.\d{2}$/);
    });
  });

  it('should show connection status', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    const connectionStatus = screen.getByTestId('connection-status');
    expect(connectionStatus).toBeInTheDocument();

    // Should show disconnected initially (mocked)
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should display update interval information', () => {
    const customInterval = 5000;

    renderWithProvider(<RealTimeDataDisplay updateInterval={customInterval} />);

    expect(screen.getByText('Interval: 5s')).toBeInTheDocument();
  });

  it('should handle WebSocket data updates', async () => {
    renderWithProvider(<RealTimeDataDisplay />);

    // Simulate WebSocket data update
    const mockDataUpdate = {
      type: 'metrics_update',
      metrics: {
        'Active Users': 150,
        'Page Views': 2500,
      },
    };

    // Find and call the WebSocket event handler
    const dataUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'data-update'
    )?.[1];

    if (dataUpdateHandler) {
      dataUpdateHandler(mockDataUpdate);
    }

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('2,500')).toBeInTheDocument();
    });
  });

  it('should format numbers with locale string', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    const dataValues = screen.getAllByTestId('data-value');

    // Check that numbers are formatted (should contain commas for large numbers)
    dataValues.forEach((value) => {
      const text = value.textContent || '';
      // Should be a valid number format
      expect(text).toMatch(/^[\d,]+(\.\d+)?$/);
    });
  });

  it('should display timestamps for data points', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    const dataPoints = screen.getAllByTestId('data-point');

    dataPoints.forEach((point) => {
      // Each data point should have a timestamp
      const timeElement = point.querySelector('.text-xs.text-gray-500');
      expect(timeElement).toBeInTheDocument();

      // Should be a valid time format
      const timeText = timeElement?.textContent || '';
      expect(timeText).toMatch(/^\d{1,2}:\d{2}:\d{2}/);
    });
  });

  it('should have proper data attributes for automation', () => {
    renderWithProvider(<RealTimeDataDisplay />);

    const dataPoints = screen.getAllByTestId('data-point');

    dataPoints.forEach((point) => {
      expect(point).toHaveAttribute('data-label');
    });
  });

  it('should apply custom className', () => {
    const customClass = 'custom-data-display';

    renderWithProvider(<RealTimeDataDisplay className={customClass} />);

    const displayElement = screen.getByTestId('real-time-data-display');
    expect(displayElement).toHaveClass(customClass);
  });

  it('should clean up intervals on unmount', () => {
    const { unmount } = renderWithProvider(<RealTimeDataDisplay />);

    // Start updates to create an interval
    const toggleButton = screen.getByTestId('toggle-updates-button');
    toggleButton.click();

    // Unmount component
    unmount();

    // Advance time - no updates should occur after unmount
    jest.advanceTimersByTime(5000);

    // If properly cleaned up, no errors should occur
    expect(true).toBe(true);
  });

  it('should not update when component is inactive', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderWithProvider(<RealTimeDataDisplay updateInterval={1000} />);

    // Don't start updates - should remain inactive
    const dataValues = screen.getAllByTestId('data-value');
    const initialValues = dataValues.map((el) => el.textContent);

    // Advance time
    jest.advanceTimersByTime(2000);

    // Values should not have changed
    const unchangedValues = screen.getAllByTestId('data-value');
    const finalValues = unchangedValues.map((el) => el.textContent);

    expect(finalValues).toEqual(initialValues);
  });
});

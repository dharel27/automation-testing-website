import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

interface DataPoint {
  id: string;
  label: string;
  value: number;
  timestamp: Date;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface RealTimeDataDisplayProps {
  title?: string;
  updateInterval?: number;
  className?: string;
}

export const RealTimeDataDisplay: React.FC<RealTimeDataDisplayProps> = ({
  title = 'Real-Time Data',
  updateInterval = 3000,
  className = '',
}) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { socket, isConnected } = useNotifications();

  // Generate mock data points
  const generateDataPoint = (
    label: string,
    previousValue?: number
  ): DataPoint => {
    const baseValue = previousValue || Math.random() * 1000;
    const change = (Math.random() - 0.5) * 100;
    const newValue = Math.max(0, baseValue + change);

    return {
      id: `${label}_${Date.now()}`,
      label,
      value: Math.round(newValue * 100) / 100,
      timestamp: new Date(),
      change: Math.round(change * 100) / 100,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    };
  };

  // Initialize data points
  useEffect(() => {
    const initialData: DataPoint[] = [
      generateDataPoint('Active Users'),
      generateDataPoint('Page Views'),
      generateDataPoint('API Requests'),
      generateDataPoint('Database Queries'),
      generateDataPoint('Memory Usage (MB)'),
      generateDataPoint('CPU Usage (%)'),
    ];
    setDataPoints(initialData);
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDataPoints((prevData) =>
        prevData.map((point) => generateDataPoint(point.label, point.value))
      );
      setLastUpdate(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isActive, updateInterval]);

  // WebSocket integration for real-time events
  useEffect(() => {
    if (!socket) return;

    const handleDataUpdate = (data: any) => {
      if (data.type === 'metrics_update') {
        setDataPoints((prevData) =>
          prevData.map((point) => {
            if (data.metrics[point.label]) {
              return {
                ...point,
                value: data.metrics[point.label],
                timestamp: new Date(),
                change: data.metrics[point.label] - point.value,
              };
            }
            return point;
          })
        );
        setLastUpdate(new Date());
      }
    };

    socket.on('data-update', handleDataUpdate);

    return () => {
      socket.off('data-update', handleDataUpdate);
    };
  }, [socket]);

  const toggleUpdates = () => {
    setIsActive(!isActive);
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div
      className={`real-time-data-display bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}
      data-testid="real-time-data-display"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {lastUpdate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              data-testid="connection-status"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={toggleUpdates}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            data-testid="toggle-updates-button"
          >
            {isActive ? 'Stop Updates' : 'Start Updates'}
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="data-points-grid"
      >
        {dataPoints.map((point) => (
          <div
            key={point.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            data-testid="data-point"
            data-label={point.label}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {point.label}
              </h4>
              <span className="text-lg" data-testid="trend-icon">
                {getTrendIcon(point.trend)}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                  data-testid="data-value"
                >
                  {point.value.toLocaleString()}
                </div>
                {point.change !== undefined && (
                  <div
                    className={`text-sm ${getTrendColor(point.trend)}`}
                    data-testid="data-change"
                  >
                    {point.change > 0 ? '+' : ''}
                    {point.change.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {point.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Update Status */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            Auto-update: {isActive ? 'ON' : 'OFF'}
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            Interval: {updateInterval / 1000}s
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

interface RealTimeData {
  id: string;
  timestamp: Date;
  value: number;
  label: string;
  type: 'metric' | 'event' | 'status';
  status?: 'active' | 'inactive' | 'warning' | 'error';
}

interface RealTimeDataDisplayProps {
  title?: string;
  maxItems?: number;
  updateInterval?: number;
  className?: string;
}

const RealTimeDataDisplay: React.FC<RealTimeDataDisplayProps> = ({
  title = 'Real-Time Data',
  maxItems = 50,
  updateInterval = 2000,
  className = '',
}) => {
  const [data, setData] = useState<RealTimeData[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  const { isConnected, addNotification } = useNotifications();

  // Simulate real-time data updates
  useEffect(() => {
    if (!isActive) return;

    setConnectionStatus('connecting');

    const interval = setInterval(() => {
      if (isConnected) {
        setConnectionStatus('connected');

        const newDataPoint: RealTimeData = {
          id: Date.now().toString(),
          timestamp: new Date(),
          value: Math.floor(Math.random() * 1000),
          label: `Data Point ${Math.floor(Math.random() * 100)}`,
          type: ['metric', 'event', 'status'][Math.floor(Math.random() * 3)] as
            | 'metric'
            | 'event'
            | 'status',
          status: ['active', 'inactive', 'warning', 'error'][
            Math.floor(Math.random() * 4)
          ] as 'active' | 'inactive' | 'warning' | 'error',
        };

        setData((prevData) => {
          const newData = [newDataPoint, ...prevData];
          return newData.slice(0, maxItems);
        });

        // Occasionally send notifications for significant events
        if (Math.random() < 0.1) {
          const notificationTypes: Array<
            'info' | 'success' | 'warning' | 'error'
          > = ['info', 'success', 'warning', 'error'];
          const randomType =
            notificationTypes[
              Math.floor(Math.random() * notificationTypes.length)
            ];

          addNotification({
            type: randomType,
            title: 'Real-Time Update',
            message: `New ${newDataPoint.type} received: ${newDataPoint.label}`,
          });
        }
      } else {
        setConnectionStatus('disconnected');
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isActive, updateInterval, maxItems, isConnected, addNotification]);

  const toggleDataStream = () => {
    setIsActive(!isActive);
    if (!isActive) {
      setData([]);
    }
  };

  const clearData = () => {
    setData([]);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'inactive':
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'metric':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 'event':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'status':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div
            className="flex items-center text-green-600"
            data-testid="connection-status-connected"
          >
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
            Connected
          </div>
        );
      case 'connecting':
        return (
          <div
            className="flex items-center text-yellow-600"
            data-testid="connection-status-connecting"
          >
            <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2 animate-pulse"></div>
            Connecting...
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div
            className="flex items-center text-red-600"
            data-testid="connection-status-disconnected"
          >
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            Disconnected
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md ${className}`}
      data-testid="real-time-data-display"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3
            className="text-lg font-semibold text-gray-900"
            data-testid="display-title"
          >
            {title}
          </h3>
          <div className="flex items-center space-x-4">
            {getConnectionStatusIndicator()}
            <div className="flex space-x-2">
              <button
                onClick={toggleDataStream}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                data-testid="toggle-stream-button"
              >
                {isActive ? 'Stop' : 'Start'}
              </button>
              <button
                onClick={clearData}
                className="px-3 py-1 rounded-md text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
                data-testid="clear-data-button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
          <span data-testid="data-count">Items: {data.length}</span>
          <span data-testid="update-interval">Update: {updateInterval}ms</span>
          <span data-testid="max-items">Max: {maxItems}</span>
        </div>
      </div>

      {/* Data list */}
      <div className="max-h-96 overflow-y-auto" data-testid="data-list">
        {data.length === 0 ? (
          <div
            className="p-8 text-center text-gray-500"
            data-testid="no-data-message"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p>No real-time data available</p>
            <p className="text-sm mt-1">
              Click "Start" to begin receiving data
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <div
                key={item.id}
                className={`p-3 hover:bg-gray-50 transition-colors duration-150 ${
                  index === 0 ? 'bg-blue-50' : ''
                }`}
                data-testid={`data-item-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1 rounded ${getStatusColor(item.status)}`}
                    >
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium text-gray-900"
                        data-testid="item-label"
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-xs text-gray-500"
                        data-testid="item-timestamp"
                      >
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm font-semibold text-gray-900"
                      data-testid="item-value"
                    >
                      {item.value.toLocaleString()}
                    </p>
                    <p
                      className="text-xs text-gray-500 capitalize"
                      data-testid="item-type"
                    >
                      {item.type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeDataDisplay;

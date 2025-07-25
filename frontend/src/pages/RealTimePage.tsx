import React, { useState } from 'react';
import {
  useNotifications,
  NotificationType,
} from '../contexts/NotificationContext';
import { InfiniteProductList } from '../components/ui/InfiniteProductList';
import { RealTimeDataDisplay } from '../components/ui/RealTimeDataDisplay';

export const RealTimePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const {
    notifications,
    isConnected,
    addToast,
    clearNotifications,
    simulateNotifications,
  } = useNotifications();

  const categories = [
    'All Categories',
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
  ];

  const handleTestNotification = (type: NotificationType) => {
    const messages = {
      [NotificationType.INFO]: {
        title: 'Information',
        message: 'This is an informational message for testing purposes.',
      },
      [NotificationType.SUCCESS]: {
        title: 'Success!',
        message: 'Operation completed successfully.',
      },
      [NotificationType.WARNING]: {
        title: 'Warning',
        message: 'Please review this warning message.',
      },
      [NotificationType.ERROR]: {
        title: 'Error Occurred',
        message: 'An error has occurred during the operation.',
      },
    };

    addToast({
      type,
      ...messages[type],
      data: { testData: true, timestamp: new Date().toISOString() },
    });
  };

  return (
    <div className="real-time-page min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Real-Time Features Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
            This page demonstrates real-time features including WebSocket
            notifications, infinite scroll, live data updates, and toast
            notifications. Perfect for testing automation frameworks with
            dynamic content.
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-3 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
                data-testid="websocket-status-indicator"
              />
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Notifications received: {notifications.length}
            </div>
          </div>
        </div>

        {/* Notification Controls */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Notification Testing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => handleTestNotification(NotificationType.INFO)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              data-testid="test-info-notification"
            >
              Test Info
            </button>
            <button
              onClick={() => handleTestNotification(NotificationType.SUCCESS)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              data-testid="test-success-notification"
            >
              Test Success
            </button>
            <button
              onClick={() => handleTestNotification(NotificationType.WARNING)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              data-testid="test-warning-notification"
            >
              Test Warning
            </button>
            <button
              onClick={() => handleTestNotification(NotificationType.ERROR)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              data-testid="test-error-notification"
            >
              Test Error
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={simulateNotifications}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              data-testid="simulate-notifications"
            >
              Simulate Real-Time Notifications
            </button>
            <button
              onClick={clearNotifications}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              data-testid="clear-notifications"
            >
              Clear All Notifications
            </button>
          </div>
        </div>

        {/* Real-Time Data Display */}
        <div className="mb-8">
          <RealTimeDataDisplay
            title="Live System Metrics"
            updateInterval={2000}
            className="w-full"
          />
        </div>

        {/* Product Search and Filters */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Infinite Scroll Product List
          </h2>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label
                htmlFor="search-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Search Products
              </label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, or tags..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="product-search-input"
              />
            </div>
            <div className="md:w-64">
              <label
                htmlFor="category-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value === 'All Categories' ? '' : e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="category-select"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Infinite Scroll Product List */}
        <InfiniteProductList
          searchQuery={searchQuery}
          category={selectedCategory}
          className="mb-8"
        />

        {/* Testing Information */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Automation Testing Notes
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
            <li>
              • WebSocket connection status is indicated by the colored dot
            </li>
            <li>
              • Toast notifications appear in the top-right corner with
              auto-dismiss
            </li>
            <li>
              • Infinite scroll triggers when scrolling near the bottom of the
              product list
            </li>
            <li>• Real-time data updates every 2-3 seconds when enabled</li>
            <li>
              • All interactive elements have data-testid attributes for
              automation
            </li>
            <li>• Search and category filters work with infinite scroll</li>
            <li>• Notifications persist in the context and can be cleared</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

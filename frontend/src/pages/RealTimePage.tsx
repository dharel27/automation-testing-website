import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import RealTimeDataDisplay from '../components/ui/RealTimeDataDisplay';
import InfiniteProductList from '../components/ui/InfiniteProductList';
import axios from 'axios';

const RealTimePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addNotification, isConnected, notifications, unreadCount } =
    useNotifications();

  const categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
    'Food',
    'Beauty',
  ];

  const handleTestNotification = (
    type: 'info' | 'success' | 'warning' | 'error'
  ) => {
    const messages = {
      info: 'This is an informational message for testing purposes.',
      success:
        'Operation completed successfully! Everything is working as expected.',
      warning: 'Please be aware that this is a warning notification.',
      error:
        'An error occurred while processing your request. Please try again.',
    };

    addNotification({
      type,
      title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: messages[type],
    });
  };

  const handleSimulateNotifications = async () => {
    try {
      await axios.post('http://localhost:3001/api/notifications/simulate', {
        count: 5,
        interval: 1000,
      });

      addNotification({
        type: 'info',
        title: 'Simulation Started',
        message: 'Simulating 5 notifications with 1 second intervals.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Simulation Failed',
        message: 'Failed to start notification simulation.',
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('');
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="real-time-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1
                className="text-3xl font-bold text-gray-900"
                data-testid="page-title"
              >
                Real-Time Features
              </h1>
              <p className="mt-2 text-gray-600" data-testid="page-description">
                Test real-time notifications, infinite scroll, and live data
                updates
              </p>
            </div>

            {/* Connection status and notification count */}
            <div className="flex items-center space-x-4">
              <div
                className="flex items-center space-x-2"
                data-testid="connection-info"
              >
                <div
                  className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {unreadCount > 0 && (
                <div
                  className="bg-red-500 text-white text-xs rounded-full px-2 py-1"
                  data-testid="unread-count"
                >
                  {unreadCount} unread
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Controls and Real-time Data */}
          <div className="lg:col-span-1 space-y-6">
            {/* Notification Controls */}
            <div
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="notification-controls"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notification Testing
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => handleTestNotification('info')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  data-testid="test-info-notification"
                >
                  Test Info Notification
                </button>

                <button
                  onClick={() => handleTestNotification('success')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                  data-testid="test-success-notification"
                >
                  Test Success Notification
                </button>

                <button
                  onClick={() => handleTestNotification('warning')}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200"
                  data-testid="test-warning-notification"
                >
                  Test Warning Notification
                </button>

                <button
                  onClick={() => handleTestNotification('error')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  data-testid="test-error-notification"
                >
                  Test Error Notification
                </button>

                <button
                  onClick={handleSimulateNotifications}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
                  data-testid="simulate-notifications"
                >
                  Simulate Multiple Notifications
                </button>
              </div>
            </div>

            {/* Real-time Data Display */}
            <RealTimeDataDisplay
              title="Live System Metrics"
              maxItems={20}
              updateInterval={1500}
              data-testid="real-time-metrics"
            />

            {/* Recent Notifications */}
            <div
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="recent-notifications"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Notifications ({notifications.length})
              </h2>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p
                    className="text-gray-500 text-sm"
                    data-testid="no-notifications"
                  >
                    No notifications yet
                  </p>
                ) : (
                  notifications.slice(0, 10).map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-md border-l-4 ${
                        notification.type === 'success'
                          ? 'bg-green-50 border-green-400'
                          : notification.type === 'error'
                            ? 'bg-red-50 border-red-400'
                            : notification.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-400'
                              : 'bg-blue-50 border-blue-400'
                      }`}
                      data-testid={`notification-item-${index}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(
                            notification.timestamp
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column - Infinite Scroll Product List */}
          <div className="lg:col-span-2">
            {/* Search and Filter Controls */}
            <div
              className="bg-white rounded-lg shadow-md p-6 mb-6"
              data-testid="search-controls"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Product Search & Infinite Scroll
              </h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Search Products
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, description, or tags..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="search-input"
                  />
                </div>

                <div className="sm:w-48">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="category-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                    data-testid="clear-search-button"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Infinite Scroll Product List */}
            <InfiniteProductList
              searchQuery={searchQuery}
              category={selectedCategory}
              className="bg-white rounded-lg shadow-md p-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimePage;

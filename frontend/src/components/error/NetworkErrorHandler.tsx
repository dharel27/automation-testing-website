import React, { useState, useEffect } from 'react';

interface NetworkErrorHandlerProps {
  children: React.ReactNode;
}

const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial connection status
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setShowOfflineMessage(false);
  };

  const handleRetry = () => {
    if (navigator.onLine) {
      setShowOfflineMessage(false);
      window.location.reload();
    }
  };

  return (
    <>
      {children}

      {showOfflineMessage && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg"
          data-testid="offline-banner"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-xl" role="img" aria-label="Offline">
                📡
              </div>
              <div>
                <h3 className="font-semibold" data-testid="offline-title">
                  No Internet Connection
                </h3>
                <p className="text-sm opacity-90" data-testid="offline-message">
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isOnline && (
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 bg-white text-red-600 rounded text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
                  data-testid="offline-retry-button"
                  aria-label="Retry connection"
                >
                  Retry
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600 rounded"
                data-testid="offline-dismiss-button"
                aria-label="Dismiss offline message"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      <div
        className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          isOnline
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}
        data-testid="connection-status"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
            aria-hidden="true"
          />
          <span data-testid="connection-status-text">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </>
  );
};

export default NetworkErrorHandler;

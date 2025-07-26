import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  showRetry?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode = 404,
  title,
  message,
  showRetry = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getDefaultContent = (code: number) => {
    switch (code) {
      case 404:
        return {
          title: 'Page Not Found',
          message:
            "The page you're looking for doesn't exist or has been moved.",
          emoji: '🔍',
        };
      case 500:
        return {
          title: 'Internal Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          emoji: '⚠️',
        };
      case 403:
        return {
          title: 'Access Forbidden',
          message: "You don't have permission to access this resource.",
          emoji: '🚫',
        };
      case 401:
        return {
          title: 'Unauthorized',
          message: 'Please log in to access this page.',
          emoji: '🔐',
        };
      case 503:
        return {
          title: 'Service Unavailable',
          message:
            'The service is temporarily unavailable. Please try again later.',
          emoji: '🔧',
        };
      default:
        return {
          title: 'Error',
          message: 'An unexpected error occurred.',
          emoji: '❌',
        };
    }
  };

  const defaultContent = getDefaultContent(statusCode);
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
      data-testid="error-page"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div
            className="text-6xl mb-4"
            role="img"
            aria-label={`Error ${statusCode}`}
          >
            {defaultContent.emoji}
          </div>
          <h1
            id="error-title"
            className="text-6xl font-bold text-gray-900 dark:text-white mb-2"
            data-testid="error-status-code"
          >
            {statusCode}
          </h1>
          <h2
            className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4"
            data-testid="error-title"
          >
            {displayTitle}
          </h2>
          <p
            className="text-gray-600 dark:text-gray-400 mb-8"
            data-testid="error-message"
          >
            {displayMessage}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              data-testid="go-home-button"
              aria-label="Go to home page"
            >
              Go Home
            </button>

            <button
              onClick={handleGoBack}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              data-testid="go-back-button"
              aria-label="Go back to previous page"
            >
              Go Back
            </button>
          </div>

          {showRetry && (
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              data-testid="retry-button"
              aria-label="Retry loading the page"
            >
              Try Again
            </button>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Debug Information
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div data-testid="debug-pathname">
                <strong>Path:</strong> {location.pathname}
              </div>
              <div data-testid="debug-search">
                <strong>Search:</strong> {location.search || 'None'}
              </div>
              <div data-testid="debug-timestamp">
                <strong>Time:</strong> {new Date().toISOString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;

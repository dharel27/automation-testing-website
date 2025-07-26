import React from 'react';
import { ApiResponse } from '../../pages/ApiTestingPage';

interface ApiResponseDisplayProps {
  response: ApiResponse | null;
  loading: boolean;
}

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300)
    return 'text-green-600 dark:text-green-400';
  if (status >= 300 && status < 400)
    return 'text-yellow-600 dark:text-yellow-400';
  if (status >= 400 && status < 500) return 'text-red-600 dark:text-red-400';
  if (status >= 500) return 'text-red-700 dark:text-red-300';
  return 'text-gray-600 dark:text-gray-400';
};

const getStatusBadgeColor = (status: number) => {
  if (status >= 200 && status < 300)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (status >= 300 && status < 400)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (status >= 400 && status < 500)
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (status >= 500)
    return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const formatJson = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

export const ApiResponseDisplay: React.FC<ApiResponseDisplayProps> = ({
  response,
  loading,
}) => {
  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-testid="loading-indicator"
      >
        <div className="flex items-center space-x-3">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-lg text-gray-600 dark:text-gray-400">
            Sending request...
          </span>
        </div>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const formattedResponse = formatJson(response.data);

  return (
    <div className="space-y-6" data-testid="api-response-display">
      {/* Status and Timing */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span
            className={`text-2xl font-bold ${getStatusColor(response.status)}`}
            data-testid="response-status"
          >
            {response.status}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(response.status)}`}
          >
            {response.statusText}
          </span>
          {response.error && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Error
            </span>
          )}
        </div>
        <div
          className="text-sm text-gray-600 dark:text-gray-400"
          data-testid="response-duration"
        >
          {response.duration}ms
        </div>
      </div>

      {/* Error Message */}
      {response.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Network Error
          </h3>
          <p
            className="text-sm text-red-700 dark:text-red-300"
            data-testid="error-message"
          >
            {response.error}
          </p>
        </div>
      )}

      {/* Response Headers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Response Headers
          </h3>
          <button
            onClick={() =>
              copyToClipboard(JSON.stringify(response.headers, null, 2))
            }
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            data-testid="copy-headers-button"
          >
            Copy Headers
          </button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 max-h-48 overflow-y-auto">
          <pre
            className="text-sm text-gray-700 dark:text-gray-300 font-mono"
            data-testid="response-headers"
          >
            {Object.keys(response.headers).length > 0
              ? Object.entries(response.headers)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n')
              : 'No headers'}
          </pre>
        </div>
      </div>

      {/* Response Body */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Response Body
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(formattedResponse)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              data-testid="copy-response-button"
            >
              Copy Response
            </button>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 max-h-96 overflow-y-auto">
          <pre
            className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap"
            data-testid="response-body"
          >
            {formattedResponse || 'No response body'}
          </pre>
        </div>
      </div>

      {/* Response Size */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Response size: {new Blob([formattedResponse]).size} bytes
      </div>
    </div>
  );
};

import React, { useState } from 'react';

interface ApiRequestBuilderProps {
  onRequest: (
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string
  ) => void;
  loading: boolean;
}

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
];

const PRESET_ENDPOINTS = [
  { label: 'Health Check', method: 'GET', url: '/api/health' },
  { label: 'Get Users', method: 'GET', url: '/api/users' },
  { label: 'Get Products', method: 'GET', url: '/api/products' },
  { label: 'Test Delay (1s)', method: 'GET', url: '/api/test/delay/1000' },
  { label: 'Test Error 404', method: 'GET', url: '/api/test/error/404' },
  { label: 'Test Echo', method: 'POST', url: '/api/test/echo' },
  {
    label: 'Large Dataset',
    method: 'GET',
    url: '/api/test/large-dataset?count=100',
  },
];

export const ApiRequestBuilder: React.FC<ApiRequestBuilderProps> = ({
  onRequest,
  loading,
}) => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('/api/health');
  const [headers, setHeaders] = useState(
    '{\n  "Content-Type": "application/json"\n}'
  );
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = JSON.parse(headers);
    } catch (error) {
      alert('Invalid JSON in headers');
      return;
    }

    // Validate JSON body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && body.trim()) {
      try {
        JSON.parse(body);
      } catch (error) {
        alert('Invalid JSON in request body');
        return;
      }
    }

    const fullUrl = url.startsWith('http')
      ? url
      : `http://localhost:3001${url}`;
    onRequest(method, fullUrl, parsedHeaders, body);
  };

  const handlePresetSelect = (preset: (typeof PRESET_ENDPOINTS)[0]) => {
    setMethod(preset.method);
    setUrl(preset.url);

    if (
      preset.method === 'POST' ||
      preset.method === 'PUT' ||
      preset.method === 'PATCH'
    ) {
      setBody(
        '{\n  "message": "Test request",\n  "timestamp": "' +
          new Date().toISOString() +
          '"\n}'
      );
    } else {
      setBody('');
    }
  };

  const formatJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-testid="api-request-builder"
    >
      {/* Preset Endpoints */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Start
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ENDPOINTS.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {preset.method} {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* HTTP Method and URL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="method"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            data-testid="method-select"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/api/endpoint or full URL"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            data-testid="url-input"
          />
        </div>
      </div>

      {/* Headers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="headers"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Headers (JSON)
          </label>
          <button
            type="button"
            onClick={() => setHeaders(formatJson(headers))}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Format JSON
          </button>
        </div>
        <textarea
          id="headers"
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
          placeholder='{"Content-Type": "application/json"}'
          data-testid="headers-textarea"
        />
      </div>

      {/* Request Body */}
      {method !== 'GET' && method !== 'HEAD' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="body"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Request Body (JSON)
            </label>
            <button
              type="button"
              onClick={() => setBody(formatJson(body))}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Format JSON
            </button>
          </div>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            placeholder='{"key": "value"}'
            data-testid="body-textarea"
          />
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          data-testid="send-request-button"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Sending...
            </span>
          ) : (
            'Send Request'
          )}
        </button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { ApiRequestBuilder } from '../components/api/ApiRequestBuilder';
import { ApiResponseDisplay } from '../components/api/ApiResponseDisplay';
import { ApiEndpointDocs } from '../components/api/ApiEndpointDocs';

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  error?: string;
}

const ApiTestingPage: React.FC = () => {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string
  ) => {
    setLoading(true);
    setResponse(null);

    const startTime = Date.now();

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (method !== 'GET' && method !== 'HEAD' && body) {
        requestOptions.body = body;
      }

      const response = await fetch(url, requestOptions);
      const duration = Date.now() - startTime;

      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: null,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Testing Interface
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test API endpoints with custom requests and view detailed responses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* API Documentation */}
          <div className="lg:col-span-1">
            <ApiEndpointDocs />
          </div>

          {/* Request Builder and Response */}
          <div className="lg:col-span-2 space-y-8">
            {/* Request Builder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Request Builder
                </h2>
                <ApiRequestBuilder
                  onRequest={handleRequest}
                  loading={loading}
                />
              </div>
            </div>

            {/* Response Display */}
            {(response || loading) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Response
                  </h2>
                  <ApiResponseDisplay response={response} loading={loading} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestingPage;

import React, { useState } from 'react';

interface EndpointDoc {
  method: string;
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    example: string;
  };
  responses: Array<{
    status: number;
    description: string;
    example?: string;
  }>;
}

const API_ENDPOINTS: EndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint',
    responses: [
      {
        status: 200,
        description: 'API is healthy',
        example:
          '{"status": "OK", "message": "Automation Testing Website API is running"}',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/users',
    description: 'Get all users with pagination',
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number (default: 1)',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Items per page (default: 10, max: 100)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'List of users',
        example: '{"success": true, "data": [...], "pagination": {...}}',
      },
    ],
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'User login',
    requestBody: {
      type: 'application/json',
      example: '{"email": "user@example.com", "password": "password123"}',
    },
    responses: [
      {
        status: 200,
        description: 'Login successful',
        example: '{"success": true, "data": {"user": {...}, "token": "..."}}',
      },
      {
        status: 401,
        description: 'Invalid credentials',
        example:
          '{"success": false, "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid credentials"}}',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/products',
    description: 'Get products with search and filtering',
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Items per page',
      },
      {
        name: 'q',
        type: 'string',
        required: false,
        description: 'Search query',
      },
      {
        name: 'category',
        type: 'string',
        required: false,
        description: 'Filter by category',
      },
      {
        name: 'minPrice',
        type: 'number',
        required: false,
        description: 'Minimum price filter',
      },
      {
        name: 'maxPrice',
        type: 'number',
        required: false,
        description: 'Maximum price filter',
      },
      {
        name: 'inStock',
        type: 'boolean',
        required: false,
        description: 'Filter by stock status',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'List of products',
        example: '{"success": true, "data": [...], "pagination": {...}}',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/test/delay/:ms',
    description: 'Test endpoint with configurable delay',
    parameters: [
      {
        name: 'ms',
        type: 'number',
        required: true,
        description: 'Delay in milliseconds (max: 30000)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Delayed response',
        example:
          '{"success": true, "data": {"message": "Delayed response after 1000ms", "delay": 1000}}',
      },
      {
        status: 400,
        description: 'Invalid delay value',
        example:
          '{"success": false, "error": {"code": "INVALID_DELAY", "message": "Invalid delay value"}}',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/test/error/:code',
    description: 'Test endpoint for simulating HTTP errors',
    parameters: [
      {
        name: 'code',
        type: 'number',
        required: true,
        description:
          'HTTP status code to simulate (400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504)',
      },
    ],
    responses: [
      {
        status: 400,
        description: 'Simulated error response',
        example:
          '{"success": false, "error": {"code": "BAD_REQUEST", "message": "This is a simulated 400 error"}}',
      },
    ],
  },
  {
    method: 'POST',
    path: '/api/test/echo',
    description: 'Echo endpoint that returns request data',
    requestBody: {
      type: 'application/json',
      example: '{"message": "Hello, API!", "data": {...}}',
    },
    responses: [
      {
        status: 200,
        description: 'Echoed request data',
        example:
          '{"success": true, "data": {"method": "POST", "headers": {...}, "body": {...}}}',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/test/large-dataset',
    description: 'Generate large dataset for performance testing',
    parameters: [
      {
        name: 'count',
        type: 'number',
        required: false,
        description: 'Number of items to generate (default: 1000, max: 10000)',
      },
      {
        name: 'delay',
        type: 'number',
        required: false,
        description: 'Additional delay in milliseconds',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Large dataset',
        example: '{"success": true, "data": {"items": [...], "count": 1000}}',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/test/random-failure',
    description: 'Test endpoint with random failures',
    parameters: [
      {
        name: 'rate',
        type: 'number',
        required: false,
        description: 'Failure rate between 0 and 1 (default: 0.5)',
      },
    ],
    responses: [
      {
        status: 200,
        description: 'Success response',
        example:
          '{"success": true, "data": {"message": "Random failure test passed"}}',
      },
      {
        status: 500,
        description: 'Random failure',
        example:
          '{"success": false, "error": {"code": "RANDOM_FAILURE", "message": "Random database connection error"}}',
      },
    ],
  },
];

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'POST':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'DELETE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'PATCH':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300)
    return 'text-green-600 dark:text-green-400';
  if (status >= 300 && status < 400)
    return 'text-yellow-600 dark:text-yellow-400';
  if (status >= 400 && status < 500) return 'text-red-600 dark:text-red-400';
  if (status >= 500) return 'text-red-700 dark:text-red-300';
  return 'text-gray-600 dark:text-gray-400';
};

export const ApiEndpointDocs: React.FC = () => {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const toggleEndpoint = (endpointKey: string) => {
    setExpandedEndpoint(expandedEndpoint === endpointKey ? null : endpointKey);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          API Documentation
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Available endpoints for testing. Click on an endpoint to see detailed
          documentation.
        </p>

        <div className="space-y-2" data-testid="api-endpoints-list">
          {API_ENDPOINTS.map((endpoint, index) => {
            const endpointKey = `${endpoint.method}-${endpoint.path}`;
            const isExpanded = expandedEndpoint === endpointKey;

            return (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-600 rounded-md"
              >
                <button
                  onClick={() => toggleEndpoint(endpointKey)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid={`endpoint-${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[/:]/g, '-')}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {endpoint.path}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {endpoint.description}
                  </p>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600">
                    {/* Parameters */}
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Parameters
                        </h4>
                        <div className="space-y-2">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="text-sm">
                              <div className="flex items-center space-x-2">
                                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  {param.name}
                                </code>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {param.type}
                                </span>
                                {param.required && (
                                  <span className="text-red-500 text-xs">
                                    required
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 ml-2 mt-1">
                                {param.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {endpoint.requestBody && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Request Body
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Content-Type: {endpoint.requestBody.type}
                          </div>
                          <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                            {endpoint.requestBody.example}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Responses */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Responses
                      </h4>
                      <div className="space-y-3">
                        {endpoint.responses.map((response, responseIndex) => (
                          <div key={responseIndex}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className={`font-medium ${getStatusColor(response.status)}`}
                              >
                                {response.status}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {response.description}
                              </span>
                            </div>
                            {response.example && (
                              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 ml-4">
                                <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                                  {response.example}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

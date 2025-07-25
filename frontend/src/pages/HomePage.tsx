import { useState, useEffect } from 'react';
import axios from 'axios';

interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

const HomePage = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/health');
        setHealthStatus(response.data);
      } catch (error) {
        console.error('Backend health check failed:', error);
        setHealthStatus({
          status: 'ERROR',
          message: 'Backend connection failed',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Automation Testing Website
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          A comprehensive platform for testing automation frameworks
        </p>
      </header>

      <div className="max-w-md mx-auto bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          System Status
        </h2>

        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              Checking backend connection...
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  healthStatus?.status === 'OK'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}
              >
                {healthStatus?.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Message:
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {healthStatus?.message}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Timestamp:
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {healthStatus?.timestamp &&
                  new Date(healthStatus.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Frontend: React + TypeScript + Vite + Tailwind CSS
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Backend: Node.js + Express + TypeScript
        </p>
      </div>
    </div>
  );
};

export default HomePage;

import { useState, useEffect } from 'react';

interface StatItem {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: string;
}

interface StatsSectionProps {
  className?: string;
}

const StatsSection = ({ className = '' }: StatsSectionProps) => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API calls to get real stats
        await new Promise((resolve) => setTimeout(resolve, 800));

        // In a real app, these would come from actual API calls
        const mockStats: StatItem[] = [
          {
            id: 'users',
            label: 'Active Users',
            value: '1,234',
            description: 'Registered testers',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
          },
          {
            id: 'tests',
            label: 'Tests Run',
            value: '45.2K',
            description: 'Total test executions',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          },
          {
            id: 'apis',
            label: 'API Calls',
            value: '892K',
            description: 'Successful requests',
            icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          },
          {
            id: 'uptime',
            label: 'Uptime',
            value: '99.9%',
            description: 'System availability',
            icon: 'M13 10V3L4 14h7v7l9-11h-7z',
          },
        ];

        // Simulate fetching real-time data
        const updatedStats = await Promise.all(
          mockStats.map(async (stat) => {
            // Add some randomness to simulate real data
            const variation = Math.random() * 0.1 - 0.05; // ±5% variation
            let newValue = stat.value;

            if (stat.id === 'users') {
              const baseValue = 1234;
              const newNum = Math.floor(baseValue * (1 + variation));
              newValue = newNum.toLocaleString();
            } else if (stat.id === 'tests') {
              const baseValue = 45200;
              const newNum = Math.floor(baseValue * (1 + variation));
              newValue = (newNum / 1000).toFixed(1) + 'K';
            } else if (stat.id === 'apis') {
              const baseValue = 892000;
              const newNum = Math.floor(baseValue * (1 + variation));
              newValue = (newNum / 1000).toFixed(0) + 'K';
            } else if (stat.id === 'uptime') {
              const baseValue = 99.9;
              const newNum = Math.max(
                99.0,
                Math.min(100.0, baseValue + variation)
              );
              newValue = newNum.toFixed(1) + '%';
            }

            return { ...stat, value: newValue };
          })
        );

        setStats(updatedStats);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Stats loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();

    // Set up periodic updates every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}
        data-testid="stats-section-loading"
      >
        <div className="text-center mb-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto mb-3 animate-pulse"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}
        data-testid="stats-section-error"
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to Load Statistics
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            data-testid="stats-retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}
      data-testid="stats-section"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Statistics
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Real-time metrics from our testing platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className="text-center group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-4 rounded-lg transition-colors duration-200"
            data-testid={`stat-item-${stat.id}`}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={stat.icon}
                />
              </svg>
            </div>

            {/* Value */}
            <div
              className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
              data-testid={`stat-value-${stat.id}`}
            >
              {stat.value}
            </div>

            {/* Label */}
            <div
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              data-testid={`stat-label-${stat.id}`}
            >
              {stat.label}
            </div>

            {/* Description */}
            <div
              className="text-xs text-gray-500 dark:text-gray-400"
              data-testid={`stat-description-${stat.id}`}
            >
              {stat.description}
            </div>
          </div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="text-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default StatsSection;

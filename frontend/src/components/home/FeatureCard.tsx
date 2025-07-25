import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface FeatureData {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  stats?: {
    label: string;
    value: string;
  };
}

interface FeatureCardProps {
  featureType: 'forms' | 'api' | 'data' | 'ui';
  delay?: number;
  className?: string;
}

const FeatureCard = ({
  featureType,
  delay = 0,
  className = '',
}: FeatureCardProps) => {
  const [feature, setFeature] = useState<FeatureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{ label: string; value: string } | null>(
    null
  );

  const featureConfigs: Record<string, FeatureData> = {
    forms: {
      id: 'forms',
      title: 'Form Testing',
      description:
        'Test various form types including validation, file uploads, and complex input scenarios.',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      link: '/forms',
    },
    api: {
      id: 'api',
      title: 'API Testing',
      description:
        'Comprehensive REST API endpoints for testing CRUD operations, authentication, and error handling.',
      icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      link: '/api-testing',
    },
    data: {
      id: 'data',
      title: 'Data Tables',
      description:
        'Interactive data tables with sorting, filtering, pagination, and real-time updates.',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z',
      link: '/data-table',
    },
    ui: {
      id: 'ui',
      title: 'UI Components',
      description:
        'Rich interactive components including modals, tooltips, carousels, and accordions.',
      icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
      link: '/ui-components',
    },
  };

  useEffect(() => {
    const loadFeatureData = async () => {
      setIsLoading(true);

      try {
        // Simulate API call with delay
        await new Promise((resolve) =>
          setTimeout(resolve, delay + Math.random() * 800 + 300)
        );

        const baseFeature = featureConfigs[featureType];
        if (!baseFeature) {
          throw new Error(`Unknown feature type: ${featureType}`);
        }

        // Simulate fetching dynamic stats
        const mockStats = await fetchFeatureStats(featureType);

        setFeature(baseFeature);
        setStats(mockStats);
      } catch (error) {
        console.error(`Error loading feature ${featureType}:`, error);
        // Set fallback data
        setFeature(featureConfigs[featureType] || null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatureData();
  }, [featureType, delay]);

  const fetchFeatureStats = async (
    type: string
  ): Promise<{ label: string; value: string }> => {
    // Simulate API call for stats
    await new Promise((resolve) => setTimeout(resolve, 200));

    const statsMap: Record<string, { label: string; value: string }> = {
      forms: { label: 'Form Types', value: '12+' },
      api: { label: 'Endpoints', value: '25+' },
      data: { label: 'Sample Records', value: '1000+' },
      ui: { label: 'Components', value: '15+' },
    };

    return statsMap[type] || { label: 'Features', value: '10+' };
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse ${className}`}
        data-testid={`feature-card-${featureType}-loading`}
      >
        {/* Icon skeleton */}
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>

        {/* Title skeleton */}
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-3/4"></div>

        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
        </div>

        {/* Stats skeleton */}
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>

        {/* Button skeleton */}
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}
        data-testid={`feature-card-${featureType}-error`}
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg
              className="w-8 h-8 mx-auto"
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
          <p className="text-red-600 dark:text-red-400 text-sm">
            Failed to load feature
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}
      data-testid={`feature-card-${featureType}`}
    >
      <div className="p-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            data-testid={`feature-icon-${featureType}`}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={feature.icon}
            />
          </svg>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
          data-testid={`feature-title-${featureType}`}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p
          className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed"
          data-testid={`feature-description-${featureType}`}
        >
          {feature.description}
        </p>

        {/* Stats */}
        {stats && (
          <div
            className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            data-testid={`feature-stats-${featureType}`}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats.label}
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {stats.value}
            </span>
          </div>
        )}

        {/* CTA Button */}
        <Link
          to={feature.link}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          data-testid={`feature-cta-${featureType}`}
          aria-label={`Explore ${feature.title}`}
        >
          Explore {feature.title}
        </Link>
      </div>
    </div>
  );
};

export default FeatureCard;

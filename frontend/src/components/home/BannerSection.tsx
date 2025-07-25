import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BannerContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
  backgroundColor: string;
}

interface BannerSectionProps {
  delay?: number;
  className?: string;
}

const BannerSection = ({ delay = 0, className = '' }: BannerSectionProps) => {
  const [content, setContent] = useState<BannerContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock banner content - in a real app, this would come from an API
  const bannerContents: BannerContent[] = [
    {
      id: '1',
      title: 'Test Automation Made Easy',
      subtitle: 'Professional Testing Platform',
      description:
        'Comprehensive testing environment for Selenium, Cypress, Playwright, and more. Practice your automation skills with real-world scenarios.',
      ctaText: 'Start Testing',
      ctaLink: '/forms',
      backgroundColor: 'from-blue-600 to-purple-600',
    },
    {
      id: '2',
      title: 'API Testing & Integration',
      subtitle: 'RESTful API Endpoints',
      description:
        'Test your API automation skills with our comprehensive set of endpoints. Includes CRUD operations, authentication, and error handling.',
      ctaText: 'Explore APIs',
      ctaLink: '/api-testing',
      backgroundColor: 'from-green-600 to-blue-600',
    },
    {
      id: '3',
      title: 'Dynamic Data Tables',
      subtitle: 'Interactive Components',
      description:
        'Practice testing complex UI interactions with sortable tables, pagination, filtering, and real-time updates.',
      ctaText: 'View Tables',
      ctaLink: '/data-table',
      backgroundColor: 'from-purple-600 to-pink-600',
    },
  ];

  useEffect(() => {
    const loadBannerContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call with delay
        await new Promise((resolve) =>
          setTimeout(resolve, delay + Math.random() * 1000 + 500)
        );

        // Randomly select a banner content
        const randomContent =
          bannerContents[Math.floor(Math.random() * bannerContents.length)];
        setContent(randomContent);
      } catch (err) {
        setError('Failed to load banner content');
        console.error('Banner loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBannerContent();
  }, [delay]);

  if (isLoading) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}
        data-testid="banner-loading"
      >
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 animate-pulse">
          <div className="px-8 py-12 sm:px-12 sm:py-16">
            <div className="max-w-xl">
              {/* Title skeleton */}
              <div className="h-8 bg-white/20 rounded-lg mb-4 animate-pulse"></div>

              {/* Subtitle skeleton */}
              <div className="h-6 bg-white/20 rounded-lg mb-6 w-3/4 animate-pulse"></div>

              {/* Description skeleton */}
              <div className="space-y-2 mb-8">
                <div className="h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-white/20 rounded animate-pulse w-4/6"></div>
              </div>

              {/* CTA button skeleton */}
              <div className="h-12 bg-white/20 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute top-4 right-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl shadow-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 ${className}`}
        data-testid="banner-error"
      >
        <div className="px-8 py-12 sm:px-12 sm:py-16 text-center">
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
            Failed to Load Content
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Unable to load banner content'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            data-testid="banner-retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}
      data-testid="banner-section"
    >
      <div className={`bg-gradient-to-r ${content.backgroundColor} relative`}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"></div>
        </div>

        <div className="relative px-8 py-12 sm:px-12 sm:py-16">
          <div className="max-w-xl">
            {/* Subtitle */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white mb-4">
              <span data-testid="banner-subtitle">{content.subtitle}</span>
            </div>

            {/* Title */}
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight"
              data-testid="banner-title"
            >
              {content.title}
            </h2>

            {/* Description */}
            <p
              className="text-lg text-white/90 mb-8 leading-relaxed"
              data-testid="banner-description"
            >
              {content.description}
            </p>

            {/* CTA Button */}
            <Link
              to={content.ctaLink}
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-105"
              data-testid="banner-cta-button"
              aria-label={`${content.ctaText} - ${content.title}`}
            >
              {content.ctaText}
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 right-0 -mb-8 -mr-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default BannerSection;

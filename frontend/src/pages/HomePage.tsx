import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/home/SearchBar';
import BannerSection from '../components/home/BannerSection';
import FeatureCard from '../components/home/FeatureCard';
import StatsSection from '../components/home/StatsSection';

interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

const HomePage = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleSearch = (query: string) => {
    // Navigate to a search results page or handle search logic
    console.log('Searching for:', query);
    // For now, navigate to data table with search query
    navigate(`/data-table?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-12" data-testid="home-page">
      {/* Hero Section */}
      <section className="text-center py-8" data-testid="hero-section">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Automation Testing Website
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          A comprehensive platform for testing automation frameworks including
          Selenium, Cypress, Playwright, and more
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search products, users, or explore features..."
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/forms"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            data-testid="cta-start-testing"
          >
            Start Testing
          </Link>
          <Link
            to="/api-testing"
            className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-3 px-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            data-testid="cta-explore-api"
          >
            Explore APIs
          </Link>
        </div>
      </section>

      {/* Banner Section */}
      <section data-testid="banner-section">
        <BannerSection delay={200} />
      </section>

      {/* Features Grid */}
      <section data-testid="features-section">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Testing Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore our comprehensive testing environment designed for
            automation engineers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard featureType="forms" delay={100} />
          <FeatureCard featureType="api" delay={200} />
          <FeatureCard featureType="data" delay={300} />
          <FeatureCard featureType="ui" delay={400} />
        </div>
      </section>

      {/* Statistics Section */}
      <section data-testid="stats-section">
        <StatsSection />
      </section>

      {/* System Status Section */}
      <section data-testid="system-status-section">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
            System Status
          </h2>

          {loading ? (
            <div
              className="flex items-center justify-center py-4"
              data-testid="system-status-loading"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Checking backend connection...
              </span>
            </div>
          ) : (
            <div className="space-y-3" data-testid="system-status-content">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Backend Status:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    healthStatus?.status === 'OK'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}
                  data-testid="backend-status"
                >
                  {healthStatus?.status}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Message:
                </span>
                <span
                  className="text-sm text-gray-600 dark:text-gray-400"
                  data-testid="backend-message"
                >
                  {healthStatus?.message}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Last Check:
                </span>
                <span
                  className="text-sm text-gray-600 dark:text-gray-400"
                  data-testid="backend-timestamp"
                >
                  {healthStatus?.timestamp &&
                    new Date(healthStatus.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Technology Stack Info */}
      <section
        className="text-center py-8 border-t border-gray-200 dark:border-gray-700"
        data-testid="tech-stack-section"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Technology Stack
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Frontend
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              React + TypeScript + Vite + Tailwind CSS
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Backend
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Node.js + Express + TypeScript + SQLite
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

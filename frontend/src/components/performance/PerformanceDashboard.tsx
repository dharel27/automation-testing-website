import React from 'react';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

interface PerformanceDashboardProps {
  className?: string;
  showDetails?: boolean;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  showDetails = false,
}) => {
  const {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getPerformanceScore,
  } = usePerformanceMonitoring();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricColor = (value: number, threshold: number): string => {
    if (value <= threshold * 0.8) return 'text-green-600';
    if (value <= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!metrics && !isMonitoring) {
    return (
      <div
        className={`p-4 bg-white rounded-lg shadow ${className}`}
        data-testid="performance-dashboard"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Performance Monitoring</h3>
          <button
            onClick={startMonitoring}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            data-testid="start-monitoring-btn"
          >
            Start Monitoring
          </button>
        </div>
      </div>
    );
  }

  if (isMonitoring) {
    return (
      <div
        className={`p-4 bg-white rounded-lg shadow ${className}`}
        data-testid="performance-dashboard"
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Collecting performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-white rounded-lg shadow ${className}`}
      data-testid="performance-dashboard"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Performance Dashboard</h3>
        <div className="flex gap-2">
          <button
            onClick={startMonitoring}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            data-testid="refresh-metrics-btn"
          >
            Refresh
          </button>
          <button
            onClick={stopMonitoring}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            data-testid="stop-monitoring-btn"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Performance Score */}
      {getPerformanceScore !== null && (
        <div className="mb-6 text-center">
          <div
            className={`text-3xl font-bold ${getScoreColor(getPerformanceScore)}`}
          >
            {getPerformanceScore}/100
          </div>
          <p className="text-gray-600">Performance Score</p>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2 text-red-600">
            Performance Alerts
          </h4>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  alert.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
                data-testid={`alert-${alert.metric.toLowerCase().replace(' ', '-')}`}
              >
                <strong>{alert.metric}:</strong> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm text-gray-600 mb-1">LCP</h4>
          <div
            className={`text-lg font-bold ${metrics?.lcp ? getMetricColor(metrics.lcp, 2500) : 'text-gray-400'}`}
          >
            {metrics?.lcp ? formatTime(metrics.lcp) : 'N/A'}
          </div>
          <p className="text-xs text-gray-500">Largest Contentful Paint</p>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm text-gray-600 mb-1">FID</h4>
          <div
            className={`text-lg font-bold ${metrics?.fid ? getMetricColor(metrics.fid, 100) : 'text-gray-400'}`}
          >
            {metrics?.fid ? formatTime(metrics.fid) : 'N/A'}
          </div>
          <p className="text-xs text-gray-500">First Input Delay</p>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm text-gray-600 mb-1">CLS</h4>
          <div
            className={`text-lg font-bold ${metrics?.cls ? getMetricColor(metrics.cls, 0.1) : 'text-gray-400'}`}
          >
            {metrics?.cls ? metrics.cls.toFixed(3) : 'N/A'}
          </div>
          <p className="text-xs text-gray-500">Cumulative Layout Shift</p>
        </div>
      </div>

      {/* Bundle Size */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm text-gray-600 mb-1">
            JavaScript
          </h4>
          <div className="text-lg font-bold text-blue-600">
            {formatBytes(metrics?.bundleSize.js || 0)}
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm text-gray-600 mb-1">CSS</h4>
          <div className="text-lg font-bold text-green-600">
            {formatBytes(metrics?.bundleSize.css || 0)}
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm text-gray-600 mb-1">
            Total Bundle
          </h4>
          <div
            className={`text-lg font-bold ${
              metrics?.bundleSize.total
                ? getMetricColor(metrics.bundleSize.total, 2 * 1024 * 1024)
                : 'text-gray-400'
            }`}
          >
            {formatBytes(metrics?.bundleSize.total || 0)}
          </div>
        </div>
      </div>

      {/* Additional Details */}
      {showDetails && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">
                Resources
              </h4>
              <div className="text-lg font-bold">
                {metrics?.resourceCount || 0}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">
                Images
              </h4>
              <div className="text-lg font-bold">
                {metrics?.imageCount || 0}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">
                Fonts
              </h4>
              <div className="text-lg font-bold">{metrics?.fontCount || 0}</div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">
                Cache Size
              </h4>
              <div className="text-lg font-bold">
                {metrics?.cacheStats.size || 0}
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          {metrics?.memoryUsage && (
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">
                Memory Usage
              </h4>
              <div className="flex justify-between text-sm">
                <span>Used: {formatBytes(metrics.memoryUsage.used)}</span>
                <span>Total: {formatBytes(metrics.memoryUsage.total)}</span>
                <span>Limit: {formatBytes(metrics.memoryUsage.limit)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;

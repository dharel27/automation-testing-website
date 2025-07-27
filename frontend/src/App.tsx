import { Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Layout } from './components/layout';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PerformanceProvider } from './contexts/PerformanceContext';
import { ProtectedRoute } from './components/auth';
import { initializeAutomationUtils } from './utils/automation';
import ErrorBoundary from './components/error/ErrorBoundary';
import NetworkErrorHandler from './components/error/NetworkErrorHandler';
import { reportBoundaryError } from './utils/errorReporting';
import ToastContainer from './components/ui/ToastContainer';
import SkipLinks from './components/accessibility/SkipLinks';
import LoadingSpinner from './components/ui/LoadingSpinner';
import './App.css';

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ComponentTestPage = lazy(() =>
  import('./pages/ComponentTestPage').then((module) => ({
    default: module.ComponentTestPage,
  }))
);
const FormsPage = lazy(() =>
  import('./pages/FormsPage').then((module) => ({ default: module.FormsPage }))
);
const DataTablePage = lazy(() => import('./pages/DataTablePage'));
const RealTimePage = lazy(() => import('./pages/RealTimePage'));
const ApiTestingPage = lazy(() => import('./pages/ApiTestingPage'));
const PerformanceTestPage = lazy(() => import('./pages/PerformanceTestPage'));
const ErrorTestPage = lazy(() => import('./pages/ErrorTestPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'));

// Import axe-core for accessibility testing in development
if (process.env.NODE_ENV !== 'production') {
  import('./utils/axeConfig');
}

function App() {
  useEffect(() => {
    // Initialize automation utilities when the app starts
    initializeAutomationUtils();

    // Set document language for accessibility
    document.documentElement.lang = 'en';

    // Register service worker for caching
    if (process.env.NODE_ENV === 'production') {
      import('./utils/serviceWorker').then(({ registerSW }) => {
        registerSW({
          onSuccess: () =>
            console.log('Service worker registered successfully'),
          onUpdate: () => console.log('New content available, please refresh'),
          onOffline: () => console.log('App is running in offline mode'),
          onOnline: () => console.log('App is back online'),
        });
      });
    }

    // Initialize bundle analyzer in development
    if (process.env.NODE_ENV === 'development') {
      import('./utils/bundleAnalyzer').then(({ bundleAnalyzer }) => {
        bundleAnalyzer.startMonitoring();
      });
    }
  }, []);

  const handleBoundaryError = (error: Error, errorInfo: React.ErrorInfo) => {
    reportBoundaryError(error, errorInfo.componentStack || '');
  };

  return (
    <ErrorBoundary onError={handleBoundaryError}>
      <NetworkErrorHandler>
        <SkipLinks />
        <AuthProvider>
          <NotificationProvider>
            <PerformanceProvider>
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                      path="/components-test"
                      element={<ComponentTestPage />}
                    />
                    <Route path="/forms" element={<FormsPage />} />
                    <Route path="/data-table" element={<DataTablePage />} />
                    <Route path="/real-time" element={<RealTimePage />} />
                    <Route path="/api-testing" element={<ApiTestingPage />} />
                    <Route
                      path="/performance"
                      element={<PerformanceTestPage />}
                    />
                    <Route path="/error-test" element={<ErrorTestPage />} />
                    <Route path="/error/500" element={<ServerErrorPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* 404 route must be last */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </Layout>
              <ToastContainer />
            </PerformanceProvider>
          </NotificationProvider>
        </AuthProvider>
      </NetworkErrorHandler>
    </ErrorBoundary>
  );
}

export default App;

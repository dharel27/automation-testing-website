import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
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
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { ComponentTestPage } from './pages/ComponentTestPage';
import { FormsPage } from './pages/FormsPage';
import DataTablePage from './pages/DataTablePage';
import RealTimePage from './pages/RealTimePage';
import ApiTestingPage from './pages/ApiTestingPage';
import PerformanceTestPage from './pages/PerformanceTestPage';
import ErrorTestPage from './pages/ErrorTestPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';
import './App.css';

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

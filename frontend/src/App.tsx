import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PerformanceProvider } from './contexts/PerformanceContext';
import { ProtectedRoute } from './components/auth';
import ToastContainer from './components/ui/ToastContainer';
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
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PerformanceProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/components-test" element={<ComponentTestPage />} />
              <Route path="/forms" element={<FormsPage />} />
              <Route path="/data-table" element={<DataTablePage />} />
              <Route path="/real-time" element={<RealTimePage />} />
              <Route path="/api-testing" element={<ApiTestingPage />} />
              <Route path="/performance" element={<PerformanceTestPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
          <ToastContainer />
        </PerformanceProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

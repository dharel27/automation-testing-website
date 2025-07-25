import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user' | 'guest';
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        data-testid="protected-route-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated || !state.user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
        data-testid="protected-route-redirect"
      />
    );
  }

  // Check role-based access if required
  if (requiredRole) {
    const hasRequiredRole = checkUserRole(state.user.role, requiredRole);

    if (!hasRequiredRole) {
      return (
        <div
          className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
          data-testid="protected-route-unauthorized"
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Access Denied
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                You don't have permission to access this page. Required role:{' '}
                {requiredRole}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Your current role: {state.user.role}
              </p>
              <button
                onClick={() => window.history.back()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                data-testid="go-back-button"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Helper function to check if user has required role
function checkUserRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    guest: 0,
    user: 1,
    admin: 2,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1;
  const requiredLevel =
    roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 999;

  return userLevel >= requiredLevel;
}

// Higher-order component for role-based protection
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'admin' | 'user' | 'guest'
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

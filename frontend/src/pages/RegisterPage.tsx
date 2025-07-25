import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RegisterForm } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { state } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

  const handleRegisterSuccess = () => {
    navigate('/', { replace: true });
  };

  if (state.isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <RegisterForm onSuccess={handleRegisterSuccess} />

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              data-testid="login-link"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

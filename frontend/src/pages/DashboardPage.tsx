import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { state, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <div className="text-center">
              <h1
                className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                data-testid="dashboard-title"
              >
                Welcome to your Dashboard
              </h1>

              {state.user && (
                <div
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6"
                  data-testid="user-info"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    User Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Username
                      </label>
                      <p
                        className="mt-1 text-sm text-gray-900 dark:text-white"
                        data-testid="user-username"
                      >
                        {state.user.username}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <p
                        className="mt-1 text-sm text-gray-900 dark:text-white"
                        data-testid="user-email"
                      >
                        {state.user.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role
                      </label>
                      <span
                        className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          state.user.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : state.user.role === 'user'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        data-testid="user-role"
                      >
                        {state.user.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </label>
                      <p
                        className="mt-1 text-sm text-gray-900 dark:text-white"
                        data-testid="user-fullname"
                      >
                        {state.user.profile.firstName}{' '}
                        {state.user.profile.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
                  data-testid="dashboard-card-1"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Profile Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Update your profile information and preferences
                  </p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Edit Profile
                  </button>
                </div>

                <div
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
                  data-testid="dashboard-card-2"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Security Settings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Manage your password and security preferences
                  </p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    Security
                  </button>
                </div>

                <div
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
                  data-testid="dashboard-card-3"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Activity Log
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    View your recent account activity
                  </p>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    View Activity
                  </button>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  data-testid="logout-button"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

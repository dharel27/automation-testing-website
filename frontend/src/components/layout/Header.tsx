import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header = ({ isDarkMode, toggleDarkMode }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { state, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header
      className="bg-white dark:bg-gray-800 shadow-md transition-colors duration-200"
      role="banner"
      data-testid="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-target"
              data-testid="logo-link"
              aria-label="Automation Testing Website Home"
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden xs:inline">AutoTest</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            id="main-navigation"
            className="hidden lg:flex items-center space-x-2 xl:space-x-4"
            role="navigation"
            aria-label="Main navigation"
          >
            <Link
              to="/"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link
              to="/forms"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-forms"
            >
              Forms
            </Link>
            <Link
              to="/data-table"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-data-table"
            >
              Data Table
            </Link>
            <Link
              to="/real-time"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-real-time"
            >
              Real-Time
            </Link>
            <Link
              to="/api-testing"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-api-testing"
            >
              API Testing
            </Link>
            <Link
              to="/performance"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-performance"
            >
              Performance
            </Link>
            <Link
              to="/error-test"
              className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
              data-testid="nav-error-test"
            >
              Error Test
            </Link>

            {/* Authentication Navigation */}
            {state.isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
                  data-testid="user-menu-button"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {state.user?.profile.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden xl:inline truncate max-w-24">
                    {state.user?.profile.firstName}
                  </span>
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 animate-slide-down"
                    data-testid="user-dropdown-menu"
                  >
                    <Link
                      to="/dashboard"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                      data-testid="nav-dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                      data-testid="nav-profile"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <hr className="border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target"
                      data-testid="nav-logout"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 xl:space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors touch-target"
                  data-testid="nav-login"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 xl:px-4 py-2 rounded-md text-sm font-medium transition-colors touch-target"
                  data-testid="nav-register"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Theme Toggle and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              data-testid="theme-toggle"
              aria-label={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              data-testid="mobile-menu-toggle"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 animate-slide-down"
            data-testid="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-1">
              <Link
                to="/"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-home"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/forms"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-forms"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Forms
              </Link>
              <Link
                to="/data-table"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-data-table"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Data Table
              </Link>
              <Link
                to="/real-time"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-real-time"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Real-Time
              </Link>
              <Link
                to="/api-testing"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-api-testing"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                API Testing
              </Link>
              <Link
                to="/performance"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-performance"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Performance
              </Link>
              <Link
                to="/error-test"
                className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                data-testid="mobile-nav-error-test"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Error Test
              </Link>

              {/* Mobile Authentication Navigation */}
              {state.isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <Link
                    to="/dashboard"
                    className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                    data-testid="mobile-nav-dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                    data-testid="mobile-nav-profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors w-full touch-target"
                    data-testid="mobile-nav-logout"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <Link
                    to="/login"
                    className="nav-link text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                    data-testid="mobile-nav-login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-base font-medium transition-colors touch-target"
                    data-testid="mobile-nav-register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

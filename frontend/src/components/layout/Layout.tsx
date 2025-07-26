import { ReactNode, useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ToastContainer } from '../ui/Toast';
import { useNotifications } from '../../contexts/NotificationContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toasts, removeToast } = useNotifications();

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200"
      data-testid="layout-wrapper"
    >
      {/* Skip Links for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
        data-testid="skip-to-main"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
        data-testid="skip-to-navigation"
      >
        Skip to navigation
      </a>

      {/* Header */}
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 bg-gray-50 dark:bg-gray-800 transition-colors duration-200"
        role="main"
        data-testid="main-content"
      >
        {/* Responsive Container with mobile-first approach */}
        <div className="min-h-full">
          <div className="container-responsive py-responsive">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default Layout;

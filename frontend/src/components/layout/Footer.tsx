import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200"
      role="contentinfo"
      data-testid="main-footer"
    >
      <div className="container-responsive py-responsive">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
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
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                AutoTest
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              A comprehensive automation testing platform designed for software
              testers to practice and validate their testing frameworks
              including Selenium, Cypress, and Playwright.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-home-link"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/forms"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-forms-link"
                >
                  Forms Testing
                </Link>
              </li>
              <li>
                <Link
                  to="/data-table"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-data-table-link"
                >
                  Data Tables
                </Link>
              </li>
              <li>
                <Link
                  to="/api-testing"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-api-testing-link"
                >
                  API Testing
                </Link>
              </li>
            </ul>
          </div>

          {/* Accessibility & Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Accessibility & Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#accessibility-statement"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-accessibility-link"
                  aria-label="View accessibility statement"
                >
                  Accessibility Statement
                </a>
              </li>
              <li>
                <a
                  href="#keyboard-shortcuts"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-keyboard-shortcuts-link"
                  aria-label="View keyboard shortcuts guide"
                >
                  Keyboard Shortcuts
                </a>
              </li>
              <li>
                <a
                  href="#screen-reader-guide"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-screen-reader-link"
                  aria-label="Screen reader compatibility guide"
                >
                  Screen Reader Guide
                </a>
              </li>
              <li>
                <a
                  href="#testing-documentation"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  data-testid="footer-documentation-link"
                  aria-label="Testing framework documentation"
                >
                  Testing Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-gray-600 dark:text-gray-400 text-sm text-center lg:text-left">
              <p data-testid="footer-copyright">
                © {currentYear} AutoTest Platform. Built for automation testing
                education and practice.
              </p>
            </div>

            {/* Accessibility Features */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Accessibility:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 whitespace-nowrap"
                  data-testid="wcag-compliance-badge"
                  aria-label="WCAG 2.1 AA compliant"
                >
                  WCAG 2.1 AA
                </span>
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 whitespace-nowrap"
                  data-testid="keyboard-navigation-badge"
                  aria-label="Full keyboard navigation support"
                >
                  Keyboard Nav
                </span>
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 whitespace-nowrap"
                  data-testid="screen-reader-badge"
                  aria-label="Screen reader compatible"
                >
                  Screen Reader
                </span>
              </div>
            </div>
          </div>

          {/* Skip Links for Accessibility */}
          <div className="mt-4 text-center">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
              data-testid="skip-to-main-link"
            >
              Skip to main content
            </a>
            <a
              href="#main-navigation"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
              data-testid="skip-to-navigation-link"
            >
              Skip to navigation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

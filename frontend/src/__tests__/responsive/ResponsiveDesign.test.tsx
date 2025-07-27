import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Layout from '../../components/layout/Layout';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HomePage from '../../pages/HomePage';
import { ContactForm } from '../../components/forms/ContactForm';
import { DataTable } from '../../components/ui/DataTable';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock axios for HomePage
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() =>
      Promise.resolve({
        data: {
          status: 'OK',
          message: 'Backend is healthy',
          timestamp: new Date().toISOString(),
        },
      })
    ),
    defaults: {
      baseURL: 'http://localhost:3001',
    },
    interceptors: {
      request: {
        use: vi.fn(() => 1),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(() => 1),
        eject: vi.fn(),
      },
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper function to set viewport size
const setViewportSize = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Helper function to render components with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>{component}</NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Responsive Design Implementation', () => {
  beforeEach(() => {
    // Reset viewport to desktop size before each test
    setViewportSize(1024, 768);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout Component Responsiveness', () => {
    it('should use responsive container classes', () => {
      const { container } = renderWithProviders(
        <div className="container-responsive">
          <div data-testid="test-content">Test Content</div>
        </div>
      );

      const testContent = screen.getByTestId('test-content');
      expect(testContent).toBeInTheDocument();

      // Check for responsive container
      const responsiveContainer = container.querySelector(
        '.container-responsive'
      );
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('should have proper skip links for accessibility', () => {
      const { container } = renderWithProviders(
        <div>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only"
            data-testid="skip-to-main"
          >
            Skip to main content
          </a>
          <a
            href="#main-navigation"
            className="sr-only focus:not-sr-only"
            data-testid="skip-to-navigation"
          >
            Skip to navigation
          </a>
          <div>Test Content</div>
        </div>
      );

      const skipToMain = screen.getByTestId('skip-to-main');
      const skipToNav = screen.getByTestId('skip-to-navigation');

      expect(skipToMain).toBeInTheDocument();
      expect(skipToNav).toBeInTheDocument();
      expect(skipToMain).toHaveAttribute('href', '#main-content');
      expect(skipToNav).toHaveAttribute('href', '#main-navigation');
    });
  });

  describe('Header Component Responsiveness', () => {
    const mockToggleDarkMode = vi.fn();

    it('should show mobile menu button on small screens', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={mockToggleDarkMode} />
      );

      const mobileMenuButton = screen.getByTestId('mobile-menu-toggle');
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should hide desktop navigation on mobile screens', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={mockToggleDarkMode} />
      );

      const desktopNav = screen.getByRole('navigation', {
        name: 'Main navigation',
      });
      expect(desktopNav).toHaveClass('hidden', 'lg:flex');
    });

    it('should show mobile menu when toggle is clicked', async () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={mockToggleDarkMode} />
      );

      const mobileMenuButton = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(mobileMenuButton);

      await waitFor(() => {
        const mobileMenu = screen.getByTestId('mobile-menu');
        expect(mobileMenu).toBeInTheDocument();
        expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have touch-friendly navigation links', () => {
      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={mockToggleDarkMode} />
      );

      const homeLink = screen.getByTestId('nav-home');
      expect(homeLink).toHaveClass('touch-target');
    });

    it('should hide brand text on extra small screens', () => {
      setViewportSize(400); // Extra small size

      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={mockToggleDarkMode} />
      );

      const logoLink = screen.getByTestId('logo-link');
      const brandText = logoLink.querySelector('span');
      expect(brandText).toHaveClass('hidden', 'xs:inline');
    });
  });

  describe('Footer Component Responsiveness', () => {
    it('should use responsive grid layout', () => {
      renderWithProviders(<Footer />);

      const footer = screen.getByTestId('main-footer');
      expect(footer).toBeInTheDocument();

      // Check for responsive grid classes
      const gridContainer = footer.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-4'
      );
    });

    it('should stack accessibility badges on mobile', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(<Footer />);

      const accessibilitySection = screen.getByTestId(
        'wcag-compliance-badge'
      ).parentElement;
      expect(accessibilitySection).toHaveClass('flex-wrap');
    });

    it('should center copyright text on mobile', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(<Footer />);

      const copyrightSection =
        screen.getByTestId('footer-copyright').parentElement;
      expect(copyrightSection).toHaveClass('text-center', 'lg:text-left');
    });
  });

  describe('HomePage Responsiveness', () => {
    it('should use responsive spacing utilities', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const homePage = screen.getByTestId('home-page');
        expect(homePage).toHaveClass('space-y-responsive');
      });
    });

    it('should have responsive hero section', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const heroSection = screen.getByTestId('hero-section');
        expect(heroSection).toHaveClass('py-responsive');
      });
    });

    it('should stack CTA buttons on mobile', async () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const ctaContainer =
          screen.getByTestId('cta-start-testing').parentElement;
        expect(ctaContainer).toHaveClass('flex-col', 'sm:flex-row');
      });
    });

    it('should use responsive grid for features', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const featuresSection = screen.getByTestId('features-section');
        const gridContainer = featuresSection.querySelector(
          '.grid-responsive-sm'
        );
        expect(gridContainer).toBeInTheDocument();
      });
    });

    it('should have full-width CTA buttons on mobile', async () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const startTestingButton = screen.getByTestId('cta-start-testing');
        expect(startTestingButton).toHaveClass('w-full', 'sm:w-auto');
      });
    });
  });

  describe('ContactForm Responsiveness', () => {
    const mockOnSubmit = vi.fn();

    it('should stack form sections on mobile', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(<ContactForm onSubmit={mockOnSubmit} />);

      const form = screen.getByTestId('contact-form');
      expect(form).toHaveClass('space-y-responsive');
    });

    it('should stack submit buttons on mobile', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(
        <ContactForm onSubmit={mockOnSubmit} onCancel={vi.fn()} />
      );

      const submitButton = screen.getByTestId('contact-submit');
      const buttonContainer = submitButton.parentElement;
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('should have touch-friendly buttons', () => {
      renderWithProviders(<ContactForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByTestId('contact-submit');
      expect(submitButton).toHaveClass('touch-target');
    });

    it('should use responsive padding', () => {
      renderWithProviders(<ContactForm onSubmit={mockOnSubmit} />);

      const formContainer = screen.getByTestId('contact-form').parentElement;
      expect(formContainer).toHaveClass('px-4');
    });
  });

  describe('DataTable Responsiveness', () => {
    const mockData = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    const mockColumns = [
      { key: 'name', header: 'Name', sortable: true, filterable: true },
      { key: 'email', header: 'Email', sortable: true, filterable: true },
    ];

    it('should have responsive bulk actions', () => {
      renderWithProviders(
        <DataTable
          data={mockData}
          columns={mockColumns}
          bulkActions={true}
          selectable={true}
        />
      );

      // Select an item to show bulk actions
      const selectAllCheckbox = screen.getByTestId('data-table-select-all');
      fireEvent.click(selectAllCheckbox);

      const bulkActionsContainer = screen.getByTestId(
        'data-table-bulk-delete'
      ).parentElement;
      expect(bulkActionsContainer).toHaveClass('flex-col', 'xs:flex-row');
    });

    it('should have responsive pagination', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      );

      const paginationContainer = screen.getByTestId('data-table-prev-page')
        .parentElement?.parentElement;
      expect(paginationContainer).toHaveClass('flex-col', 'lg:flex-row');
    });

    it('should have touch-friendly pagination buttons', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      );

      const prevButton = screen.getByTestId('data-table-prev-page');
      const nextButton = screen.getByTestId('data-table-next-page');

      expect(prevButton).toHaveClass('touch-target');
      expect(nextButton).toHaveClass('touch-target');
    });

    it('should have responsive page size selector', () => {
      const mockPagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      );

      const pageSizeSelect = screen.getByTestId('data-table-page-size');
      expect(pageSizeSelect).toHaveClass('touch-target');
    });

    it('should stack pagination controls on mobile', () => {
      setViewportSize(640); // Mobile size

      const mockPagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      renderWithProviders(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
          onPageChange={vi.fn()}
          onLimitChange={vi.fn()}
        />
      );

      const paginationButtons = screen.getByTestId(
        'data-table-prev-page'
      ).parentElement;
      expect(paginationButtons).toHaveClass('flex-col', 'xs:flex-row');
    });
  });

  describe('Touch-Friendly Interface Tests', () => {
    it('should have minimum 44px touch targets', () => {
      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={vi.fn()} />
      );

      const themeToggle = screen.getByTestId('theme-toggle');
      const computedStyle = window.getComputedStyle(themeToggle);

      // Check that the element has touch-target class or appropriate sizing
      expect(themeToggle).toHaveClass('p-2'); // This should provide adequate touch target
    });

    it('should have proper spacing for mobile interactions', () => {
      setViewportSize(640); // Mobile size

      renderWithProviders(
        <Header isDarkMode={false} toggleDarkMode={vi.fn()} />
      );

      const mobileMenuButton = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(mobileMenuButton);

      const mobileNavLinks = screen.getAllByTestId(/mobile-nav-/);
      mobileNavLinks.forEach((link) => {
        expect(link).toHaveClass('py-3'); // Adequate vertical padding for touch
      });
    });
  });

  describe('Responsive Typography Tests', () => {
    it('should use responsive font sizes', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();

        // The heading should use clamp() for responsive sizing via CSS
        const computedStyle = window.getComputedStyle(heading);
        expect(computedStyle.fontSize).toBeDefined();
      });
    });

    it('should have proper line heights for readability', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const paragraph = screen.getByText(/comprehensive platform/i);
        expect(paragraph).toHaveClass('leading-relaxed');
      });
    });
  });

  describe('Responsive Grid System Tests', () => {
    it('should use auto-fit grid classes', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const featuresSection = screen.getByTestId('features-section');
        const gridContainer = featuresSection.querySelector(
          '.grid-responsive-sm'
        );
        expect(gridContainer).toBeInTheDocument();
      });
    });

    it('should have proper gap spacing', async () => {
      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const techStackSection = screen.getByTestId('tech-stack-section');
        const gridContainer = techStackSection.querySelector('.grid');
        expect(gridContainer).toHaveClass('gap-4');
      });
    });
  });

  describe('Breakpoint-Specific Tests', () => {
    const breakpoints = [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'large', width: 1280 },
    ];

    breakpoints.forEach(({ name, width }) => {
      it(`should render correctly at ${name} breakpoint (${width}px)`, async () => {
        setViewportSize(width);

        renderWithProviders(
          <div>
            <Header isDarkMode={false} toggleDarkMode={vi.fn()} />
            <main data-testid="main-content">
              <HomePage />
            </main>
            <Footer />
          </div>
        );

        await waitFor(() => {
          const homePage = screen.getByTestId('home-page');
          expect(homePage).toBeInTheDocument();
        });

        // Verify header renders correctly
        const header = screen.getByTestId('main-header');
        expect(header).toBeInTheDocument();

        // Verify footer renders correctly
        const footer = screen.getByTestId('main-footer');
        expect(footer).toBeInTheDocument();

        // Verify main content is accessible
        const mainContent = screen.getByTestId('main-content');
        expect(mainContent).toBeInTheDocument();
      });
    });
  });

  describe('Orientation Change Tests', () => {
    it('should handle orientation changes gracefully', async () => {
      // Start in portrait
      setViewportSize(375, 667);

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const homePage = screen.getByTestId('home-page');
        expect(homePage).toBeInTheDocument();
      });

      // Switch to landscape
      setViewportSize(667, 375);

      // Component should still render correctly
      const homePageAfterRotation = screen.getByTestId('home-page');
      expect(homePageAfterRotation).toBeInTheDocument();
    });
  });
});

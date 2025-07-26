import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { PerformanceProvider } from '../../contexts/PerformanceContext';
import HomePage from '../../pages/HomePage';
import LoginPage from '../../pages/LoginPage';
import FormsPage from '../../pages/FormsPage';
import DataTablePage from '../../pages/DataTablePage';
import { Layout } from '../../components/layout';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Modal } from '../../components/ui/Modal';
import { FormInput } from '../../components/forms/FormInput';
import { DataTable } from '../../components/ui/DataTable';
import SkipLinks from '../../components/accessibility/SkipLinks';
import AccessibleButton from '../../components/accessibility/AccessibleButton';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <PerformanceProvider>{children}</PerformanceProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Accessibility Tests', () => {
  describe('Layout Components', () => {
    it('should not have accessibility violations in Header', async () => {
      const { container } = render(
        <TestWrapper>
          <Header isDarkMode={false} toggleDarkMode={() => {}} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in Footer', async () => {
      const { container } = render(
        <TestWrapper>
          <Footer />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in Layout', async () => {
      const { container } = render(
        <TestWrapper>
          <Layout>
            <div>Test content</div>
          </Layout>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Page Components', () => {
    it('should not have accessibility violations in HomePage', async () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in LoginPage', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in FormsPage', async () => {
      const { container } = render(
        <TestWrapper>
          <FormsPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in DataTablePage', async () => {
      const { container } = render(
        <TestWrapper>
          <DataTablePage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('UI Components', () => {
    it('should not have accessibility violations in Modal', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in FormInput', async () => {
      const { container } = render(
        <FormInput
          id="test-input"
          name="test"
          label="Test Input"
          value=""
          onChange={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in DataTable', async () => {
      const mockData = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      const mockColumns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
      ];

      const { container } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={() => {}}
          onFilter={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Accessibility Components', () => {
    it('should not have accessibility violations in SkipLinks', async () => {
      const { container } = render(<SkipLinks />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in AccessibleButton', async () => {
      const { container } = render(
        <AccessibleButton onClick={() => {}}>Test Button</AccessibleButton>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper focus management in Modal', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      // Check that modal is focusable
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('tabIndex', '-1');
    });

    it('should have proper ARIA attributes in form inputs', () => {
      render(
        <FormInput
          id="test-input"
          name="test"
          label="Test Input"
          value=""
          onChange={() => {}}
          required={true}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('id', 'test-input');

      const label = screen.getByText('Test Input');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('should have proper ARIA attributes in buttons', () => {
      const mockOnClick = jest.fn();
      render(
        <AccessibleButton onClick={mockOnClick} loading={true}>
          Loading Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // First heading should be h1
      const h1Elements = headings.filter((heading) => heading.tagName === 'H1');
      expect(h1Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper landmark roles', () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Test content</div>
          </Layout>
        </TestWrapper>
      );

      // Check for main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Check for banner (header) landmark
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Check for contentinfo (footer) landmark
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      // Check for navigation landmark
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have proper alt text for images', () => {
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // All images should have alt text or be marked as decorative
      const images = screen.getAllByRole('img', { hidden: true });
      images.forEach((img) => {
        expect(img.hasAttribute('alt') || img.hasAttribute('aria-hidden')).toBe(
          true
        );
      });
    });
  });

  describe('Color Contrast', () => {
    it('should pass color contrast checks', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <p className="text-gray-900 dark:text-white">High contrast text</p>
            <button className="bg-blue-600 text-white">
              Accessible button
            </button>
            <a href="#" className="text-blue-600 hover:text-blue-800">
              Accessible link
            </a>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and error handling', async () => {
      const { container } = render(
        <TestWrapper>
          <FormsPage />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          label: { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should handle form validation errors accessibly', () => {
      const mockValidator = (value: string) => ({
        isValid: false,
        error: 'This field is required',
      });

      render(
        <FormInput
          id="test-input"
          name="test"
          label="Test Input"
          value=""
          onChange={() => {}}
          validator={mockValidator}
        />
      );

      // Simulate blur to trigger validation
      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();

      // Check for error message
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('This field is required');
    });
  });

  describe('Table Accessibility', () => {
    it('should have proper table structure and headers', async () => {
      const mockData = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      const mockColumns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
      ];

      const { container } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={() => {}}
          onFilter={() => {}}
        />
      );

      const results = await axe(container, {
        rules: {
          'th-has-data-cells': { enabled: true },
          'td-headers-attr': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});

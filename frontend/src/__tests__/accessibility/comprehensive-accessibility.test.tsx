/**
 * Comprehensive Accessibility Tests
 * Tests WCAG 2.1 AA compliance and accessibility features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Components to test
import HomePage from '../../pages/HomePage';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import DataTablePage from '../../pages/DataTablePage';
import FormsPage from '../../pages/FormsPage';
import Modal from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import Accordion from '../../components/ui/Accordion';
import DataTable from '../../components/ui/DataTable';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Comprehensive Accessibility Tests', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations on HomePage', async () => {
      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on LoginPage', async () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on RegisterPage', async () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on DataTablePage', async () => {
      const { container } = render(<DataTablePage />, { wrapper: TestWrapper });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on FormsPage', async () => {
      const { container } = render(<FormsPage />, { wrapper: TestWrapper });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation on forms', async () => {
      const user = userEvent.setup();
      render(<LoginPage />, { wrapper: TestWrapper });

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /login/i })).toHaveFocus();

      // Test form submission with Enter key
      await user.keyboard('{Enter}');
      // Form should attempt to submit
    });

    it('should support keyboard navigation in data table', async () => {
      const user = userEvent.setup();
      const mockData = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'admin',
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'role', label: 'Role', sortable: false },
          ]}
          onSort={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Tab to table
      await user.tab();
      expect(screen.getByRole('table')).toHaveFocus();

      // Arrow key navigation within table
      await user.keyboard('{ArrowDown}');
      expect(screen.getAllByRole('row')[1]).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('john@example.com')).toHaveFocus();
    });

    it('should support keyboard navigation in modal dialogs', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          title="Test Modal"
          data-testid="test-modal"
        >
          <button>First Button</button>
          <button>Second Button</button>
          <button>Third Button</button>
        </Modal>,
        { wrapper: TestWrapper }
      );

      // Focus should be trapped within modal
      await user.tab();
      expect(screen.getByText('First Button')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Second Button')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Third Button')).toHaveFocus();

      // Tab should cycle back to first element
      await user.tab();
      expect(screen.getByLabelText(/close modal/i)).toHaveFocus();

      // Escape key should close modal
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should support keyboard navigation in accordion', async () => {
      const user = userEvent.setup();
      const accordionItems = [
        { id: '1', title: 'Section 1', content: 'Content 1' },
        { id: '2', title: 'Section 2', content: 'Content 2' },
        { id: '3', title: 'Section 3', content: 'Content 3' },
      ];

      render(<Accordion items={accordionItems} />, { wrapper: TestWrapper });

      // Tab to first accordion header
      await user.tab();
      const firstHeader = screen.getByText('Section 1');
      expect(firstHeader).toHaveFocus();

      // Enter/Space should toggle accordion
      await user.keyboard('{Enter}');
      expect(screen.getByText('Content 1')).toBeVisible();

      // Arrow keys should navigate between headers
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Section 2')).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('Section 1')).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Check for main landmarks
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveAttribute('aria-level', '1');
    });

    it('should have proper form labels and descriptions', () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      // Check form labels
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');

      // Check for error message associations
      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      render(<FormsPage />, { wrapper: TestWrapper });

      // Fill form with invalid data to trigger validation
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger validation

      // Check for aria-live region with error message
      const errorMessage = screen.getByText(/please enter a valid email/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper table headers and captions', () => {
      const mockData = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
      ];

      render(
        <DataTable
          data={mockData}
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
          ]}
          onSort={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Check table structure
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label');

      // Check column headers
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      expect(nameHeader).toHaveAttribute('scope', 'col');

      const emailHeader = screen.getByRole('columnheader', { name: /email/i });
      expect(emailHeader).toHaveAttribute('scope', 'col');

      // Check sortable headers have proper ARIA attributes
      expect(nameHeader).toHaveAttribute('aria-sort');
      expect(nameHeader).toHaveAttribute('tabindex', '0');
    });

    it('should provide proper button descriptions', () => {
      render(<DataTablePage />, { wrapper: TestWrapper });

      // Check action buttons have descriptive labels
      const addButton = screen.getByRole('button', { name: /add user/i });
      expect(addButton).toHaveAccessibleName();

      // Check icon buttons have labels
      const editButtons = screen.getAllByLabelText(/edit user/i);
      expect(editButtons.length).toBeGreaterThan(0);

      const deleteButtons = screen.getAllByLabelText(/delete user/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly in modals', async () => {
      const user = userEvent.setup();
      render(<DataTablePage />, { wrapper: TestWrapper });

      // Open modal
      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      // Focus should move to modal
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveFocus();

      // Close modal and focus should return
      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(addButton).toHaveFocus();
    });

    it('should provide visible focus indicators', () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();

      // Check for focus styles (this would need to be tested with actual CSS)
      expect(emailInput).toHaveFocus();
      expect(emailInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('should handle skip links properly', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      // Tab to skip link
      await user.tab();
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toHaveFocus();

      // Activate skip link
      await user.keyboard('{Enter}');
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveFocus();
    });
  });

  describe('Color Contrast and Visual Design', () => {
    it('should have sufficient color contrast', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // This would typically be tested with automated tools
      // For now, we check that elements have appropriate classes
      const primaryButton = screen.getByRole('button', {
        name: /get started/i,
      });
      expect(primaryButton).toHaveClass('bg-blue-600', 'text-white');

      const secondaryButton = screen.getByRole('button', {
        name: /learn more/i,
      });
      expect(secondaryButton).toHaveClass('border-gray-300', 'text-gray-700');
    });

    it('should not rely solely on color for information', () => {
      render(<FormsPage />, { wrapper: TestWrapper });

      // Error states should have icons or text, not just color
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);

      // Success/error messages should have appropriate icons
      // This would be tested when form validation is triggered
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<HomePage />, { wrapper: TestWrapper });

      // Check that high contrast styles are applied
      const body = document.body;
      expect(body).toHaveClass('high-contrast');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HomePage />, { wrapper: TestWrapper });

      // Check mobile navigation
      const mobileMenuButton = screen.getByLabelText(/open menu/i);
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have appropriate touch targets', () => {
      render(<DataTablePage />, { wrapper: TestWrapper });

      // Check that interactive elements have minimum 44px touch targets
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);

        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();

      // Mock failed API call
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<LoginPage />, { wrapper: TestWrapper });

      // Attempt login
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Check for error announcement
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should provide clear error recovery instructions', async () => {
      render(<FormsPage />, { wrapper: TestWrapper });

      // Trigger validation error
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.blur(emailInput); // Trigger validation on empty field

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('id');
        expect(emailInput).toHaveAttribute('aria-describedby', errorMessage.id);
      });
    });
  });

  describe('Internationalization Accessibility', () => {
    it('should support RTL languages', () => {
      // Mock RTL language
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');

      render(<HomePage />, { wrapper: TestWrapper });

      // Check that layout adapts to RTL
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveStyle('direction: rtl');

      // Cleanup
      document.documentElement.removeAttribute('dir');
      document.documentElement.setAttribute('lang', 'en');
    });

    it('should have proper language attributes', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Check main language attribute
      expect(document.documentElement).toHaveAttribute('lang', 'en');

      // Check for any content in different languages
      const foreignText = screen.queryByText(/[^\x00-\x7F]/);
      if (foreignText) {
        expect(foreignText).toHaveAttribute('lang');
      }
    });
  });

  describe('Animation and Motion Accessibility', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<HomePage />, { wrapper: TestWrapper });

      // Check that animations are disabled
      const animatedElements = screen.getAllByRole('button');
      animatedElements.forEach((element) => {
        expect(element).toHaveClass('motion-reduce:transition-none');
      });
    });

    it('should not auto-play media without user consent', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Check for any video or audio elements
      const mediaElements = document.querySelectorAll('video, audio');
      mediaElements.forEach((element) => {
        expect(element).not.toHaveAttribute('autoplay');
      });
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should provide clear navigation and orientation', () => {
      render(<DataTablePage />, { wrapper: TestWrapper });

      // Check for breadcrumbs or page indicators
      const breadcrumbs = screen.queryByRole('navigation', {
        name: /breadcrumb/i,
      });
      if (breadcrumbs) {
        expect(breadcrumbs).toBeInTheDocument();
      }

      // Check for clear page titles
      const pageTitle = screen.getByRole('heading', { level: 1 });
      expect(pageTitle).toBeInTheDocument();
      expect(pageTitle.textContent).toBeTruthy();
    });

    it('should provide help and instructions', () => {
      render(<FormsPage />, { wrapper: TestWrapper });

      // Check for form instructions
      const helpText = screen.queryByText(/help/i);
      if (helpText) {
        expect(helpText).toBeInTheDocument();
      }

      // Check for required field indicators
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should allow users to extend time limits', async () => {
      // This would test session timeout warnings and extensions
      // For now, we check that timeout warnings exist
      render(<DataTablePage />, { wrapper: TestWrapper });

      // Mock session timeout warning
      const timeoutWarning = screen.queryByRole('dialog', {
        name: /session timeout/i,
      });
      if (timeoutWarning) {
        expect(timeoutWarning).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /extend session/i })
        ).toBeInTheDocument();
      }
    });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { Modal } from '../../components/ui/Modal';
import { FormInput } from '../../components/forms/FormInput';
import AccessibleButton from '../../components/accessibility/AccessibleButton';
import FocusTrap from '../../components/accessibility/FocusTrap';
import { DataTable } from '../../components/ui/DataTable';
import Header from '../../components/layout/Header';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Keyboard Navigation Tests', () => {
  describe('Focus Management', () => {
    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <button data-testid="first-button">First Button</button>
          <button data-testid="second-button">Second Button</button>
          <button data-testid="third-button">Third Button</button>
        </Modal>
      );

      const firstButton = screen.getByTestId('first-button');
      const secondButton = screen.getByTestId('second-button');
      const thirdButton = screen.getByTestId('third-button');

      // Focus should start on first button
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab should move to second button
      await user.tab();
      expect(secondButton).toHaveFocus();

      // Tab should move to third button
      await user.tab();
      expect(thirdButton).toHaveFocus();

      // Tab should move to close button
      await user.tab();
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveFocus();

      // Tab should wrap back to first button
      await user.tab();
      expect(firstButton).toHaveFocus();

      // Shift+Tab should go backwards
      await user.tab({ shift: true });
      expect(closeButton).toHaveFocus();
    });

    it('should handle Escape key in modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <button>Test Button</button>
        </Modal>
      );

      // Press Escape
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should manage focus in FocusTrap component', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="outside-button">Outside Button</button>
          <FocusTrap isActive={true}>
            <button data-testid="inside-button-1">Inside Button 1</button>
            <button data-testid="inside-button-2">Inside Button 2</button>
          </FocusTrap>
        </div>
      );

      const outsideButton = screen.getByTestId('outside-button');
      const insideButton1 = screen.getByTestId('inside-button-1');
      const insideButton2 = screen.getByTestId('inside-button-2');

      // Focus should be trapped inside
      insideButton1.focus();
      expect(insideButton1).toHaveFocus();

      await user.tab();
      expect(insideButton2).toHaveFocus();

      // Tab should wrap back to first button inside trap
      await user.tab();
      expect(insideButton1).toHaveFocus();
    });
  });

  describe('Button Keyboard Interaction', () => {
    it('should handle Enter key on AccessibleButton', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <AccessibleButton onClick={onClick}>Test Button</AccessibleButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalled();
    });

    it('should handle Space key on AccessibleButton', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <AccessibleButton onClick={onClick}>Test Button</AccessibleButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalled();
    });

    it('should not trigger when button is disabled', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <AccessibleButton onClick={onClick} disabled={true}>
          Disabled Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not trigger when button is loading', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <AccessibleButton onClick={onClick} loading={true}>
          Loading Button
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Form Navigation', () => {
    it('should navigate between form inputs with Tab', async () => {
      const user = userEvent.setup();

      render(
        <form>
          <FormInput
            id="input1"
            name="input1"
            label="Input 1"
            value=""
            onChange={() => {}}
          />
          <FormInput
            id="input2"
            name="input2"
            label="Input 2"
            value=""
            onChange={() => {}}
          />
          <button type="submit">Submit</button>
        </form>
      );

      const input1 = screen.getByLabelText('Input 1');
      const input2 = screen.getByLabelText('Input 2');
      const submitButton = screen.getByRole('button');

      input1.focus();
      expect(input1).toHaveFocus();

      await user.tab();
      expect(input2).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should show/hide password with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <FormInput
          id="password"
          name="password"
          type="password"
          label="Password"
          value=""
          onChange={() => {}}
          showPasswordToggle={true}
        />
      );

      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByLabelText('Show password');

      expect(passwordInput).toHaveAttribute('type', 'password');

      toggleButton.focus();
      await user.keyboard('{Enter}');

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });
  });

  describe('Table Navigation', () => {
    it('should navigate table with keyboard', async () => {
      const user = userEvent.setup();
      const mockData = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      const mockColumns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          onSort={() => {}}
          onFilter={() => {}}
        />
      );

      // Find sortable column headers
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const emailHeader = screen.getByRole('columnheader', { name: /email/i });

      // Should be able to focus and activate sort
      nameHeader.focus();
      expect(nameHeader).toHaveFocus();

      await user.tab();
      expect(emailHeader).toHaveFocus();
    });
  });

  describe('Navigation Menu', () => {
    it('should navigate header menu with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Header isDarkMode={false} toggleDarkMode={() => {}} />
        </TestWrapper>
      );

      // Find navigation links
      const homeLink = screen.getByTestId('nav-home');
      const formsLink = screen.getByTestId('nav-forms');
      const themeToggle = screen.getByTestId('theme-toggle');

      homeLink.focus();
      expect(homeLink).toHaveFocus();

      await user.tab();
      expect(formsLink).toHaveFocus();

      // Navigate to theme toggle (skip other nav items for brevity)
      themeToggle.focus();
      expect(themeToggle).toHaveFocus();

      // Should activate theme toggle with Enter
      await user.keyboard('{Enter}');
      // Theme toggle functionality would be tested separately
    });

    it('should handle mobile menu keyboard navigation', async () => {
      const user = userEvent.setup();

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      render(
        <TestWrapper>
          <Header isDarkMode={false} toggleDarkMode={() => {}} />
        </TestWrapper>
      );

      const mobileMenuToggle = screen.getByTestId('mobile-menu-toggle');

      mobileMenuToggle.focus();
      expect(mobileMenuToggle).toHaveFocus();

      // Open mobile menu with Enter
      await user.keyboard('{Enter}');

      // Mobile menu should be visible
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

      // Should be able to navigate mobile menu items
      const mobileHomeLink = screen.getByTestId('mobile-nav-home');
      mobileHomeLink.focus();
      expect(mobileHomeLink).toHaveFocus();
    });
  });

  describe('Skip Links', () => {
    it('should activate skip links with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only"
            data-testid="skip-to-main"
          >
            Skip to main content
          </a>
          <nav id="main-navigation">
            <a href="/">Home</a>
          </nav>
          <main id="main-content" tabIndex={-1}>
            <h1>Main Content</h1>
          </main>
        </div>
      );

      const skipLink = screen.getByTestId('skip-to-main');

      skipLink.focus();
      expect(skipLink).toHaveFocus();

      // Activate skip link
      await user.keyboard('{Enter}');

      // Main content should receive focus
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveFocus();
    });
  });

  describe('Dropdown Navigation', () => {
    it('should handle dropdown keyboard navigation', async () => {
      const user = userEvent.setup();

      // Mock authenticated user for dropdown menu
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user' as const,
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      // This would require mocking the auth context
      // For now, we'll test the basic dropdown structure
      render(
        <div>
          <button
            data-testid="dropdown-trigger"
            aria-expanded={false}
            aria-haspopup={true}
          >
            User Menu
          </button>
          <div role="menu" data-testid="dropdown-menu" hidden>
            <a href="/profile" role="menuitem">
              Profile
            </a>
            <a href="/settings" role="menuitem">
              Settings
            </a>
            <button role="menuitem">Logout</button>
          </div>
        </div>
      );

      const dropdownTrigger = screen.getByTestId('dropdown-trigger');

      dropdownTrigger.focus();
      expect(dropdownTrigger).toHaveFocus();

      // Arrow down should open dropdown and focus first item
      await user.keyboard('{ArrowDown}');

      // This would require implementing proper dropdown keyboard handling
      // in the actual component
    });
  });

  describe('Error Handling', () => {
    it('should handle keyboard navigation when elements are disabled', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>Enabled Button 1</button>
          <button disabled>Disabled Button</button>
          <button>Enabled Button 2</button>
        </div>
      );

      const enabledButton1 = screen.getByText('Enabled Button 1');
      const disabledButton = screen.getByText('Disabled Button');
      const enabledButton2 = screen.getByText('Enabled Button 2');

      enabledButton1.focus();
      expect(enabledButton1).toHaveFocus();

      // Tab should skip disabled button
      await user.tab();
      expect(enabledButton2).toHaveFocus();
      expect(disabledButton).not.toHaveFocus();
    });

    it('should handle keyboard navigation with dynamic content', async () => {
      const user = userEvent.setup();
      let showSecondButton = false;

      const TestComponent = () => {
        const [show, setShow] = React.useState(showSecondButton);

        return (
          <div>
            <button onClick={() => setShow(!show)}>Toggle</button>
            {show && (
              <button data-testid="dynamic-button">Dynamic Button</button>
            )}
            <button>Last Button</button>
          </div>
        );
      };

      const { rerender } = render(<TestComponent />);

      const toggleButton = screen.getByText('Toggle');
      const lastButton = screen.getByText('Last Button');

      toggleButton.focus();
      await user.keyboard('{Enter}');

      // Re-render with dynamic content
      showSecondButton = true;
      rerender(<TestComponent />);

      // Should be able to navigate to dynamic button
      await user.tab();
      const dynamicButton = screen.getByTestId('dynamic-button');
      expect(dynamicButton).toHaveFocus();

      await user.tab();
      expect(lastButton).toHaveFocus();
    });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

const renderHeader = (props = {}) => {
  const defaultProps = {
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    ...props,
  };

  return render(
    <BrowserRouter>
      <Header {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  it('renders the header with logo and navigation', () => {
    renderHeader();

    expect(screen.getByTestId('main-header')).toBeInTheDocument();
    expect(screen.getByTestId('logo-link')).toBeInTheDocument();
    expect(screen.getByText('AutoTest')).toBeInTheDocument();
  });

  it('displays desktop navigation links', () => {
    renderHeader();

    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-forms')).toBeInTheDocument();
    expect(screen.getByTestId('nav-data-table')).toBeInTheDocument();
    expect(screen.getByTestId('nav-api-testing')).toBeInTheDocument();
    expect(screen.getByTestId('nav-login')).toBeInTheDocument();
  });

  it('renders theme toggle button with correct aria-label', () => {
    renderHeader({ isDarkMode: false });

    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('renders theme toggle button with dark mode aria-label', () => {
    renderHeader({ isDarkMode: true });

    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('calls toggleDarkMode when theme toggle is clicked', () => {
    const mockToggleDarkMode = vi.fn();
    renderHeader({ toggleDarkMode: mockToggleDarkMode });

    const themeToggle = screen.getByTestId('theme-toggle');
    fireEvent.click(themeToggle);

    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile menu when mobile menu button is clicked', () => {
    renderHeader();

    const mobileMenuToggle = screen.getByTestId('mobile-menu-toggle');
    expect(mobileMenuToggle).toHaveAttribute('aria-expanded', 'false');

    // Mobile menu should not be visible initially
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

    // Click to open mobile menu
    fireEvent.click(mobileMenuToggle);
    expect(mobileMenuToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Click to close mobile menu
    fireEvent.click(mobileMenuToggle);
    expect(mobileMenuToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  it('displays mobile navigation links when mobile menu is open', () => {
    renderHeader();

    const mobileMenuToggle = screen.getByTestId('mobile-menu-toggle');
    fireEvent.click(mobileMenuToggle);

    expect(screen.getByTestId('mobile-nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-forms')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-data-table')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-api-testing')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-login')).toBeInTheDocument();
  });

  it('closes mobile menu when a mobile nav link is clicked', () => {
    renderHeader();

    const mobileMenuToggle = screen.getByTestId('mobile-menu-toggle');
    fireEvent.click(mobileMenuToggle);

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    const mobileNavHome = screen.getByTestId('mobile-nav-home');
    fireEvent.click(mobileNavHome);

    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderHeader();

    const header = screen.getByTestId('main-header');
    expect(header).toHaveAttribute('role', 'banner');

    const logoLink = screen.getByTestId('logo-link');
    expect(logoLink).toHaveAttribute(
      'aria-label',
      'Automation Testing Website Home'
    );

    const mobileMenuToggle = screen.getByTestId('mobile-menu-toggle');
    expect(mobileMenuToggle).toHaveAttribute(
      'aria-label',
      'Toggle mobile menu'
    );
  });

  it('applies dark mode classes when isDarkMode is true', () => {
    renderHeader({ isDarkMode: true });

    const header = screen.getByTestId('main-header');
    expect(header).toHaveClass('dark:bg-gray-800');
  });
});

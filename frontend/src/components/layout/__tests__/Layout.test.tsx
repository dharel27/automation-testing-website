import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Layout from '../Layout';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const renderLayout = (
  children = <div data-testid="test-content">Test Content</div>
) => {
  return render(
    <BrowserRouter>
      <Layout>{children}</Layout>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('renders the layout wrapper with proper structure', () => {
    renderLayout();

    expect(screen.getByTestId('layout-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders header and footer components', () => {
    renderLayout();

    expect(screen.getByTestId('main-header')).toBeInTheDocument();
    expect(screen.getByTestId('main-footer')).toBeInTheDocument();
  });

  it('includes skip links for accessibility', () => {
    renderLayout();

    expect(screen.getByTestId('skip-to-main')).toBeInTheDocument();
    expect(screen.getByTestId('skip-to-navigation')).toBeInTheDocument();
  });

  it('initializes dark mode from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    renderLayout();

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initializes light mode when localStorage has light theme', () => {
    localStorageMock.getItem.mockReturnValue('light');

    renderLayout();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('uses system preference when no localStorage theme is set', () => {
    localStorageMock.getItem.mockReturnValue(null);

    // Mock system preference for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    renderLayout();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles dark mode when theme toggle is clicked', () => {
    renderLayout();

    const themeToggle = screen.getByTestId('theme-toggle');

    // Initially light mode
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click to enable dark mode
    fireEvent.click(themeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');

    // Click to disable dark mode
    fireEvent.click(themeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('has proper main content structure with role', () => {
    renderLayout();

    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toHaveAttribute('role', 'main');
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  it('applies responsive container classes', () => {
    renderLayout();

    const layoutWrapper = screen.getByTestId('layout-wrapper');
    expect(layoutWrapper).toHaveClass('min-h-screen', 'flex', 'flex-col');
  });

  it('applies dark mode classes to layout wrapper', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    renderLayout();

    const layoutWrapper = screen.getByTestId('layout-wrapper');
    expect(layoutWrapper).toHaveClass('dark:bg-gray-900');
  });

  it('renders children content properly', () => {
    const customContent = (
      <div data-testid="custom-content">Custom Test Content</div>
    );
    renderLayout(customContent);

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Test Content')).toBeInTheDocument();
  });

  it('maintains flex layout structure', () => {
    renderLayout();

    const layoutWrapper = screen.getByTestId('layout-wrapper');
    const mainContent = screen.getByTestId('main-content');

    expect(layoutWrapper).toHaveClass('flex', 'flex-col');
    expect(mainContent).toHaveClass('flex-1');
  });
});

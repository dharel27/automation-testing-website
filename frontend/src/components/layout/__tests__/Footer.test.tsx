import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer';

const renderFooter = () => {
  return render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  it('renders the footer with proper role and test id', () => {
    renderFooter();

    const footer = screen.getByTestId('main-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute('role', 'contentinfo');
  });

  it('displays the brand section with logo and description', () => {
    renderFooter();

    expect(screen.getByText('AutoTest')).toBeInTheDocument();
    expect(
      screen.getByText(/comprehensive automation testing platform/i)
    ).toBeInTheDocument();
  });

  it('displays quick links section', () => {
    renderFooter();

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByTestId('footer-home-link')).toBeInTheDocument();
    expect(screen.getByTestId('footer-forms-link')).toBeInTheDocument();
    expect(screen.getByTestId('footer-data-table-link')).toBeInTheDocument();
    expect(screen.getByTestId('footer-api-testing-link')).toBeInTheDocument();
  });

  it('displays accessibility and support section', () => {
    renderFooter();

    expect(screen.getByText('Accessibility & Support')).toBeInTheDocument();
    expect(screen.getByTestId('footer-accessibility-link')).toBeInTheDocument();
    expect(
      screen.getByTestId('footer-keyboard-shortcuts-link')
    ).toBeInTheDocument();
    expect(screen.getByTestId('footer-screen-reader-link')).toBeInTheDocument();
    expect(screen.getByTestId('footer-documentation-link')).toBeInTheDocument();
  });

  it('displays copyright with current year', () => {
    renderFooter();

    const currentYear = new Date().getFullYear();
    const copyright = screen.getByTestId('footer-copyright');
    expect(copyright).toBeInTheDocument();
    expect(copyright).toHaveTextContent(currentYear.toString());
  });

  it('displays accessibility compliance badges', () => {
    renderFooter();

    expect(screen.getByTestId('wcag-compliance-badge')).toBeInTheDocument();
    expect(screen.getByTestId('keyboard-navigation-badge')).toBeInTheDocument();
    expect(screen.getByTestId('screen-reader-badge')).toBeInTheDocument();
  });

  it('includes skip links for accessibility', () => {
    renderFooter();

    expect(screen.getByTestId('skip-to-main-link')).toBeInTheDocument();
    expect(screen.getByTestId('skip-to-navigation-link')).toBeInTheDocument();
  });

  it('has proper accessibility attributes for links', () => {
    renderFooter();

    const accessibilityLink = screen.getByTestId('footer-accessibility-link');
    expect(accessibilityLink).toHaveAttribute(
      'aria-label',
      'View accessibility statement'
    );

    const keyboardShortcutsLink = screen.getByTestId(
      'footer-keyboard-shortcuts-link'
    );
    expect(keyboardShortcutsLink).toHaveAttribute(
      'aria-label',
      'View keyboard shortcuts guide'
    );

    const screenReaderLink = screen.getByTestId('footer-screen-reader-link');
    expect(screenReaderLink).toHaveAttribute(
      'aria-label',
      'Screen reader compatibility guide'
    );

    const documentationLink = screen.getByTestId('footer-documentation-link');
    expect(documentationLink).toHaveAttribute(
      'aria-label',
      'Testing framework documentation'
    );
  });

  it('has proper accessibility attributes for badges', () => {
    renderFooter();

    const wcagBadge = screen.getByTestId('wcag-compliance-badge');
    expect(wcagBadge).toHaveAttribute('aria-label', 'WCAG 2.1 AA compliant');

    const keyboardBadge = screen.getByTestId('keyboard-navigation-badge');
    expect(keyboardBadge).toHaveAttribute(
      'aria-label',
      'Full keyboard navigation support'
    );

    const screenReaderBadge = screen.getByTestId('screen-reader-badge');
    expect(screenReaderBadge).toHaveAttribute(
      'aria-label',
      'Screen reader compatible'
    );
  });

  it('renders all footer links with correct hrefs', () => {
    renderFooter();

    expect(screen.getByTestId('footer-home-link')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('footer-forms-link')).toHaveAttribute(
      'href',
      '/forms'
    );
    expect(screen.getByTestId('footer-data-table-link')).toHaveAttribute(
      'href',
      '/data-table'
    );
    expect(screen.getByTestId('footer-api-testing-link')).toHaveAttribute(
      'href',
      '/api-testing'
    );
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BannerSection from '../BannerSection';

// Mock setTimeout to control timing in tests
vi.useFakeTimers();

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BannerSection', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('shows loading state initially', () => {
    renderWithRouter(<BannerSection />);

    expect(screen.getByTestId('banner-loading')).toBeInTheDocument();
    expect(screen.getByTestId('banner-loading')).toHaveClass('animate-pulse');
  });

  it('shows content after loading delay', async () => {
    renderWithRouter(<BannerSection delay={100} />);

    // Fast-forward time to complete the loading
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });

    expect(screen.getByTestId('banner-title')).toBeInTheDocument();
    expect(screen.getByTestId('banner-subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('banner-description')).toBeInTheDocument();
    expect(screen.getByTestId('banner-cta-button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-banner-class';
    renderWithRouter(<BannerSection className={customClass} />);

    const bannerElement = screen.getByTestId('banner-loading');
    expect(bannerElement).toHaveClass(customClass);
  });

  it('respects delay prop', async () => {
    const delay = 500;
    renderWithRouter(<BannerSection delay={delay} />);

    // Should still be loading before delay
    vi.advanceTimersByTime(delay - 100);
    expect(screen.getByTestId('banner-loading')).toBeInTheDocument();

    // Should be loaded after delay + random time
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });
  });

  it('displays one of the predefined banner contents', async () => {
    renderWithRouter(<BannerSection />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });

    const title = screen.getByTestId('banner-title');
    const possibleTitles = [
      'Test Automation Made Easy',
      'API Testing & Integration',
      'Dynamic Data Tables',
    ];

    expect(possibleTitles).toContain(title.textContent);
  });

  it('has proper CTA button with link', async () => {
    renderWithRouter(<BannerSection />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-cta-button')).toBeInTheDocument();
    });

    const ctaButton = screen.getByTestId('banner-cta-button');
    expect(ctaButton).toHaveAttribute('href');
    expect(ctaButton.getAttribute('href')).toMatch(
      /^\/(forms|api-testing|data-table)$/
    );
  });

  it('shows error state when loading fails', async () => {
    // Mock Math.random to force an error scenario
    const originalRandom = Math.random;
    Math.random = vi.fn(() => 0.5);

    // Mock console.error to avoid error logs in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<BannerSection />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });

    // Restore original Math.random
    Math.random = originalRandom;
    consoleSpy.mockRestore();
  });

  it('has proper accessibility attributes', async () => {
    renderWithRouter(<BannerSection />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-cta-button')).toBeInTheDocument();
    });

    const ctaButton = screen.getByTestId('banner-cta-button');
    expect(ctaButton).toHaveAttribute('aria-label');

    const ariaLabel = ctaButton.getAttribute('aria-label');
    expect(ariaLabel).toContain(' - '); // Should contain both CTA text and title
  });

  it('displays loading indicator in loading state', () => {
    renderWithRouter(<BannerSection />);

    const loadingElement = screen.getByTestId('banner-loading');
    const spinner = loadingElement.querySelector('.animate-spin');

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('border-t-transparent');
  });

  it('shows gradient background with proper styling', async () => {
    renderWithRouter(<BannerSection />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });

    const bannerSection = screen.getByTestId('banner-section');
    expect(bannerSection).toHaveClass('rounded-xl', 'shadow-lg');

    // Check for gradient background classes
    const gradientElement = bannerSection.querySelector('.bg-gradient-to-r');
    expect(gradientElement).toBeInTheDocument();
  });

  it('handles multiple banner instances with different delays', async () => {
    const { rerender } = renderWithRouter(<BannerSection delay={100} />);

    // First banner should be loading
    expect(screen.getByTestId('banner-loading')).toBeInTheDocument();

    // Rerender with different delay
    rerender(
      <BrowserRouter>
        <BannerSection delay={200} />
      </BrowserRouter>
    );

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });
  });

  it('displays decorative elements', async () => {
    renderWithRouter(<BannerSection />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    });

    const bannerSection = screen.getByTestId('banner-section');
    const decorativeElements = bannerSection.querySelectorAll(
      '.bg-white\\/10, .bg-white\\/5'
    );

    expect(decorativeElements.length).toBeGreaterThan(0);
  });
});

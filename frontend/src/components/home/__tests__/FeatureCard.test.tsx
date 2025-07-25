import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import FeatureCard from '../FeatureCard';

// Mock setTimeout to control timing in tests
vi.useFakeTimers();

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FeatureCard', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('shows loading state initially', () => {
    renderWithRouter(<FeatureCard featureType="forms" />);

    expect(
      screen.getByTestId('feature-card-forms-loading')
    ).toBeInTheDocument();
    expect(screen.getByTestId('feature-card-forms-loading')).toHaveClass(
      'animate-pulse'
    );
  });

  it('displays forms feature content after loading', async () => {
    renderWithRouter(<FeatureCard featureType="forms" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-forms')).toBeInTheDocument();
    });

    expect(screen.getByTestId('feature-title-forms')).toHaveTextContent(
      'Form Testing'
    );
    expect(screen.getByTestId('feature-description-forms')).toHaveTextContent(
      'Test various form types including validation, file uploads, and complex input scenarios.'
    );
    expect(screen.getByTestId('feature-cta-forms')).toHaveAttribute(
      'href',
      '/forms'
    );
  });

  it('displays api feature content after loading', async () => {
    renderWithRouter(<FeatureCard featureType="api" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-api')).toBeInTheDocument();
    });

    expect(screen.getByTestId('feature-title-api')).toHaveTextContent(
      'API Testing'
    );
    expect(screen.getByTestId('feature-description-api')).toHaveTextContent(
      'Comprehensive REST API endpoints for testing CRUD operations, authentication, and error handling.'
    );
    expect(screen.getByTestId('feature-cta-api')).toHaveAttribute(
      'href',
      '/api-testing'
    );
  });

  it('displays data feature content after loading', async () => {
    renderWithRouter(<FeatureCard featureType="data" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-data')).toBeInTheDocument();
    });

    expect(screen.getByTestId('feature-title-data')).toHaveTextContent(
      'Data Tables'
    );
    expect(screen.getByTestId('feature-description-data')).toHaveTextContent(
      'Interactive data tables with sorting, filtering, pagination, and real-time updates.'
    );
    expect(screen.getByTestId('feature-cta-data')).toHaveAttribute(
      'href',
      '/data-table'
    );
  });

  it('displays ui feature content after loading', async () => {
    renderWithRouter(<FeatureCard featureType="ui" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-ui')).toBeInTheDocument();
    });

    expect(screen.getByTestId('feature-title-ui')).toHaveTextContent(
      'UI Components'
    );
    expect(screen.getByTestId('feature-description-ui')).toHaveTextContent(
      'Rich interactive components including modals, tooltips, carousels, and accordions.'
    );
    expect(screen.getByTestId('feature-cta-ui')).toHaveAttribute(
      'href',
      '/ui-components'
    );
  });

  it('applies custom className', () => {
    const customClass = 'custom-feature-class';
    renderWithRouter(
      <FeatureCard featureType="forms" className={customClass} />
    );

    const featureElement = screen.getByTestId('feature-card-forms-loading');
    expect(featureElement).toHaveClass(customClass);
  });

  it('respects delay prop', async () => {
    const delay = 500;
    renderWithRouter(<FeatureCard featureType="forms" delay={delay} />);

    // Should still be loading before delay
    vi.advanceTimersByTime(delay - 100);
    expect(
      screen.getByTestId('feature-card-forms-loading')
    ).toBeInTheDocument();

    // Should be loaded after delay + random time
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-forms')).toBeInTheDocument();
    });
  });

  it('displays stats when loaded', async () => {
    renderWithRouter(<FeatureCard featureType="forms" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-stats-forms')).toBeInTheDocument();
    });

    const statsElement = screen.getByTestId('feature-stats-forms');
    expect(statsElement).toHaveTextContent('Form Types');
    expect(statsElement).toHaveTextContent('12+');
  });

  it('shows error state for unknown feature type', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<FeatureCard featureType="unknown" as any />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(
        screen.getByTestId('feature-card-unknown-error')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load feature')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('has proper hover effects', async () => {
    renderWithRouter(<FeatureCard featureType="forms" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-forms')).toBeInTheDocument();
    });

    const featureCard = screen.getByTestId('feature-card-forms');
    expect(featureCard).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
  });

  it('displays proper icon for each feature type', async () => {
    const featureTypes = ['forms', 'api', 'data', 'ui'] as const;

    for (const featureType of featureTypes) {
      const { unmount } = renderWithRouter(
        <FeatureCard featureType={featureType} />
      );

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(
          screen.getByTestId(`feature-icon-${featureType}`)
        ).toBeInTheDocument();
      });

      const icon = screen.getByTestId(`feature-icon-${featureType}`);
      expect(icon).toHaveClass('text-blue-600', 'dark:text-blue-400');

      unmount();
    }
  });

  it('has proper accessibility attributes', async () => {
    renderWithRouter(<FeatureCard featureType="forms" />);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-cta-forms')).toBeInTheDocument();
    });

    const ctaButton = screen.getByTestId('feature-cta-forms');
    expect(ctaButton).toHaveAttribute('aria-label', 'Explore Form Testing');
  });

  it('displays correct stats for each feature type', async () => {
    const expectedStats = {
      forms: { label: 'Form Types', value: '12+' },
      api: { label: 'Endpoints', value: '25+' },
      data: { label: 'Sample Records', value: '1000+' },
      ui: { label: 'Components', value: '15+' },
    };

    for (const [featureType, expectedStat] of Object.entries(expectedStats)) {
      const { unmount } = renderWithRouter(
        <FeatureCard featureType={featureType as any} />
      );

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(
          screen.getByTestId(`feature-stats-${featureType}`)
        ).toBeInTheDocument();
      });

      const statsElement = screen.getByTestId(`feature-stats-${featureType}`);
      expect(statsElement).toHaveTextContent(expectedStat.label);
      expect(statsElement).toHaveTextContent(expectedStat.value);

      unmount();
    }
  });

  it('has proper loading skeleton structure', () => {
    renderWithRouter(<FeatureCard featureType="forms" />);

    const loadingElement = screen.getByTestId('feature-card-forms-loading');

    // Check for skeleton elements
    expect(loadingElement.querySelector('.w-12.h-12')).toBeInTheDocument(); // Icon skeleton
    expect(loadingElement.querySelector('.h-6')).toBeInTheDocument(); // Title skeleton
    expect(loadingElement.querySelector('.h-4')).toBeInTheDocument(); // Description skeleton
    expect(loadingElement.querySelector('.h-10')).toBeInTheDocument(); // Button skeleton
  });

  it('handles multiple feature cards with different delays', async () => {
    const { rerender } = renderWithRouter(
      <FeatureCard featureType="forms" delay={100} />
    );

    // First card should be loading
    expect(
      screen.getByTestId('feature-card-forms-loading')
    ).toBeInTheDocument();

    // Rerender with different feature type and delay
    rerender(
      <BrowserRouter>
        <FeatureCard featureType="api" delay={200} />
      </BrowserRouter>
    );

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('feature-card-api')).toBeInTheDocument();
    });
  });
});

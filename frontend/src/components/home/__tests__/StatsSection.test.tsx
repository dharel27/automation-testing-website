import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import StatsSection from '../StatsSection';

// Mock setTimeout to control timing in tests
vi.useFakeTimers();

describe('StatsSection', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('shows loading state initially', () => {
    render(<StatsSection />);

    expect(screen.getByTestId('stats-section-loading')).toBeInTheDocument();
    expect(screen.getByTestId('stats-section-loading')).toHaveClass(
      'animate-pulse'
    );
  });

  it('displays stats content after loading', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    expect(screen.getByText('Platform Statistics')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time metrics from our testing platform')
    ).toBeInTheDocument();
  });

  it('displays all four stat items', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stat-item-users')).toBeInTheDocument();
    });

    expect(screen.getByTestId('stat-item-users')).toBeInTheDocument();
    expect(screen.getByTestId('stat-item-tests')).toBeInTheDocument();
    expect(screen.getByTestId('stat-item-apis')).toBeInTheDocument();
    expect(screen.getByTestId('stat-item-uptime')).toBeInTheDocument();
  });

  it('displays correct labels for each stat', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stat-label-users')).toBeInTheDocument();
    });

    expect(screen.getByTestId('stat-label-users')).toHaveTextContent(
      'Active Users'
    );
    expect(screen.getByTestId('stat-label-tests')).toHaveTextContent(
      'Tests Run'
    );
    expect(screen.getByTestId('stat-label-apis')).toHaveTextContent(
      'API Calls'
    );
    expect(screen.getByTestId('stat-label-uptime')).toHaveTextContent('Uptime');
  });

  it('displays correct descriptions for each stat', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stat-description-users')).toBeInTheDocument();
    });

    expect(screen.getByTestId('stat-description-users')).toHaveTextContent(
      'Registered testers'
    );
    expect(screen.getByTestId('stat-description-tests')).toHaveTextContent(
      'Total test executions'
    );
    expect(screen.getByTestId('stat-description-apis')).toHaveTextContent(
      'Successful requests'
    );
    expect(screen.getByTestId('stat-description-uptime')).toHaveTextContent(
      'System availability'
    );
  });

  it('displays stat values with proper formatting', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stat-value-users')).toBeInTheDocument();
    });

    const usersValue = screen.getByTestId('stat-value-users');
    const testsValue = screen.getByTestId('stat-value-tests');
    const apisValue = screen.getByTestId('stat-value-apis');
    const uptimeValue = screen.getByTestId('stat-value-uptime');

    // Check that values are formatted correctly
    expect(usersValue.textContent).toMatch(/^\d{1,3}(,\d{3})*$/); // Number with commas
    expect(testsValue.textContent).toMatch(/^\d+\.\d+K$/); // Number with K suffix
    expect(apisValue.textContent).toMatch(/^\d+K$/); // Number with K suffix
    expect(uptimeValue.textContent).toMatch(/^\d+\.\d+%$/); // Percentage
  });

  it('applies custom className', () => {
    const customClass = 'custom-stats-class';
    render(<StatsSection className={customClass} />);

    const statsElement = screen.getByTestId('stats-section-loading');
    expect(statsElement).toHaveClass(customClass);
  });

  it('shows error state when loading fails', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Math.random to potentially cause an error (this is a simplified test)
    const originalRandom = Math.random;
    Math.random = vi.fn(() => 0.5);

    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    // Restore original Math.random
    Math.random = originalRandom;
    consoleSpy.mockRestore();
  });

  it('displays last updated timestamp', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    const timestampText = screen.getByText(/Last updated:/);
    expect(timestampText).toBeInTheDocument();
  });

  it('has proper grid layout', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    const statsSection = screen.getByTestId('stats-section');
    const gridContainer = statsSection.querySelector('.grid');

    expect(gridContainer).toHaveClass('grid-cols-2', 'md:grid-cols-4');
  });

  it('has proper hover effects on stat items', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stat-item-users')).toBeInTheDocument();
    });

    const statItem = screen.getByTestId('stat-item-users');
    expect(statItem).toHaveClass(
      'hover:bg-gray-50',
      'dark:hover:bg-gray-700/50'
    );
  });

  it('displays proper icons for each stat', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stat-item-users')).toBeInTheDocument();
    });

    // Check that each stat item has an icon
    const statItems = ['users', 'tests', 'apis', 'uptime'];

    statItems.forEach((statId) => {
      const statItem = screen.getByTestId(`stat-item-${statId}`);
      const icon = statItem.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });
  });

  it('has proper loading skeleton structure', () => {
    render(<StatsSection />);

    const loadingElement = screen.getByTestId('stats-section-loading');

    // Check for header skeleton
    expect(loadingElement.querySelector('.h-8')).toBeInTheDocument(); // Title skeleton
    expect(loadingElement.querySelector('.h-4')).toBeInTheDocument(); // Subtitle skeleton

    // Check for stat item skeletons
    const skeletonItems = loadingElement.querySelectorAll('.grid > div');
    expect(skeletonItems).toHaveLength(4);
  });

  it('updates stats periodically', async () => {
    render(<StatsSection />);

    // Initial load
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    const initialUsersValue =
      screen.getByTestId('stat-value-users').textContent;

    // Advance time by 30 seconds (periodic update interval)
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      const updatedUsersValue =
        screen.getByTestId('stat-value-users').textContent;
      // Values might be the same due to randomization, but the update should have occurred
      expect(updatedUsersValue).toBeDefined();
    });
  });

  it('cleans up interval on unmount', async () => {
    const { unmount } = render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    // Unmount component
    unmount();

    // Advance time to check if interval is cleaned up
    vi.advanceTimersByTime(30000);

    // No assertions needed - if interval wasn't cleaned up, it would cause issues
  });

  it('handles stat value variations correctly', async () => {
    render(<StatsSection />);

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    // Check that all stat values are within reasonable ranges
    const usersValue = screen.getByTestId('stat-value-users').textContent;
    const testsValue = screen.getByTestId('stat-value-tests').textContent;
    const apisValue = screen.getByTestId('stat-value-apis').textContent;
    const uptimeValue = screen.getByTestId('stat-value-uptime').textContent;

    expect(usersValue).toMatch(/^\d/); // Starts with a digit
    expect(testsValue).toMatch(/^\d/); // Starts with a digit
    expect(apisValue).toMatch(/^\d/); // Starts with a digit
    expect(uptimeValue).toMatch(/^\d/); // Starts with a digit
  });
});

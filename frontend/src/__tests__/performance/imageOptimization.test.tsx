import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import OptimizedImage from '../../components/ui/OptimizedImage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Image Optimization Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render optimized image with WebP support', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        data-testid="test-image"
      />
    );

    const picture = screen.getByTestId('test-image');
    expect(picture).toBeInTheDocument();

    // Should have WebP source
    const webpSource = picture.querySelector('source[type="image/webp"]');
    expect(webpSource).toBeInTheDocument();
    expect(webpSource?.getAttribute('srcset')).toBe('/test-image.webp');

    // Should have fallback img
    const img = screen.getByTestId('test-image-img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('/test-image.jpg');
  });

  it('should implement lazy loading with intersection observer', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        loading="lazy"
        data-testid="lazy-image"
      />
    );

    // Should show placeholder initially
    expect(screen.getByTestId('lazy-image-placeholder')).toBeInTheDocument();

    // Should set up intersection observer
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('should show loading state before image loads', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        loading="eager"
        placeholder="Loading..."
        data-testid="loading-image"
      />
    );

    // Should show loading placeholder
    expect(screen.getByTestId('loading-image-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle image load success', async () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        loading="eager"
        data-testid="success-image"
      />
    );

    const img = screen.getByTestId('success-image-img');

    // Simulate image load
    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveClass('opacity-100');
    });
  });

  it('should handle image load error with fallback', async () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        fallback="/fallback-image.jpg"
        loading="eager"
        data-testid="error-image"
      />
    );

    const img = screen.getByTestId('error-image-img');

    // Simulate image error
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByTestId('error-image-error')).toBeInTheDocument();
    });

    // Should use fallback src
    expect(img.getAttribute('src')).toBe('/fallback-image.jpg');
  });

  it('should support AVIF format', () => {
    render(
      <OptimizedImage
        src="/test-image.avif"
        alt="Test image"
        data-testid="avif-image"
      />
    );

    const picture = screen.getByTestId('avif-image');
    const avifSource = picture.querySelector('source[type="image/avif"]');

    expect(avifSource).toBeInTheDocument();
    expect(avifSource?.getAttribute('srcset')).toBe('/test-image.avif');
  });

  it('should call onLoad and onError callbacks', async () => {
    const onLoad = vi.fn();
    const onError = vi.fn();

    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        loading="eager"
        onLoad={onLoad}
        onError={onError}
        data-testid="callback-image"
      />
    );

    const img = screen.getByTestId('callback-image-img');

    // Test onLoad callback
    fireEvent.load(img);
    expect(onLoad).toHaveBeenCalled();

    // Test onError callback
    fireEvent.error(img);
    expect(onError).toHaveBeenCalled();
  });

  it('should handle custom dimensions', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        loading="eager"
        data-testid="sized-image"
      />
    );

    const img = screen.getByTestId('sized-image-img');
    expect(img.getAttribute('width')).toBe('300');
    expect(img.getAttribute('height')).toBe('200');
  });

  it('should preserve WebP and AVIF extensions', () => {
    render(
      <OptimizedImage
        src="/test-image.webp"
        alt="Test image"
        data-testid="webp-image"
      />
    );

    const picture = screen.getByTestId('webp-image');
    const webpSource = picture.querySelector('source[type="image/webp"]');

    // Should not double-convert WebP
    expect(webpSource?.getAttribute('srcset')).toBe('/test-image.webp');
  });

  it('should handle intersection observer trigger', () => {
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    mockIntersectionObserver.mockReturnValue({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: mockDisconnect,
    });

    const { unmount } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        loading="lazy"
        data-testid="observer-image"
      />
    );

    expect(mockObserve).toHaveBeenCalled();

    // Should disconnect on unmount
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});

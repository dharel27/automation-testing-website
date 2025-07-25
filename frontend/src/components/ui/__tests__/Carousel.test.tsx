import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Carousel } from '../Carousel';

describe('Carousel', () => {
  const defaultItems = [
    {
      id: 'slide1',
      content: <div>Slide 1 Content</div>,
      alt: 'First slide',
    },
    {
      id: 'slide2',
      content: <div>Slide 2 Content</div>,
      alt: 'Second slide',
    },
    {
      id: 'slide3',
      content: <div>Slide 3 Content</div>,
      alt: 'Third slide',
    },
  ];

  const defaultProps = {
    items: defaultItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders carousel with all slides', () => {
    render(<Carousel {...defaultProps} />);

    expect(screen.getByTestId('carousel')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-slide-0')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-slide-1')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-slide-2')).toBeInTheDocument();
  });

  it('shows first slide by default', () => {
    render(<Carousel {...defaultProps} />);

    const firstSlide = screen.getByTestId('carousel-slide-0');
    const secondSlide = screen.getByTestId('carousel-slide-1');

    expect(firstSlide).toHaveClass('opacity-100');
    expect(secondSlide).toHaveClass('opacity-0');
  });

  it('navigates to next slide with next button', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} />);

    const nextButton = screen.getByTestId('carousel-next-button');
    await user.click(nextButton);

    const firstSlide = screen.getByTestId('carousel-slide-0');
    const secondSlide = screen.getByTestId('carousel-slide-1');

    expect(firstSlide).toHaveClass('opacity-0');
    expect(secondSlide).toHaveClass('opacity-100');
  });

  it('navigates to previous slide with prev button', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} />);

    // First go to second slide
    const nextButton = screen.getByTestId('carousel-next-button');
    await user.click(nextButton);

    // Then go back to first slide
    const prevButton = screen.getByTestId('carousel-prev-button');
    await user.click(prevButton);

    const firstSlide = screen.getByTestId('carousel-slide-0');
    const secondSlide = screen.getByTestId('carousel-slide-1');

    expect(firstSlide).toHaveClass('opacity-100');
    expect(secondSlide).toHaveClass('opacity-0');
  });

  it('navigates with dot indicators', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} />);

    const thirdDot = screen.getByTestId('carousel-dot-2');
    await user.click(thirdDot);

    const firstSlide = screen.getByTestId('carousel-slide-0');
    const thirdSlide = screen.getByTestId('carousel-slide-2');

    expect(firstSlide).toHaveClass('opacity-0');
    expect(thirdSlide).toHaveClass('opacity-100');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} />);

    const carousel = screen.getByTestId('carousel');
    carousel.focus();

    // Arrow right should go to next slide
    await user.keyboard('{ArrowRight}');

    const firstSlide = screen.getByTestId('carousel-slide-0');
    const secondSlide = screen.getByTestId('carousel-slide-1');

    expect(firstSlide).toHaveClass('opacity-0');
    expect(secondSlide).toHaveClass('opacity-100');

    // Arrow left should go to previous slide
    await user.keyboard('{ArrowLeft}');

    expect(firstSlide).toHaveClass('opacity-100');
    expect(secondSlide).toHaveClass('opacity-0');
  });

  it('handles Home and End keys', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} />);

    const carousel = screen.getByTestId('carousel');
    carousel.focus();

    // Go to second slide first
    await user.keyboard('{ArrowRight}');

    // Home should go to first slide
    await user.keyboard('{Home}');

    const firstSlide = screen.getByTestId('carousel-slide-0');
    expect(firstSlide).toHaveClass('opacity-100');

    // End should go to last slide
    await user.keyboard('{End}');

    const lastSlide = screen.getByTestId('carousel-slide-2');
    expect(lastSlide).toHaveClass('opacity-100');
  });

  it('wraps around when infinite is true', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} infinite={true} />);

    const nextButton = screen.getByTestId('carousel-next-button');

    // Go to last slide
    await user.click(nextButton);
    await user.click(nextButton);

    const lastSlide = screen.getByTestId('carousel-slide-2');
    expect(lastSlide).toHaveClass('opacity-100');

    // Next should wrap to first slide
    await user.click(nextButton);

    const firstSlide = screen.getByTestId('carousel-slide-0');
    expect(firstSlide).toHaveClass('opacity-100');
  });

  it('does not wrap around when infinite is false', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} infinite={false} />);

    const nextButton = screen.getByTestId('carousel-next-button');
    const prevButton = screen.getByTestId('carousel-prev-button');

    // Previous button should be disabled on first slide
    expect(prevButton).toBeDisabled();

    // Go to last slide
    await user.click(nextButton);
    await user.click(nextButton);

    // Next button should be disabled on last slide
    expect(nextButton).toBeDisabled();
  });

  it('starts autoplay when autoPlay is true', () => {
    render(
      <Carousel {...defaultProps} autoPlay={true} autoPlayInterval={1000} />
    );

    const firstSlide = screen.getByTestId('carousel-slide-0');
    expect(firstSlide).toHaveClass('opacity-100');

    // Fast-forward past the interval
    vi.advanceTimersByTime(1000);

    const secondSlide = screen.getByTestId('carousel-slide-1');
    expect(secondSlide).toHaveClass('opacity-100');
  });

  it('stops autoplay on mouse enter and resumes on mouse leave', async () => {
    const user = userEvent.setup();
    render(
      <Carousel {...defaultProps} autoPlay={true} autoPlayInterval={1000} />
    );

    const carousel = screen.getByTestId('carousel');

    // Mouse enter should stop autoplay
    await user.hover(carousel);

    vi.advanceTimersByTime(1000);

    const firstSlide = screen.getByTestId('carousel-slide-0');
    expect(firstSlide).toHaveClass('opacity-100'); // Should still be on first slide

    // Mouse leave should resume autoplay
    await user.unhover(carousel);

    vi.advanceTimersByTime(1000);

    const secondSlide = screen.getByTestId('carousel-slide-1');
    expect(secondSlide).toHaveClass('opacity-100');
  });

  it('toggles autoplay with play/pause button', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} autoPlay={true} />);

    const playPauseButton = screen.getByTestId('carousel-play-pause-button');

    // Should start playing
    expect(playPauseButton).toHaveAttribute('aria-label', 'Pause slideshow');

    // Click to pause
    await user.click(playPauseButton);
    expect(playPauseButton).toHaveAttribute('aria-label', 'Play slideshow');

    // Click to play
    await user.click(playPauseButton);
    expect(playPauseButton).toHaveAttribute('aria-label', 'Pause slideshow');
  });

  it('toggles autoplay with spacebar', async () => {
    const user = userEvent.setup();
    render(<Carousel {...defaultProps} autoPlay={true} />);

    const carousel = screen.getByTestId('carousel');
    carousel.focus();

    const playPauseButton = screen.getByTestId('carousel-play-pause-button');

    // Space should toggle autoplay
    await user.keyboard(' ');
    expect(playPauseButton).toHaveAttribute('aria-label', 'Play slideshow');

    await user.keyboard(' ');
    expect(playPauseButton).toHaveAttribute('aria-label', 'Pause slideshow');
  });

  it('handles touch/swipe gestures', () => {
    render(<Carousel {...defaultProps} />);

    const content = screen.getByTestId('carousel-content');

    // Simulate swipe left (next slide)
    fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 40 }] }); // 60px difference

    const secondSlide = screen.getByTestId('carousel-slide-1');
    expect(secondSlide).toHaveClass('opacity-100');
  });

  it('handles mouse drag gestures', () => {
    render(<Carousel {...defaultProps} />);

    const content = screen.getByTestId('carousel-content');

    // Simulate drag left (next slide)
    fireEvent.mouseDown(content, { clientX: 100 });
    fireEvent.mouseMove(content, { clientX: 40 }); // 60px difference

    const secondSlide = screen.getByTestId('carousel-slide-1');
    expect(secondSlide).toHaveClass('opacity-100');
  });

  it('hides arrows when showArrows is false', () => {
    render(<Carousel {...defaultProps} showArrows={false} />);

    expect(
      screen.queryByTestId('carousel-prev-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('carousel-next-button')
    ).not.toBeInTheDocument();
  });

  it('hides dots when showDots is false', () => {
    render(<Carousel {...defaultProps} showDots={false} />);

    expect(screen.queryByTestId('carousel-dots')).not.toBeInTheDocument();
  });

  it('does not show navigation for single item', () => {
    const singleItem = [{ id: 'slide1', content: <div>Single slide</div> }];
    render(<Carousel items={singleItem} />);

    expect(
      screen.queryByTestId('carousel-prev-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('carousel-next-button')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('carousel-dots')).not.toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(<Carousel items={[]} />);

    expect(screen.getByText('No items to display')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<Carousel {...defaultProps} />);

    const carousel = screen.getByTestId('carousel');
    expect(carousel).toHaveAttribute('role', 'region');
    expect(carousel).toHaveAttribute('aria-label', 'Image carousel');
    expect(carousel).toHaveAttribute('aria-live', 'polite');
    expect(carousel).toHaveAttribute('tabIndex', '0');
  });

  it('announces current slide to screen readers', () => {
    render(<Carousel {...defaultProps} />);

    expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument();
  });

  it('uses custom data-testid', () => {
    render(<Carousel {...defaultProps} data-testid="custom-carousel" />);

    expect(screen.getByTestId('custom-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('custom-carousel-content')).toBeInTheDocument();
    expect(screen.getByTestId('custom-carousel-slide-0')).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-carousel-prev-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('custom-carousel-next-button')
    ).toBeInTheDocument();
    expect(screen.getByTestId('custom-carousel-dots')).toBeInTheDocument();
    expect(screen.getByTestId('custom-carousel-dot-0')).toBeInTheDocument();
  });

  it('cleans up intervals on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = render(<Carousel {...defaultProps} autoPlay={true} />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});

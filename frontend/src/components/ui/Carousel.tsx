import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface CarouselItem {
  id: string;
  content: React.ReactNode;
  alt?: string;
}

export interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  infinite?: boolean;
  'data-testid'?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  infinite = true,
  'data-testid': testId = 'carousel',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (infinite) {
        setCurrentIndex((index + items.length) % items.length);
      } else {
        setCurrentIndex(Math.max(0, Math.min(index, items.length - 1)));
      }
    },
    [items.length, infinite]
  );

  const goToNext = useCallback(() => {
    if (infinite || currentIndex < items.length - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, items.length, infinite, goToSlide]);

  const goToPrevious = useCallback(() => {
    if (infinite || currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, infinite, goToSlide]);

  const startAutoPlay = useCallback(() => {
    if (autoPlay && items.length > 1) {
      intervalRef.current = setInterval(goToNext, autoPlayInterval);
      setIsPlaying(true);
    }
  }, [autoPlay, items.length, goToNext, autoPlayInterval]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsPlaying(false);
  }, []);

  const toggleAutoPlay = () => {
    if (isPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay) {
      startAutoPlay();
    }

    return () => {
      stopAutoPlay();
    };
  }, [autoPlay, startAutoPlay, stopAutoPlay]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case 'Home':
        event.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        goToSlide(items.length - 1);
        break;
      case ' ':
        event.preventDefault();
        toggleAutoPlay();
        break;
    }
  };

  // Touch/Mouse events for swipe functionality
  const handleTouchStart = (event: React.TouchEvent) => {
    startX.current = event.touches[0].clientX;
    isDragging.current = true;
    stopAutoPlay();
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    startX.current = event.clientX;
    isDragging.current = true;
    stopAutoPlay();
    event.preventDefault();
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = event.touches[0].clientX;
    const diffX = startX.current - currentX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
      isDragging.current = false;
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging.current) return;

    const currentX = event.clientX;
    const diffX = startX.current - currentX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
      isDragging.current = false;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (autoPlay) {
      startAutoPlay();
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (autoPlay) {
      startAutoPlay();
    }
  };

  if (items.length === 0) {
    return <div data-testid={testId}>No items to display</div>;
  }

  return (
    <div
      ref={carouselRef}
      className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
      onKeyDown={handleKeyDown}
      onMouseEnter={stopAutoPlay}
      onMouseLeave={() => autoPlay && startAutoPlay()}
      tabIndex={0}
      role="region"
      aria-label="Image carousel"
      aria-live="polite"
      data-testid={testId}
    >
      {/* Main content area */}
      <div
        className="relative h-64 md:h-96 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid={`${testId}-content`}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== currentIndex}
            data-testid={`${testId}-slide-${index}`}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white ${
              !infinite && currentIndex === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            onClick={goToPrevious}
            disabled={!infinite && currentIndex === 0}
            aria-label="Previous slide"
            data-testid={`${testId}-prev-button`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white ${
              !infinite && currentIndex === items.length - 1
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            onClick={goToNext}
            disabled={!infinite && currentIndex === items.length - 1}
            aria-label="Next slide"
            data-testid={`${testId}-next-button`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && items.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
          data-testid={`${testId}-dots`}
        >
          {items.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`${testId}-dot-${index}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause button for auto-play */}
      {autoPlay && (
        <button
          className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={toggleAutoPlay}
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          data-testid={`${testId}-play-pause-button`}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {currentIndex + 1} of {items.length}
      </div>
    </div>
  );
};

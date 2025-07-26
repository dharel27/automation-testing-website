/**
 * Accessibility utilities for focus management and keyboard navigation
 */

export interface FocusableElement extends HTMLElement {
  focus(): void;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(
  container: HTMLElement
): FocusableElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(
    container.querySelectorAll(focusableSelectors)
  ) as FocusableElement[];
}

/**
 * Trap focus within a container (useful for modals, dropdowns)
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * Focus management for single page applications
 */
export class FocusManager {
  private static instance: FocusManager;
  private focusHistory: HTMLElement[] = [];
  private skipLinks: HTMLElement[] = [];

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  /**
   * Save current focus to history
   */
  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement);
    }
  }

  /**
   * Restore focus from history
   */
  restoreFocus(): void {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  /**
   * Focus the main content area (skip navigation)
   */
  focusMainContent(): void {
    const mainContent = document.querySelector(
      'main, [role="main"], #main-content'
    );
    if (mainContent) {
      (mainContent as HTMLElement).focus();
    }
  }

  /**
   * Set focus to the first heading in the main content
   */
  focusFirstHeading(): void {
    const mainContent = document.querySelector(
      'main, [role="main"], #main-content'
    );
    if (mainContent) {
      const firstHeading = mainContent.querySelector('h1, h2, h3, h4, h5, h6');
      if (firstHeading) {
        (firstHeading as HTMLElement).setAttribute('tabindex', '-1');
        (firstHeading as HTMLElement).focus();
      }
    }
  }

  /**
   * Register skip links for keyboard navigation
   */
  registerSkipLink(element: HTMLElement): void {
    this.skipLinks.push(element);
  }

  /**
   * Handle skip link activation
   */
  handleSkipLink(targetId: string): void {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate ARIA label for interactive elements
 */
export function getAriaLabel(element: HTMLElement, fallback?: string): string {
  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title') ||
    (element as HTMLInputElement).placeholder ||
    element.textContent?.trim() ||
    fallback ||
    'Interactive element'
  );
}

/**
 * Keyboard navigation handler for custom components
 */
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }
): void {
  const { key } = event;

  switch (key) {
    case 'Enter':
      if (options.onEnter) {
        event.preventDefault();
        options.onEnter();
      }
      break;
    case ' ':
    case 'Space':
      if (options.onSpace) {
        event.preventDefault();
        options.onSpace();
      }
      break;
    case 'Escape':
      if (options.onEscape) {
        event.preventDefault();
        options.onEscape();
      }
      break;
    case 'ArrowUp':
      if (options.onArrowUp) {
        event.preventDefault();
        options.onArrowUp();
      }
      break;
    case 'ArrowDown':
      if (options.onArrowDown) {
        event.preventDefault();
        options.onArrowDown();
      }
      break;
    case 'ArrowLeft':
      if (options.onArrowLeft) {
        event.preventDefault();
        options.onArrowLeft();
      }
      break;
    case 'ArrowRight':
      if (options.onArrowRight) {
        event.preventDefault();
        options.onArrowRight();
      }
      break;
    case 'Home':
      if (options.onHome) {
        event.preventDefault();
        options.onHome();
      }
      break;
    case 'End':
      if (options.onEnd) {
        event.preventDefault();
        options.onEnd();
      }
      break;
  }
}

/**
 * Create a unique ID for accessibility purposes
 */
export function createAccessibleId(prefix: string = 'accessible'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

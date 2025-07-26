/**
 * Accessibility testing setup and utilities
 */

import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Configure testing library for better accessibility testing
configure({
  // Use accessible queries by default
  defaultHidden: false,
  // Increase timeout for accessibility tests
  asyncUtilTimeout: 5000,
});

// Mock window.matchMedia for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock focus method
HTMLElement.prototype.focus = jest.fn();

// Mock blur method
HTMLElement.prototype.blur = jest.fn();

// Accessibility testing utilities
export const accessibilityTestUtils = {
  /**
   * Check if element has proper ARIA attributes
   */
  hasProperAriaAttributes: (element: HTMLElement) => {
    const requiredAttributes = [
      'role',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
    ];
    const hasAtLeastOne = requiredAttributes.some((attr) =>
      element.hasAttribute(attr)
    );
    return hasAtLeastOne;
  },

  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = [
      'BUTTON',
      'A',
      'INPUT',
      'SELECT',
      'TEXTAREA',
    ].includes(element.tagName);
    const hasTabIndex = tabIndex !== null && tabIndex !== '-1';

    return isInteractive || hasTabIndex;
  },

  /**
   * Check if element has sufficient color contrast
   */
  hasSufficientContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // This is a simplified check - in real implementation,
    // you would calculate the actual contrast ratio
    return color !== backgroundColor;
  },

  /**
   * Check if form element has proper labeling
   */
  hasProperLabeling: (
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ) => {
    const id = element.id;
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');

    if (ariaLabel || ariaLabelledBy) return true;

    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      return label !== null;
    }

    // Check if wrapped in label
    const parentLabel = element.closest('label');
    return parentLabel !== null;
  },

  /**
   * Check if heading structure is logical
   */
  hasLogicalHeadingStructure: (container: HTMLElement) => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map((h) =>
      parseInt(h.tagName.charAt(1))
    );

    if (levels.length === 0) return true;

    // Should start with h1
    if (levels[0] !== 1) return false;

    // Check for logical progression
    for (let i = 1; i < levels.length; i++) {
      const current = levels[i];
      const previous = levels[i - 1];

      // Can't skip more than one level
      if (current > previous + 1) return false;
    }

    return true;
  },

  /**
   * Check if images have alt text
   */
  imagesHaveAltText: (container: HTMLElement) => {
    const images = container.querySelectorAll('img');
    return Array.from(images).every(
      (img) => img.hasAttribute('alt') || img.hasAttribute('aria-hidden')
    );
  },

  /**
   * Check if links have descriptive text
   */
  linksHaveDescriptiveText: (container: HTMLElement) => {
    const links = container.querySelectorAll('a[href]');
    return Array.from(links).every((link) => {
      const text = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const ariaLabelledBy = link.getAttribute('aria-labelledby');

      return (text && text.length > 0) || ariaLabel || ariaLabelledBy;
    });
  },

  /**
   * Check if buttons have accessible names
   */
  buttonsHaveAccessibleNames: (container: HTMLElement) => {
    const buttons = container.querySelectorAll('button, [role="button"]');
    return Array.from(buttons).every((button) => {
      const text = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');

      return (text && text.length > 0) || ariaLabel || ariaLabelledBy;
    });
  },

  /**
   * Check if tables have proper headers
   */
  tablesHaveProperHeaders: (container: HTMLElement) => {
    const tables = container.querySelectorAll('table');
    return Array.from(tables).every((table) => {
      const headers = table.querySelectorAll('th');
      const hasHeaders = headers.length > 0;

      if (!hasHeaders) return false;

      // Check if headers have scope or id attributes
      return Array.from(headers).every(
        (th) => th.hasAttribute('scope') || th.hasAttribute('id')
      );
    });
  },

  /**
   * Check if form has proper structure
   */
  formHasProperStructure: (form: HTMLFormElement) => {
    const inputs = form.querySelectorAll('input, select, textarea');
    const hasProperLabeling = Array.from(inputs).every((input) =>
      accessibilityTestUtils.hasProperLabeling(input as HTMLInputElement)
    );

    const requiredInputs = form.querySelectorAll('[required]');
    const requiredHaveAriaRequired = Array.from(requiredInputs).every(
      (input) => input.getAttribute('aria-required') === 'true'
    );

    return hasProperLabeling && requiredHaveAriaRequired;
  },

  /**
   * Check if modal has proper focus management
   */
  modalHasProperFocusManagement: (modal: HTMLElement) => {
    const hasRole = modal.getAttribute('role') === 'dialog';
    const hasAriaModal = modal.getAttribute('aria-modal') === 'true';
    const hasAriaLabel =
      modal.hasAttribute('aria-label') || modal.hasAttribute('aria-labelledby');
    const isFocusable = modal.getAttribute('tabindex') === '-1';

    return hasRole && hasAriaModal && hasAriaLabel && isFocusable;
  },

  /**
   * Check if navigation has proper landmarks
   */
  navigationHasProperLandmarks: (container: HTMLElement) => {
    const nav = container.querySelector('nav, [role="navigation"]');
    const main = container.querySelector('main, [role="main"]');
    const header = container.querySelector('header, [role="banner"]');
    const footer = container.querySelector('footer, [role="contentinfo"]');

    return {
      hasNavigation: nav !== null,
      hasMain: main !== null,
      hasHeader: header !== null,
      hasFooter: footer !== null,
    };
  },
};

// Custom matchers for accessibility testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveProperAriaAttributes(): R;
      toBeKeyboardAccessible(): R;
      toHaveProperLabeling(): R;
    }
  }
}

// Implement custom matchers
expect.extend({
  toBeAccessible(received: HTMLElement) {
    const checks = [
      accessibilityTestUtils.hasLogicalHeadingStructure(received),
      accessibilityTestUtils.imagesHaveAltText(received),
      accessibilityTestUtils.linksHaveDescriptiveText(received),
      accessibilityTestUtils.buttonsHaveAccessibleNames(received),
      accessibilityTestUtils.tablesHaveProperHeaders(received),
    ];

    const pass = checks.every((check) => check);

    return {
      message: () =>
        pass
          ? `Expected element not to be accessible`
          : `Expected element to be accessible`,
      pass,
    };
  },

  toHaveProperAriaAttributes(received: HTMLElement) {
    const pass = accessibilityTestUtils.hasProperAriaAttributes(received);

    return {
      message: () =>
        pass
          ? `Expected element not to have proper ARIA attributes`
          : `Expected element to have proper ARIA attributes`,
      pass,
    };
  },

  toBeKeyboardAccessible(received: HTMLElement) {
    const pass = accessibilityTestUtils.isKeyboardAccessible(received);

    return {
      message: () =>
        pass
          ? `Expected element not to be keyboard accessible`
          : `Expected element to be keyboard accessible`,
      pass,
    };
  },

  toHaveProperLabeling(
    received: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ) {
    const pass = accessibilityTestUtils.hasProperLabeling(received);

    return {
      message: () =>
        pass
          ? `Expected form element not to have proper labeling`
          : `Expected form element to have proper labeling`,
      pass,
    };
  },
});

export default accessibilityTestUtils;

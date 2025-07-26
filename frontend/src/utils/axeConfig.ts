/**
 * Axe-core configuration for accessibility testing
 */

import { configureAxe } from '@axe-core/react';

// Configure axe-core for development
if (process.env.NODE_ENV !== 'production') {
  configureAxe({
    // Run accessibility checks
    rules: {
      // Enable all WCAG 2.1 AA rules
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-roles': { enabled: true },
      'button-name': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'frame-title': { enabled: true },
      'html-has-lang': { enabled: true },
      'html-lang-valid': { enabled: true },
      'image-alt': { enabled: true },
      'input-image-alt': { enabled: true },
      label: { enabled: true },
      'link-name': { enabled: true },
      list: { enabled: true },
      listitem: { enabled: true },
      'meta-refresh': { enabled: true },
      'meta-viewport': { enabled: true },
      'object-alt': { enabled: true },
      'role-img-alt': { enabled: true },
      'th-has-data-cells': { enabled: true },
      'valid-lang': { enabled: true },
      'video-caption': { enabled: true },
    },
    // Tags to include in testing
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    // Disable in production
    disableDedupe: false,
  });
}

/**
 * Custom axe configuration for specific testing scenarios
 */
export const axeConfig = {
  // Configuration for form testing
  forms: {
    rules: {
      label: { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'aria-required-attr': { enabled: true },
      'color-contrast': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'best-practice'],
  },

  // Configuration for navigation testing
  navigation: {
    rules: {
      'keyboard-navigation': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'link-name': { enabled: true },
      'button-name': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'best-practice'],
  },

  // Configuration for modal/dialog testing
  modals: {
    rules: {
      'focus-order-semantics': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'keyboard-navigation': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'best-practice'],
  },

  // Configuration for data table testing
  tables: {
    rules: {
      'th-has-data-cells': { enabled: true },
      'td-headers-attr': { enabled: true },
      'table-fake-caption': { enabled: true },
      'scope-attr-valid': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'best-practice'],
  },
};

/**
 * Run accessibility audit on a specific element
 */
export async function runAccessibilityAudit(
  element: HTMLElement,
  config?: any
): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).axe) {
    try {
      const results = await (window as any).axe.run(element, config);
      return results;
    } catch (error) {
      console.error('Accessibility audit failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Log accessibility violations to console
 */
export function logAccessibilityViolations(results: any): void {
  if (!results || !results.violations) return;

  results.violations.forEach((violation: any) => {
    console.group(`🚨 Accessibility Violation: ${violation.id}`);
    console.log(`Description: ${violation.description}`);
    console.log(`Impact: ${violation.impact}`);
    console.log(`Help: ${violation.help}`);
    console.log(`Help URL: ${violation.helpUrl}`);

    violation.nodes.forEach((node: any, index: number) => {
      console.group(`Element ${index + 1}:`);
      console.log('HTML:', node.html);
      console.log('Target:', node.target);
      console.log('Failure Summary:', node.failureSummary);
      console.groupEnd();
    });

    console.groupEnd();
  });
}

/**
 * Check if accessibility testing is enabled
 */
export function isAccessibilityTestingEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && typeof window !== 'undefined';
}

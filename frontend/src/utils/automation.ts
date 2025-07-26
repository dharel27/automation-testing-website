/**
 * Automation Testing Utilities
 * Provides utilities for test automation framework integration
 */

export interface AutomationAttributes {
  'data-testid': string;
  'data-automation-id'?: string;
  'data-component'?: string;
  'data-state'?: string;
  'data-value'?: string | number;
  'data-index'?: number;
  'data-role'?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
}

/**
 * Generates automation-friendly attributes for components
 */
export const createAutomationAttributes = (
  testId: string,
  options: {
    component?: string;
    state?: string;
    value?: string | number;
    index?: number;
    role?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    htmlRole?: string;
    generateId?: boolean;
  } = {}
): AutomationAttributes => {
  const attributes: AutomationAttributes = {
    'data-testid': testId,
  };

  // Add automation ID (kebab-case version of testId)
  attributes['data-automation-id'] = testId.toLowerCase().replace(/\s+/g, '-');

  // Add component type
  if (options.component) {
    attributes['data-component'] = options.component;
  }

  // Add state information
  if (options.state) {
    attributes['data-state'] = options.state;
  }

  // Add value information
  if (options.value !== undefined) {
    attributes['data-value'] = options.value;
  }

  // Add index for list items
  if (options.index !== undefined) {
    attributes['data-index'] = options.index;
  }

  // Add role information
  if (options.role) {
    attributes['data-role'] = options.role;
  }

  // Generate unique ID if requested
  if (options.generateId) {
    attributes.id = `auto-${testId.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  // Add ARIA attributes
  if (options.ariaLabel) {
    attributes['aria-label'] = options.ariaLabel;
  }

  if (options.ariaDescribedBy) {
    attributes['aria-describedby'] = options.ariaDescribedBy;
  }

  if (options.htmlRole) {
    attributes.role = options.htmlRole;
  }

  return attributes;
};

/**
 * Creates automation attributes for form elements
 */
export const createFormAutomationAttributes = (
  fieldName: string,
  options: {
    type?: string;
    required?: boolean;
    hasError?: boolean;
    value?: string | number;
  } = {}
) => {
  const baseAttributes = createAutomationAttributes(`${fieldName}-input`, {
    component: 'form-input',
    state: options.hasError ? 'error' : 'valid',
    value: options.value,
    ariaLabel: `${fieldName} input field`,
    generateId: true,
  });

  return {
    ...baseAttributes,
    'data-field-name': fieldName,
    'data-field-type': options.type || 'text',
    'data-required': options.required ? 'true' : 'false',
    'data-has-error': options.hasError ? 'true' : 'false',
  };
};

/**
 * Creates automation attributes for buttons
 */
export const createButtonAutomationAttributes = (
  action: string,
  options: {
    variant?: string;
    disabled?: boolean;
    loading?: boolean;
    size?: string;
  } = {}
) => {
  return createAutomationAttributes(`${action}-button`, {
    component: 'button',
    state: options.disabled
      ? 'disabled'
      : options.loading
        ? 'loading'
        : 'enabled',
    role: 'action',
    ariaLabel: `${action} button`,
  });
};

/**
 * Creates automation attributes for navigation elements
 */
export const createNavAutomationAttributes = (
  navItem: string,
  options: {
    active?: boolean;
    mobile?: boolean;
  } = {}
) => {
  return createAutomationAttributes(
    `nav-${navItem}${options.mobile ? '-mobile' : ''}`,
    {
      component: 'navigation',
      state: options.active ? 'active' : 'inactive',
      role: 'navigation',
      ariaLabel: `Navigate to ${navItem}`,
    }
  );
};

/**
 * Creates automation attributes for list items
 */
export const createListItemAutomationAttributes = (
  itemType: string,
  index: number,
  options: {
    id?: string | number;
    selected?: boolean;
    expanded?: boolean;
  } = {}
) => {
  return createAutomationAttributes(`${itemType}-item-${index}`, {
    component: 'list-item',
    state: options.selected
      ? 'selected'
      : options.expanded
        ? 'expanded'
        : 'default',
    index,
    value: options.id,
    role: 'list-item',
  });
};

/**
 * Creates automation attributes for modal/dialog elements
 */
export const createModalAutomationAttributes = (
  modalType: string,
  options: {
    open?: boolean;
    size?: string;
  } = {}
) => {
  return createAutomationAttributes(`${modalType}-modal`, {
    component: 'modal',
    state: options.open ? 'open' : 'closed',
    value: options.size,
    htmlRole: 'dialog',
    ariaLabel: `${modalType} modal dialog`,
  });
};

/**
 * Test data management utilities
 */
export class TestDataManager {
  private static instance: TestDataManager;
  private testData: Map<string, any> = new Map();

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  /**
   * Store test data for later retrieval
   */
  setTestData(key: string, data: any): void {
    this.testData.set(key, data);
    // Also store in sessionStorage for persistence across page reloads
    try {
      sessionStorage.setItem(`test-data-${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to store test data in sessionStorage:', error);
    }
  }

  /**
   * Retrieve test data
   */
  getTestData(key: string): any {
    let data = this.testData.get(key);

    // If not in memory, try to get from sessionStorage
    if (!data) {
      try {
        const stored = sessionStorage.getItem(`test-data-${key}`);
        if (stored) {
          data = JSON.parse(stored);
          this.testData.set(key, data);
        }
      } catch (error) {
        console.warn(
          'Failed to retrieve test data from sessionStorage:',
          error
        );
      }
    }

    return data;
  }

  /**
   * Clear all test data
   */
  clearTestData(): void {
    this.testData.clear();
    // Clear from sessionStorage as well
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith('test-data-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear test data from sessionStorage:', error);
    }
  }

  /**
   * Get all test data keys
   */
  getTestDataKeys(): string[] {
    return Array.from(this.testData.keys());
  }
}

/**
 * Event hooks for automation testing
 */
export class AutomationEventHooks {
  private static instance: AutomationEventHooks;
  private eventListeners: Map<string, Function[]> = new Map();

  static getInstance(): AutomationEventHooks {
    if (!AutomationEventHooks.instance) {
      AutomationEventHooks.instance = new AutomationEventHooks();
    }
    return AutomationEventHooks.instance;
  }

  /**
   * Register an event listener for automation testing
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event for automation testing
   */
  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in automation event listener for ${event}:`,
            error
          );
        }
      });
    }

    // Also dispatch as custom DOM event for external listeners
    try {
      window.dispatchEvent(
        new CustomEvent(`automation:${event}`, { detail: data })
      );
    } catch (error) {
      console.warn('Failed to dispatch automation event:', error);
    }
  }

  /**
   * Get all registered events
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Clear all event listeners
   */
  clearAllListeners(): void {
    this.eventListeners.clear();
  }
}

/**
 * Global automation utilities available on window object
 */
declare global {
  interface Window {
    automationUtils: {
      testDataManager: TestDataManager;
      eventHooks: AutomationEventHooks;
      waitForElement: (selector: string, timeout?: number) => Promise<Element>;
      waitForElementToDisappear: (
        selector: string,
        timeout?: number
      ) => Promise<void>;
      getElementByTestId: (testId: string) => Element | null;
      getAllElementsByTestId: (testId: string) => NodeListOf<Element>;
      triggerEvent: (
        element: Element,
        eventType: string,
        eventData?: any
      ) => void;
      getComponentState: (testId: string) => any;
    };
  }
}

/**
 * Initialize automation utilities on window object
 */
export const initializeAutomationUtils = (): void => {
  if (typeof window !== 'undefined') {
    window.automationUtils = {
      testDataManager: TestDataManager.getInstance(),
      eventHooks: AutomationEventHooks.getInstance(),

      waitForElement: (
        selector: string,
        timeout: number = 5000
      ): Promise<Element> => {
        return new Promise((resolve, reject) => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }

          const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
              observer.disconnect();
              resolve(element);
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });

          setTimeout(() => {
            observer.disconnect();
            reject(
              new Error(`Element ${selector} not found within ${timeout}ms`)
            );
          }, timeout);
        });
      },

      waitForElementToDisappear: (
        selector: string,
        timeout: number = 5000
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          const element = document.querySelector(selector);
          if (!element) {
            resolve();
            return;
          }

          const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (!element) {
              observer.disconnect();
              resolve();
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });

          setTimeout(() => {
            observer.disconnect();
            reject(
              new Error(
                `Element ${selector} did not disappear within ${timeout}ms`
              )
            );
          }, timeout);
        });
      },

      getElementByTestId: (testId: string): Element | null => {
        return document.querySelector(`[data-testid="${testId}"]`);
      },

      getAllElementsByTestId: (testId: string): NodeListOf<Element> => {
        return document.querySelectorAll(`[data-testid="${testId}"]`);
      },

      triggerEvent: (
        element: Element,
        eventType: string,
        eventData?: any
      ): void => {
        const event = new CustomEvent(eventType, { detail: eventData });
        element.dispatchEvent(event);
      },

      getComponentState: (testId: string): any => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        if (!element) return null;

        // Check visibility more reliably
        const isVisible =
          element.offsetParent !== null ||
          (element as HTMLElement).offsetWidth > 0 ||
          (element as HTMLElement).offsetHeight > 0 ||
          element.getClientRects().length > 0;

        return {
          visible: isVisible,
          disabled: (element as HTMLInputElement).disabled,
          value: (element as HTMLInputElement).value,
          checked: (element as HTMLInputElement).checked,
          selected: (element as HTMLSelectElement).selectedIndex,
          textContent: element.textContent,
          className: element.className,
          attributes: Array.from(element.attributes).reduce(
            (acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            },
            {} as Record<string, string>
          ),
        };
      },
    };
  }
};

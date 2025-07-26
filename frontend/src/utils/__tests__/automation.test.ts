/**
 * Tests for automation utilities
 */

import { vi } from 'vitest';
import {
  createAutomationAttributes,
  createFormAutomationAttributes,
  createButtonAutomationAttributes,
  createNavAutomationAttributes,
  createListItemAutomationAttributes,
  createModalAutomationAttributes,
  TestDataManager,
  AutomationEventHooks,
  initializeAutomationUtils,
} from '../automation';

describe('Automation Utilities', () => {
  describe('createAutomationAttributes', () => {
    it('should create basic automation attributes', () => {
      const attributes = createAutomationAttributes('test-element');

      expect(attributes).toEqual({
        'data-testid': 'test-element',
        'data-automation-id': 'test-element',
      });
    });

    it('should create automation attributes with options', () => {
      const attributes = createAutomationAttributes('test-button', {
        component: 'button',
        state: 'enabled',
        value: 'submit',
        index: 1,
        role: 'action',
        ariaLabel: 'Submit form',
        generateId: true,
      });

      expect(attributes).toMatchObject({
        'data-testid': 'test-button',
        'data-automation-id': 'test-button',
        'data-component': 'button',
        'data-state': 'enabled',
        'data-value': 'submit',
        'data-index': 1,
        'data-role': 'action',
        'aria-label': 'Submit form',
      });
      expect(attributes.id).toMatch(/^auto-test-button-\d+$/);
    });
  });

  describe('createFormAutomationAttributes', () => {
    it('should create form automation attributes', () => {
      const attributes = createFormAutomationAttributes('email', {
        type: 'email',
        required: true,
        hasError: false,
        value: 'test@example.com',
      });

      expect(attributes).toMatchObject({
        'data-testid': 'email-input',
        'data-automation-id': 'email-input',
        'data-component': 'form-input',
        'data-state': 'valid',
        'data-value': 'test@example.com',
        'data-field-name': 'email',
        'data-field-type': 'email',
        'data-required': 'true',
        'data-has-error': 'false',
        'aria-label': 'email input field',
      });
    });

    it('should handle error state', () => {
      const attributes = createFormAutomationAttributes('password', {
        hasError: true,
        required: true,
      });

      expect(attributes['data-state']).toBe('error');
      expect(attributes['data-has-error']).toBe('true');
    });
  });

  describe('createButtonAutomationAttributes', () => {
    it('should create button automation attributes', () => {
      const attributes = createButtonAutomationAttributes('submit', {
        variant: 'primary',
        disabled: false,
        loading: false,
      });

      expect(attributes).toMatchObject({
        'data-testid': 'submit-button',
        'data-automation-id': 'submit-button',
        'data-component': 'button',
        'data-state': 'enabled',
        'data-role': 'action',
        'aria-label': 'submit button',
      });
    });

    it('should handle disabled state', () => {
      const attributes = createButtonAutomationAttributes('submit', {
        disabled: true,
      });

      expect(attributes['data-state']).toBe('disabled');
    });

    it('should handle loading state', () => {
      const attributes = createButtonAutomationAttributes('submit', {
        loading: true,
      });

      expect(attributes['data-state']).toBe('loading');
    });
  });

  describe('createNavAutomationAttributes', () => {
    it('should create navigation automation attributes', () => {
      const attributes = createNavAutomationAttributes('home');

      expect(attributes).toMatchObject({
        'data-testid': 'nav-home',
        'data-automation-id': 'nav-home',
        'data-component': 'navigation',
        'data-state': 'inactive',
        'data-role': 'navigation',
        'aria-label': 'Navigate to home',
      });
    });

    it('should handle active state', () => {
      const attributes = createNavAutomationAttributes('home', {
        active: true,
      });
      expect(attributes['data-state']).toBe('active');
    });

    it('should handle mobile navigation', () => {
      const attributes = createNavAutomationAttributes('home', {
        mobile: true,
      });
      expect(attributes['data-testid']).toBe('nav-home-mobile');
    });
  });

  describe('createListItemAutomationAttributes', () => {
    it('should create list item automation attributes', () => {
      const attributes = createListItemAutomationAttributes('product', 0, {
        id: 'prod-123',
        selected: false,
      });

      expect(attributes).toMatchObject({
        'data-testid': 'product-item-0',
        'data-automation-id': 'product-item-0',
        'data-component': 'list-item',
        'data-state': 'default',
        'data-index': 0,
        'data-value': 'prod-123',
        'data-role': 'list-item',
      });
    });

    it('should handle selected state', () => {
      const attributes = createListItemAutomationAttributes('product', 0, {
        selected: true,
      });
      expect(attributes['data-state']).toBe('selected');
    });
  });

  describe('createModalAutomationAttributes', () => {
    it('should create modal automation attributes', () => {
      const attributes = createModalAutomationAttributes('confirmation', {
        open: true,
        size: 'md',
      });

      expect(attributes).toMatchObject({
        'data-testid': 'confirmation-modal',
        'data-automation-id': 'confirmation-modal',
        'data-component': 'modal',
        'data-state': 'open',
        'data-value': 'md',
        role: 'dialog',
        'aria-label': 'confirmation modal dialog',
      });
    });
  });

  describe('TestDataManager', () => {
    let testDataManager: TestDataManager;

    beforeEach(() => {
      testDataManager = TestDataManager.getInstance();
      testDataManager.clearTestData();
    });

    it('should store and retrieve test data', () => {
      const testData = { name: 'John', email: 'john@example.com' };
      testDataManager.setTestData('user', testData);

      const retrieved = testDataManager.getTestData('user');
      expect(retrieved).toEqual(testData);
    });

    it('should return undefined for non-existent data', () => {
      const retrieved = testDataManager.getTestData('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should clear all test data', () => {
      testDataManager.setTestData('user1', { name: 'John' });
      testDataManager.setTestData('user2', { name: 'Jane' });

      testDataManager.clearTestData();

      expect(testDataManager.getTestData('user1')).toBeUndefined();
      expect(testDataManager.getTestData('user2')).toBeUndefined();
    });

    it('should get all test data keys', () => {
      testDataManager.setTestData('user1', { name: 'John' });
      testDataManager.setTestData('user2', { name: 'Jane' });

      const keys = testDataManager.getTestDataKeys();
      expect(keys).toContain('user1');
      expect(keys).toContain('user2');
    });
  });

  describe('AutomationEventHooks', () => {
    let eventHooks: AutomationEventHooks;

    beforeEach(() => {
      eventHooks = AutomationEventHooks.getInstance();
      eventHooks.clearAllListeners();
    });

    it('should register and emit events', () => {
      const callback = vi.fn();
      eventHooks.on('test-event', callback);

      eventHooks.emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const callback = vi.fn();
      eventHooks.on('test-event', callback);
      eventHooks.off('test-event', callback);

      eventHooks.emit('test-event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventHooks.on('test-event', callback1);
      eventHooks.on('test-event', callback2);

      eventHooks.emit('test-event', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should get registered events', () => {
      eventHooks.on('event1', vi.fn());
      eventHooks.on('event2', vi.fn());

      const events = eventHooks.getRegisteredEvents();
      expect(events).toContain('event1');
      expect(events).toContain('event2');
    });

    it('should clear all listeners', () => {
      eventHooks.on('event1', vi.fn());
      eventHooks.on('event2', vi.fn());

      eventHooks.clearAllListeners();

      expect(eventHooks.getRegisteredEvents()).toHaveLength(0);
    });
  });

  describe('initializeAutomationUtils', () => {
    beforeEach(() => {
      // Clean up any existing window.automationUtils
      delete (window as any).automationUtils;
    });

    it('should initialize automation utils on window object', () => {
      initializeAutomationUtils();

      expect(window.automationUtils).toBeDefined();
      expect(window.automationUtils.testDataManager).toBeDefined();
      expect(window.automationUtils.eventHooks).toBeDefined();
      expect(window.automationUtils.waitForElement).toBeDefined();
      expect(window.automationUtils.waitForElementToDisappear).toBeDefined();
      expect(window.automationUtils.getElementByTestId).toBeDefined();
      expect(window.automationUtils.getAllElementsByTestId).toBeDefined();
      expect(window.automationUtils.triggerEvent).toBeDefined();
      expect(window.automationUtils.getComponentState).toBeDefined();
    });

    it('should provide working utility functions', () => {
      // Create a test element
      const testElement = document.createElement('div');
      testElement.setAttribute('data-testid', 'test-element');
      testElement.textContent = 'Test Content';
      document.body.appendChild(testElement);

      initializeAutomationUtils();

      // Test getElementByTestId
      const foundElement =
        window.automationUtils.getElementByTestId('test-element');
      expect(foundElement).toBe(testElement);

      // Test getComponentState
      const state = window.automationUtils.getComponentState('test-element');
      expect(state.textContent).toBe('Test Content');
      expect(state.attributes['data-testid']).toBe('test-element');

      // Clean up
      document.body.removeChild(testElement);
    });
  });
});

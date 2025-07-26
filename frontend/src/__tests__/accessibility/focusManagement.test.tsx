import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FocusManager,
  getFocusableElements,
  trapFocus,
  announceToScreenReader,
  handleKeyboardNavigation,
  createAccessibleId,
} from '../../utils/accessibility';
import FocusTrap from '../../components/accessibility/FocusTrap';
import { Modal } from '../../components/ui/Modal';

describe('Focus Management Tests', () => {
  describe('FocusManager', () => {
    let focusManager: FocusManager;

    beforeEach(() => {
      focusManager = FocusManager.getInstance();
      // Clear any existing focus history
      while (focusManager['focusHistory'].length > 0) {
        focusManager['focusHistory'].pop();
      }
    });

    it('should save and restore focus', () => {
      render(
        <div>
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
        </div>
      );

      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');

      // Focus first button and save
      button1.focus();
      expect(button1).toHaveFocus();
      focusManager.saveFocus();

      // Focus second button
      button2.focus();
      expect(button2).toHaveFocus();

      // Restore focus should return to first button
      focusManager.restoreFocus();
      expect(button1).toHaveFocus();
    });

    it('should focus main content', () => {
      render(
        <div>
          <nav>Navigation</nav>
          <main id="main-content" tabIndex={-1}>
            <h1>Main Content</h1>
          </main>
        </div>
      );

      focusManager.focusMainContent();
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveFocus();
    });

    it('should focus first heading in main content', () => {
      render(
        <div>
          <nav>Navigation</nav>
          <main role="main">
            <h1 data-testid="main-heading">Main Heading</h1>
            <p>Content</p>
          </main>
        </div>
      );

      focusManager.focusFirstHeading();
      const heading = screen.getByTestId('main-heading');
      expect(heading).toHaveFocus();
      expect(heading).toHaveAttribute('tabindex', '-1');
    });

    it('should handle skip link activation', () => {
      render(
        <div>
          <a
            href="#target"
            onClick={(e) => {
              e.preventDefault();
              focusManager.handleSkipLink('target');
            }}
          >
            Skip to target
          </a>
          <div id="target" data-testid="target">
            Target content
          </div>
        </div>
      );

      const skipLink = screen.getByText('Skip to target');
      const target = screen.getByTestId('target');

      fireEvent.click(skipLink);

      expect(target).toHaveFocus();
      expect(target).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      const { container } = render(
        <div>
          <button>Button</button>
          <a href="#">Link</a>
          <input type="text" />
          <select>
            <option>Option</option>
          </select>
          <textarea></textarea>
          <div tabIndex={0}>Focusable div</div>
          <div tabIndex={-1}>Non-focusable div</div>
          <button disabled>Disabled button</button>
        </div>
      );

      const focusableElements = getFocusableElements(container);

      // Should find: button, link, input, select, textarea, focusable div
      // Should NOT find: non-focusable div, disabled button
      expect(focusableElements).toHaveLength(6);

      const elementTypes = focusableElements.map((el) =>
        el.tagName.toLowerCase()
      );
      expect(elementTypes).toContain('button');
      expect(elementTypes).toContain('a');
      expect(elementTypes).toContain('input');
      expect(elementTypes).toContain('select');
      expect(elementTypes).toContain('textarea');
      expect(elementTypes).toContain('div');
    });

    it('should handle empty container', () => {
      const { container } = render(<div></div>);
      const focusableElements = getFocusableElements(container);
      expect(focusableElements).toHaveLength(0);
    });
  });

  describe('trapFocus', () => {
    it('should trap focus within container on Tab', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <div>
          <button data-testid="first">First</button>
          <button data-testid="second">Second</button>
          <button data-testid="third">Third</button>
        </div>
      );

      const first = screen.getByTestId('first');
      const second = screen.getByTestId('second');
      const third = screen.getByTestId('third');

      // Focus last element
      third.focus();
      expect(third).toHaveFocus();

      // Simulate Tab key - should wrap to first
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      Object.defineProperty(tabEvent, 'target', { value: third });

      trapFocus(container, tabEvent);

      // Since we're testing the utility function directly,
      // we need to manually handle the focus change
      if (tabEvent.defaultPrevented) {
        first.focus();
      }

      expect(first).toHaveFocus();
    });

    it('should trap focus within container on Shift+Tab', async () => {
      const { container } = render(
        <div>
          <button data-testid="first">First</button>
          <button data-testid="second">Second</button>
          <button data-testid="third">Third</button>
        </div>
      );

      const first = screen.getByTestId('first');
      const third = screen.getByTestId('third');

      // Focus first element
      first.focus();
      expect(first).toHaveFocus();

      // Simulate Shift+Tab - should wrap to last
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
      });
      Object.defineProperty(shiftTabEvent, 'target', { value: first });

      trapFocus(container, shiftTabEvent);

      if (shiftTabEvent.defaultPrevented) {
        third.focus();
      }

      expect(third).toHaveFocus();
    });

    it('should ignore non-Tab keys', () => {
      const { container } = render(
        <div>
          <button>Button</button>
        </div>
      );

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spy = jest.spyOn(enterEvent, 'preventDefault');

      trapFocus(container, enterEvent);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('FocusTrap Component', () => {
    it('should trap focus when active', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="outside">Outside</button>
          <FocusTrap isActive={true}>
            <button data-testid="inside1">Inside 1</button>
            <button data-testid="inside2">Inside 2</button>
          </FocusTrap>
        </div>
      );

      const inside1 = screen.getByTestId('inside1');
      const inside2 = screen.getByTestId('inside2');

      // Should auto-focus first element
      expect(inside1).toHaveFocus();

      // Tab should move to second element
      await user.tab();
      expect(inside2).toHaveFocus();

      // Tab should wrap back to first
      await user.tab();
      expect(inside1).toHaveFocus();
    });

    it('should not trap focus when inactive', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="outside">Outside</button>
          <FocusTrap isActive={false}>
            <button data-testid="inside">Inside</button>
          </FocusTrap>
        </div>
      );

      const outside = screen.getByTestId('outside');
      const inside = screen.getByTestId('inside');

      outside.focus();
      expect(outside).toHaveFocus();

      await user.tab();
      expect(inside).toHaveFocus();

      // Should be able to tab out of inactive trap
      await user.tab();
      expect(inside).not.toHaveFocus();
    });

    it('should restore focus when deactivated', () => {
      const { rerender } = render(
        <div>
          <button data-testid="outside">Outside</button>
          <FocusTrap isActive={false}>
            <button data-testid="inside">Inside</button>
          </FocusTrap>
        </div>
      );

      const outside = screen.getByTestId('outside');
      outside.focus();
      expect(outside).toHaveFocus();

      // Activate trap
      rerender(
        <div>
          <button data-testid="outside">Outside</button>
          <FocusTrap isActive={true}>
            <button data-testid="inside">Inside</button>
          </FocusTrap>
        </div>
      );

      const inside = screen.getByTestId('inside');
      expect(inside).toHaveFocus();

      // Deactivate trap
      rerender(
        <div>
          <button data-testid="outside">Outside</button>
          <FocusTrap isActive={false}>
            <button data-testid="inside">Inside</button>
          </FocusTrap>
        </div>
      );

      // Focus should be restored to outside button
      expect(outside).toHaveFocus();
    });
  });

  describe('announceToScreenReader', () => {
    it('should create announcement element', () => {
      announceToScreenReader('Test announcement');

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent('Test announcement');
      expect(announcement).toHaveClass('sr-only');
    });

    it('should create assertive announcement', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent('Urgent message');
    });

    it('should remove announcement after timeout', (done) => {
      announceToScreenReader('Temporary message');

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeInTheDocument();

      setTimeout(() => {
        const removedAnnouncement = document.querySelector(
          '[aria-live="polite"]'
        );
        expect(removedAnnouncement).not.toBeInTheDocument();
        done();
      }, 1100);
    });
  });

  describe('handleKeyboardNavigation', () => {
    it('should handle Enter key', () => {
      const onEnter = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const spy = jest.spyOn(event, 'preventDefault');

      handleKeyboardNavigation(event, { onEnter });

      expect(onEnter).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle Space key', () => {
      const onSpace = jest.fn();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const spy = jest.spyOn(event, 'preventDefault');

      handleKeyboardNavigation(event, { onSpace });

      expect(onSpace).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle arrow keys', () => {
      const onArrowUp = jest.fn();
      const onArrowDown = jest.fn();
      const onArrowLeft = jest.fn();
      const onArrowRight = jest.fn();

      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });

      handleKeyboardNavigation(upEvent, { onArrowUp });
      handleKeyboardNavigation(downEvent, { onArrowDown });
      handleKeyboardNavigation(leftEvent, { onArrowLeft });
      handleKeyboardNavigation(rightEvent, { onArrowRight });

      expect(onArrowUp).toHaveBeenCalled();
      expect(onArrowDown).toHaveBeenCalled();
      expect(onArrowLeft).toHaveBeenCalled();
      expect(onArrowRight).toHaveBeenCalled();
    });

    it('should handle Home and End keys', () => {
      const onHome = jest.fn();
      const onEnd = jest.fn();

      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });

      handleKeyboardNavigation(homeEvent, { onHome });
      handleKeyboardNavigation(endEvent, { onEnd });

      expect(onHome).toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalled();
    });

    it('should ignore unhandled keys', () => {
      const onEnter = jest.fn();
      const event = new KeyboardEvent('keydown', { key: 'a' });
      const spy = jest.spyOn(event, 'preventDefault');

      handleKeyboardNavigation(event, { onEnter });

      expect(onEnter).not.toHaveBeenCalled();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('createAccessibleId', () => {
    it('should create unique IDs', () => {
      const id1 = createAccessibleId();
      const id2 = createAccessibleId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^accessible-[a-z0-9]+$/);
      expect(id2).toMatch(/^accessible-[a-z0-9]+$/);
    });

    it('should use custom prefix', () => {
      const id = createAccessibleId('custom');
      expect(id).toMatch(/^custom-[a-z0-9]+$/);
    });
  });

  describe('Modal Focus Management', () => {
    it('should manage focus properly in modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <div>
          <button data-testid="trigger">Open Modal</button>
          <Modal isOpen={true} onClose={onClose} title="Test Modal">
            <button data-testid="modal-button">Modal Button</button>
          </Modal>
        </div>
      );

      // Modal should be focused
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveFocus();

      // Tab should move to modal button
      await user.tab();
      const modalButton = screen.getByTestId('modal-button');
      expect(modalButton).toHaveFocus();

      // Tab should move to close button
      await user.tab();
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveFocus();

      // Tab should wrap back to modal button
      await user.tab();
      expect(modalButton).toHaveFocus();
    });

    it('should restore focus when modal closes', () => {
      const onClose = jest.fn();

      const { rerender } = render(
        <div>
          <button data-testid="trigger">Open Modal</button>
          <Modal isOpen={false} onClose={onClose} title="Test Modal">
            <button>Modal Button</button>
          </Modal>
        </div>
      );

      const trigger = screen.getByTestId('trigger');
      trigger.focus();
      expect(trigger).toHaveFocus();

      // Open modal
      rerender(
        <div>
          <button data-testid="trigger">Open Modal</button>
          <Modal isOpen={true} onClose={onClose} title="Test Modal">
            <button>Modal Button</button>
          </Modal>
        </div>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveFocus();

      // Close modal
      rerender(
        <div>
          <button data-testid="trigger">Open Modal</button>
          <Modal isOpen={false} onClose={onClose} title="Test Modal">
            <button>Modal Button</button>
          </Modal>
        </div>
      );

      // Focus should be restored to trigger
      expect(trigger).toHaveFocus();
    });
  });
});

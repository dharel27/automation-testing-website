import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = 'unset';
  });

  it('renders modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders modal with title', () => {
    render(<Modal {...defaultProps} title="Test Modal" />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby',
      'modal-title'
    );
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByTestId('modal-close-button');
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked and closeOnOverlayClick is true', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} closeOnOverlayClick={true} />);

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} closeOnOverlayClick={false} />);

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const modalContent = screen.getByTestId('modal-content');
    await user.click(modalContent);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed and closeOnEscape is true', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} closeOnEscape={true} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape key is pressed and closeOnEscape is false', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} closeOnEscape={false} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByTestId('modal')).toHaveClass('max-w-sm');

    rerender(<Modal {...defaultProps} size="md" />);
    expect(screen.getByTestId('modal')).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByTestId('modal')).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="xl" />);
    expect(screen.getByTestId('modal')).toHaveClass('max-w-xl');
  });

  it('prevents body scroll when modal is open', () => {
    render(<Modal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal is closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('unset');
  });

  it('has proper ARIA attributes', () => {
    render(<Modal {...defaultProps} title="Test Modal" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal {...defaultProps}>
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );

    const firstButton = screen.getByText('First button');
    const secondButton = screen.getByText('Second button');
    const closeButton = screen.getByTestId('modal-close-button');

    // Focus should start on the modal
    expect(screen.getByTestId('modal')).toHaveFocus();

    // Tab should move to first focusable element
    await user.tab();
    expect(firstButton).toHaveFocus();

    // Tab should move to second button
    await user.tab();
    expect(secondButton).toHaveFocus();

    // Tab should move to close button
    await user.tab();
    expect(closeButton).toHaveFocus();

    // Tab should wrap back to first button
    await user.tab();
    expect(firstButton).toHaveFocus();

    // Shift+Tab should move backwards
    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it('uses custom data-testid', () => {
    render(<Modal {...defaultProps} data-testid="custom-modal" />);

    expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
    expect(screen.getByTestId('custom-modal-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('custom-modal-close-button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-modal-content')).toBeInTheDocument();
  });

  it('focuses modal when opened', async () => {
    const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

    rerender(<Modal {...defaultProps} isOpen={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toHaveFocus();
    });
  });
});

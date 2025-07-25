import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  const defaultProps = {
    content: 'Tooltip content',
    children: <button>Trigger</button>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders trigger element', () => {
    render(<Tooltip {...defaultProps} />);

    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
  });

  it('shows tooltip on hover when trigger is hover', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} trigger="hover" />);

    const trigger = screen.getByTestId('tooltip-trigger');
    await user.hover(trigger);

    // Fast-forward past the delay
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });
  });

  it('hides tooltip on mouse leave when trigger is hover', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} trigger="hover" />);

    const trigger = screen.getByTestId('tooltip-trigger');
    await user.hover(trigger);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    await user.unhover(trigger);

    await waitFor(() => {
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus when trigger is focus', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} trigger="focus" />);

    const button = screen.getByText('Trigger');
    await user.click(button); // This will focus the button

    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip on blur when trigger is focus', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} trigger="focus" />);

    const button = screen.getByText('Trigger');
    await user.click(button);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    await user.tab(); // This will blur the button

    await waitFor(() => {
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on both hover and focus when trigger is both', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} trigger="both" />);

    const trigger = screen.getByTestId('tooltip-trigger');

    // Test hover
    await user.hover(trigger);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    await user.unhover(trigger);

    await waitFor(() => {
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    // Test focus
    const button = screen.getByText('Trigger');
    await user.click(button);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  it('respects custom delay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} delay={500} />);

    const trigger = screen.getByTestId('tooltip-trigger');
    await user.hover(trigger);

    // Should not show before delay
    jest.advanceTimersByTime(400);
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();

    // Should show after delay
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  it('applies correct position classes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const positions = ['top', 'bottom', 'left', 'right'] as const;

    for (const position of positions) {
      const { unmount } = render(
        <Tooltip {...defaultProps} position={position} />
      );

      const trigger = screen.getByTestId('tooltip-trigger');
      await user.hover(trigger);
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        const tooltip = screen.getByTestId('tooltip');
        expect(tooltip).toBeInTheDocument();

        // Check that position-specific classes are applied
        const positionClasses = {
          top: 'bottom-full',
          bottom: 'top-full',
          left: 'right-full',
          right: 'left-full',
        };

        expect(tooltip).toHaveClass(positionClasses[position]);
      });

      unmount();
    }
  });

  it('hides tooltip on Escape key', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} />);

    const trigger = screen.getByTestId('tooltip-trigger');
    await user.hover(trigger);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} />);

    const trigger = screen.getByTestId('tooltip-trigger');
    await user.hover(trigger);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
      expect(tooltip).toHaveAttribute('aria-hidden', 'false');
    });
  });

  it('renders arrow element', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} />);

    const trigger = screen.getByTestId('tooltip-trigger');
    await user.hover(trigger);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip-arrow')).toBeInTheDocument();
    });
  });

  it('uses custom data-testid', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Tooltip {...defaultProps} data-testid="custom-tooltip" />);

    expect(screen.getByTestId('custom-tooltip-trigger')).toBeInTheDocument();

    const trigger = screen.getByTestId('custom-tooltip-trigger');
    await user.hover(trigger);
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(screen.getByTestId('custom-tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('custom-tooltip-arrow')).toBeInTheDocument();
    });
  });

  it('clears timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = render(<Tooltip {...defaultProps} />);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput } from '../FormInput';
import { validateEmail } from '../validation';

describe('FormInput', () => {
  const defaultProps = {
    id: 'test-input',
    name: 'testInput',
    label: 'Test Input',
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<FormInput {...defaultProps} />);

    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-input');
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'testInput');
  });

  it('shows required indicator when required', () => {
    render(<FormInput {...defaultProps} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FormInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(onChange).toHaveBeenLastCalledWith('test value');
  });

  it('shows validation error after blur', async () => {
    const user = userEvent.setup();

    render(
      <FormInput
        {...defaultProps}
        type="email"
        validator={validateEmail}
        value="invalid-email"
      />
    );

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('clears error when input becomes valid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <FormInput
        {...defaultProps}
        type="email"
        validator={validateEmail}
        value="invalid-email"
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Trigger blur to show error

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });

    // Update with valid email
    rerender(
      <FormInput
        {...defaultProps}
        type="email"
        validator={validateEmail}
        value="test@example.com"
        onChange={onChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid email address')
      ).not.toBeInTheDocument();
    });
  });

  it('shows password toggle when showPasswordToggle is true', () => {
    render(<FormInput {...defaultProps} type="password" showPasswordToggle />);

    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();

    render(
      <FormInput
        {...defaultProps}
        type="password"
        showPasswordToggle
        value="secret"
      />
    );

    const input = screen.getByDisplayValue('secret');
    const toggleButton = screen.getByLabelText('Show password');

    expect(input).toHaveAttribute('type', 'password');

    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('shows help text when provided', () => {
    render(<FormInput {...defaultProps} helpText="This is help text" />);

    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('sets aria attributes correctly', () => {
    render(<FormInput {...defaultProps} required helpText="Help text" />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-help');
  });

  it('sets aria-invalid when there is an error', async () => {
    const user = userEvent.setup();

    render(
      <FormInput
        {...defaultProps}
        type="email"
        validator={validateEmail}
        value="invalid-email"
      />
    );

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('disables input when disabled prop is true', () => {
    render(<FormInput {...defaultProps} disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('uses custom data-testid', () => {
    render(<FormInput {...defaultProps} data-testid="custom-input" />);

    expect(screen.getByTestId('custom-input')).toBeInTheDocument();
  });

  it('uses default data-testid based on name', () => {
    render(<FormInput {...defaultProps} />);

    expect(screen.getByTestId('testInput-input')).toBeInTheDocument();
  });
});

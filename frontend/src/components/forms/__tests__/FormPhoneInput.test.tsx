import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormPhoneInput } from '../FormPhoneInput';

describe('FormPhoneInput', () => {
  const defaultProps = {
    id: 'phone-input',
    name: 'phone',
    label: 'Phone Number',
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<FormPhoneInput {...defaultProps} />);

    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
  });

  it('formats phone number as user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FormPhoneInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '1234567890');

    // Should call onChange with unformatted number
    expect(onChange).toHaveBeenLastCalledWith('1234567890');

    // Display should be formatted
    expect(input).toHaveValue('(123) 456-7890');
  });

  it('limits input to 10 digits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FormPhoneInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '12345678901234');

    // Should only accept first 10 digits
    expect(onChange).toHaveBeenLastCalledWith('1234567890');
  });

  it('shows validation error for invalid phone number', async () => {
    const user = userEvent.setup();

    render(<FormPhoneInput {...defaultProps} value="123" />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid phone number')
      ).toBeInTheDocument();
    });
  });

  it('shows required error when required and empty', async () => {
    const user = userEvent.setup();

    render(<FormPhoneInput {...defaultProps} required />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });
  });

  it('accepts valid 10-digit phone number', async () => {
    const user = userEvent.setup();

    render(<FormPhoneInput {...defaultProps} value="1234567890" />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid phone number')
      ).not.toBeInTheDocument();
    });
  });

  it('shows required indicator when required', () => {
    render(<FormPhoneInput {...defaultProps} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(<FormPhoneInput {...defaultProps} disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('uses custom placeholder', () => {
    render(<FormPhoneInput {...defaultProps} placeholder="Enter phone" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter phone');
  });

  it('sets aria attributes correctly', () => {
    render(<FormPhoneInput {...defaultProps} required />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('autocomplete', 'tel');
  });

  it('uses custom data-testid', () => {
    render(<FormPhoneInput {...defaultProps} data-testid="custom-phone" />);

    expect(screen.getByTestId('custom-phone')).toBeInTheDocument();
  });

  it('handles existing formatted value correctly', () => {
    render(<FormPhoneInput {...defaultProps} value="1234567890" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('(123) 456-7890');
  });
});

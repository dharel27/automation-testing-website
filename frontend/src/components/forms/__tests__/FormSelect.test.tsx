import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormSelect } from '../FormSelect';
import { validateRequired } from '../validation';

describe('FormSelect', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  const defaultProps = {
    id: 'test-select',
    name: 'testSelect',
    label: 'Test Select',
    value: '',
    onChange: vi.fn(),
    options,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<FormSelect {...defaultProps} />);

    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<FormSelect {...defaultProps} />);

    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<FormSelect {...defaultProps} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FormSelect {...defaultProps} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'option1');

    expect(onChange).toHaveBeenCalledWith('option1');
  });

  it('shows validation error after blur', async () => {
    const user = userEvent.setup();

    render(
      <FormSelect
        {...defaultProps}
        required
        validator={(value) => validateRequired(value, 'Test Select')}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Test Select is required')).toBeInTheDocument();
    });
  });

  it('clears error when valid option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <FormSelect
        {...defaultProps}
        required
        validator={(value) => validateRequired(value, 'Test Select')}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.tab(); // Trigger blur to show error

    await waitFor(() => {
      expect(screen.getByText('Test Select is required')).toBeInTheDocument();
    });

    // Update with valid selection
    rerender(
      <FormSelect
        {...defaultProps}
        required
        validator={(value) => validateRequired(value, 'Test Select')}
        value="option1"
        onChange={onChange}
      />
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Test Select is required')
      ).not.toBeInTheDocument();
    });
  });

  it('disables select when disabled prop is true', () => {
    render(<FormSelect {...defaultProps} disabled />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('disables specific options', () => {
    render(<FormSelect {...defaultProps} />);

    const option3 = screen.getByRole('option', { name: 'Option 3' });
    expect(option3).toBeDisabled();
  });

  it('shows help text when provided', () => {
    render(<FormSelect {...defaultProps} helpText="This is help text" />);

    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('uses custom placeholder', () => {
    render(<FormSelect {...defaultProps} placeholder="Choose an option" />);

    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('sets aria attributes correctly', () => {
    render(<FormSelect {...defaultProps} required helpText="Help text" />);

    const select = screen.getByRole('combobox');

    expect(select).toHaveAttribute('aria-required', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'test-select-help');
  });

  it('sets aria-invalid when there is an error', async () => {
    const user = userEvent.setup();

    render(
      <FormSelect
        {...defaultProps}
        required
        validator={(value) => validateRequired(value, 'Test Select')}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);
    await user.tab();

    await waitFor(() => {
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('uses custom data-testid', () => {
    render(<FormSelect {...defaultProps} data-testid="custom-select" />);

    expect(screen.getByTestId('custom-select')).toBeInTheDocument();
  });

  it('uses default data-testid based on name', () => {
    render(<FormSelect {...defaultProps} />);

    expect(screen.getByTestId('testSelect-select')).toBeInTheDocument();
  });

  it('displays selected value correctly', () => {
    render(<FormSelect {...defaultProps} value="option2" />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });
});

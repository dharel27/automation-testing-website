import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all required fields', () => {
    render(<ContactForm {...defaultProps} />);

    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type of Inquiry/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const submitButton = screen.getByTestId('contact-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please fill in all required fields')
      ).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const emailInput = screen.getByTestId('contact-email');
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('validates subject minimum length', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const subjectInput = screen.getByTestId('contact-subject');
    await user.type(subjectInput, 'Hi');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Subject must be at least 5 characters long')
      ).toBeInTheDocument();
    });
  });

  it('validates message minimum length', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const messageInput = screen.getByTestId('contact-message');
    await user.type(messageInput, 'Short message');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Message must be at least 20 characters long')
      ).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill in required fields
    await user.type(screen.getByTestId('contact-firstName'), 'John');
    await user.type(screen.getByTestId('contact-lastName'), 'Doe');
    await user.type(screen.getByTestId('contact-email'), 'john@example.com');
    await user.selectOptions(
      screen.getByTestId('contact-inquiryType'),
      'general'
    );
    await user.type(screen.getByTestId('contact-subject'), 'Test subject');
    await user.type(
      screen.getByTestId('contact-message'),
      'This is a test message with enough characters'
    );

    const submitButton = screen.getByTestId('contact-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '',
        company: '',
        jobTitle: '',
        inquiryType: 'general',
        priority: 'medium',
        subject: 'Test subject',
        message: 'This is a test message with enough characters',
        newsletter: false,
        preferredContact: 'email',
      });
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill in required fields
    await user.type(screen.getByTestId('contact-firstName'), 'John');
    await user.type(screen.getByTestId('contact-lastName'), 'Doe');
    await user.type(screen.getByTestId('contact-email'), 'john@example.com');
    await user.selectOptions(
      screen.getByTestId('contact-inquiryType'),
      'general'
    );
    await user.type(screen.getByTestId('contact-subject'), 'Test subject');
    await user.type(
      screen.getByTestId('contact-message'),
      'This is a test message with enough characters'
    );

    const submitButton = screen.getByTestId('contact-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Message Sent Successfully!')
      ).toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill in required fields
    await user.type(screen.getByTestId('contact-firstName'), 'John');
    await user.type(screen.getByTestId('contact-lastName'), 'Doe');
    await user.type(screen.getByTestId('contact-email'), 'john@example.com');
    await user.selectOptions(
      screen.getByTestId('contact-inquiryType'),
      'general'
    );
    await user.type(screen.getByTestId('contact-subject'), 'Test subject');
    await user.type(
      screen.getByTestId('contact-message'),
      'This is a test message with enough characters'
    );

    const submitButton = screen.getByTestId('contact-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

    render(<ContactForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill in required fields
    await user.type(screen.getByTestId('contact-firstName'), 'John');
    await user.type(screen.getByTestId('contact-lastName'), 'Doe');
    await user.type(screen.getByTestId('contact-email'), 'john@example.com');
    await user.selectOptions(
      screen.getByTestId('contact-inquiryType'),
      'general'
    );
    await user.type(screen.getByTestId('contact-subject'), 'Test subject');
    await user.type(
      screen.getByTestId('contact-message'),
      'This is a test message with enough characters'
    );

    const submitButton = screen.getByTestId('contact-submit');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Sending Message...')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ContactForm {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByTestId('contact-cancel');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('does not render cancel button when onCancel is not provided', () => {
    render(<ContactForm onSubmit={vi.fn()} />);

    expect(screen.queryByTestId('contact-cancel')).not.toBeInTheDocument();
  });

  it('allows selecting priority level', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const highPriorityRadio = screen.getByTestId('contact-priority-high-radio');
    await user.click(highPriorityRadio);

    expect(highPriorityRadio).toBeChecked();
  });

  it('allows selecting preferred contact method', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const phoneContactRadio = screen.getByTestId(
      'contact-preferredContact-phone-radio'
    );
    await user.click(phoneContactRadio);

    expect(phoneContactRadio).toBeChecked();
  });

  it('allows subscribing to newsletter', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const newsletterCheckbox = screen.getByTestId('contact-newsletter');
    await user.click(newsletterCheckbox);

    expect(newsletterCheckbox).toBeChecked();
  });

  it('formats phone number input', async () => {
    const user = userEvent.setup();

    render(<ContactForm {...defaultProps} />);

    const phoneInput = screen.getByTestId('contact-phone');
    await user.type(phoneInput, '1234567890');

    expect(phoneInput).toHaveValue('(123) 456-7890');
  });
});

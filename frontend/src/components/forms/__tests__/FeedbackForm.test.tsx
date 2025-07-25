import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '../FeedbackForm';

describe('FeedbackForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all required fields', () => {
    render(<FeedbackForm {...defaultProps} />);

    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Submit feedback anonymously/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Type of Feedback/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categories/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it('shows contact fields when not anonymous', () => {
    render(<FeedbackForm {...defaultProps} />);

    expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
  });

  it('hides contact fields when anonymous is selected', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const anonymousCheckbox = screen.getByTestId('feedback-anonymous');
    await user.click(anonymousCheckbox);

    expect(screen.queryByLabelText(/Your Name/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Email Address/)).not.toBeInTheDocument();
  });

  it('shows bug report specific fields when bug type is selected', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const bugRadio = screen.getByTestId('feedbackType-bug-radio');
    await user.click(bugRadio);

    await waitFor(() => {
      expect(screen.getByLabelText(/Steps to Reproduce/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expected Behavior/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Actual Behavior/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Browser/)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const submitButton = screen.getByTestId('feedback-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please fill in all required fields')
      ).toBeInTheDocument();
    });
  });

  it('validates categories selection', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    // Fill other required fields but leave categories empty
    const bugRadio = screen.getByTestId('feedbackType-bug-radio');
    await user.click(bugRadio);

    const titleInput = screen.getByTestId('feedback-title');
    await user.type(titleInput, 'Test title');

    const descriptionInput = screen.getByTestId('feedback-description');
    await user.type(
      descriptionInput,
      'This is a test description with enough characters'
    );

    const submitButton = screen.getByTestId('feedback-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please fill in all required fields')
      ).toBeInTheDocument();
    });
  });

  it('validates title minimum length', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const titleInput = screen.getByTestId('feedback-title');
    await user.type(titleInput, 'Hi');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Title must be at least 5 characters long')
      ).toBeInTheDocument();
    });
  });

  it('validates description minimum length', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const descriptionInput = screen.getByTestId('feedback-description');
    await user.type(descriptionInput, 'Short');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.getByText('Description must be at least 20 characters long')
      ).toBeInTheDocument();
    });
  });

  it('submits form with valid anonymous feedback', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

    // Select anonymous
    const anonymousCheckbox = screen.getByTestId('feedback-anonymous');
    await user.click(anonymousCheckbox);

    // Fill required fields
    const bugRadio = screen.getByTestId('feedbackType-bug-radio');
    await user.click(bugRadio);

    // Select categories
    const categoriesButton = screen.getByTestId('categories-multiselect');
    await user.click(categoriesButton);
    const uiOption = screen.getByTestId('categories-option-ui-design');
    await user.click(uiOption);

    await user.type(
      screen.getByTestId('feedback-title'),
      'Test feedback title'
    );
    await user.type(
      screen.getByTestId('feedback-description'),
      'This is a detailed test description with enough characters'
    );

    const submitButton = screen.getByTestId('feedback-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          feedbackType: 'bug',
          categories: ['ui-design'],
          title: 'Test feedback title',
          description:
            'This is a detailed test description with enough characters',
          anonymous: true,
          name: '',
          email: '',
        })
      );
    });
  });

  it('submits form with valid non-anonymous feedback', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill contact information
    await user.type(screen.getByTestId('feedback-name'), 'John Doe');
    await user.type(screen.getByTestId('feedback-email'), 'john@example.com');

    // Fill required fields
    const featureRadio = screen.getByTestId('feedbackType-feature-radio');
    await user.click(featureRadio);

    // Select categories
    const categoriesButton = screen.getByTestId('categories-multiselect');
    await user.click(categoriesButton);
    const navigationOption = screen.getByTestId('categories-option-navigation');
    await user.click(navigationOption);

    await user.type(
      screen.getByTestId('feedback-title'),
      'Feature request title'
    );
    await user.type(
      screen.getByTestId('feedback-description'),
      'This is a detailed feature request description with enough characters'
    );

    const submitButton = screen.getByTestId('feedback-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          feedbackType: 'feature',
          categories: ['navigation'],
          title: 'Feature request title',
          description:
            'This is a detailed feature request description with enough characters',
          anonymous: false,
        })
      );
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

    // Select anonymous and fill required fields
    const anonymousCheckbox = screen.getByTestId('feedback-anonymous');
    await user.click(anonymousCheckbox);

    const generalRadio = screen.getByTestId('feedbackType-general-radio');
    await user.click(generalRadio);

    const categoriesButton = screen.getByTestId('categories-multiselect');
    await user.click(categoriesButton);
    const uiOption = screen.getByTestId('categories-option-ui-design');
    await user.click(uiOption);

    await user.type(screen.getByTestId('feedback-title'), 'Test title');
    await user.type(
      screen.getByTestId('feedback-description'),
      'This is a test description with enough characters'
    );

    const submitButton = screen.getByTestId('feedback-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Feedback Submitted Successfully!')
      ).toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'));

    render(<FeedbackForm {...defaultProps} onSubmit={onSubmit} />);

    // Select anonymous and fill required fields
    const anonymousCheckbox = screen.getByTestId('feedback-anonymous');
    await user.click(anonymousCheckbox);

    const generalRadio = screen.getByTestId('feedbackType-general-radio');
    await user.click(generalRadio);

    const categoriesButton = screen.getByTestId('categories-multiselect');
    await user.click(categoriesButton);
    const uiOption = screen.getByTestId('categories-option-ui-design');
    await user.click(uiOption);

    await user.type(screen.getByTestId('feedback-title'), 'Test title');
    await user.type(
      screen.getByTestId('feedback-description'),
      'This is a test description with enough characters'
    );

    const submitButton = screen.getByTestId('feedback-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('validates attachment URL format', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const attachmentInput = screen.getByTestId('feedback-attachmentUrl');
    await user.type(attachmentInput, 'not-a-url');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });
  });

  it('allows valid attachment URL', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const attachmentInput = screen.getByTestId('feedback-attachmentUrl');
    await user.type(attachmentInput, 'https://example.com/screenshot.png');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid URL')
      ).not.toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<FeedbackForm {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByTestId('feedback-cancel');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('limits category selections to maximum', async () => {
    const user = userEvent.setup();

    render(<FeedbackForm {...defaultProps} />);

    const categoriesButton = screen.getByTestId('categories-multiselect');
    await user.click(categoriesButton);

    // Select maximum allowed categories (5)
    const categories = ['ui-design', 'navigation', 'forms', 'search', 'mobile'];
    for (const category of categories) {
      const option = screen.getByTestId(`categories-option-${category}`);
      await user.click(option);
    }

    // Try to select one more - should be disabled
    const accessibilityOption = screen.getByTestId(
      'categories-option-accessibility'
    );
    expect(accessibilityOption).toBeDisabled();
  });
});

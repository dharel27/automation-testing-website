import React, { useState } from 'react';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormSelect, SelectOption } from './FormSelect';
import { FormCheckbox } from './FormCheckbox';
import { FormRadioGroup, RadioOption } from './FormRadioGroup';
import { FormMultiSelect, MultiSelectOption } from './FormMultiSelect';
import {
  validateEmail,
  validateRequired,
  validateMinLength,
  validateUrl,
  ValidationResult,
} from './validation';

interface FeedbackFormData {
  name: string;
  email: string;
  userType: string;
  feedbackType: string;
  rating: string;
  categories: string[];
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  browserInfo: string;
  attachmentUrl: string;
  allowContact: boolean;
  anonymous: boolean;
}

interface FeedbackFormProps {
  onSubmit?: (data: FeedbackFormData) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const userTypeOptions: SelectOption[] = [
  { value: 'new-user', label: 'New User (less than 1 month)' },
  { value: 'regular-user', label: 'Regular User (1-6 months)' },
  { value: 'experienced-user', label: 'Experienced User (6+ months)' },
  { value: 'developer', label: 'Developer/Technical User' },
  { value: 'admin', label: 'Administrator' },
];

const feedbackTypeOptions: RadioOption[] = [
  {
    value: 'bug',
    label: 'Bug Report',
    helpText: 'Something is not working as expected',
  },
  {
    value: 'feature',
    label: 'Feature Request',
    helpText: 'Suggest a new feature or improvement',
  },
  {
    value: 'usability',
    label: 'Usability Issue',
    helpText: 'Something is confusing or hard to use',
  },
  {
    value: 'performance',
    label: 'Performance Issue',
    helpText: 'Something is slow or unresponsive',
  },
  {
    value: 'general',
    label: 'General Feedback',
    helpText: 'General comments or suggestions',
  },
];

const ratingOptions: RadioOption[] = [
  { value: '1', label: '1 - Very Poor' },
  { value: '2', label: '2 - Poor' },
  { value: '3', label: '3 - Average' },
  { value: '4', label: '4 - Good' },
  { value: '5', label: '5 - Excellent' },
];

const categoryOptions: MultiSelectOption[] = [
  { value: 'ui-design', label: 'UI/Design' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'forms', label: 'Forms & Input' },
  { value: 'search', label: 'Search Functionality' },
  { value: 'mobile', label: 'Mobile Experience' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'api', label: 'API/Integration' },
  { value: 'documentation', label: 'Documentation' },
];

const browserOptions: SelectOption[] = [
  { value: 'chrome', label: 'Google Chrome' },
  { value: 'firefox', label: 'Mozilla Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'edge', label: 'Microsoft Edge' },
  { value: 'opera', label: 'Opera' },
  { value: 'other', label: 'Other' },
];

export function FeedbackForm({
  onSubmit,
  onCancel,
  className = '',
}: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: '',
    email: '',
    userType: '',
    feedbackType: '',
    rating: '',
    categories: [],
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    browserInfo: '',
    attachmentUrl: '',
    allowContact: true,
    anonymous: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateTitle = (title: string): ValidationResult => {
    const requiredResult = validateRequired(title, 'Title');
    if (!requiredResult.isValid) return requiredResult;

    return validateMinLength(title, 5, 'Title');
  };

  const validateDescription = (description: string): ValidationResult => {
    const requiredResult = validateRequired(description, 'Description');
    if (!requiredResult.isValid) return requiredResult;

    return validateMinLength(description, 20, 'Description');
  };

  const validateCategories = (categories: string[]): ValidationResult => {
    if (categories.length === 0) {
      return { isValid: false, error: 'Please select at least one category' };
    }
    return { isValid: true };
  };

  const handleInputChange =
    (field: keyof FeedbackFormData) => (value: string | boolean | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSubmitError(undefined);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Basic validation
    if (
      !formData.feedbackType ||
      !formData.title ||
      !formData.description ||
      formData.categories.length === 0
    ) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (!formData.anonymous && (!formData.name || !formData.email)) {
      setSubmitError(
        'Please provide your name and email, or select anonymous feedback'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      await onSubmit?.(formData);
      setSubmitSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          userType: '',
          feedbackType: '',
          rating: '',
          categories: [],
          title: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          browserInfo: '',
          attachmentUrl: '',
          allowContact: true,
          anonymous: false,
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      setSubmitError(
        error.message || 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBugReport = formData.feedbackType === 'bug';
  const showContactFields = !formData.anonymous;

  if (submitSuccess) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="h-12 w-12 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
            Feedback Submitted Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Thank you for your feedback. We appreciate your input and will
            review it carefully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        data-testid="feedback-form"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Share Your Feedback
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Help us improve by sharing your thoughts, reporting bugs, or
            suggesting new features.
          </p>
        </div>

        {submitError && (
          <div
            className="p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-700"
            role="alert"
            data-testid="feedback-form-error"
          >
            {submitError}
          </div>
        )}

        {/* Privacy Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Privacy Options
          </h3>

          <FormCheckbox
            id="anonymous"
            name="anonymous"
            label="Submit feedback anonymously"
            checked={formData.anonymous}
            onChange={handleInputChange('anonymous')}
            helpText="Your personal information will not be collected or stored"
            data-testid="feedback-anonymous"
          />
        </div>

        {/* Contact Information */}
        {showContactFields && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="name"
                name="name"
                label="Your Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required={!formData.anonymous}
                validator={(value) =>
                  formData.anonymous
                    ? { isValid: true }
                    : validateRequired(value, 'Name')
                }
                data-testid="feedback-name"
              />

              <FormInput
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange('email')}
                required={!formData.anonymous}
                validator={(value) =>
                  formData.anonymous ? { isValid: true } : validateEmail(value)
                }
                data-testid="feedback-email"
              />
            </div>

            <FormSelect
              id="userType"
              name="userType"
              label="User Type"
              value={formData.userType}
              onChange={handleInputChange('userType')}
              options={userTypeOptions}
              helpText="This helps us understand your perspective"
              data-testid="feedback-userType"
            />

            <FormCheckbox
              id="allowContact"
              name="allowContact"
              label="Allow us to contact you about this feedback"
              checked={formData.allowContact}
              onChange={handleInputChange('allowContact')}
              helpText="We may reach out for clarification or to provide updates"
              data-testid="feedback-allowContact"
            />
          </div>
        )}

        {/* Feedback Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Feedback Details
          </h3>

          <FormRadioGroup
            name="feedbackType"
            label="Type of Feedback"
            value={formData.feedbackType}
            onChange={handleInputChange('feedbackType')}
            options={feedbackTypeOptions}
            required
            data-testid="feedback-type"
          />

          <FormMultiSelect
            id="categories"
            name="categories"
            label="Categories"
            values={formData.categories}
            onChange={handleInputChange('categories')}
            options={categoryOptions}
            required
            maxSelections={5}
            validator={validateCategories}
            helpText="Select all relevant categories (max 5)"
            data-testid="feedback-categories"
          />

          <FormInput
            id="title"
            name="title"
            label="Title"
            value={formData.title}
            onChange={handleInputChange('title')}
            required
            validator={validateTitle}
            helpText="Provide a brief, descriptive title"
            data-testid="feedback-title"
          />

          <FormTextarea
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange('description')}
            required
            rows={6}
            maxLength={2000}
            validator={validateDescription}
            helpText="Provide detailed information about your feedback"
            data-testid="feedback-description"
          />

          {formData.rating && (
            <FormRadioGroup
              name="rating"
              label="Overall Rating"
              value={formData.rating}
              onChange={handleInputChange('rating')}
              options={ratingOptions}
              helpText="Rate your overall experience"
              data-testid="feedback-rating"
            />
          )}
        </div>

        {/* Bug Report Specific Fields */}
        {isBugReport && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Bug Report Details
            </h3>

            <FormTextarea
              id="stepsToReproduce"
              name="stepsToReproduce"
              label="Steps to Reproduce"
              value={formData.stepsToReproduce}
              onChange={handleInputChange('stepsToReproduce')}
              rows={4}
              maxLength={1000}
              helpText="List the steps to reproduce the bug (1. First step, 2. Second step, etc.)"
              data-testid="feedback-stepsToReproduce"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextarea
                id="expectedBehavior"
                name="expectedBehavior"
                label="Expected Behavior"
                value={formData.expectedBehavior}
                onChange={handleInputChange('expectedBehavior')}
                rows={3}
                maxLength={500}
                helpText="What should have happened?"
                data-testid="feedback-expectedBehavior"
              />

              <FormTextarea
                id="actualBehavior"
                name="actualBehavior"
                label="Actual Behavior"
                value={formData.actualBehavior}
                onChange={handleInputChange('actualBehavior')}
                rows={3}
                maxLength={500}
                helpText="What actually happened?"
                data-testid="feedback-actualBehavior"
              />
            </div>

            <FormSelect
              id="browserInfo"
              name="browserInfo"
              label="Browser"
              value={formData.browserInfo}
              onChange={handleInputChange('browserInfo')}
              options={browserOptions}
              helpText="Which browser were you using when the bug occurred?"
              data-testid="feedback-browserInfo"
            />
          </div>
        )}

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Additional Information
          </h3>

          <FormInput
            id="attachmentUrl"
            name="attachmentUrl"
            type="url"
            label="Attachment URL"
            value={formData.attachmentUrl}
            onChange={handleInputChange('attachmentUrl')}
            validator={validateUrl}
            helpText="Link to screenshots, videos, or other relevant files"
            data-testid="feedback-attachmentUrl"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
            data-testid="feedback-submit"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting Feedback...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              data-testid="feedback-cancel"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

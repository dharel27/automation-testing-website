import React, { useState } from 'react';
import { FormInput } from './FormInput';
import { FormPhoneInput } from './FormPhoneInput';
import { FormTextarea } from './FormTextarea';
import { FormSelect, SelectOption } from './FormSelect';
import { FormCheckbox } from './FormCheckbox';
import { FormRadioGroup, RadioOption } from './FormRadioGroup';
import {
  validateEmail,
  validateRequired,
  validateMinLength,
  ValidationResult,
} from './validation';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  inquiryType: string;
  priority: string;
  subject: string;
  message: string;
  newsletter: boolean;
  preferredContact: string;
}

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const inquiryTypeOptions: SelectOption[] = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'sales', label: 'Sales Question' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'feedback', label: 'Product Feedback' },
  { value: 'other', label: 'Other' },
];

const priorityOptions: RadioOption[] = [
  { value: 'low', label: 'Low', helpText: 'Response within 3-5 business days' },
  {
    value: 'medium',
    label: 'Medium',
    helpText: 'Response within 1-2 business days',
  },
  { value: 'high', label: 'High', helpText: 'Response within 24 hours' },
  { value: 'urgent', label: 'Urgent', helpText: 'Response within 4 hours' },
];

const contactMethodOptions: RadioOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'either', label: 'Either email or phone' },
];

export function ContactForm({
  onSubmit,
  onCancel,
  className = '',
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    inquiryType: '',
    priority: 'medium',
    subject: '',
    message: '',
    newsletter: false,
    preferredContact: 'email',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateSubject = (subject: string): ValidationResult => {
    const requiredResult = validateRequired(subject, 'Subject');
    if (!requiredResult.isValid) return requiredResult;

    return validateMinLength(subject, 5, 'Subject');
  };

  const validateMessage = (message: string): ValidationResult => {
    const requiredResult = validateRequired(message, 'Message');
    if (!requiredResult.isValid) return requiredResult;

    return validateMinLength(message, 20, 'Message');
  };

  const validateInquiryType = (inquiryType: string): ValidationResult => {
    return validateRequired(inquiryType, 'Inquiry type');
  };

  const handleInputChange =
    (field: keyof ContactFormData) => (value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSubmitError(undefined);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.inquiryType ||
      !formData.subject ||
      !formData.message
    ) {
      setSubmitError('Please fill in all required fields');
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
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          jobTitle: '',
          inquiryType: '',
          priority: 'medium',
          subject: '',
          message: '',
          newsletter: false,
          preferredContact: 'email',
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      setSubmitError(
        error.message || 'Failed to submit contact form. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Message Sent Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Thank you for contacting us. We'll get back to you soon based on
            your selected priority level.
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
        data-testid="contact-form"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contact Us
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>

        {submitError && (
          <div
            className="p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-700"
            role="alert"
            data-testid="contact-form-error"
          >
            {submitError}
          </div>
        )}

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="firstName"
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              required
              validator={(value) => validateRequired(value, 'First name')}
              data-testid="contact-firstName"
            />

            <FormInput
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              required
              validator={(value) => validateRequired(value, 'Last name')}
              data-testid="contact-lastName"
            />
          </div>

          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            validator={validateEmail}
            data-testid="contact-email"
          />

          <FormPhoneInput
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            data-testid="contact-phone"
          />
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Professional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="company"
              name="company"
              label="Company"
              value={formData.company}
              onChange={handleInputChange('company')}
              data-testid="contact-company"
            />

            <FormInput
              id="jobTitle"
              name="jobTitle"
              label="Job Title"
              value={formData.jobTitle}
              onChange={handleInputChange('jobTitle')}
              data-testid="contact-jobTitle"
            />
          </div>
        </div>

        {/* Inquiry Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Inquiry Details
          </h3>

          <FormSelect
            id="inquiryType"
            name="inquiryType"
            label="Type of Inquiry"
            value={formData.inquiryType}
            onChange={handleInputChange('inquiryType')}
            options={inquiryTypeOptions}
            required
            validator={validateInquiryType}
            data-testid="contact-inquiryType"
          />

          <FormRadioGroup
            name="priority"
            label="Priority Level"
            value={formData.priority}
            onChange={handleInputChange('priority')}
            options={priorityOptions}
            required
            data-testid="contact-priority"
          />

          <FormInput
            id="subject"
            name="subject"
            label="Subject"
            value={formData.subject}
            onChange={handleInputChange('subject')}
            required
            validator={validateSubject}
            helpText="Please provide a brief subject for your inquiry"
            data-testid="contact-subject"
          />

          <FormTextarea
            id="message"
            name="message"
            label="Message"
            value={formData.message}
            onChange={handleInputChange('message')}
            required
            rows={6}
            maxLength={2000}
            validator={validateMessage}
            helpText="Please provide detailed information about your inquiry"
            data-testid="contact-message"
          />
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Contact Preferences
          </h3>

          <FormRadioGroup
            name="preferredContact"
            label="Preferred Contact Method"
            value={formData.preferredContact}
            onChange={handleInputChange('preferredContact')}
            options={contactMethodOptions}
            required
            data-testid="contact-preferredContact"
          />

          <FormCheckbox
            id="newsletter"
            name="newsletter"
            label="Subscribe to our newsletter for updates and announcements"
            checked={formData.newsletter}
            onChange={handleInputChange('newsletter')}
            data-testid="contact-newsletter"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
            data-testid="contact-submit"
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
                Sending Message...
              </>
            ) : (
              'Send Message'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              data-testid="contact-cancel"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

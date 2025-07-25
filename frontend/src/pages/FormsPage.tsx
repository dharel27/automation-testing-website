import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ContactForm } from '../components/forms/ContactForm';
import { FeedbackForm } from '../components/forms/FeedbackForm';

type ActiveForm = 'contact' | 'feedback' | 'demo';

export function FormsPage() {
  const [activeForm, setActiveForm] = useState<ActiveForm>('contact');

  const handleContactSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Contact form submitted:', data);
  };

  const handleFeedbackSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Feedback form submitted:', data);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Form Components & Validation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive form components with real-time validation,
              accessibility features, and extensive input types for automation
              testing.
            </p>
          </div>

          {/* Form Navigation */}
          <div className="flex justify-center mb-8">
            <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveForm('contact')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeForm === 'contact'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid="contact-form-tab"
              >
                Contact Form
              </button>
              <button
                onClick={() => setActiveForm('feedback')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeForm === 'feedback'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid="feedback-form-tab"
              >
                Feedback Form
              </button>
              <button
                onClick={() => setActiveForm('demo')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeForm === 'demo'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid="demo-form-tab"
              >
                Component Demo
              </button>
            </nav>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {activeForm === 'contact' && (
              <ContactForm onSubmit={handleContactSubmit} />
            )}

            {activeForm === 'feedback' && (
              <FeedbackForm onSubmit={handleFeedbackSubmit} />
            )}

            {activeForm === 'demo' && <ComponentDemo />}
          </div>

          {/* Features List */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
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
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  Real-time Validation
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive validation for email, phone, password, and custom
                formats with immediate feedback and user-friendly error
                messages.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                    />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  Accessibility First
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Full ARIA support, keyboard navigation, screen reader
                compatibility, and WCAG 2.1 AA compliance for inclusive user
                experiences.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  Test Automation Ready
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive data-testid attributes, unique IDs, and semantic
                markup optimized for Selenium, Cypress, and Playwright testing
                frameworks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Component Demo Section
function ComponentDemo() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Form Component Showcase
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive examples of all available form components with validation
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Input Components
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Text Input
              </div>
              <input
                type="text"
                placeholder="Enter text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                data-testid="demo-text-input"
              />
            </div>
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Input
              </div>
              <input
                type="email"
                placeholder="Enter email"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                data-testid="demo-email-input"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Selection Components
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dropdown Select
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                data-testid="demo-select"
              >
                <option value="">Select an option</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
                <option value="option3">Option 3</option>
              </select>
            </div>

            <div>
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Radio Buttons
                </legend>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="radio1"
                      name="demo-radio"
                      type="radio"
                      value="option1"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      data-testid="demo-radio-1"
                    />
                    <label
                      htmlFor="radio1"
                      className="ml-3 text-sm text-gray-900 dark:text-gray-300"
                    >
                      Radio Option 1
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="radio2"
                      name="demo-radio"
                      type="radio"
                      value="option2"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      data-testid="demo-radio-2"
                    />
                    <label
                      htmlFor="radio2"
                      className="ml-3 text-sm text-gray-900 dark:text-gray-300"
                    >
                      Radio Option 2
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            <div>
              <div className="flex items-start">
                <input
                  id="demo-checkbox"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                  data-testid="demo-checkbox"
                />
                <div className="ml-3">
                  <label
                    htmlFor="demo-checkbox"
                    className="text-sm text-gray-900 dark:text-gray-300"
                  >
                    Checkbox Option
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This is a checkbox with help text
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Text Area
          </h3>
          <textarea
            rows={4}
            placeholder="Enter your message here..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-vertical"
            data-testid="demo-textarea"
          />
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Form Actions
          </h3>
          <div className="flex space-x-4">
            <button
              type="button"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-testid="demo-submit-button"
            >
              Submit
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              data-testid="demo-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

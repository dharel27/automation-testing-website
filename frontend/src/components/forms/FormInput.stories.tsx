import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FormInput } from './FormInput';

const meta: Meta<typeof FormInput> = {
  title: 'Form Components/FormInput',
  component: FormInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The FormInput component is a reusable input field with built-in validation, accessibility features, and consistent styling.

## Features
- Built-in validation states with error display
- Accessibility labels and ARIA attributes
- Auto-complete support
- Loading and disabled states
- Consistent styling across the application
- TypeScript support with proper prop types

## Accessibility
- Proper label association with \`htmlFor\` and \`id\`
- ARIA attributes for error states (\`aria-invalid\`, \`aria-describedby\`)
- Screen reader friendly error messages
- Keyboard navigation support

## Testing
The component includes test IDs for automation testing:
- \`{name}-input\` - The input element
- \`{name}-label\` - The label element  
- \`{name}-error\` - The error message element
- \`{name}-help-text\` - The help text element

## Validation
The component supports various validation states and automatically handles:
- Required field validation
- Email format validation
- Password strength indicators
- Custom validation messages
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'url', 'number'],
      description: 'The input type',
    },
    label: {
      control: 'text',
      description: 'The label text for the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when input is empty',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helpText: {
      control: 'text',
      description: 'Help text to display below the input',
    },
    autoComplete: {
      control: 'text',
      description: 'HTML autocomplete attribute value',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormInput>;

// Interactive wrapper for stories
const FormInputWrapper = (args: any) => {
  const [value, setValue] = useState(args.value || '');

  return (
    <div className="w-80">
      <FormInput {...args} value={value} onChange={setValue} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'default-input',
    name: 'default',
    label: 'Default Input',
    placeholder: 'Enter some text...',
    type: 'text',
  },
};

export const Required: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'required-input',
    name: 'required',
    label: 'Required Field',
    placeholder: 'This field is required',
    type: 'text',
    required: true,
  },
};

export const WithError: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'error-input',
    name: 'error',
    label: 'Field with Error',
    placeholder: 'Enter valid email',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
    required: true,
  },
};

export const WithHelpText: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'help-input',
    name: 'help',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    helpText:
      'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers',
    required: true,
  },
};

export const Email: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'email-input',
    name: 'email',
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
    autoComplete: 'email',
    required: true,
  },
};

export const Password: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'password-input',
    name: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    autoComplete: 'current-password',
    required: true,
  },
};

export const Phone: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'phone-input',
    name: 'phone',
    label: 'Phone Number',
    placeholder: '+1 (555) 123-4567',
    type: 'tel',
    autoComplete: 'tel',
  },
};

export const Disabled: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'disabled-input',
    name: 'disabled',
    label: 'Disabled Field',
    placeholder: 'This field is disabled',
    type: 'text',
    value: 'Cannot edit this value',
    disabled: true,
  },
};

export const Loading: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'loading-input',
    name: 'loading',
    label: 'Loading State',
    placeholder: 'Loading...',
    type: 'text',
    loading: true,
  },
};

export const WithIcon: Story = {
  render: (args) => <FormInputWrapper {...args} />,
  args: {
    id: 'icon-input',
    name: 'search',
    label: 'Search',
    placeholder: 'Search for anything...',
    type: 'text',
    icon: (
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
};

export const ValidationStates: Story = {
  render: () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const emailError =
      email && !email.includes('@') ? 'Please enter a valid email' : '';
    const passwordError =
      password && password.length < 8
        ? 'Password must be at least 8 characters'
        : '';
    const confirmError =
      confirmPassword && password !== confirmPassword
        ? 'Passwords do not match'
        : '';

    return (
      <div className="w-80 space-y-4">
        <FormInput
          id="validation-email"
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={emailError}
          placeholder="Enter your email"
          required
        />
        <FormInput
          id="validation-password"
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={passwordError}
          placeholder="Enter your password"
          helpText="Must be at least 8 characters"
          required
        />
        <FormInput
          id="validation-confirm"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={confirmError}
          placeholder="Confirm your password"
          required
        />
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      website: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!formData.email.includes('@'))
        newErrors.email = 'Please enter a valid email';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        alert('Form submitted successfully!');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="w-96 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="firstName"
            name="firstName"
            label="First Name"
            type="text"
            value={formData.firstName}
            onChange={(value) => updateField('firstName', value)}
            error={errors.firstName}
            placeholder="John"
            required
          />
          <FormInput
            id="lastName"
            name="lastName"
            label="Last Name"
            type="text"
            value={formData.lastName}
            onChange={(value) => updateField('lastName', value)}
            error={errors.lastName}
            placeholder="Doe"
            required
          />
        </div>
        <FormInput
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          error={errors.email}
          placeholder="john@example.com"
          autoComplete="email"
          required
        />
        <FormInput
          id="phone"
          name="phone"
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(value) => updateField('phone', value)}
          placeholder="+1 (555) 123-4567"
          autoComplete="tel"
        />
        <FormInput
          id="website"
          name="website"
          label="Website"
          type="url"
          value={formData.website}
          onChange={(value) => updateField('website', value)}
          placeholder="https://example.com"
          helpText="Optional: Your personal or company website"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          data-testid="submit-button"
        >
          Submit Form
        </button>
      </form>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Modal component provides an accessible dialog overlay for displaying content above the main page. 
It includes focus management, keyboard navigation, and proper ARIA attributes for screen readers.

## Features
- Focus trap management
- Keyboard navigation (ESC to close)
- Overlay click handling
- Multiple sizes
- Smooth animations
- Portal rendering for proper z-index stacking

## Accessibility
- Proper ARIA attributes (\`role="dialog"\`, \`aria-modal="true"\`)
- Focus management (traps focus within modal)
- Keyboard support (ESC to close, Tab navigation)
- Screen reader announcements

## Testing
The component includes comprehensive test IDs for automation testing:
- \`modal-overlay\` - The backdrop overlay
- \`modal-container\` - The main modal container
- \`modal-header\` - The header section
- \`modal-title\` - The title element
- \`modal-content\` - The content area
- \`modal-close-button\` - The close button
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible',
    },
    title: {
      control: 'text',
      description: 'The title displayed in the modal header',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'The size of the modal',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Whether clicking the overlay closes the modal',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing ESC closes the modal',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show the close button in the header',
    },
    onClose: {
      action: 'closed',
      description: 'Callback fired when the modal is closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Interactive wrapper component for stories
const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        data-testid="open-modal-button"
      >
        Open Modal
      </button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {args.children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Default Modal',
    size: 'md',
    closeOnOverlayClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    children: (
      <div className="space-y-4">
        <p>This is a default modal with standard content.</p>
        <p>
          You can close it by clicking the X button, pressing ESC, or clicking
          outside.
        </p>
      </div>
    ),
  },
};

export const Small: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Small Modal',
    size: 'sm',
    children: (
      <div>
        <p>
          This is a small modal, perfect for simple confirmations or alerts.
        </p>
      </div>
    ),
  },
};

export const Large: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Large Modal',
    size: 'lg',
    children: (
      <div className="space-y-4">
        <p>This is a large modal with more content space.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Section 1</h3>
            <p>Content for the first section.</p>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Section 2</h3>
            <p>Content for the second section.</p>
          </div>
        </div>
      </div>
    ),
  },
};

export const WithForm: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Contact Form',
    size: 'md',
    children: (
      <form className="space-y-4" data-testid="modal-form">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="name-input"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="email-input"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="message-textarea"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            data-testid="submit-button"
          >
            Submit
          </button>
        </div>
      </form>
    ),
  },
};

export const Confirmation: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Confirm Action',
    size: 'sm',
    children: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Delete Item</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            data-testid="delete-button"
          >
            Delete
          </button>
        </div>
      </div>
    ),
  },
};

export const NoCloseButton: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Modal Without Close Button',
    size: 'md',
    showCloseButton: false,
    closeOnOverlayClick: false,
    closeOnEscape: false,
    children: (
      <div className="space-y-4">
        <p>
          This modal can only be closed by clicking the "Done" button below.
        </p>
        <p>The close button, overlay click, and ESC key are all disabled.</p>
        <div className="flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            data-testid="done-button"
          >
            Done
          </button>
        </div>
      </div>
    ),
  },
};

export const WithScrollableContent: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Scrollable Content',
    size: 'md',
    children: (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold">Section {i + 1}</h3>
            <p>
              This is section {i + 1} with some content. The modal content is
              scrollable when it exceeds the maximum height. Lorem ipsum dolor
              sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        ))}
      </div>
    ),
  },
};

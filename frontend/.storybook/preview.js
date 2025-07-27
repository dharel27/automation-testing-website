import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../src/index.css';

// Mock implementations for Storybook
const mockAuthContext = {
  user: null,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve(),
  loading: false,
  error: null,
};

const mockNotificationContext = {
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
};

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },

  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
  },

  docs: {
    extractComponentDescription: (component, { notes }) => {
      if (notes) {
        return typeof notes === 'string' ? notes : notes.markdown || notes.text;
      }
      return null;
    },
  },

  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff',
      },
      {
        name: 'dark',
        value: '#1a1a1a',
      },
      {
        name: 'gray',
        value: '#f5f5f5',
      },
    ],
  },

  viewport: {
    viewports: {
      ...INITIAL_VIEWPORTS,
      mobile1: {
        name: 'Small Mobile',
        styles: {
          width: '320px',
          height: '568px',
        },
      },
      mobile2: {
        name: 'Large Mobile',
        styles: {
          width: '414px',
          height: '896px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1024px',
          height: '768px',
        },
      },
      largeDesktop: {
        name: 'Large Desktop',
        styles: {
          width: '1440px',
          height: '900px',
        },
      },
    },
  },

  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: false, // Disable for Storybook as it can be flaky
        },
      ],
    },
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },

  layout: 'centered',
};

// Global decorators
export const decorators = [
  // Theme decorator
  (Story, context) => {
    const theme = context.globals.theme || 'light';

    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <Story />
        </div>
      </div>
    );
  },

  // Context providers decorator
  (Story) => {
    // Mock context providers for components that need them
    const AuthContext = React.createContext(mockAuthContext);
    const NotificationContext = React.createContext(mockNotificationContext);

    return (
      <AuthContext.Provider value={mockAuthContext}>
        <NotificationContext.Provider value={mockNotificationContext}>
          <Story />
        </NotificationContext.Provider>
      </AuthContext.Provider>
    );
  },

  // Padding decorator for better visual presentation
  (Story) => (
    <div style={{ padding: '1rem' }}>
      <Story />
    </div>
  ),
];

// Global types for theme switching
export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'light', icon: 'circlehollow', title: 'Light theme' },
        { value: 'dark', icon: 'circle', title: 'Dark theme' },
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
};

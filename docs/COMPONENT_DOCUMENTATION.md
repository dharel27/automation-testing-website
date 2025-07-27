# Component Documentation

This document provides comprehensive documentation for all React components in the Automation Testing Website. Each component is designed with automation testing in mind, featuring proper accessibility attributes, test IDs, and clear APIs.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [UI Components](#ui-components)
- [Authentication Components](#authentication-components)
- [Testing Utilities](#testing-utilities)
- [Accessibility Features](#accessibility-features)
- [Styling Guidelines](#styling-guidelines)

## Component Architecture

### Design Principles

1. **Testability First**: Every component includes `data-testid` attributes and proper ARIA labels
2. **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
3. **Reusability**: Components are designed to be reusable across different contexts
4. **Type Safety**: Full TypeScript support with comprehensive prop types
5. **Performance**: Optimized for performance with proper memoization and lazy loading

### Component Structure

```typescript
interface ComponentProps {
  // Required props
  id: string;
  children: React.ReactNode;

  // Optional props with defaults
  className?: string;
  disabled?: boolean;

  // Event handlers
  onClick?: (event: React.MouseEvent) => void;

  // Accessibility props
  "aria-label"?: string;
  "data-testid"?: string;
}

const Component: React.FC<ComponentProps> = ({
  id,
  children,
  className = "",
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
  "data-testid": testId = "component",
  ...props
}) => {
  return (
    <div
      id={id}
      className={`component-base ${className}`}
      data-testid={testId}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  );
};
```

## Layout Components

### Header Component

**Location**: `src/components/layout/Header.tsx`

**Purpose**: Main navigation header with user authentication status and theme toggle.

**Props**:

```typescript
interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}
```

**Features**:

- Responsive navigation menu
- User authentication status
- Dark/light theme toggle
- Mobile hamburger menu
- Accessibility-compliant navigation

**Test IDs**:

- `header-container`
- `nav-menu`
- `user-menu`
- `theme-toggle`
- `mobile-menu-button`
- `logout-button`

**Usage**:

```tsx
<Header
  user={currentUser}
  onLogout={handleLogout}
  onThemeToggle={toggleTheme}
  isDarkMode={isDarkMode}
/>
```

**Automation Testing**:

```javascript
// Cypress example
cy.get('[data-testid="header-container"]').should("be.visible");
cy.get('[data-testid="user-menu"]').click();
cy.get('[data-testid="logout-button"]').click();

// Playwright example
await page.locator('[data-testid="theme-toggle"]').click();
await expect(page.locator("body")).toHaveClass(/dark-theme/);
```

### Footer Component

**Location**: `src/components/layout/Footer.tsx`

**Purpose**: Site footer with links and accessibility information.

**Props**:

```typescript
interface FooterProps {
  className?: string;
  showAccessibilityLinks?: boolean;
}
```

**Features**:

- Responsive layout
- Accessibility statement link
- Social media links
- Copyright information
- Skip links for screen readers

**Test IDs**:

- `footer-container`
- `footer-links`
- `accessibility-link`
- `copyright-text`

### Layout Component

**Location**: `src/components/layout/Layout.tsx`

**Purpose**: Main layout wrapper that provides consistent structure across pages.

**Props**:

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}
```

**Features**:

- Responsive grid layout
- Skip navigation links
- Page title management
- Consistent spacing and typography
- Mobile-first design

## Form Components

### FormInput Component

**Location**: `src/components/forms/FormInput.tsx`

**Purpose**: Reusable input field with validation and accessibility features.

**Props**:

```typescript
interface FormInputProps {
  id: string;
  name: string;
  type?: "text" | "email" | "password" | "tel" | "url";
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  "data-testid"?: string;
}
```

**Features**:

- Built-in validation states
- Error message display
- Accessibility labels and descriptions
- Auto-complete support
- Loading states

**Test IDs**:

- `${name}-input`
- `${name}-label`
- `${name}-error`
- `${name}-help-text`

**Usage**:

```tsx
<FormInput
  id="email"
  name="email"
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
  autoComplete="email"
  data-testid="email-input"
/>
```

**Automation Testing**:

```javascript
// Test input validation
cy.get('[data-testid="email-input"]').type("invalid-email").blur();
cy.get('[data-testid="email-error"]').should(
  "contain",
  "Please enter a valid email"
);

// Test successful input
cy.get('[data-testid="email-input"]').clear().type("user@example.com");
cy.get('[data-testid="email-error"]').should("not.exist");
```

### FormSelect Component

**Location**: `src/components/forms/FormSelect.tsx`

**Purpose**: Dropdown select component with search and multi-select capabilities.

**Props**:

```typescript
interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

**Features**:

- Single and multi-select modes
- Search functionality
- Keyboard navigation
- Custom option rendering
- Loading states

**Test IDs**:

- `${name}-select`
- `${name}-option-${value}`
- `${name}-search-input`
- `${name}-clear-button`

### ContactForm Component

**Location**: `src/components/forms/ContactForm.tsx`

**Purpose**: Complete contact form with validation and submission handling.

**Features**:

- Real-time validation
- File attachment support
- CAPTCHA integration
- Success/error states
- Accessibility compliance

**Test IDs**:

- `contact-form`
- `contact-name-input`
- `contact-email-input`
- `contact-message-textarea`
- `contact-submit-button`
- `contact-success-message`

## UI Components

### Modal Component

**Location**: `src/components/ui/Modal.tsx`

**Purpose**: Accessible modal dialog with various content types.

**Props**:

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}
```

**Features**:

- Focus trap management
- Keyboard navigation (ESC to close)
- Overlay click handling
- Multiple sizes
- Smooth animations
- Portal rendering

**Test IDs**:

- `modal-overlay`
- `modal-container`
- `modal-header`
- `modal-title`
- `modal-content`
- `modal-close-button`

**Usage**:

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="modal-actions">
    <Button onClick={handleConfirm}>Confirm</Button>
    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
      Cancel
    </Button>
  </div>
</Modal>
```

**Automation Testing**:

```javascript
// Open modal
cy.get('[data-testid="open-modal-button"]').click();
cy.get('[data-testid="modal-container"]').should("be.visible");

// Test focus trap
cy.get('[data-testid="modal-close-button"]').should("be.focused");
cy.tab();
cy.get('[data-testid="confirm-button"]').should("be.focused");

// Close with ESC
cy.get("body").type("{esc}");
cy.get('[data-testid="modal-container"]').should("not.exist");
```

### DataTable Component

**Location**: `src/components/ui/DataTable.tsx`

**Purpose**: Feature-rich data table with sorting, filtering, and pagination.

**Props**:

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  selection?: SelectionConfig;
  onRowClick?: (row: T) => void;
  className?: string;
}

interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}
```

**Features**:

- Sortable columns
- Column filtering
- Row selection
- Pagination
- Loading states
- Responsive design
- Keyboard navigation

**Test IDs**:

- `data-table`
- `table-header-${columnKey}`
- `table-row-${index}`
- `table-cell-${rowIndex}-${columnKey}`
- `table-pagination`
- `table-sort-button-${columnKey}`

### Carousel Component

**Location**: `src/components/ui/Carousel.tsx`

**Purpose**: Image and content carousel with touch and keyboard support.

**Props**:

```typescript
interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  infinite?: boolean;
  className?: string;
}

interface CarouselItem {
  id: string;
  content: React.ReactNode;
  alt?: string;
}
```

**Features**:

- Touch/swipe support
- Keyboard navigation
- Auto-play functionality
- Infinite scrolling
- Responsive design
- Accessibility compliance

**Test IDs**:

- `carousel-container`
- `carousel-item-${index}`
- `carousel-prev-button`
- `carousel-next-button`
- `carousel-dot-${index}`

## Authentication Components

### LoginForm Component

**Location**: `src/components/auth/LoginForm.tsx`

**Purpose**: User login form with validation and error handling.

**Props**:

```typescript
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
  redirectTo?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Features**:

- Email/password validation
- Remember me functionality
- Loading states
- Error display
- Forgot password link
- Social login options

**Test IDs**:

- `login-form`
- `email-input`
- `password-input`
- `remember-me-checkbox`
- `login-button`
- `forgot-password-link`
- `login-error-message`

### ProtectedRoute Component

**Location**: `src/components/auth/ProtectedRoute.tsx`

**Purpose**: Route wrapper that requires authentication.

**Props**:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
  fallback?: React.ReactNode;
}
```

**Features**:

- Role-based access control
- Automatic redirects
- Loading states
- Custom fallback components

## Testing Utilities

### Component Testing Helpers

**Location**: `src/utils/testUtils.tsx`

**Purpose**: Utilities for testing React components.

```typescript
// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock user for testing
export const mockUser: User = {
  id: "1",
  username: "testuser",
  email: "test@example.com",
  role: "user",
  profile: {
    firstName: "Test",
    lastName: "User",
  },
};

// Wait for async operations
export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
};
```

### Accessibility Testing

**Location**: `src/utils/axeConfig.ts`

**Purpose**: Configuration for automated accessibility testing.

```typescript
import { configureAxe } from "jest-axe";

export const axe = configureAxe({
  rules: {
    // Disable color-contrast rule for testing (can be flaky)
    "color-contrast": { enabled: false },
    // Custom rules for testing environment
    "landmark-one-main": { enabled: true },
    "page-has-heading-one": { enabled: true },
  },
});

// Helper function for accessibility testing
export const checkAccessibility = async (container: HTMLElement) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};
```

## Accessibility Features

### Keyboard Navigation

All components support keyboard navigation:

- **Tab**: Move to next focusable element
- **Shift+Tab**: Move to previous focusable element
- **Enter/Space**: Activate buttons and links
- **Arrow Keys**: Navigate within components (carousels, menus)
- **Escape**: Close modals and dropdowns

### Screen Reader Support

Components include proper ARIA attributes:

```tsx
// Example: Button with screen reader support
<button
  data-testid="submit-button"
  aria-label="Submit contact form"
  aria-describedby="submit-help-text"
  disabled={isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
<div id="submit-help-text" className="sr-only">
  This will send your message to our support team
</div>
```

### Focus Management

Components properly manage focus:

```tsx
// Modal focus trap example
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector('[tabindex="0"]');
    firstFocusable?.focus();
  }
}, [isOpen]);
```

## Styling Guidelines

### CSS Classes

Components use consistent CSS class naming:

```css
/* Component base class */
.component-name {
  /* Base styles */
}

/* Modifier classes */
.component-name--variant {
  /* Variant styles */
}

.component-name--state {
  /* State styles (disabled, loading, etc.) */
}

/* Element classes */
.component-name__element {
  /* Element styles */
}
```

### Responsive Design

All components are mobile-first:

```css
/* Mobile first (default) */
.component {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}
```

### Theme Support

Components support light and dark themes:

```css
/* Light theme (default) */
.component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Dark theme */
.dark .component {
  background-color: var(--bg-primary-dark);
  color: var(--text-primary-dark);
}
```

## Component Testing Examples

### Unit Testing

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is accessible", async () => {
    const { container } = render(
      <Button aria-label="Submit form">Submit</Button>
    );

    await checkAccessibility(container);
  });
});
```

### Integration Testing

```typescript
// LoginForm.test.tsx
import { renderWithProviders } from "../utils/testUtils";
import { LoginForm } from "./LoginForm";

describe("LoginForm Integration", () => {
  it("submits form with valid data", async () => {
    const mockSubmit = jest.fn();
    renderWithProviders(<LoginForm onSubmit={mockSubmit} />);

    await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
    await userEvent.type(screen.getByTestId("password-input"), "password123");
    await userEvent.click(screen.getByTestId("login-button"));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});
```

### E2E Testing

```javascript
// login.spec.js (Playwright)
test("complete login flow", async ({ page }) => {
  await page.goto("/login");

  await page.locator('[data-testid="email-input"]').fill("test@example.com");
  await page.locator('[data-testid="password-input"]').fill("password123");
  await page.locator('[data-testid="login-button"]').click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

---

This documentation provides a comprehensive guide to all components in the Automation Testing Website. Each component is designed with testing in mind, featuring proper accessibility attributes, test IDs, and clear APIs that make automation testing straightforward and reliable.

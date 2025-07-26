# Automation Testing Examples

This directory contains example test scripts and configurations for testing the Automation Testing Website using popular automation frameworks.

## Supported Frameworks

- **Selenium WebDriver** (Python)
- **Cypress** (JavaScript)
- **Playwright** (JavaScript)

## Prerequisites

Before running any tests, ensure that:

1. The frontend application is running on `http://localhost:5173`
2. The backend API is running on `http://localhost:3001`
3. The database is initialized and accessible

### Starting the Application

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## Test Data Management

All frameworks use the test data API endpoints for consistent test data:

- `POST /api/test-data/reset` - Clear all test data
- `POST /api/test-data/seed/users` - Seed test users
- `POST /api/test-data/seed/products` - Seed test products
- `POST /api/test-data/seed/all` - Reset and seed all data
- `POST /api/test-data/seed/large-dataset` - Generate large dataset for performance testing
- `GET /api/test-data/status` - Get current data counts

### Test Users

The following test users are available after seeding:

| Email             | Password    | Role  | Name       |
| ----------------- | ----------- | ----- | ---------- |
| test1@example.com | password123 | user  | John Doe   |
| test2@example.com | password123 | user  | Jane Smith |
| admin@example.com | admin123    | admin | Admin User |
| guest@example.com | guest123    | guest | Guest User |

## Selenium WebDriver (Python)

### Setup

```bash
cd automation-examples/selenium
pip install -r requirements.txt
```

### Running Tests

```bash
# Run all tests
pytest

# Run with specific browser
pytest --browser=chrome
pytest --browser=firefox

# Run in headless mode
pytest --headless

# Run with HTML report
pytest --html=report.html

# Run specific test
pytest test_login.py::TestLogin::test_successful_login

# Run with custom base URL
pytest --base-url=http://localhost:3000
```

### Test Structure

```
selenium/
├── conftest.py          # Pytest configuration and fixtures
├── requirements.txt     # Python dependencies
├── test_login.py       # Login functionality tests
└── page_objects/       # Page Object Model classes (optional)
```

### Key Features

- Cross-browser testing (Chrome, Firefox, Edge)
- Headless mode support
- HTML test reports
- Automatic test data reset
- Page Object Model ready
- Custom WebDriver configurations

## Cypress

### Setup

```bash
cd automation-examples/cypress
npm install cypress --save-dev
npm install axios --save-dev  # For API calls in tasks
```

### Running Tests

```bash
# Open Cypress Test Runner
npx cypress open

# Run tests headlessly
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/login.cy.js"

# Run with specific browser
npx cypress run --browser chrome
npx cypress run --browser firefox

# Run with custom base URL
npx cypress run --config baseUrl=http://localhost:3000
```

### Test Structure

```
cypress/
├── cypress.config.js    # Cypress configuration
├── e2e/
│   └── login.cy.js     # Login functionality tests
└── support/
    ├── commands.js     # Custom commands
    └── e2e.js         # Support file
```

### Custom Commands

- `cy.loginAs(email, password)` - Login with credentials
- `cy.logout()` - Logout current user
- `cy.resetTestData()` - Reset test data
- `cy.getByTestId(testId)` - Get element by test ID
- `cy.fillForm(formData)` - Fill form with data object
- `cy.checkValidationErrors(fields)` - Check validation errors
- `cy.toggleDarkMode()` - Toggle dark/light theme
- `cy.testResponsive(callback)` - Test across viewports

## Playwright

### Setup

```bash
cd automation-examples/playwright
npm install @playwright/test
npx playwright install
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/login.spec.js

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run with headed mode
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```

### Test Structure

```
playwright/
├── playwright.config.js    # Playwright configuration
├── global-setup.js        # Global setup
├── global-teardown.js     # Global teardown
└── tests/
    └── login.spec.js      # Login functionality tests
```

### Key Features

- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile device testing
- Auto-waiting for elements
- Network interception
- Parallel test execution
- Rich HTML reports
- Video and screenshot capture

## Automation-Friendly Features

The application includes several features specifically designed for automation testing:

### Data Attributes

All interactive elements include automation-friendly attributes:

- `data-testid` - Primary selector for automation
- `data-automation-id` - Alternative automation ID
- `data-component` - Component type identifier
- `data-state` - Current state (enabled, disabled, loading, etc.)
- `data-value` - Current value for inputs
- `data-index` - Index for list items

### Unique IDs

All form elements and interactive components have unique IDs following the pattern:

- Form inputs: `{fieldName}-input`
- Buttons: `{action}-button`
- Navigation: `nav-{page}`
- Modals: `{type}-modal`

### ARIA Labels

Comprehensive ARIA labeling for:

- Form inputs with descriptive labels
- Buttons with action descriptions
- Navigation elements
- Modal dialogs
- Error messages

### State Management

Components expose their state through data attributes:

- Loading states: `data-state="loading"`
- Error states: `data-state="error"`
- Disabled states: `data-state="disabled"`
- Active states: `data-state="active"`

### Event Hooks

The application provides automation event hooks accessible via `window.automationUtils`:

```javascript
// Wait for element to appear
await window.automationUtils.waitForElement('[data-testid="login-form"]');

// Get element by test ID
const element = window.automationUtils.getElementByTestId("login-submit");

// Get component state
const state = window.automationUtils.getComponentState("login-form");

// Trigger custom events
window.automationUtils.eventHooks.emit("test-event", { data: "value" });
```

## Best Practices

### Element Selection

1. **Primary**: Use `data-testid` attributes

   ```javascript
   // Good
   cy.get('[data-testid="login-submit"]');

   // Avoid
   cy.get(".btn-primary");
   ```

2. **Fallback**: Use semantic selectors

   ```javascript
   // Acceptable
   cy.get('button[type="submit"]');
   cy.get('input[name="email"]');
   ```

3. **Avoid**: CSS classes and complex selectors
   ```javascript
   // Avoid
   cy.get(".form-container .btn.btn-primary.btn-lg");
   ```

### Test Data

1. **Reset before each test**: Ensure clean state
2. **Use API endpoints**: Faster than UI-based setup
3. **Seed consistent data**: Use predefined test users/products
4. **Clean up after tests**: Remove test-specific data

### Waiting Strategies

1. **Explicit waits**: Wait for specific conditions

   ```javascript
   // Cypress
   cy.get('[data-testid="user-menu"]').should("be.visible");

   // Playwright
   await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

   // Selenium
   wait.until(
     EC.visibility_of_element_located(
       (By.CSS_SELECTOR, '[data-testid="user-menu"]')
     )
   );
   ```

2. **Avoid fixed delays**: Use dynamic waits instead of `sleep()`

### Error Handling

1. **Graceful failures**: Handle network errors and timeouts
2. **Meaningful assertions**: Use descriptive error messages
3. **Screenshot on failure**: Capture state for debugging
4. **Retry mechanisms**: Handle flaky tests appropriately

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Start application
        run: |
          cd backend && npm run dev &
          cd frontend && npm run dev &

      - name: Wait for application
        run: npx wait-on http://localhost:5173 http://localhost:3001

      - name: Run Cypress tests
        run: |
          cd automation-examples/cypress
          npx cypress run

      - name: Run Playwright tests
        run: |
          cd automation-examples/playwright
          npx playwright test
```

## Troubleshooting

### Common Issues

1. **Application not running**: Ensure both frontend and backend are started
2. **Port conflicts**: Check that ports 5173 and 3001 are available
3. **Test data issues**: Verify API endpoints are accessible
4. **Browser issues**: Update browser drivers/binaries
5. **Timing issues**: Increase timeout values if needed

### Debug Mode

- **Cypress**: Run with `--headed` flag and add `cy.pause()`
- **Playwright**: Use `--debug` flag or `page.pause()`
- **Selenium**: Remove `--headless` option and add breakpoints

### Logs and Reports

- **Cypress**: Check `cypress/videos` and `cypress/screenshots`
- **Playwright**: Use `npx playwright show-report`
- **Selenium**: Generate HTML reports with `pytest --html=report.html`

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use appropriate data-testid selectors
3. Include proper test data setup/cleanup
4. Add meaningful assertions and error messages
5. Test across different browsers/viewports
6. Document any new custom commands or utilities

## Resources

- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Page Object Model](https://selenium-python.readthedocs.io/page-objects.html)

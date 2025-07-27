# Automation Testing Guidelines and Best Practices

This document provides comprehensive guidelines and best practices for using the Automation Testing Website with various testing frameworks and tools.

## Table of Contents

- [Overview](#overview)
- [General Testing Principles](#general-testing-principles)
- [Framework-Specific Guidelines](#framework-specific-guidelines)
- [Element Identification Strategies](#element-identification-strategies)
- [Test Data Management](#test-data-management)
- [Error Handling and Debugging](#error-handling-and-debugging)
- [Performance Testing](#performance-testing)
- [Accessibility Testing](#accessibility-testing)
- [API Testing](#api-testing)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

The Automation Testing Website is designed to provide a comprehensive testing environment that supports various automation testing scenarios. It includes:

- **Functional Testing**: Forms, navigation, user interactions
- **UI Testing**: Components, responsive design, themes
- **API Testing**: RESTful endpoints with various response scenarios
- **Performance Testing**: Large datasets, file uploads, memory-intensive operations
- **Error Testing**: Simulated errors, timeout scenarios, network failures
- **Accessibility Testing**: WCAG compliance, keyboard navigation, screen readers

## General Testing Principles

### 1. Test Pyramid Strategy

Follow the test pyramid approach:

```
    /\
   /  \     E2E Tests (Few)
  /____\
 /      \   Integration Tests (Some)
/__________\ Unit Tests (Many)
```

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test API endpoints and component interactions
- **E2E Tests**: Test complete user workflows

### 2. Page Object Model (POM)

Implement the Page Object Model pattern to:

- Separate test logic from page structure
- Improve test maintainability
- Reduce code duplication
- Enhance readability

### 3. Data-Driven Testing

Use external data sources for:

- Test parameters
- Expected results
- User credentials
- Test scenarios

### 4. Independent Tests

Ensure tests are:

- Independent of each other
- Can run in any order
- Have their own test data
- Clean up after execution

## Framework-Specific Guidelines

### Selenium WebDriver

#### Setup and Configuration

```python
# Python example
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class TestConfig:
    BASE_URL = "http://localhost:5173"
    API_BASE_URL = "http://localhost:3001/api"
    TIMEOUT = 10

    @staticmethod
    def get_driver():
        options = Options()
        options.add_argument("--headless")  # For CI/CD
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        return webdriver.Chrome(options=options)
```

#### Page Object Example

```python
class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, TestConfig.TIMEOUT)

    # Locators
    EMAIL_INPUT = (By.ID, "email")
    PASSWORD_INPUT = (By.ID, "password")
    LOGIN_BUTTON = (By.DATA_TESTID, "login-button")
    ERROR_MESSAGE = (By.DATA_TESTID, "error-message")

    def navigate_to_login(self):
        self.driver.get(f"{TestConfig.BASE_URL}/login")
        return self

    def enter_email(self, email):
        element = self.wait.until(EC.presence_of_element_located(self.EMAIL_INPUT))
        element.clear()
        element.send_keys(email)
        return self

    def enter_password(self, password):
        element = self.wait.until(EC.presence_of_element_located(self.PASSWORD_INPUT))
        element.clear()
        element.send_keys(password)
        return self

    def click_login(self):
        element = self.wait.until(EC.element_to_be_clickable(self.LOGIN_BUTTON))
        element.click()
        return self

    def get_error_message(self):
        element = self.wait.until(EC.presence_of_element_located(self.ERROR_MESSAGE))
        return element.text

    def is_login_successful(self):
        try:
            self.wait.until(EC.url_contains("/dashboard"))
            return True
        except:
            return False
```

#### Test Example

```python
import pytest
from pages.login_page import LoginPage

class TestLogin:
    def setup_method(self):
        self.driver = TestConfig.get_driver()
        self.login_page = LoginPage(self.driver)

    def teardown_method(self):
        self.driver.quit()

    def test_successful_login(self):
        # Arrange
        email = "admin@example.com"
        password = "admin123"

        # Act
        self.login_page.navigate_to_login() \
                      .enter_email(email) \
                      .enter_password(password) \
                      .click_login()

        # Assert
        assert self.login_page.is_login_successful()

    def test_invalid_credentials(self):
        # Arrange
        email = "invalid@example.com"
        password = "wrongpassword"

        # Act
        self.login_page.navigate_to_login() \
                      .enter_email(email) \
                      .enter_password(password) \
                      .click_login()

        # Assert
        error_message = self.login_page.get_error_message()
        assert "Invalid credentials" in error_message
```

### Cypress

#### Configuration

```javascript
// cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    apiUrl: "http://localhost:3001/api",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

#### Custom Commands

```javascript
// cypress/support/commands.js
Cypress.Commands.add("login", (email, password) => {
  cy.visit("/login");
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

Cypress.Commands.add("createUser", (userData) => {
  cy.request({
    method: "POST",
    url: `${Cypress.config("apiUrl")}/auth/register`,
    body: userData,
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body.data;
  });
});

Cypress.Commands.add("resetDatabase", () => {
  cy.request("POST", `${Cypress.config("apiUrl")}/test/reset-data`);
});
```

#### Test Example

```javascript
// cypress/e2e/login.cy.js
describe("Login Functionality", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.createUser({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should login successfully with valid credentials", () => {
    cy.visit("/login");

    cy.get('[data-testid="email-input"]')
      .type("test@example.com")
      .should("have.value", "test@example.com");

    cy.get('[data-testid="password-input"]').type("password123");

    cy.get('[data-testid="login-button"]').click();

    cy.url().should("include", "/dashboard");
    cy.get('[data-testid="user-menu"]').should("be.visible");
  });

  it("should show error for invalid credentials", () => {
    cy.visit("/login");

    cy.get('[data-testid="email-input"]').type("invalid@example.com");
    cy.get('[data-testid="password-input"]').type("wrongpassword");
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should("be.visible")
      .and("contain", "Invalid credentials");
  });

  it("should handle network errors gracefully", () => {
    cy.intercept("POST", "/api/auth/login", { forceNetworkError: true });

    cy.visit("/login");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]').should("contain", "Network error");
  });
});
```

### Playwright

#### Configuration

```javascript
// playwright.config.js
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Page Object Example

```javascript
// tests/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async navigate() {
    await this.page.goto("/login");
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async isLoginSuccessful() {
    await this.page.waitForURL("**/dashboard");
    return this.page.url().includes("/dashboard");
  }
}

module.exports = { LoginPage };
```

#### Test Example

```javascript
// tests/login.spec.js
const { test, expect } = require("@playwright/test");
const { LoginPage } = require("./pages/LoginPage");

test.describe("Login Functionality", () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    // Reset test data
    await page.request.post("http://localhost:3001/api/test/reset-data");

    // Create test user
    await page.request.post("http://localhost:3001/api/auth/register", {
      data: {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      },
    });
  });

  test("should login successfully with valid credentials", async () => {
    await loginPage.navigate();
    await loginPage.login("test@example.com", "password123");

    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
  });

  test("should show error for invalid credentials", async () => {
    await loginPage.navigate();
    await loginPage.login("invalid@example.com", "wrongpassword");

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain("Invalid credentials");
  });

  test("should be accessible", async ({ page }) => {
    await loginPage.navigate();

    // Check for proper ARIA labels
    await expect(page.locator('[aria-label="Email address"]')).toBeVisible();
    await expect(page.locator('[aria-label="Password"]')).toBeVisible();

    // Test keyboard navigation
    await page.keyboard.press("Tab");
    await expect(loginPage.emailInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(loginPage.passwordInput).toBeFocused();
  });
});
```

## Element Identification Strategies

### Priority Order for Element Selection

1. **data-testid attributes** (Recommended)

   ```html
   <button data-testid="login-button">Login</button>
   ```

   ```javascript
   // Cypress
   cy.get('[data-testid="login-button"]');

   // Playwright
   page.locator('[data-testid="login-button"]');

   // Selenium
   driver.find_element(By.CSS_SELECTOR, '[data-testid="login-button"]');
   ```

2. **Semantic HTML elements with ARIA labels**

   ```html
   <button aria-label="Submit login form">Login</button>
   ```

3. **ID attributes** (if unique and stable)

   ```html
   <input id="email" type="email" />
   ```

4. **CSS classes** (if semantic and stable)

   ```html
   <div class="user-profile-card">...</div>
   ```

5. **XPath** (as last resort)

   ```javascript
   // Avoid complex XPath like:
   //div[@class='container']/div[2]/form/button[1]

   // Prefer semantic XPath:
   //button[contains(text(), 'Login')]
   ```

### Element Identification Best Practices

#### Use Stable Selectors

```javascript
// ❌ Avoid - fragile selectors
cy.get(".MuiButton-root:nth-child(2)");
cy.get("div > div > button");

// ✅ Prefer - stable selectors
cy.get('[data-testid="submit-button"]');
cy.get('[aria-label="Submit form"]');
```

#### Combine Multiple Attributes

```javascript
// More specific and reliable
cy.get('button[data-testid="login-button"][type="submit"]');
page.locator('input[data-testid="email-input"][type="email"]');
```

#### Use Text Content Carefully

```javascript
// ❌ Avoid - text might change or be localized
cy.contains("Click here to login");

// ✅ Better - use data attributes
cy.get('[data-testid="login-button"]');

// ✅ Acceptable - for unique, stable text
cy.contains("button", "Login");
```

## Test Data Management

### Test Data Strategy

#### 1. Use API for Data Setup

```javascript
// Cypress example
beforeEach(() => {
  // Create test user via API
  cy.request("POST", "/api/auth/register", {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  });

  // Create test products
  cy.request("POST", "/api/products", {
    name: "Test Product",
    price: 99.99,
    category: "Electronics",
  });
});
```

#### 2. Use Fixtures for Static Data

```javascript
// cypress/fixtures/users.json
{
  "validUser": {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  },
  "adminUser": {
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }
}

// In test
cy.fixture('users').then((users) => {
  cy.login(users.validUser.email, users.validUser.password);
});
```

#### 3. Generate Dynamic Test Data

```javascript
// Use faker.js or similar libraries
const faker = require("faker");

const generateUser = () => ({
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: faker.internet.password(8),
  profile: {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
  },
});
```

#### 4. Clean Up Test Data

```javascript
// After each test
afterEach(() => {
  // Reset database to clean state
  cy.request("POST", "/api/test/reset-data");
});

// Or delete specific test data
afterEach(() => {
  cy.request("DELETE", `/api/users/${testUserId}`);
});
```

### Environment-Specific Data

```javascript
// config/test-data.js
const testData = {
  development: {
    baseUrl: "http://localhost:5173",
    apiUrl: "http://localhost:3001/api",
  },
  staging: {
    baseUrl: "https://staging.example.com",
    apiUrl: "https://api-staging.example.com",
  },
  production: {
    baseUrl: "https://example.com",
    apiUrl: "https://api.example.com",
  },
};

module.exports = testData[process.env.NODE_ENV || "development"];
```

## Error Handling and Debugging

### Retry Mechanisms

```javascript
// Cypress - built-in retry
cy.get('[data-testid="dynamic-content"]', { timeout: 10000 })
  .should('be.visible');

// Playwright - custom retry
async function waitForElement(page, selector, timeout = 10000) {
  const element = page.locator(selector);
  await element.waitFor({ timeout });
  return element;
}

// Selenium - explicit wait
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 10)
element = wait.until(EC.presence_of_element_located((By.ID, "myElement")))
```

### Error Screenshots and Videos

```javascript
// Cypress - automatic on failure
// cypress.config.js
{
  screenshotOnRunFailure: true,
  video: true,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots'
}

// Playwright - on failure
test('example test', async ({ page }) => {
  try {
    // Test logic here
  } catch (error) {
    await page.screenshot({ path: 'error-screenshot.png' });
    throw error;
  }
});

// Selenium - manual screenshot
def take_screenshot_on_failure(driver, test_name):
    try:
        driver.save_screenshot(f"screenshots/{test_name}_failure.png")
    except Exception as e:
        print(f"Failed to take screenshot: {e}")
```

### Logging and Debugging

```javascript
// Cypress - debug commands
cy.debug(); // Pause execution
cy.log('Custom log message');
cy.task('log', 'Server-side log message');

// Playwright - debug mode
// Run with: npx playwright test --debug
await page.pause(); // Pause execution

// Console logs
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Selenium - logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Starting test execution")
```

## Performance Testing

### Load Testing with Large Datasets

```javascript
// Test with large product list
cy.visit("/products");
cy.get('[data-testid="load-large-dataset"]').click();
cy.get('[data-testid="product-item"]', { timeout: 30000 }).should(
  "have.length.greaterThan",
  1000
);

// Measure load time
const startTime = Date.now();
cy.visit("/products?count=5000");
cy.get('[data-testid="products-loaded"]').then(() => {
  const loadTime = Date.now() - startTime;
  expect(loadTime).to.be.lessThan(5000); // 5 seconds max
});
```

### Memory and Resource Testing

```javascript
// Test file upload performance
cy.fixture("large-file.pdf", "base64").then((fileContent) => {
  cy.get('[data-testid="file-input"]').selectFile({
    contents: Cypress.Buffer.from(fileContent, "base64"),
    fileName: "large-file.pdf",
    mimeType: "application/pdf",
  });

  cy.get('[data-testid="upload-progress"]')
    .should("be.visible")
    .and("contain", "100%");
});
```

### Network Simulation

```javascript
// Cypress - network stubbing
cy.intercept("GET", "/api/products", { delay: 2000 }).as("slowProducts");
cy.visit("/products");
cy.wait("@slowProducts");

// Playwright - network conditions
await page.route("**/api/products", (route) => {
  setTimeout(() => route.continue(), 2000);
});

// Simulate offline
await page.context().setOffline(true);
```

## Accessibility Testing

### Automated Accessibility Testing

```javascript
// Cypress with cypress-axe
import "cypress-axe";

it("should be accessible", () => {
  cy.visit("/login");
  cy.injectAxe();
  cy.checkA11y();
});

// Playwright with @axe-core/playwright
const { injectAxe, checkA11y } = require("@axe-core/playwright");

test("accessibility test", async ({ page }) => {
  await page.goto("/login");
  await injectAxe(page);
  await checkA11y(page);
});
```

### Keyboard Navigation Testing

```javascript
// Test tab navigation
cy.visit("/forms");
cy.get("body").tab(); // First focusable element
cy.focused().should("have.attr", "data-testid", "first-input");

cy.tab(); // Next element
cy.focused().should("have.attr", "data-testid", "second-input");

// Test keyboard shortcuts
cy.get("body").type("{ctrl+k}"); // Open search
cy.get('[data-testid="search-modal"]').should("be.visible");
```

### Screen Reader Testing

```javascript
// Test ARIA labels and roles
cy.get('[data-testid="login-form"]')
  .should("have.attr", "role", "form")
  .and("have.attr", "aria-label", "Login form");

cy.get('[data-testid="error-message"]')
  .should("have.attr", "role", "alert")
  .and("have.attr", "aria-live", "polite");
```

## API Testing

### REST API Testing

```javascript
// Cypress API testing
describe("Users API", () => {
  it("should create a user", () => {
    cy.request({
      method: "POST",
      url: "/api/users",
      body: {
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
      },
      headers: {
        Authorization: "Bearer " + authToken,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property("id");
    });
  });

  it("should handle validation errors", () => {
    cy.request({
      method: "POST",
      url: "/api/users",
      body: {
        username: "", // Invalid empty username
        email: "invalid-email", // Invalid email format
        password: "123", // Too short password
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error.code).to.eq("VALIDATION_ERROR");
    });
  });
});
```

### Authentication Testing

```javascript
// Test JWT token handling
let authToken;

before(() => {
  cy.request("POST", "/api/auth/login", {
    email: "test@example.com",
    password: "password123",
  }).then((response) => {
    authToken = response.body.data.accessToken;
  });
});

it("should access protected endpoint", () => {
  cy.request({
    method: "GET",
    url: "/api/auth/profile",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.data.user).to.have.property("email");
  });
});
```

## Best Practices

### 1. Test Organization

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth/              # Authentication tests
│   ├── products/          # Product-related tests
│   └── forms/             # Form testing
├── api/                   # API tests
│   ├── users.spec.js
│   └── products.spec.js
├── components/            # Component tests
├── fixtures/              # Test data
├── support/               # Helper functions
└── pages/                 # Page objects
```

### 2. Naming Conventions

```javascript
// Test files
login.spec.js;
user - management.spec.js;
product - search.spec.js;

// Test descriptions
describe("User Authentication", () => {
  describe("Login functionality", () => {
    it("should login with valid credentials", () => {});
    it("should show error for invalid credentials", () => {});
    it("should redirect to dashboard after login", () => {});
  });
});
```

### 3. Assertions

```javascript
// ✅ Good - specific assertions
expect(response.status).to.eq(200);
expect(response.body.data).to.have.property("id");
expect(response.body.data.email).to.eq("test@example.com");

// ❌ Avoid - vague assertions
expect(response).to.be.ok;
expect(response.body).to.exist;
```

### 4. Wait Strategies

```javascript
// ✅ Explicit waits
cy.get('[data-testid="loading"]').should("not.exist");
cy.get('[data-testid="content"]').should("be.visible");

// ❌ Avoid hard waits
cy.wait(5000); // Unreliable and slow
```

### 5. Test Data Isolation

```javascript
// ✅ Each test creates its own data
beforeEach(() => {
  cy.createUser().then((user) => {
    testUser = user;
  });
});

// ❌ Avoid shared test data
const sharedUser = { email: "shared@example.com" };
```

## Common Patterns

### 1. Login Helper

```javascript
// cypress/support/commands.js
Cypress.Commands.add("loginAs", (userType = "user") => {
  const users = {
    admin: { email: "admin@example.com", password: "admin123" },
    user: { email: "user@example.com", password: "user123" },
    guest: { email: "guest@example.com", password: "guest123" },
  };

  const user = users[userType];

  cy.request("POST", "/api/auth/login", user).then((response) => {
    window.localStorage.setItem("authToken", response.body.data.accessToken);
  });

  cy.visit("/dashboard");
});

// Usage
cy.loginAs("admin");
```

### 2. Form Testing Pattern

```javascript
const fillForm = (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}-input"]`).type(value);
  });
};

const submitForm = () => {
  cy.get('[data-testid="submit-button"]').click();
};

const expectFormError = (field, message) => {
  cy.get(`[data-testid="${field}-error"]`)
    .should("be.visible")
    .and("contain", message);
};

// Usage
it("should validate required fields", () => {
  cy.visit("/contact");
  submitForm();
  expectFormError("email", "Email is required");
  expectFormError("message", "Message is required");
});
```

### 3. API Response Validation

```javascript
const validateApiResponse = (response, expectedSchema) => {
  expect(response.body).to.have.property("success");
  expect(response.body).to.have.property("data");
  expect(response.body).to.have.property("timestamp");

  if (expectedSchema) {
    // Validate against JSON schema
    expect(response.body.data).to.jsonSchema(expectedSchema);
  }
};
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Element Not Found

```javascript
// Problem: Element not found immediately
cy.get('[data-testid="dynamic-element"]').click(); // Fails

// Solution: Wait for element
cy.get('[data-testid="dynamic-element"]', { timeout: 10000 })
  .should("be.visible")
  .click();
```

#### 2. Flaky Tests

```javascript
// Problem: Test passes sometimes, fails other times
cy.get(".loading").should("not.exist"); // Flaky

// Solution: Wait for specific condition
cy.get('[data-testid="content-loaded"]').should("exist");
```

#### 3. Slow Tests

```javascript
// Problem: Tests are too slow
cy.visit("/page");
cy.wait(5000); // Unnecessary wait

// Solution: Wait for specific conditions
cy.visit("/page");
cy.get('[data-testid="page-ready"]').should("exist");
```

#### 4. Cross-Browser Issues

```javascript
// Problem: Test works in Chrome but fails in Firefox
cy.get("input").type("{selectall}new text"); // Chrome-specific

// Solution: Use cross-browser compatible commands
cy.get("input").clear().type("new text");
```

### Debugging Tips

1. **Use browser developer tools** during test development
2. **Add console.log statements** in page objects
3. **Take screenshots** at key points
4. **Use test framework debugging features** (cy.debug(), page.pause())
5. **Run tests in headed mode** during development
6. **Check network requests** in browser dev tools
7. **Validate API responses** separately from UI tests

### Performance Optimization

1. **Minimize page visits** - use API calls when possible
2. **Reuse authentication tokens** across tests
3. **Run tests in parallel** when supported
4. **Use headless browsers** in CI/CD
5. **Optimize selectors** for speed
6. **Clean up test data** efficiently
7. **Use fixtures** instead of generating data repeatedly

---

This guide provides a comprehensive foundation for automation testing with the Automation Testing Website. Adapt these patterns and practices to your specific testing needs and framework preferences.

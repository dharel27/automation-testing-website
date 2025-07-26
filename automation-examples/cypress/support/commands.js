// Custom Cypress commands for the Automation Testing Website

/**
 * Login command
 * @param {string} email - User email
 * @param {string} password - User password
 */
Cypress.Commands.add("loginAs", (email, password) => {
  cy.visit("/login");
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.get('[data-testid="user-menu-button"]', { timeout: 10000 }).should(
    "be.visible"
  );
});

/**
 * Logout command
 */
Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="user-menu-button"]').click();
  cy.get('[data-testid="nav-logout"]').click();
});

/**
 * Reset test data command
 */
Cypress.Commands.add("resetTestData", () => {
  cy.task("resetTestData");
});

/**
 * Seed large dataset command
 */
Cypress.Commands.add("seedLargeDataset", (count = 1000) => {
  cy.task("seedLargeDataset", count);
});

/**
 * Wait for element by test ID
 */
Cypress.Commands.add("getByTestId", (testId, options = {}) => {
  return cy.get(`[data-testid="${testId}"]`, options);
});

/**
 * Wait for element to be visible by test ID
 */
Cypress.Commands.add("waitForTestId", (testId, timeout = 10000) => {
  return cy.get(`[data-testid="${testId}"]`, { timeout }).should("be.visible");
});

/**
 * Fill form by test IDs
 */
Cypress.Commands.add("fillForm", (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}-input"]`).clear().type(value);
  });
});

/**
 * Check form validation errors
 */
Cypress.Commands.add("checkValidationErrors", (expectedErrors) => {
  expectedErrors.forEach((field) => {
    cy.get(`[data-testid="${field}-error"]`).should("be.visible");
  });
});

/**
 * Toggle dark mode
 */
Cypress.Commands.add("toggleDarkMode", () => {
  cy.get('[data-testid="theme-toggle"]').click();
});

/**
 * Navigate using test IDs
 */
Cypress.Commands.add("navigateTo", (page) => {
  cy.get(`[data-testid="nav-${page}"]`).click();
});

/**
 * Wait for loading to complete
 */
Cypress.Commands.add("waitForLoading", () => {
  cy.get('[data-testid*="loading"]').should("not.exist");
});

/**
 * Check accessibility
 */
Cypress.Commands.add("checkA11y", () => {
  cy.injectAxe();
  cy.checkA11y();
});

/**
 * Custom tab command for keyboard navigation testing
 */
Cypress.Commands.add("tab", { prevSubject: "optional" }, (subject) => {
  const selector = subject ? cy.wrap(subject) : cy.focused();
  return selector.trigger("keydown", { key: "Tab" });
});

/**
 * Custom shift+tab command for keyboard navigation testing
 */
Cypress.Commands.add("shiftTab", { prevSubject: "optional" }, (subject) => {
  const selector = subject ? cy.wrap(subject) : cy.focused();
  return selector.trigger("keydown", { key: "Tab", shiftKey: true });
});

/**
 * Test responsive design
 */
Cypress.Commands.add("testResponsive", (callback) => {
  const viewports = [
    { width: 375, height: 667, name: "mobile" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 1280, height: 720, name: "desktop" },
  ];

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    callback(viewport);
  });
});

/**
 * Simulate slow network
 */
Cypress.Commands.add("simulateSlowNetwork", () => {
  cy.intercept("**", (req) => {
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), 2000);
      });
    });
  });
});

/**
 * Create test user
 */
Cypress.Commands.add("createTestUser", (userData) => {
  cy.request(
    "POST",
    `${Cypress.env("apiUrl")}/api/test-data/create-test-user`,
    userData
  );
});

/**
 * API request with authentication
 */
Cypress.Commands.add("apiRequest", (method, url, body = {}) => {
  return cy.request({
    method,
    url: `${Cypress.env("apiUrl")}${url}`,
    body,
    failOnStatusCode: false,
  });
});

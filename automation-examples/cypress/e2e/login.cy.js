/**
 * Cypress End-to-End Test Example
 * Tests the login functionality of the Automation Testing Website
 */

describe("Login Functionality", () => {
  beforeEach(() => {
    // Reset test data before each test
    cy.request("POST", "http://localhost:3001/api/test-data/reset");
    cy.request("POST", "http://localhost:3001/api/test-data/seed/users");

    // Visit login page
    cy.visit("/login");
  });

  it("should load the login page correctly", () => {
    // Check that login form is visible
    cy.get('[data-testid="login-form"]').should("be.visible");

    // Check that all form elements are present
    cy.get('[data-testid="email-input"]').should("be.visible");
    cy.get('[data-testid="password-input"]').should("be.visible");
    cy.get('[data-testid="login-submit"]')
      .should("be.visible")
      .and("be.enabled");
    cy.get('[data-testid="remember-checkbox"]').should("be.visible");
    cy.get('[data-testid="forgot-password-link"]').should("be.visible");
  });

  it("should successfully login with valid credentials", () => {
    // Fill in the login form
    cy.get('[data-testid="email-input"]').type("test1@example.com");
    cy.get('[data-testid="password-input"]').type("password123");

    // Submit the form
    cy.get('[data-testid="login-submit"]').click();

    // Should redirect to dashboard or home
    cy.url().should("not.contain", "/login");

    // Should show user menu indicating successful login
    cy.get('[data-testid="user-menu-button"]', { timeout: 10000 })
      .should("be.visible")
      .and("contain", "John"); // First name from test data
  });

  it("should show error message for invalid credentials", () => {
    // Fill in invalid credentials
    cy.get('[data-testid="email-input"]').type("invalid@example.com");
    cy.get('[data-testid="password-input"]').type("wrongpassword");

    // Submit the form
    cy.get('[data-testid="login-submit"]').click();

    // Should show error message
    cy.get('[data-testid="login-error"]')
      .should("be.visible")
      .and("contain.text", "Login failed");

    // Should remain on login page
    cy.url().should("contain", "/login");
  });

  it("should validate required fields", () => {
    // Try to submit empty form
    cy.get('[data-testid="login-submit"]').click();

    // Should show validation errors
    cy.get('[data-testid="email-error"]')
      .should("be.visible")
      .and("contain.text", "required");

    cy.get('[data-testid="password-error"]')
      .should("be.visible")
      .and("contain.text", "required");
  });

  it("should validate email format", () => {
    // Enter invalid email format
    cy.get('[data-testid="email-input"]').type("invalid-email");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="login-submit"]').click();

    // Should show email format error
    cy.get('[data-testid="email-error"]')
      .should("be.visible")
      .and("contain.text", "valid email");
  });

  it("should toggle password visibility", () => {
    const password = "testpassword";

    // Type password
    cy.get('[data-testid="password-input"]').type(password);

    // Initially password should be hidden
    cy.get('[data-testid="password-input"]').should(
      "have.attr",
      "type",
      "password"
    );

    // Click toggle to show password
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('[data-testid="password-input"]').should(
      "have.attr",
      "type",
      "text"
    );

    // Click toggle to hide password again
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('[data-testid="password-input"]').should(
      "have.attr",
      "type",
      "password"
    );
  });

  it("should handle remember me checkbox", () => {
    // Initially unchecked
    cy.get('[data-testid="remember-checkbox"]').should("not.be.checked");

    // Click to check
    cy.get('[data-testid="remember-checkbox"]').click();
    cy.get('[data-testid="remember-checkbox"]').should("be.checked");

    // Click to uncheck
    cy.get('[data-testid="remember-checkbox"]').click();
    cy.get('[data-testid="remember-checkbox"]').should("not.be.checked");
  });

  it("should show loading state during login", () => {
    // Fill in valid credentials
    cy.get('[data-testid="email-input"]').type("test1@example.com");
    cy.get('[data-testid="password-input"]').type("password123");

    // Intercept the login request to add delay
    cy.intercept("POST", "/api/auth/login", (req) => {
      req.reply((res) => {
        // Add delay to see loading state
        return new Promise((resolve) => {
          setTimeout(() => resolve(res), 1000);
        });
      });
    });

    // Submit form
    cy.get('[data-testid="login-submit"]').click();

    // Should show loading state
    cy.get('[data-testid="login-submit"]')
      .should("contain.text", "Signing in...")
      .and("be.disabled");
  });

  it("should navigate to register page", () => {
    // Click register link
    cy.get('[data-testid="register-link"]').click();

    // Should navigate to register page
    cy.url().should("contain", "/register");
    cy.get('[data-testid="register-form"]').should("be.visible");
  });

  it("should handle keyboard navigation", () => {
    // Tab through form elements
    cy.get("body").tab();
    cy.focused().should("have.attr", "data-testid", "email-input");

    cy.focused().tab();
    cy.focused().should("have.attr", "data-testid", "password-input");

    cy.focused().tab();
    cy.focused().should("have.attr", "data-testid", "toggle-password");

    cy.focused().tab();
    cy.focused().should("have.attr", "data-testid", "remember-checkbox");
  });

  it("should work with different user roles", () => {
    const testUsers = [
      { email: "test1@example.com", password: "password123", role: "user" },
      { email: "admin@example.com", password: "admin123", role: "admin" },
      { email: "guest@example.com", password: "guest123", role: "guest" },
    ];

    testUsers.forEach((user) => {
      // Login with each user type
      cy.get('[data-testid="email-input"]').clear().type(user.email);
      cy.get('[data-testid="password-input"]').clear().type(user.password);
      cy.get('[data-testid="login-submit"]').click();

      // Should successfully login
      cy.get('[data-testid="user-menu-button"]', { timeout: 10000 }).should(
        "be.visible"
      );

      // Logout for next iteration
      cy.get('[data-testid="user-menu-button"]').click();
      cy.get('[data-testid="nav-logout"]').click();

      // Should return to login page or home
      cy.url().should("not.contain", "/dashboard");

      // Navigate back to login if needed
      if (!cy.url().should("contain", "/login")) {
        cy.visit("/login");
      }
    });
  });
});

// Custom commands for better test organization
Cypress.Commands.add("loginAs", (email, password) => {
  cy.visit("/login");
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.get('[data-testid="user-menu-button"]', { timeout: 10000 }).should(
    "be.visible"
  );
});

Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="user-menu-button"]').click();
  cy.get('[data-testid="nav-logout"]').click();
});

Cypress.Commands.add("resetTestData", () => {
  cy.request("POST", "http://localhost:3001/api/test-data/reset");
  cy.request("POST", "http://localhost:3001/api/test-data/seed/all");
});

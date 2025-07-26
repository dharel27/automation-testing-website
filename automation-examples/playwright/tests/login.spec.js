/**
 * Playwright Test Example
 * Tests the login functionality of the Automation Testing Website
 */

const { test, expect } = require("@playwright/test");

test.describe("Login Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Reset test data before each test
    await page.request.post("http://localhost:3001/api/test-data/reset");
    await page.request.post("http://localhost:3001/api/test-data/seed/users");

    // Navigate to login page
    await page.goto("/login");
  });

  test("should load the login page correctly", async ({ page }) => {
    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Check that all form elements are present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeEnabled();
    await expect(
      page.locator('[data-testid="remember-checkbox"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="forgot-password-link"]')
    ).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Fill in the login form
    await page.locator('[data-testid="email-input"]').fill("test1@example.com");
    await page.locator('[data-testid="password-input"]').fill("password123");

    // Submit the form
    await page.locator('[data-testid="login-submit"]').click();

    // Should redirect away from login page
    await expect(page).not.toHaveURL(/.*\/login/);

    // Should show user menu indicating successful login
    await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="user-menu-button"]')
    ).toContainText("John");
  });

  test("should show error message for invalid credentials", async ({
    page,
  }) => {
    // Fill in invalid credentials
    await page
      .locator('[data-testid="email-input"]')
      .fill("invalid@example.com");
    await page.locator('[data-testid="password-input"]').fill("wrongpassword");

    // Submit the form
    await page.locator('[data-testid="login-submit"]').click();

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      "Login failed"
    );

    // Should remain on login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("should validate required fields", async ({ page }) => {
    // Try to submit empty form
    await page.locator('[data-testid="login-submit"]').click();

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      "required"
    );

    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      "required"
    );
  });

  test("should validate email format", async ({ page }) => {
    // Enter invalid email format
    await page.locator('[data-testid="email-input"]').fill("invalid-email");
    await page.locator('[data-testid="password-input"]').fill("password123");
    await page.locator('[data-testid="login-submit"]').click();

    // Should show email format error
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      "valid email"
    );
  });

  test("should toggle password visibility", async ({ page }) => {
    const password = "testpassword";

    // Type password
    await page.locator('[data-testid="password-input"]').fill(password);

    // Initially password should be hidden
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute("type", "password");

    // Click toggle to show password
    await page.locator('[data-testid="toggle-password"]').click();
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute("type", "text");

    // Click toggle to hide password again
    await page.locator('[data-testid="toggle-password"]').click();
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute("type", "password");
  });

  test("should handle remember me checkbox", async ({ page }) => {
    // Initially unchecked
    await expect(
      page.locator('[data-testid="remember-checkbox"]')
    ).not.toBeChecked();

    // Click to check
    await page.locator('[data-testid="remember-checkbox"]').click();
    await expect(
      page.locator('[data-testid="remember-checkbox"]')
    ).toBeChecked();

    // Click to uncheck
    await page.locator('[data-testid="remember-checkbox"]').click();
    await expect(
      page.locator('[data-testid="remember-checkbox"]')
    ).not.toBeChecked();
  });

  test("should show loading state during login", async ({ page }) => {
    // Intercept the login request to add delay
    await page.route("**/api/auth/login", async (route) => {
      // Add delay to see loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Fill in valid credentials
    await page.locator('[data-testid="email-input"]').fill("test1@example.com");
    await page.locator('[data-testid="password-input"]').fill("password123");

    // Submit form
    await page.locator('[data-testid="login-submit"]').click();

    // Should show loading state
    await expect(page.locator('[data-testid="login-submit"]')).toContainText(
      "Signing in..."
    );
    await expect(page.locator('[data-testid="login-submit"]')).toBeDisabled();
  });

  test("should navigate to register page", async ({ page }) => {
    // Click register link
    await page.locator('[data-testid="register-link"]').click();

    // Should navigate to register page
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
  });

  test("should handle keyboard navigation", async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press("Tab");
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('[data-testid="toggle-password"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(
      page.locator('[data-testid="remember-checkbox"]')
    ).toBeFocused();
  });

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();

    // Form should still be functional
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Fill and submit form
    await page.locator('[data-testid="email-input"]').fill("test1@example.com");
    await page.locator('[data-testid="password-input"]').fill("password123");
    await page.locator('[data-testid="login-submit"]').click();

    // Should successfully login
    await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should work with different user roles", async ({ page }) => {
    const testUsers = [
      {
        email: "test1@example.com",
        password: "password123",
        role: "user",
        name: "John",
      },
      {
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        name: "Admin",
      },
      {
        email: "guest@example.com",
        password: "guest123",
        role: "guest",
        name: "Guest",
      },
    ];

    for (const user of testUsers) {
      // Login with each user type
      await page.locator('[data-testid="email-input"]').fill(user.email);
      await page.locator('[data-testid="password-input"]').fill(user.password);
      await page.locator('[data-testid="login-submit"]').click();

      // Should successfully login
      await expect(
        page.locator('[data-testid="user-menu-button"]')
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('[data-testid="user-menu-button"]')
      ).toContainText(user.name);

      // Logout for next iteration
      await page.locator('[data-testid="user-menu-button"]').click();
      await page.locator('[data-testid="nav-logout"]').click();

      // Should return to login page or home
      await expect(page).not.toHaveURL(/.*\/dashboard/);

      // Navigate back to login if needed
      if (!(await page.url().includes("/login"))) {
        await page.goto("/login");
      }
    }
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Simulate network failure
    await page.route("**/api/auth/login", (route) => route.abort());

    // Fill in credentials
    await page.locator('[data-testid="email-input"]').fill("test1@example.com");
    await page.locator('[data-testid="password-input"]').fill("password123");

    // Submit form
    await page.locator('[data-testid="login-submit"]').click();

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test("should maintain accessibility standards", async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      "aria-invalid"
    );
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute("aria-invalid");

    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Check for proper heading structure
    await expect(page.locator("h2")).toBeVisible();

    // Check for proper button labeling
    await expect(
      page.locator('[data-testid="toggle-password"]')
    ).toHaveAttribute("aria-label");
  });
});

// Helper functions for common operations
async function loginAs(page, email, password) {
  await page.goto("/login");
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="password-input"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({
    timeout: 10000,
  });
}

async function logout(page) {
  await page.locator('[data-testid="user-menu-button"]').click();
  await page.locator('[data-testid="nav-logout"]').click();
}

async function resetTestData(page) {
  await page.request.post("http://localhost:3001/api/test-data/reset");
  await page.request.post("http://localhost:3001/api/test-data/seed/all");
}

module.exports = { loginAs, logout, resetTestData };

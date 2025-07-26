// Cypress support file for e2e tests

import "./commands";

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  style.innerHTML =
    ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");
  app.document.head.appendChild(style);
}

// Global error handling
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions. Customize this based on your needs.
  console.error("Uncaught exception:", err);
  return false;
});

// Before each test
beforeEach(() => {
  // Reset test data
  cy.task("resetTestData");

  // Set up common aliases
  cy.intercept("GET", "**/api/auth/profile").as("getProfile");
  cy.intercept("POST", "**/api/auth/login").as("login");
  cy.intercept("POST", "**/api/auth/logout").as("logout");
  cy.intercept("GET", "**/api/users").as("getUsers");
  cy.intercept("GET", "**/api/products").as("getProducts");
});

// After each test
afterEach(() => {
  // Clean up any test data if needed
  // This could include clearing localStorage, sessionStorage, etc.
  cy.clearLocalStorage();
  cy.clearCookies();
});

// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import code coverage support
import '@cypress/code-coverage/support';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for accessibility testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to check accessibility violations
       * @example cy.checkA11y()
       */
      checkA11y(): Chainable<Element>;

      /**
       * Custom command to login a user
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<Element>;

      /**
       * Custom command to seed test data
       * @example cy.seedTestData()
       */
      seedTestData(): Chainable<Element>;

      /**
       * Custom command to reset test data
       * @example cy.resetTestData()
       */
      resetTestData(): Chainable<Element>;
    }
  }
}

// Global before hook to set up test environment
beforeEach(() => {
  // Reset test data before each test
  cy.resetTestData();

  // Set up viewport for consistent testing
  cy.viewport(1280, 720);

  // Intercept API calls for better test control
  cy.intercept('GET', '/api/users*', { fixture: 'users.json' }).as('getUsers');
  cy.intercept('GET', '/api/products*', { fixture: 'products.json' }).as(
    'getProducts'
  );
});

// Global after hook for cleanup
afterEach(() => {
  // Take screenshot on failure
  cy.screenshot({ capture: 'runner', onlyOnFailure: true });
});

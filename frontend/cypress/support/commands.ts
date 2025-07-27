/// <reference types="cypress" />
import 'cypress-axe';

// Custom command for accessibility testing
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y(
    null,
    {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
      },
    },
    (violations) => {
      if (violations.length > 0) {
        cy.task(
          'log',
          `${violations.length} accessibility violation(s) detected`
        );
        violations.forEach((violation) => {
          cy.task('log', `${violation.id}: ${violation.description}`);
          violation.nodes.forEach((node) => {
            cy.task('log', `  - ${node.target}`);
          });
        });
      }
    }
  );
});

// Custom command for user login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage.token').should('exist');
  });
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request('POST', '/api/test-data/seed').then((response) => {
    expect(response.status).to.eq(200);
  });
});

// Custom command to reset test data
Cypress.Commands.add('resetTestData', () => {
  cy.request('POST', '/api/test-data/reset').then((response) => {
    expect(response.status).to.eq(200);
  });
});

// Custom command for waiting for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should(
    'not.exist'
  );
});

// Custom command for testing form validation
Cypress.Commands.add(
  'testFormValidation',
  (
    formSelector: string,
    validationTests: Array<{
      field: string;
      value: string;
      expectedError: string;
    }>
  ) => {
    validationTests.forEach(({ field, value, expectedError }) => {
      cy.get(`${formSelector} [data-testid="${field}"]`).clear().type(value);
      cy.get(`${formSelector} [data-testid="submit-button"]`).click();
      cy.get(`[data-testid="${field}-error"]`).should('contain', expectedError);
    });
  }
);

// Custom command for testing responsive design
Cypress.Commands.add(
  'testResponsive',
  (breakpoints: Array<{ width: number; height: number; name: string }>) => {
    breakpoints.forEach(({ width, height, name }) => {
      cy.viewport(width, height);
      cy.get('body').should('be.visible');
      cy.screenshot(`responsive-${name}`);
    });
  }
);

// Add type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      waitForPageLoad(): Chainable<Element>;
      testFormValidation(
        formSelector: string,
        validationTests: Array<{
          field: string;
          value: string;
          expectedError: string;
        }>
      ): Chainable<Element>;
      testResponsive(
        breakpoints: Array<{ width: number; height: number; name: string }>
      ): Chainable<Element>;
    }
  }
}

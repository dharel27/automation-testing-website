describe('Critical User Journeys', () => {
  beforeEach(() => {
    cy.seedTestData();
  });

  describe('User Registration and Login Flow', () => {
    it('should complete full user registration and login journey', () => {
      // Visit registration page
      cy.visit('/register');
      cy.checkA11y();

      // Fill registration form
      const testUser = {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      cy.get('[data-testid="username-input"]').type(testUser.username);
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="confirm-password-input"]').type(testUser.password);
      cy.get('[data-testid="first-name-input"]').type(testUser.firstName);
      cy.get('[data-testid="last-name-input"]').type(testUser.lastName);

      // Submit registration
      cy.get('[data-testid="register-button"]').click();

      // Should redirect to login or dashboard
      cy.url().should('not.include', '/register');

      // If redirected to login, complete login
      cy.url().then((url) => {
        if (url.includes('/login')) {
          cy.get('[data-testid="email-input"]').type(testUser.email);
          cy.get('[data-testid="password-input"]').type(testUser.password);
          cy.get('[data-testid="login-button"]').click();
        }
      });

      // Should be logged in and on dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', testUser.firstName);
    });

    it('should handle login with existing user', () => {
      cy.visit('/login');
      cy.checkA11y();

      // Use seeded test user
      cy.get('[data-testid="email-input"]').type('admin@example.com');
      cy.get('[data-testid="password-input"]').type('admin123');
      cy.get('[data-testid="login-button"]').click();

      // Should be redirected to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle logout flow', () => {
      cy.login('admin@example.com', 'admin123');
      cy.visit('/dashboard');

      // Open user menu and logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Should be redirected to home page
      cy.url().should('not.include', '/dashboard');
      cy.get('[data-testid="login-link"]').should('be.visible');
    });
  });

  describe('Data Management Flow', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'admin123');
    });

    it('should complete CRUD operations on data table', () => {
      cy.visit('/data-table');
      cy.waitForPageLoad();
      cy.checkA11y();

      // Test Create operation
      cy.get('[data-testid="add-user-button"]').click();
      cy.get('[data-testid="user-form-modal"]').should('be.visible');

      const newUser = {
        username: 'newuser123',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      cy.get('[data-testid="modal-username-input"]').type(newUser.username);
      cy.get('[data-testid="modal-email-input"]').type(newUser.email);
      cy.get('[data-testid="modal-first-name-input"]').type(newUser.firstName);
      cy.get('[data-testid="modal-last-name-input"]').type(newUser.lastName);
      cy.get('[data-testid="modal-save-button"]').click();

      // Verify user was added
      cy.get('[data-testid="data-table"]').should('contain', newUser.username);

      // Test Read operation (search/filter)
      cy.get('[data-testid="search-input"]').type(newUser.username);
      cy.get('[data-testid="data-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="data-table"]').should('contain', newUser.email);

      // Test Update operation
      cy.get('[data-testid="edit-user-button"]').first().click();
      cy.get('[data-testid="user-form-modal"]').should('be.visible');
      cy.get('[data-testid="modal-first-name-input"]').clear().type('Updated');
      cy.get('[data-testid="modal-save-button"]').click();

      // Verify user was updated
      cy.get('[data-testid="data-table"]').should('contain', 'Updated');

      // Test Delete operation
      cy.get('[data-testid="delete-user-button"]').first().click();
      cy.get('[data-testid="confirm-delete-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Verify user was deleted
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="data-table"]').should(
        'not.contain',
        newUser.username
      );
    });

    it('should handle table sorting and pagination', () => {
      cy.visit('/data-table');
      cy.waitForPageLoad();

      // Test sorting
      cy.get('[data-testid="sort-username"]').click();
      cy.get('[data-testid="data-table"] tbody tr')
        .first()
        .should('contain', 'admin');

      cy.get('[data-testid="sort-username"]').click();
      cy.get('[data-testid="data-table"] tbody tr')
        .first()
        .should('not.contain', 'admin');

      // Test pagination
      cy.get('[data-testid="pagination-next"]').click();
      cy.get('[data-testid="current-page"]').should('contain', '2');

      cy.get('[data-testid="pagination-prev"]').click();
      cy.get('[data-testid="current-page"]').should('contain', '1');
    });
  });

  describe('Form Validation Flow', () => {
    it('should validate contact form with comprehensive error handling', () => {
      cy.visit('/forms');
      cy.checkA11y();

      // Test form validation
      const validationTests = [
        {
          field: 'email-input',
          value: 'invalid-email',
          expectedError: 'Please enter a valid email address',
        },
        {
          field: 'phone-input',
          value: '123',
          expectedError: 'Please enter a valid phone number',
        },
        { field: 'name-input', value: '', expectedError: 'Name is required' },
      ];

      cy.testFormValidation('[data-testid="contact-form"]', validationTests);

      // Test successful form submission
      cy.get('[data-testid="name-input"]').clear().type('John Doe');
      cy.get('[data-testid="email-input"]').clear().type('john@example.com');
      cy.get('[data-testid="phone-input"]').clear().type('+1234567890');
      cy.get('[data-testid="message-input"]').type('This is a test message');
      cy.get('[data-testid="submit-button"]').click();

      // Should show success message
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Message sent successfully'
      );
    });

    it('should validate feedback form with file upload', () => {
      cy.visit('/forms');

      // Test file upload
      const fileName = 'test-file.txt';
      cy.get('[data-testid="file-upload-input"]').selectFile({
        contents: Cypress.Buffer.from('Test file content'),
        fileName: fileName,
        mimeType: 'text/plain',
      });

      cy.get('[data-testid="uploaded-file-name"]').should('contain', fileName);

      // Fill and submit feedback form
      cy.get('[data-testid="feedback-rating"]').click();
      cy.get('[data-testid="feedback-rating-5"]').click();
      cy.get('[data-testid="feedback-message"]').type('Great application!');
      cy.get('[data-testid="feedback-submit"]').click();

      cy.get('[data-testid="feedback-success"]').should('be.visible');
    });
  });

  describe('API Testing Interface Flow', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'admin123');
    });

    it('should test API endpoints through the interface', () => {
      cy.visit('/api-testing');
      cy.waitForPageLoad();
      cy.checkA11y();

      // Test GET request
      cy.get('[data-testid="endpoint-select"]').select('GET /api/users');
      cy.get('[data-testid="send-request-button"]').click();

      cy.get('[data-testid="response-status"]').should('contain', '200');
      cy.get('[data-testid="response-body"]').should('contain', 'users');

      // Test POST request
      cy.get('[data-testid="endpoint-select"]').select('POST /api/users');
      cy.get('[data-testid="request-body-input"]').type(
        JSON.stringify({
          username: 'apitest',
          email: 'apitest@example.com',
          password: 'password123',
        })
      );
      cy.get('[data-testid="send-request-button"]').click();

      cy.get('[data-testid="response-status"]').should('contain', '201');

      // Test error handling
      cy.get('[data-testid="endpoint-select"]').select(
        'GET /api/test/error/500'
      );
      cy.get('[data-testid="send-request-button"]').click();

      cy.get('[data-testid="response-status"]').should('contain', '500');
      cy.get('[data-testid="response-body"]').should('contain', 'error');
    });
  });

  describe('Performance Testing Flow', () => {
    it('should handle large datasets and performance scenarios', () => {
      cy.visit('/performance-test');
      cy.waitForPageLoad();
      cy.checkA11y();

      // Test large dataset loading
      cy.get('[data-testid="load-large-dataset"]').click();
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
      cy.get('[data-testid="loading-indicator"]', { timeout: 30000 }).should(
        'not.exist'
      );

      // Verify large dataset loaded
      cy.get('[data-testid="dataset-count"]').should('contain', '1000');

      // Test search performance
      cy.get('[data-testid="performance-search"]').type('test');
      cy.get('[data-testid="search-results"]').should('be.visible');
      cy.get('[data-testid="search-time"]').should('be.visible');

      // Test file upload performance
      cy.get('[data-testid="large-file-upload"]').selectFile({
        contents: Cypress.Buffer.alloc(1024 * 1024), // 1MB file
        fileName: 'large-test-file.bin',
        mimeType: 'application/octet-stream',
      });

      cy.get('[data-testid="upload-progress"]').should('be.visible');
      cy.get('[data-testid="upload-complete"]', { timeout: 30000 }).should(
        'be.visible'
      );
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle various error scenarios gracefully', () => {
      // Test 404 page
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      cy.get('[data-testid="404-page"]').should('be.visible');
      cy.get('[data-testid="back-to-home"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Test network error handling
      cy.visit('/error-test');
      cy.get('[data-testid="trigger-network-error"]').click();
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Network error'
      );

      // Test JavaScript error handling
      cy.get('[data-testid="trigger-js-error"]').click();
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('[data-testid="error-boundary"]').should(
        'contain',
        'Something went wrong'
      );
    });
  });

  describe('Accessibility Flow', () => {
    it('should be fully accessible across all pages', () => {
      const pages = [
        '/',
        '/login',
        '/register',
        '/dashboard',
        '/forms',
        '/data-table',
        '/api-testing',
      ];

      pages.forEach((page) => {
        cy.visit(page);
        cy.waitForPageLoad();
        cy.checkA11y();

        // Test keyboard navigation
        cy.get('body').tab();
        cy.focused().should('be.visible');

        // Test skip links
        cy.get('[data-testid="skip-to-main"]').should('exist');
        cy.get('[data-testid="skip-to-main"]').focus().type('{enter}');
        cy.get('main').should('be.focused');
      });
    });

    it('should support screen reader navigation', () => {
      cy.visit('/');

      // Check for proper heading structure
      cy.get('h1').should('exist');
      cy.get('h1').should('have.attr', 'id');

      // Check for proper form labels
      cy.visit('/login');
      cy.get('input[type="email"]')
        .should('have.attr', 'aria-label')
        .or('have.attr', 'aria-labelledby');
      cy.get('input[type="password"]')
        .should('have.attr', 'aria-label')
        .or('have.attr', 'aria-labelledby');

      // Check for proper button descriptions
      cy.get('button').each(($btn) => {
        cy.wrap($btn).should('satisfy', ($el) => {
          return (
            $el.text().trim() !== '' ||
            $el.attr('aria-label') ||
            $el.attr('aria-labelledby') ||
            $el.attr('title')
          );
        });
      });
    });
  });

  describe('Responsive Design Flow', () => {
    it('should work correctly across different screen sizes', () => {
      const breakpoints = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 375, height: 667, name: 'mobile-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop-small' },
        { width: 1440, height: 900, name: 'desktop-large' },
      ];

      cy.visit('/');
      cy.testResponsive(breakpoints);

      // Test mobile navigation
      cy.viewport(375, 667);
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');

      // Test desktop navigation
      cy.viewport(1440, 900);
      cy.get('[data-testid="desktop-menu"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible');
    });
  });
});

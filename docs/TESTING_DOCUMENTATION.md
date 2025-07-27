# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, implementation, and execution for the Automation Testing Website project. The testing framework is designed to ensure high quality, accessibility compliance, and comprehensive coverage across all application components.

## Testing Strategy

### Test Pyramid

Our testing strategy follows the test pyramid approach:

1. **Unit Tests (70%)** - Fast, isolated tests for individual components and functions
2. **Integration Tests (20%)** - Tests for component interactions and API integrations
3. **End-to-End Tests (10%)** - Full user journey tests using Cypress

### Testing Types

#### 1. Unit Tests

- **Frontend**: React component tests using Vitest and React Testing Library
- **Backend**: Node.js/Express API tests using Jest and Supertest
- **Coverage Target**: 90%+ code coverage

#### 2. Integration Tests

- API endpoint integration tests
- Component integration with contexts and providers
- Database integration tests
- Authentication flow integration

#### 3. End-to-End Tests

- Critical user journeys using Cypress
- Cross-browser compatibility testing
- Real user scenario validation

#### 4. Accessibility Tests

- WCAG 2.1 AA compliance testing
- Screen reader compatibility
- Keyboard navigation testing
- Color contrast validation

#### 5. Performance Tests

- Lighthouse CI for performance metrics
- Load testing for API endpoints
- Bundle size optimization validation

#### 6. Security Tests

- Dependency vulnerability scanning
- Input sanitization validation
- Authentication security testing

## Test Structure

### Frontend Tests (`frontend/src/__tests__/`)

```
__tests__/
├── accessibility/
│   ├── accessibility.test.tsx
│   ├── focusManagement.test.tsx
│   ├── keyboardNavigation.test.tsx
│   ├── comprehensive-accessibility.test.tsx
│   └── setup.ts
├── integration/
│   ├── performanceIntegration.test.tsx
│   └── comprehensive-integration.test.tsx
├── performance/
│   └── loadTesting.test.ts
└── responsive/
    ├── BreakpointTests.test.tsx
    ├── ResponsiveCSS.test.tsx
    └── ResponsiveDesign.test.tsx
```

### Backend Tests (`backend/src/__tests__/`)

```
__tests__/
├── database/
│   └── init.test.ts
├── middleware/
│   ├── auth.test.ts
│   ├── csrf.test.ts
│   ├── errorHandler.test.ts
│   ├── security.test.ts
│   └── sessionManager.test.ts
├── models/
│   ├── FileRecord.test.ts
│   ├── Product.test.ts
│   ├── Session.test.ts
│   └── User.test.ts
├── routes/
│   ├── auth.test.ts
│   ├── errors.test.ts
│   ├── files.test.ts
│   ├── notifications.test.ts
│   ├── products.test.ts
│   ├── test-data.test.ts
│   ├── test.test.ts
│   └── users.test.ts
├── security/
│   ├── integration.test.ts
│   └── vulnerabilities.test.ts
├── utils/
│   └── logger.test.ts
└── setup.ts
```

### E2E Tests (`frontend/cypress/`)

```
cypress/
├── e2e/
│   └── critical-user-journeys.cy.ts
├── fixtures/
│   ├── users.json
│   └── products.json
└── support/
    ├── commands.ts
    ├── component.ts
    └── e2e.ts
```

## Running Tests

### Quick Start

```bash
# Install all dependencies
npm run install:all

# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:accessibility # Accessibility tests only
npm run test:e2e          # End-to-end tests only
npm run test:performance  # Performance tests only
npm run test:all          # All tests including E2E and performance
```

### Individual Test Suites

#### Frontend Tests

```bash
cd frontend

# Run all frontend tests
npm run test:run

# Run tests in watch mode
npm test

# Run with coverage
npm run test:run -- --coverage

# Run specific test files
npm run test:run -- --testPathPattern=accessibility
npm run test:run -- --testPathPattern=integration
npm run test:run -- --testPathPattern=components

# Run Cypress E2E tests
npm run test:e2e:open    # Interactive mode
npm run test:e2e         # Headless mode
npm run test:e2e:ci      # CI mode

# Run component tests
npm run test:component
```

#### Backend Tests

```bash
cd backend

# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern=routes
npm test -- --testPathPattern=models
npm test -- --testPathPattern=middleware
```

### CI/CD Integration

The project includes a comprehensive CI/CD pipeline using GitHub Actions:

```yaml
# .github/workflows/ci.yml
- Backend Tests (Unit, Integration, Security)
- Frontend Tests (Unit, Integration, Accessibility)
- E2E Tests (Cypress)
- Performance Tests (Lighthouse)
- Security Scans (npm audit, Snyk)
- Code Quality (SonarCloud, ESLint)
```

## Test Configuration

### Vitest Configuration (`frontend/vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

### Jest Configuration (`backend/jest.config.js`)

```javascript
export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
```

### Cypress Configuration (`frontend/cypress.config.ts`)

```typescript
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

## Test Data Management

### Test Database

- **Backend**: Uses SQLite with in-memory database for tests
- **Isolation**: Each test gets a fresh database instance
- **Seeding**: Automated test data seeding for consistent scenarios

### Mock Data

- **API Responses**: Comprehensive mock data for all API endpoints
- **User Scenarios**: Predefined user roles and permissions
- **Edge Cases**: Mock data for error scenarios and edge cases

### Fixtures

```javascript
// cypress/fixtures/users.json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "1",
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin"
      }
    ]
  }
}
```

## Accessibility Testing

### WCAG 2.1 AA Compliance

Our accessibility tests ensure compliance with WCAG 2.1 AA standards:

- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators and logical tab order

### Automated Accessibility Testing

```typescript
// Using jest-axe for automated accessibility testing
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

test("should have no accessibility violations", async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Accessibility Testing

- **Screen Reader Testing**: NVDA, JAWS, VoiceOver compatibility
- **Keyboard Navigation**: Tab order and keyboard shortcuts
- **High Contrast Mode**: Windows High Contrast support
- **Zoom Testing**: 200% zoom compatibility

## Performance Testing

### Lighthouse CI

Performance testing is automated using Lighthouse CI:

```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
      },
    },
  },
};
```

### Performance Metrics

- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 4 seconds
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 5 seconds

### Load Testing

- **API Endpoints**: Concurrent request testing
- **Database Operations**: Performance under load
- **File Uploads**: Large file handling

## Security Testing

### Automated Security Scans

```bash
# Dependency vulnerability scanning
npm audit --audit-level=high

# Snyk security scanning
snyk test --severity-threshold=high
```

### Security Test Coverage

- **Input Sanitization**: XSS prevention testing
- **Authentication**: JWT security validation
- **Authorization**: Role-based access control
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse prevention

## Code Coverage

### Coverage Targets

- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: 80%+ branch coverage
- **E2E Tests**: 100% critical path coverage

### Coverage Reports

```bash
# Generate coverage reports
npm run test:unit -- --coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.js
collectCoverageFrom: [
  "src/**/*.{ts,tsx}",
  "!src/**/*.test.{ts,tsx}",
  "!src/**/*.stories.{ts,tsx}",
  "!src/test/**/*",
];
```

## Test Reporting

### Automated Reports

The test suite generates comprehensive reports:

- **JSON Report**: `test-results.json`
- **HTML Report**: `test-results.html`
- **Coverage Reports**: `coverage/` directory
- **Cypress Reports**: Videos and screenshots

### CI/CD Integration

- **GitHub Actions**: Automated test execution
- **Pull Request Comments**: Test result summaries
- **Codecov Integration**: Coverage tracking
- **Slack Notifications**: Deployment status

## Best Practices

### Writing Tests

1. **Arrange, Act, Assert**: Clear test structure
2. **Descriptive Names**: Self-documenting test names
3. **Single Responsibility**: One assertion per test
4. **Test Independence**: No test dependencies
5. **Mock External Dependencies**: Isolated testing

### Test Maintenance

1. **Regular Updates**: Keep tests current with code changes
2. **Flaky Test Management**: Identify and fix unstable tests
3. **Performance Monitoring**: Track test execution times
4. **Coverage Monitoring**: Maintain coverage thresholds

### Debugging Tests

```bash
# Debug frontend tests
npm run test:ui  # Interactive test UI

# Debug backend tests
npm run test:watch  # Watch mode with debugging

# Debug Cypress tests
npm run test:e2e:open  # Interactive Cypress runner
```

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values for slow operations
2. **Mock Issues**: Ensure proper mock setup and cleanup
3. **Database Conflicts**: Use proper test isolation
4. **Async Issues**: Proper async/await usage

### Environment Issues

```bash
# Clear test cache
npm run test -- --clearCache

# Reset test database
rm -f test.sqlite

# Reinstall dependencies
rm -rf node_modules && npm install
```

## Contributing

### Adding New Tests

1. Follow existing test patterns
2. Ensure proper test isolation
3. Add appropriate mocks
4. Update documentation
5. Verify CI/CD integration

### Test Review Checklist

- [ ] Tests are independent and isolated
- [ ] Proper error handling tested
- [ ] Edge cases covered
- [ ] Accessibility considerations included
- [ ] Performance implications considered
- [ ] Documentation updated

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Cypress Documentation](https://docs.cypress.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools

- **Test Runners**: Vitest, Jest, Cypress
- **Assertion Libraries**: Jest, Chai
- **Mocking**: Jest mocks, MSW
- **Accessibility**: jest-axe, cypress-axe
- **Performance**: Lighthouse CI
- **Security**: npm audit, Snyk

This comprehensive testing documentation ensures that all team members can effectively contribute to and maintain the high-quality testing standards of the Automation Testing Website project.

# Automation Testing Examples

This directory contains example test scripts and configurations for popular automation testing frameworks. These examples demonstrate how to test the Automation Testing Website using different tools and approaches.

## Available Frameworks

- **[Selenium WebDriver](#selenium-webdriver)** - Python examples with pytest
- **[Cypress](#cypress)** - JavaScript E2E testing framework
- **[Playwright](#playwright)** - Modern cross-browser automation

## Quick Start

### Prerequisites

1. Ensure the application is running:

   ```bash
   # From the root directory
   npm run dev
   ```

2. The application should be accessible at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

### Running Examples

Each framework directory contains its own setup instructions and examples. Choose the framework you want to explore:

```bash
# Selenium (Python)
cd selenium/
pip install -r requirements.txt
pytest test_login.py -v

# Cypress (JavaScript)
cd cypress/
npm install
npx cypress run

# Playwright (JavaScript)
cd playwright/
npm install
npx playwright test
```

## Framework Comparison

| Feature                | Selenium                          | Cypress               | Playwright                        |
| ---------------------- | --------------------------------- | --------------------- | --------------------------------- |
| **Language Support**   | Multiple (Python, Java, C#, etc.) | JavaScript/TypeScript | JavaScript/TypeScript, Python, C# |
| **Browser Support**    | Chrome, Firefox, Safari, Edge, IE | Chrome, Firefox, Edge | Chrome, Firefox, Safari, Edge     |
| **Mobile Testing**     | Yes (via Appium)                  | Limited               | Yes                               |
| **Parallel Execution** | Yes                               | Yes (paid)            | Yes                               |
| **Real Browser**       | Yes                               | Yes                   | Yes                               |
| **Network Stubbing**   | Limited                           | Excellent             | Excellent                         |
| **Debugging**          | Good                              | Excellent             | Excellent                         |
| **Learning Curve**     | Moderate                          | Easy                  | Easy-Moderate                     |
| **Community**          | Large                             | Large                 | Growing                           |

## Test Scenarios Covered

All framework examples include tests for:

### 1. Authentication

- User login with valid credentials
- Login with invalid credentials
- User registration
- Password validation
- Session management

### 2. Form Interactions

- Form field validation
- File uploads
- Dropdown selections
- Checkbox and radio button interactions
- Multi-step forms

### 3. Dynamic Content

- Loading states
- Infinite scroll
- Real-time updates
- AJAX requests
- Modal dialogs

### 4. API Testing

- REST endpoint testing
- Authentication headers
- Error response handling
- Data validation
- Performance testing

### 5. Responsive Design

- Mobile viewport testing
- Responsive layout validation
- Touch interactions
- Orientation changes

### 6. Accessibility

- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Color contrast
- Focus management

### 7. Performance

- Page load times
- Large dataset handling
- Memory usage
- Network optimization

## Best Practices Demonstrated

### 1. Page Object Model

All examples implement the Page Object Model pattern for:

- Better test maintainability
- Code reusability
- Separation of concerns
- Easier updates when UI changes

### 2. Data-Driven Testing

Examples show how to:

- Use external data files
- Parameterize tests
- Generate test data
- Manage test environments

### 3. Error Handling

Robust error handling including:

- Retry mechanisms
- Graceful failures
- Detailed error reporting
- Screenshot capture

### 4. CI/CD Integration

Configuration for:

- GitHub Actions
- Jenkins
- Docker containers
- Parallel execution

## Framework-Specific Features

### Selenium WebDriver

- **Strengths**: Mature ecosystem, multiple language support, extensive browser support
- **Use Cases**: Cross-browser testing, legacy browser support, integration with existing Python/Java projects
- **Examples**:
  - `test_login.py` - Authentication testing
  - `test_forms.py` - Form interactions
  - `test_api.py` - API testing with requests library

### Cypress

- **Strengths**: Developer-friendly, excellent debugging, built-in waiting
- **Use Cases**: Modern web applications, rapid development, team collaboration
- **Examples**:
  - `e2e/login.cy.js` - Login functionality
  - `e2e/forms.cy.js` - Form testing
  - `e2e/api.cy.js` - API testing

### Playwright

- **Strengths**: Fast execution, modern features, cross-browser support
- **Use Cases**: Modern web apps, mobile testing, performance testing
- **Examples**:
  - `tests/login.spec.js` - Authentication tests
  - `tests/forms.spec.js` - Form interactions
  - `tests/mobile.spec.js` - Mobile testing

## Configuration Files

Each framework includes production-ready configuration:

### Selenium

- `conftest.py` - Pytest configuration and fixtures
- `requirements.txt` - Python dependencies
- `pytest.ini` - Test execution settings

### Cypress

- `cypress.config.js` - Main configuration
- `support/commands.js` - Custom commands
- `support/e2e.js` - Global setup

### Playwright

- `playwright.config.js` - Test configuration
- `global-setup.js` - Global setup and teardown
- `package.json` - Dependencies and scripts

## Environment Setup

### Development Environment

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Run tests
cd automation-examples/[framework] && [run command]
```

### CI/CD Environment

```yaml
# Example GitHub Actions workflow
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
```

### Docker Environment

```dockerfile
# Example Dockerfile for testing
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "test"]
```

## Test Data Management

### Static Test Data

```json
// fixtures/users.json
{
  "validUser": {
    "email": "test@example.com",
    "password": "password123"
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "admin123"
  }
}
```

### Dynamic Test Data

```javascript
// utils/testData.js
const faker = require("faker");

const generateUser = () => ({
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: faker.internet.password(8),
});
```

### API Test Data

```javascript
// Setup test data via API
beforeEach(async () => {
  await api.post("/test/reset-data");
  testUser = await api.post("/auth/register", userData);
});
```

## Reporting and Analytics

### Test Reports

- HTML reports with screenshots
- JUnit XML for CI integration
- Custom dashboards
- Trend analysis

### Metrics Tracked

- Test execution time
- Pass/fail rates
- Browser compatibility
- Performance metrics
- Coverage reports

## Troubleshooting

### Common Issues

1. **Application not running**

   ```bash
   # Ensure both frontend and backend are running
   npm run dev
   ```

2. **Port conflicts**

   ```bash
   # Check if ports 3001 and 5173 are available
   lsof -ti:3001 -ti:5173
   ```

3. **Browser driver issues**

   ```bash
   # Update browser drivers
   npx playwright install
   # or for Selenium
   pip install --upgrade selenium webdriver-manager
   ```

4. **Network timeouts**
   - Increase timeout values in configuration
   - Check network connectivity
   - Verify API endpoints are accessible

### Debug Mode

Each framework supports debug mode:

```bash
# Selenium
pytest --pdb test_login.py

# Cypress
npx cypress open

# Playwright
npx playwright test --debug
```

## Contributing

To add new examples or improve existing ones:

1. Follow the established patterns in each framework
2. Include comprehensive comments
3. Add corresponding documentation
4. Test examples thoroughly
5. Update this README with new features

## Resources

### Documentation

- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Playwright Documentation](https://playwright.dev/)

### Community

- [Selenium Community](https://www.selenium.dev/community/)
- [Cypress Discord](https://discord.gg/cypress)
- [Playwright Slack](https://aka.ms/playwright-slack)

### Learning Resources

- [Test Automation University](https://testautomationu.applitools.com/)
- [Automation Panda Blog](https://automationpanda.com/)
- [Ministry of Testing](https://www.ministryoftesting.com/)

---

Choose the framework that best fits your needs and start exploring the examples. Each directory contains detailed setup instructions and comprehensive test suites to help you get started with automation testing.

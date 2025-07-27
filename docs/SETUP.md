# Development Environment Setup Guide

This guide will help you set up the Automation Testing Website for development and testing purposes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (version 18.0.0 or higher)

   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)

   - Verify installation: `npm --version`

3. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Optional but Recommended

1. **Visual Studio Code** (or your preferred IDE)

   - Download from [code.visualstudio.com](https://code.visualstudio.com/)
   - Recommended extensions:
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features
     - REST Client (for API testing)

2. **Postman** or **Insomnia** (for API testing)
   - [Postman](https://www.postman.com/)
   - [Insomnia](https://insomnia.rest/)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd automation-testing-website
```

### 2. Install Dependencies

The project uses a monorepo structure with separate frontend and backend applications. Install all dependencies using the root package.json script:

```bash
# Install dependencies for all packages
npm run install:all
```

This command will:

- Install root dependencies
- Install frontend dependencies (React, TypeScript, Vite, etc.)
- Install backend dependencies (Express, SQLite, JWT, etc.)

### 3. Verify Installation

Check that all dependencies are installed correctly:

```bash
# Check root dependencies
npm list --depth=0

# Check frontend dependencies
cd frontend && npm list --depth=0

# Check backend dependencies
cd ../backend && npm list --depth=0
```

## Configuration

### Environment Variables

The application uses environment variables for configuration. While the default settings work for development, you can customize them if needed.

#### Backend Configuration

Create a `.env` file in the `backend` directory (optional):

```bash
# backend/.env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
LOG_LEVEL=info
```

#### Frontend Configuration

The frontend uses Vite's environment variable system. Create a `.env` file in the `frontend` directory (optional):

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=Automation Testing Website
```

### Database Setup

The application uses SQLite, which requires no additional setup. The database file will be created automatically when you first run the backend server.

## Running the Application

### Development Mode

The easiest way to run both frontend and backend simultaneously:

```bash
# From the root directory
npm run dev
```

This command uses `concurrently` to run:

- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:5173`

### Running Services Separately

If you prefer to run services separately:

#### Backend Only

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001` with hot reloading enabled.

#### Frontend Only

```bash
cd frontend
npm run dev
```

The frontend development server will start on `http://localhost:5173` with hot reloading enabled.

### Production Build

To build the application for production:

```bash
# Build both frontend and backend
npm run build

# Or build separately
npm run build:frontend
npm run build:backend
```

## Development Workflow

### Code Quality

The project includes several tools to maintain code quality:

#### Linting

```bash
# Lint all code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Lint specific parts
npm run lint:frontend
npm run lint:backend
```

#### Code Formatting

```bash
# Format all code
npm run format

# Format specific parts
npm run format:frontend
npm run format:backend
```

### Git Hooks

The project is configured with pre-commit hooks that automatically:

- Run ESLint and fix issues
- Format code with Prettier
- Run type checking

### File Structure

```
automation-testing-website/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── __tests__/      # Test files
│   ├── public/             # Static assets
│   └── dist/               # Built frontend (after build)
├── backend/                 # Express TypeScript backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Data models
│   │   ├── middleware/     # Express middleware
│   │   ├── database/       # Database configuration
│   │   ├── utils/          # Utility functions
│   │   └── __tests__/      # Test files
│   ├── uploads/            # File upload directory
│   ├── logs/               # Application logs
│   └── dist/               # Built backend (after build)
├── automation-examples/     # Test automation examples
│   ├── cypress/            # Cypress test examples
│   ├── playwright/         # Playwright test examples
│   └── selenium/           # Selenium test examples
├── docs/                   # Documentation
│   └── api/                # API documentation
└── package.json            # Root package configuration
```

## Testing

### Running Tests

#### Frontend Tests

```bash
cd frontend

# Run tests once
npm run test:run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui
```

#### Backend Tests

```bash
cd backend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Types

The project includes several types of tests:

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test API endpoints and database operations
3. **Component Tests**: Test React components with user interactions
4. **Accessibility Tests**: Automated accessibility testing with axe-core

### Writing Tests

#### Frontend Test Example

```typescript
// frontend/src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Backend Test Example

```typescript
// backend/src/__tests__/routes/users.test.ts
import request from "supertest";
import app from "../../index";

describe("Users API", () => {
  it("should get all users", async () => {
    const response = await request(app).get("/api/users").expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should create a new user", async () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    const response = await request(app)
      .post("/api/users")
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.username).toBe(userData.username);
  });
});
```

## Troubleshooting

### Common Issues

#### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Find process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# On Windows, use:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

#### Database Issues

If you encounter database-related errors:

```bash
# Delete the database file and restart
rm backend/database.sqlite
npm run dev
```

#### Node Modules Issues

If you encounter dependency-related issues:

```bash
# Clean install all dependencies
rm -rf node_modules frontend/node_modules backend/node_modules
rm package-lock.json frontend/package-lock.json backend/package-lock.json
npm run install:all
```

#### TypeScript Errors

If you encounter TypeScript compilation errors:

```bash
# Check TypeScript configuration
cd frontend && npx tsc --noEmit
cd ../backend && npx tsc --noEmit

# Clear TypeScript cache
rm -rf frontend/.tsbuildinfo backend/.tsbuildinfo
```

### Performance Issues

#### Slow Development Server

If the development server is slow:

1. Ensure you have sufficient RAM (8GB+ recommended)
2. Close unnecessary applications
3. Use `npm run dev:backend` and `npm run dev:frontend` separately
4. Consider using a faster SSD for better I/O performance

#### Large Bundle Size

If the frontend bundle is too large:

```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-analyzer dist
```

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](repository-issues-url) for similar problems
2. Review the application logs in `backend/logs/`
3. Enable debug logging by setting `LOG_LEVEL=debug` in backend/.env
4. Use browser developer tools to inspect network requests and console errors

## Additional Resources

### API Documentation

- **OpenAPI Specification**: `docs/api/openapi.yaml`
- **Interactive API Docs**: Available at `http://localhost:3001/api-docs` (when implemented)

### Testing Resources

- **Automation Examples**: See `automation-examples/` directory
- **Test Data**: Use the `/api/test/` endpoints for generating test data
- **Error Simulation**: Use `/api/test/error/:code` for testing error scenarios

### Development Tools

#### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "humao.rest-client",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

#### Useful npm Scripts

```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:frontend        # Start frontend only
npm run dev:backend         # Start backend only

# Building
npm run build              # Build both applications
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only

# Code Quality
npm run lint               # Lint all code
npm run lint:fix           # Fix linting issues
npm run format             # Format all code

# Testing
npm test                   # Run all tests
npm run test:frontend      # Run frontend tests
npm run test:backend       # Run backend tests
```

### Environment-Specific Notes

#### Windows Users

- Use Git Bash or PowerShell for better command-line experience
- Ensure Windows Defender doesn't interfere with file watching
- Consider using WSL2 for better performance

#### macOS Users

- Install Xcode Command Line Tools: `xcode-select --install`
- Consider using Homebrew for package management

#### Linux Users

- Ensure you have build essentials installed: `sudo apt-get install build-essential`
- Some distributions may require additional Python dependencies for native modules

---

## Next Steps

After setting up the development environment:

1. **Explore the API**: Use the interactive API documentation or Postman collection
2. **Run Tests**: Execute the test suite to ensure everything works
3. **Try Automation Examples**: Run the provided Selenium, Cypress, or Playwright examples
4. **Read the Documentation**: Review the component documentation and testing guidelines
5. **Start Developing**: Begin implementing your automation tests or extending the platform

For more detailed information about specific aspects of the project, refer to the additional documentation in the `docs/` directory.

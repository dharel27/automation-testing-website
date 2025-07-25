# Automation Testing Website

A comprehensive platform designed specifically for testing automation frameworks including Selenium, Cypress, Playwright, and others. This website provides a realistic testing environment with various UI components, forms, APIs, and interactive elements.

## 🚀 Project Structure

```
automation-testing-website/
├── frontend/          # React TypeScript frontend with Vite
├── backend/           # Express.js TypeScript backend
├── .kiro/            # Kiro specifications and configuration
└── package.json      # Root package with convenience scripts
```

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **React Router** for client-side navigation
- **Axios** for API communication

### Backend

- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** for lightweight database operations
- **JWT** for authentication
- **Winston** for logging
- **Multer** for file uploads

### Development Tools

- **ESLint** for code linting
- **Prettier** for code formatting
- **Concurrently** for running multiple processes

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd automation-testing-website
   ```

2. **Install all dependencies**

   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both frontend (http://localhost:5173) and backend (http://localhost:3001) servers concurrently.

## 🔧 Available Scripts

### Root Level Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run lint` - Run linting on both projects
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code using Prettier
- `npm run install:all` - Install dependencies for all projects

### Frontend Scripts (in `/frontend`)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format with Prettier

### Backend Scripts (in `/backend`)

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format with Prettier

## 🌐 API Endpoints

### Health Check

- `GET /api/health` - Check backend server status

## 🎯 Testing Features

This platform is designed to provide comprehensive testing scenarios for automation frameworks:

### Planned Features

- **Forms & Validation** - Various form types with validation
- **Dynamic Content** - Real-time updates and async operations
- **Data Tables** - Sortable, filterable, paginated tables
- **Interactive UI** - Modals, tooltips, accordions, carousels
- **Authentication** - Role-based access control
- **API Testing** - RESTful endpoints for integration testing
- **Error Handling** - Various error scenarios and HTTP status codes
- **Performance Testing** - Large datasets and load testing scenarios
- **Accessibility** - WCAG compliant components with ARIA labels
- **Responsive Design** - Mobile, tablet, and desktop layouts

## 🔍 Automation Framework Support

The website is designed to work seamlessly with:

- **Selenium WebDriver** - Standard HTML elements with proper attributes
- **Cypress** - Modern JavaScript testing framework
- **Playwright** - Cross-browser automation
- **TestCafe** - Node.js end-to-end testing

### Element Identification

- Unique `id` attributes on all interactive elements
- Custom `data-testid` attributes for automation targeting
- Comprehensive ARIA labels for accessibility and automation
- Semantic CSS classes following BEM methodology

## 🚀 Development

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting with TypeScript support
- **Prettier** for consistent code formatting
- **Strict TypeScript** configuration for better code quality

### Project Configuration

- **Vite** for fast frontend development and building
- **Hot Module Replacement** for instant development feedback
- **Source maps** for debugging
- **Environment variables** support

## 📝 Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Write TypeScript with strict type checking
3. Test your changes with the automation frameworks
4. Update documentation as needed

## 📄 License

ISC License

## 🤝 Support

For questions or issues, please refer to the project documentation or create an issue in the repository.

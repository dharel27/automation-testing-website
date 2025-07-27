/**
 * Demo Data Management for Automation Testing
 * Provides comprehensive demo scenarios and test data
 */

interface DemoScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  cleanup?: () => Promise<void>;
  testCases: string[];
}

interface DemoUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'guest';
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface DemoProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  tags: string[];
}

class DemoDataManager {
  private baseUrl =
    process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

  /**
   * Initialize all demo data
   */
  async initializeAllDemoData(): Promise<void> {
    try {
      console.log('🎭 Initializing comprehensive demo data...');

      // Reset existing data
      await this.resetAllData();

      // Create demo scenarios
      await this.createDemoScenarios();

      console.log('✅ Demo data initialization complete');

      // Show success notification
      this.showNotification('success', 'Demo data initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize demo data:', error);
      this.showNotification('error', 'Failed to initialize demo data');
      throw error;
    }
  }

  /**
   * Reset all data
   */
  async resetAllData(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/test-data/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to reset data: ${response.status}`);
    }

    console.log('🧹 All data reset successfully');
  }

  /**
   * Create comprehensive demo scenarios
   */
  async createDemoScenarios(): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/test-data/seed/demo-scenarios`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create demo scenarios: ${response.status}`);
    }

    const result = await response.json();
    console.log('🎬 Demo scenarios created:', result.data);

    // Store demo credentials for easy access
    localStorage.setItem(
      'demo_credentials',
      JSON.stringify(result.demoCredentials)
    );
    localStorage.setItem(
      'demo_scenarios',
      JSON.stringify(result.testScenarios)
    );
  }

  /**
   * Create large dataset for performance testing
   */
  async createLargeDataset(count: number = 1000): Promise<void> {
    console.log(`📊 Creating large dataset with ${count} items...`);

    const response = await fetch(
      `${this.baseUrl}/api/test-data/seed/large-dataset`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create large dataset: ${response.status}`);
    }

    const result = await response.json();
    console.log('📈 Large dataset created:', result.data);

    this.showNotification(
      'success',
      `Created ${result.data.count} items for performance testing`
    );
  }

  /**
   * Get demo credentials
   */
  getDemoCredentials(): Record<string, { username: string; password: string }> {
    try {
      const stored = localStorage.getItem('demo_credentials');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get available demo scenarios
   */
  getDemoScenarios(): string[] {
    try {
      const stored = localStorage.getItem('demo_scenarios');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Create specific test user
   */
  async createTestUser(userData: Partial<DemoUser>): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/test-data/create-test-user`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create test user');
    }

    const result = await response.json();
    console.log('👤 Test user created:', result.data);
  }

  /**
   * Get current data status
   */
  async getDataStatus(): Promise<{
    users: number;
    products: number;
    sessions: number;
    files: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/test-data/status`);

    if (!response.ok) {
      throw new Error(`Failed to get data status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Predefined demo scenarios
   */
  getScenarios(): DemoScenario[] {
    return [
      {
        name: 'Basic User Journey',
        description:
          'Complete user registration, login, and basic interactions',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'User registration with validation',
          'User login with different roles',
          'Profile management',
          'Basic navigation',
        ],
      },
      {
        name: 'E-commerce Flow',
        description:
          'Product browsing, search, and shopping cart functionality',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'Product catalog browsing',
          'Search and filtering',
          'Product details view',
          'Shopping cart operations',
          'Checkout process',
        ],
      },
      {
        name: 'Admin Dashboard',
        description: 'Administrative functions and data management',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'Admin login',
          'User management',
          'Product management',
          'System monitoring',
          'Data export/import',
        ],
      },
      {
        name: 'Performance Testing',
        description: 'Large datasets and performance-intensive operations',
        setup: async () => {
          await this.createLargeDataset(2000);
        },
        testCases: [
          'Large table rendering',
          'Search with many results',
          'Pagination performance',
          'Memory usage monitoring',
          'Load time measurement',
        ],
      },
      {
        name: 'Error Scenarios',
        description: 'Various error conditions and edge cases',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'Network error handling',
          'Invalid form submissions',
          'Authentication failures',
          'Server error responses',
          'Offline functionality',
        ],
      },
      {
        name: 'Accessibility Testing',
        description: 'Comprehensive accessibility features and compliance',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'Keyboard navigation',
          'Screen reader compatibility',
          'Color contrast validation',
          'Focus management',
          'ARIA implementation',
        ],
      },
      {
        name: 'Mobile Responsiveness',
        description: 'Mobile and tablet device compatibility',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'Mobile layout adaptation',
          'Touch interactions',
          'Responsive breakpoints',
          'Mobile navigation',
          'Performance on mobile',
        ],
      },
      {
        name: 'API Integration',
        description: 'RESTful API testing and integration scenarios',
        setup: async () => {
          await this.createDemoScenarios();
        },
        testCases: [
          'CRUD operations',
          'Authentication endpoints',
          'Error response handling',
          'Rate limiting',
          'Data validation',
        ],
      },
    ];
  }

  /**
   * Run a specific demo scenario
   */
  async runScenario(scenarioName: string): Promise<void> {
    const scenario = this.getScenarios().find((s) => s.name === scenarioName);

    if (!scenario) {
      throw new Error(`Scenario "${scenarioName}" not found`);
    }

    console.log(`🎬 Running scenario: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);

    try {
      await scenario.setup();

      console.log('✅ Scenario setup complete');
      console.log('🧪 Available test cases:');
      scenario.testCases.forEach((testCase, index) => {
        console.log(`  ${index + 1}. ${testCase}`);
      });

      this.showNotification(
        'success',
        `Scenario "${scenario.name}" is ready for testing`
      );
    } catch (error) {
      console.error(`❌ Failed to run scenario "${scenarioName}":`, error);
      this.showNotification(
        'error',
        `Failed to setup scenario: ${scenarioName}`
      );
      throw error;
    }
  }

  /**
   * Generate test report
   */
  generateTestReport(): string {
    const credentials = this.getDemoCredentials();
    const scenarios = this.getDemoScenarios();

    let report = `
Automation Testing Website - Demo Data Report
============================================
Generated: ${new Date().toISOString()}

Available Demo Credentials:
`;

    Object.entries(credentials).forEach(([role, creds]) => {
      report += `
${role.toUpperCase()}:
  Username: ${creds.username}
  Password: ${creds.password}
`;
    });

    report += `
Available Test Scenarios:
`;

    scenarios.forEach((scenario, index) => {
      report += `${index + 1}. ${scenario}\n`;
    });

    report += `
Predefined Demo Scenarios:
`;

    this.getScenarios().forEach((scenario, index) => {
      report += `
${index + 1}. ${scenario.name}
   Description: ${scenario.description}
   Test Cases: ${scenario.testCases.length}
`;
    });

    return report;
  }

  /**
   * Export demo data configuration
   */
  exportConfiguration(): object {
    return {
      credentials: this.getDemoCredentials(),
      scenarios: this.getDemoScenarios(),
      predefinedScenarios: this.getScenarios().map((s) => ({
        name: s.name,
        description: s.description,
        testCases: s.testCases,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Show notification (if notification system is available)
   */
  private showNotification(
    type: 'success' | 'error' | 'info',
    message: string
  ): void {
    // Try to use the notification system if available
    if (window.showNotification) {
      window.showNotification(type, message);
    } else {
      // Fallback to console
      const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
      console.log(`${emoji} ${message}`);
    }
  }
}

// Create singleton instance
const demoDataManager = new DemoDataManager();

// Export convenience functions
export const initializeDemoData = () => demoDataManager.initializeAllDemoData();
export const resetDemoData = () => demoDataManager.resetAllData();
export const createLargeDataset = (count?: number) =>
  demoDataManager.createLargeDataset(count);
export const getDemoCredentials = () => demoDataManager.getDemoCredentials();
export const getDemoScenarios = () => demoDataManager.getDemoScenarios();
export const runDemoScenario = (name: string) =>
  demoDataManager.runScenario(name);
export const getDataStatus = () => demoDataManager.getDataStatus();
export const generateDemoReport = () => demoDataManager.generateTestReport();
export const exportDemoConfig = () => demoDataManager.exportConfiguration();

// Export the manager for advanced usage
export { demoDataManager };

// Global declaration for notification system
declare global {
  interface Window {
    showNotification?: (
      type: 'success' | 'error' | 'info',
      message: string
    ) => void;
  }
}

import { Router } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { FileRecord } from '../models/FileRecord';
import { Session } from '../models/Session';
import { db } from '../database/connection';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * Test data seeding and reset endpoints for automation testing
 */

// Sample test data
const sampleUsers = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'password123',
    role: 'user' as const,
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
    },
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'password123',
    role: 'user' as const,
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      avatar: null,
    },
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin' as const,
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      avatar: null,
    },
  },
  {
    username: 'guest',
    email: 'guest@example.com',
    password: 'guest123',
    role: 'guest' as const,
    profile: {
      firstName: 'Guest',
      lastName: 'User',
      avatar: null,
    },
  },
];

const sampleProducts = [
  {
    name: 'Test Product 1',
    description: 'This is a test product for automation testing',
    price: 29.99,
    category: 'Electronics',
    inStock: true,
    imageUrl: null,
    tags: ['test', 'electronics', 'automation'],
  },
  {
    name: 'Test Product 2',
    description: 'Another test product with different category',
    price: 49.99,
    category: 'Books',
    inStock: false,
    imageUrl: null,
    tags: ['test', 'books', 'education'],
  },
  {
    name: 'Test Product 3',
    description: 'Premium test product for advanced testing',
    price: 99.99,
    category: 'Electronics',
    inStock: true,
    imageUrl: null,
    tags: ['test', 'premium', 'electronics'],
  },
  {
    name: 'Test Product 4',
    description: 'Budget-friendly test product',
    price: 9.99,
    category: 'Home',
    inStock: true,
    imageUrl: null,
    tags: ['test', 'budget', 'home'],
  },
  {
    name: 'Test Product 5',
    description: 'Out of stock test product',
    price: 19.99,
    category: 'Clothing',
    inStock: false,
    imageUrl: null,
    tags: ['test', 'clothing', 'fashion'],
  },
];

/**
 * Reset all test data - clears all tables
 */
router.post('/reset', async (req, res) => {
  try {
    // Clear all tables in correct order (respecting foreign key constraints)
    await db.run('DELETE FROM sessions');
    await db.run('DELETE FROM file_records');
    await db.run('DELETE FROM products');
    await db.run('DELETE FROM users');

    // Reset auto-increment counters
    await db.run('DELETE FROM sqlite_sequence');

    res.json({
      success: true,
      message: 'All test data has been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting test data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_ERROR',
        message: 'Failed to reset test data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Seed users table with test data
 */
router.post('/seed/users', async (req, res) => {
  try {
    const users = [];

    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User(
        userData.username,
        userData.email,
        hashedPassword,
        userData.role,
        userData.profile
      );

      await user.save();
      users.push({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      });
    }

    res.json({
      success: true,
      message: `Seeded ${users.length} test users`,
      data: users,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEED_USERS_ERROR',
        message: 'Failed to seed user data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Seed products table with test data
 */
router.post('/seed/products', async (req, res) => {
  try {
    const products = [];

    for (const productData of sampleProducts) {
      const product = new Product(
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.inStock,
        productData.imageUrl,
        productData.tags
      );

      await product.save();
      products.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        inStock: product.inStock,
        tags: product.tags,
      });
    }

    res.json({
      success: true,
      message: `Seeded ${products.length} test products`,
      data: products,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEED_PRODUCTS_ERROR',
        message: 'Failed to seed product data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Seed all tables with test data
 */
router.post('/seed/all', async (req, res) => {
  try {
    // First reset all data
    await db.run('DELETE FROM sessions');
    await db.run('DELETE FROM file_records');
    await db.run('DELETE FROM products');
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM sqlite_sequence');

    // Seed users
    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User(
        userData.username,
        userData.email,
        hashedPassword,
        userData.role,
        userData.profile
      );

      await user.save();
      users.push({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      });
    }

    // Seed products
    const products = [];
    for (const productData of sampleProducts) {
      const product = new Product(
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.inStock,
        productData.imageUrl,
        productData.tags
      );

      await product.save();
      products.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        inStock: product.inStock,
        tags: product.tags,
      });
    }

    res.json({
      success: true,
      message: 'All test data has been seeded successfully',
      data: {
        users: users.length,
        products: products.length,
      },
      seededData: {
        users,
        products,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding all test data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEED_ALL_ERROR',
        message: 'Failed to seed all test data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Generate large dataset for performance testing
 */
router.post('/seed/large-dataset', async (req, res) => {
  try {
    const { count = 1000 } = req.body;
    const maxCount = 10000; // Prevent excessive data generation
    const actualCount = Math.min(count, maxCount);

    const products = [];
    const categories = [
      'Electronics',
      'Books',
      'Clothing',
      'Home',
      'Sports',
      'Toys',
      'Food',
      'Beauty',
    ];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    for (let i = 1; i <= actualCount; i++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];

      const product = new Product(
        `Performance Test Product ${i}`,
        `This is a generated product for performance testing. Product number ${i} with various attributes for filtering and searching.`,
        Math.round((Math.random() * 1000 + 10) * 100) / 100, // Random price between $10-$1010
        category,
        Math.random() > 0.2, // 80% chance of being in stock
        null,
        ['performance', 'test', 'generated', category.toLowerCase(), priority]
      );

      // Add custom properties for performance testing
      (product as any).priority = priority;
      (product as any).value = Math.floor(Math.random() * 1000);
      (product as any).active = Math.random() > 0.1; // 90% chance of being active

      await product.save();
      products.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        inStock: product.inStock,
        priority,
        value: (product as any).value,
        active: (product as any).active,
      });
    }

    res.json({
      success: true,
      message: `Generated ${products.length} products for performance testing`,
      data: {
        count: products.length,
        categories: categories.length,
        sampleProducts: products.slice(0, 5), // Return first 5 as sample
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating large dataset:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LARGE_DATASET_ERROR',
        message: 'Failed to generate large dataset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get current test data status
 */
router.get('/status', async (req, res) => {
  try {
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    const sessionCount = await db.get('SELECT COUNT(*) as count FROM sessions');
    const fileCount = await db.get(
      'SELECT COUNT(*) as count FROM file_records'
    );

    res.json({
      success: true,
      data: {
        users: userCount.count,
        products: productCount.count,
        sessions: sessionCount.count,
        files: fileCount.count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting test data status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to get test data status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Create specific test user for automation
 */
router.post('/create-test-user', async (req, res) => {
  try {
    const {
      username = 'automation-user',
      email = 'automation@test.com',
      password = 'test123',
      role = 'user',
      profile = {
        firstName: 'Automation',
        lastName: 'Test',
        avatar: null,
      },
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Test user already exists',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User(username, email, hashedPassword, role, profile);
    await user.save();

    res.json({
      success: true,
      message: 'Test user created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_USER_ERROR',
        message: 'Failed to create test user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

import { DatabaseManager } from '../database/init';
import { closeDatabase, resetDatabaseConnection } from '../database/connection';
import fs from 'fs';
import path from 'path';

// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'test.sqlite');

beforeEach(async () => {
  // Remove test database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Reset the singleton instances to ensure fresh state
  (DatabaseManager as any).instance = null;
  resetDatabaseConnection();

  // Initialize fresh database for each test
  const manager = DatabaseManager.getInstance();
  await manager.initialize(TEST_DB_PATH);
});

afterEach(async () => {
  try {
    // Close database connection
    const manager = DatabaseManager.getInstance();
    await manager.close();
    await closeDatabase();
  } catch (error) {
    // Ignore errors during cleanup
  }

  // Reset the singleton instances
  (DatabaseManager as any).instance = null;
  resetDatabaseConnection();

  // Clean up test database file
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

afterAll(async () => {
  // Final cleanup
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

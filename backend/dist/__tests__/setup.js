var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DatabaseManager } from '../database/init';
import { closeDatabase, resetDatabaseConnection } from '../database/connection';
import fs from 'fs';
import path from 'path';
// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'test.sqlite');
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    // Remove test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
    }
    // Reset the singleton instances to ensure fresh state
    DatabaseManager.instance = null;
    resetDatabaseConnection();
    // Initialize fresh database for each test
    const manager = DatabaseManager.getInstance();
    yield manager.initialize(TEST_DB_PATH);
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Close database connection
        const manager = DatabaseManager.getInstance();
        yield manager.close();
        yield closeDatabase();
    }
    catch (error) {
        // Ignore errors during cleanup
    }
    // Reset the singleton instances
    DatabaseManager.instance = null;
    resetDatabaseConnection();
    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
    }
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Final cleanup
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
    }
}));

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const migrations = [
    {
        id: '001_initial_schema',
        description: 'Create initial database schema',
        up: (db) => __awaiter(void 0, void 0, void 0, function* () {
            // Create users table
            yield db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
          first_name TEXT,
          last_name TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create products table
            yield db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category TEXT NOT NULL,
          in_stock BOOLEAN DEFAULT 1,
          image_url TEXT,
          tags TEXT, -- JSON array stored as string
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create sessions table
            yield db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);
            // Create file_records table
            yield db.run(`
        CREATE TABLE IF NOT EXISTS file_records (
          id TEXT PRIMARY KEY,
          original_name TEXT NOT NULL,
          filename TEXT NOT NULL,
          mimetype TEXT NOT NULL,
          size INTEGER NOT NULL,
          uploaded_by TEXT NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE CASCADE
        )
      `);
            // Create migrations table to track applied migrations
            yield db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create indexes for better performance
            yield db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
            yield db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)');
            yield db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)');
            yield db.run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token)');
            yield db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)');
            yield db.run('CREATE INDEX IF NOT EXISTS idx_file_records_uploaded_by ON file_records (uploaded_by)');
        }),
        down: (db) => __awaiter(void 0, void 0, void 0, function* () {
            yield db.run('DROP TABLE IF EXISTS file_records');
            yield db.run('DROP TABLE IF EXISTS sessions');
            yield db.run('DROP TABLE IF EXISTS products');
            yield db.run('DROP TABLE IF EXISTS users');
            yield db.run('DROP TABLE IF EXISTS migrations');
        }),
    },
];
export class MigrationRunner {
    constructor(db) {
        this.db = db;
    }
    runMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get applied migrations
            const appliedMigrations = yield this.getAppliedMigrations();
            for (const migration of migrations) {
                if (!appliedMigrations.includes(migration.id)) {
                    console.log(`Running migration: ${migration.id} - ${migration.description}`);
                    try {
                        yield migration.up(this.db);
                        yield this.recordMigration(migration);
                        console.log(`Migration ${migration.id} completed successfully`);
                    }
                    catch (error) {
                        console.error(`Migration ${migration.id} failed:`, error);
                        throw error;
                    }
                }
            }
        });
    }
    rollbackMigration(migrationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const migration = migrations.find((m) => m.id === migrationId);
            if (!migration) {
                throw new Error(`Migration ${migrationId} not found`);
            }
            const appliedMigrations = yield this.getAppliedMigrations();
            if (!appliedMigrations.includes(migrationId)) {
                throw new Error(`Migration ${migrationId} has not been applied`);
            }
            console.log(`Rolling back migration: ${migrationId}`);
            yield migration.down(this.db);
            yield this.removeMigrationRecord(migrationId);
            console.log(`Migration ${migrationId} rolled back successfully`);
        });
    }
    getAppliedMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rows = yield this.db.all('SELECT id FROM migrations ORDER BY applied_at');
                return rows.map((row) => row.id);
            }
            catch (error) {
                // If migrations table doesn't exist, no migrations have been applied
                return [];
            }
        });
    }
    recordMigration(migration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.run('INSERT INTO migrations (id, description) VALUES (?, ?)', [migration.id, migration.description]);
        });
    }
    removeMigrationRecord(migrationId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.run('DELETE FROM migrations WHERE id = ?', [migrationId]);
        });
    }
}

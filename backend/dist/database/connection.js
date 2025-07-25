var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
class DatabaseConnection {
    constructor() {
        this.db = null;
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    connect(dbPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                return this.createDatabaseInterface();
            }
            const databasePath = dbPath || path.join(process.cwd(), 'database.sqlite');
            // Ensure database directory exists
            const dbDir = path.dirname(databasePath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            return new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(databasePath, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log(`Connected to SQLite database at ${databasePath}`);
                        resolve(this.createDatabaseInterface());
                    }
                });
            });
        });
    }
    createDatabaseInterface() {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        const db = this.db;
        return {
            run: (sql, params) => __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    db.run(sql, params || [], function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(this);
                        }
                    });
                });
            }),
            get: promisify(db.get.bind(db)),
            all: promisify(db.all.bind(db)),
            close: () => __awaiter(this, void 0, void 0, function* () {
                // This is a no-op for the interface - actual closing is handled by the connection manager
                return Promise.resolve();
            }),
        };
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                const closePromise = promisify(this.db.close.bind(this.db));
                yield closePromise();
                this.db = null;
            }
        });
    }
}
export const getDatabase = (dbPath) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = DatabaseConnection.getInstance();
    return yield connection.connect(dbPath);
});
export const closeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = DatabaseConnection.getInstance();
    yield connection.close();
});
export const resetDatabaseConnection = () => {
    DatabaseConnection.instance = null;
};

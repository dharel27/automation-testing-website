var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuidv4 } from 'uuid';
export class Session {
    constructor(db) {
        this.db = db;
    }
    create(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = uuidv4();
            const now = new Date().toISOString();
            yield this.db.run(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
                id,
                sessionData.userId,
                sessionData.token,
                sessionData.expiresAt.toISOString(),
                now,
            ]);
            const session = yield this.findById(id);
            if (!session) {
                throw new Error('Failed to create session');
            }
            return session;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM sessions WHERE id = ?', [id]);
            return row ? this.mapRowToSession(row) : null;
        });
    }
    findByToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM sessions WHERE token = ?', [token]);
            return row ? this.mapRowToSession(row) : null;
        });
    }
    findByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.db.all('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            return rows.map((row) => this.mapRowToSession(row));
        });
    }
    findValidByToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")', [token]);
            return row ? this.mapRowToSession(row) : null;
        });
    }
    findValidByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.db.all('SELECT * FROM sessions WHERE user_id = ? AND expires_at > datetime("now") ORDER BY created_at DESC', [userId]);
            return rows.map((row) => this.mapRowToSession(row));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
            return (result.changes || 0) > 0;
        });
    }
    deleteByToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM sessions WHERE token = ?', [
                token,
            ]);
            return (result.changes || 0) > 0;
        });
    }
    deleteByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM sessions WHERE user_id = ?', [
                userId,
            ]);
            return result.changes || 0;
        });
    }
    deleteExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM sessions WHERE expires_at <= datetime("now")');
            return result.changes || 0;
        });
    }
    update(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = [];
            const values = [];
            if (updates.token !== undefined) {
                fields.push('token = ?');
                values.push(updates.token);
            }
            if (updates.expiresAt !== undefined) {
                fields.push('expires_at = ?');
                values.push(updates.expiresAt.toISOString());
            }
            if (fields.length === 0) {
                return yield this.findById(id);
            }
            values.push(id);
            const result = yield this.db.run(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);
            if ((result.changes || 0) === 0) {
                return null;
            }
            return yield this.findById(id);
        });
    }
    extendSession(token, newExpiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('UPDATE sessions SET expires_at = ? WHERE token = ?', [newExpiresAt.toISOString(), token]);
            if ((result.changes || 0) === 0) {
                return null;
            }
            return yield this.findByToken(token);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.get('SELECT COUNT(*) as count FROM sessions');
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    countValid() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.get('SELECT COUNT(*) as count FROM sessions WHERE expires_at > datetime("now")');
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    countByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.get('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?', [userId]);
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    isTokenValid(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.findValidByToken(token);
            return session !== null;
        });
    }
    mapRowToSession(row) {
        return {
            id: row.id,
            userId: row.user_id,
            token: row.token,
            expiresAt: new Date(row.expires_at),
            createdAt: new Date(row.created_at),
        };
    }
}

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
import bcrypt from 'bcryptjs';
export class User {
    constructor(db) {
        this.db = db;
    }
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const id = uuidv4();
            const hashedPassword = yield bcrypt.hash(userData.password, 10);
            const now = new Date().toISOString();
            yield this.db.run(`
      INSERT INTO users (
        id, username, email, password, role, first_name, last_name, avatar, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
                id,
                userData.username,
                userData.email,
                hashedPassword,
                userData.role || 'user',
                ((_a = userData.profile) === null || _a === void 0 ? void 0 : _a.firstName) || null,
                ((_b = userData.profile) === null || _b === void 0 ? void 0 : _b.lastName) || null,
                ((_c = userData.profile) === null || _c === void 0 ? void 0 : _c.avatar) || null,
                now,
                now,
            ]);
            const user = yield this.findById(id);
            if (!user) {
                throw new Error('Failed to create user');
            }
            return user;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM users WHERE id = ?', [
                id,
            ]);
            return row ? this.mapRowToUser(row) : null;
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM users WHERE email = ?', [email]);
            return row ? this.mapRowToUser(row) : null;
        });
    }
    findByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM users WHERE username = ?', [username]);
            return row ? this.mapRowToUser(row) : null;
        });
    }
    findAll(limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM users ORDER BY created_at DESC';
            const params = [];
            if (limit) {
                query += ' LIMIT ?';
                params.push(limit);
                if (offset) {
                    query += ' OFFSET ?';
                    params.push(offset);
                }
            }
            const rows = yield this.db.all(query, params);
            return rows.map((row) => this.mapRowToUser(row));
        });
    }
    update(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const existingUser = yield this.findById(id);
            if (!existingUser) {
                return null;
            }
            const updates = [];
            const params = [];
            if (updateData.username !== undefined) {
                updates.push('username = ?');
                params.push(updateData.username);
            }
            if (updateData.email !== undefined) {
                updates.push('email = ?');
                params.push(updateData.email);
            }
            if (updateData.password !== undefined) {
                updates.push('password = ?');
                params.push(yield bcrypt.hash(updateData.password, 10));
            }
            if (updateData.role !== undefined) {
                updates.push('role = ?');
                params.push(updateData.role);
            }
            if (((_a = updateData.profile) === null || _a === void 0 ? void 0 : _a.firstName) !== undefined) {
                updates.push('first_name = ?');
                params.push(updateData.profile.firstName);
            }
            if (((_b = updateData.profile) === null || _b === void 0 ? void 0 : _b.lastName) !== undefined) {
                updates.push('last_name = ?');
                params.push(updateData.profile.lastName);
            }
            if (((_c = updateData.profile) === null || _c === void 0 ? void 0 : _c.avatar) !== undefined) {
                updates.push('avatar = ?');
                params.push(updateData.profile.avatar);
            }
            if (updates.length === 0) {
                return existingUser;
            }
            updates.push('updated_at = ?');
            params.push(new Date().toISOString());
            params.push(id);
            yield this.db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
            return yield this.findById(id);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM users WHERE id = ?', [id]);
            return (result.changes || 0) > 0;
        });
    }
    verifyPassword(user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield bcrypt.compare(password, user.password);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.get('SELECT COUNT(*) as count FROM users');
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    mapRowToUser(row) {
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            password: row.password,
            role: row.role,
            profile: {
                firstName: row.first_name || undefined,
                lastName: row.last_name || undefined,
                avatar: row.avatar || undefined,
            },
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}

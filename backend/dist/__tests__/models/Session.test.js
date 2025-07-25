var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getModels } from '../../database/init';
describe('Session Model', () => {
    let sessionModel;
    let userModel;
    let testUserId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const models = getModels();
        sessionModel = models.session;
        userModel = models.user;
        // Create a test user for session tests
        const userData = {
            username: 'sessionuser',
            email: 'session@example.com',
            password: 'password123',
        };
        const user = yield userModel.create(userData);
        testUserId = user.id;
    }));
    describe('create', () => {
        it('should create a new session', () => __awaiter(void 0, void 0, void 0, function* () {
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
            const sessionData = {
                userId: testUserId,
                token: 'test-token-123',
                expiresAt,
            };
            const session = yield sessionModel.create(sessionData);
            expect(session.id).toBeDefined();
            expect(session.userId).toBe(sessionData.userId);
            expect(session.token).toBe(sessionData.token);
            expect(session.expiresAt).toEqual(expiresAt);
            expect(session.createdAt).toBeInstanceOf(Date);
        }));
        it('should throw error for duplicate token', () => __awaiter(void 0, void 0, void 0, function* () {
            const expiresAt = new Date(Date.now() + 3600000);
            const sessionData = {
                userId: testUserId,
                token: 'duplicate-token',
                expiresAt,
            };
            yield sessionModel.create(sessionData);
            const duplicateData = {
                userId: testUserId,
                token: 'duplicate-token',
                expiresAt,
            };
            yield expect(sessionModel.create(duplicateData)).rejects.toThrow();
        }));
    });
    describe('findById', () => {
        it('should find session by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const expiresAt = new Date(Date.now() + 3600000);
            const sessionData = {
                userId: testUserId,
                token: 'find-by-id-token',
                expiresAt,
            };
            const createdSession = yield sessionModel.create(sessionData);
            const foundSession = yield sessionModel.findById(createdSession.id);
            expect(foundSession).not.toBeNull();
            expect(foundSession.id).toBe(createdSession.id);
            expect(foundSession.token).toBe(sessionData.token);
        }));
        it('should return null for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            const foundSession = yield sessionModel.findById('non-existent-id');
            expect(foundSession).toBeNull();
        }));
    });
    describe('findByToken', () => {
        it('should find session by token', () => __awaiter(void 0, void 0, void 0, function* () {
            const expiresAt = new Date(Date.now() + 3600000);
            const sessionData = {
                userId: testUserId,
                token: 'find-by-token',
                expiresAt,
            };
            yield sessionModel.create(sessionData);
            const foundSession = yield sessionModel.findByToken(sessionData.token);
            expect(foundSession).not.toBeNull();
            expect(foundSession.token).toBe(sessionData.token);
        }));
        it('should return null for non-existent token', () => __awaiter(void 0, void 0, void 0, function* () {
            const foundSession = yield sessionModel.findByToken('non-existent-token');
            expect(foundSession).toBeNull();
        }));
    });
    describe('findByUserId', () => {
        it('should find all sessions for a user', () => __awaiter(void 0, void 0, void 0, function* () {
            const sessions = [
                {
                    userId: testUserId,
                    token: 'user-token-1',
                    expiresAt: new Date(Date.now() + 3600000),
                },
                {
                    userId: testUserId,
                    token: 'user-token-2',
                    expiresAt: new Date(Date.now() + 3600000),
                },
            ];
            for (const sessionData of sessions) {
                yield sessionModel.create(sessionData);
            }
            const userSessions = yield sessionModel.findByUserId(testUserId);
            expect(userSessions).toHaveLength(2);
            expect(userSessions.every((s) => s.userId === testUserId)).toBe(true);
        }));
        it('should return empty array for user with no sessions', () => __awaiter(void 0, void 0, void 0, function* () {
            const userSessions = yield sessionModel.findByUserId('non-existent-user');
            expect(userSessions).toHaveLength(0);
        }));
    });
    describe('findValidByToken', () => {
        it('should find valid (non-expired) session by token', () => __awaiter(void 0, void 0, void 0, function* () {
            const validExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now
            const expiredExpiresAt = new Date(Date.now() - 3600000); // 1 hour ago
            yield sessionModel.create({
                userId: testUserId,
                token: 'valid-token',
                expiresAt: validExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'expired-token',
                expiresAt: expiredExpiresAt,
            });
            const validSession = yield sessionModel.findValidByToken('valid-token');
            const expiredSession = yield sessionModel.findValidByToken('expired-token');
            expect(validSession).not.toBeNull();
            expect(validSession.token).toBe('valid-token');
            expect(expiredSession).toBeNull();
        }));
    });
    describe('findValidByUserId', () => {
        it('should find only valid sessions for a user', () => __awaiter(void 0, void 0, void 0, function* () {
            const validExpiresAt = new Date(Date.now() + 3600000);
            const expiredExpiresAt = new Date(Date.now() - 3600000);
            yield sessionModel.create({
                userId: testUserId,
                token: 'valid-token-1',
                expiresAt: validExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'valid-token-2',
                expiresAt: validExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'expired-token',
                expiresAt: expiredExpiresAt,
            });
            const validSessions = yield sessionModel.findValidByUserId(testUserId);
            expect(validSessions).toHaveLength(2);
            expect(validSessions.every((s) => s.expiresAt > new Date())).toBe(true);
        }));
    });
    describe('delete', () => {
        it('should delete session by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const sessionData = {
                userId: testUserId,
                token: 'delete-test-token',
                expiresAt: new Date(Date.now() + 3600000),
            };
            const session = yield sessionModel.create(sessionData);
            const deleted = yield sessionModel.delete(session.id);
            expect(deleted).toBe(true);
            const foundSession = yield sessionModel.findById(session.id);
            expect(foundSession).toBeNull();
        }));
        it('should return false for non-existent session', () => __awaiter(void 0, void 0, void 0, function* () {
            const deleted = yield sessionModel.delete('non-existent-id');
            expect(deleted).toBe(false);
        }));
    });
    describe('deleteByToken', () => {
        it('should delete session by token', () => __awaiter(void 0, void 0, void 0, function* () {
            const sessionData = {
                userId: testUserId,
                token: 'delete-by-token',
                expiresAt: new Date(Date.now() + 3600000),
            };
            yield sessionModel.create(sessionData);
            const deleted = yield sessionModel.deleteByToken(sessionData.token);
            expect(deleted).toBe(true);
            const foundSession = yield sessionModel.findByToken(sessionData.token);
            expect(foundSession).toBeNull();
        }));
    });
    describe('deleteByUserId', () => {
        it('should delete all sessions for a user', () => __awaiter(void 0, void 0, void 0, function* () {
            const sessions = [
                {
                    userId: testUserId,
                    token: 'user-token-1',
                    expiresAt: new Date(Date.now() + 3600000),
                },
                {
                    userId: testUserId,
                    token: 'user-token-2',
                    expiresAt: new Date(Date.now() + 3600000),
                },
            ];
            for (const sessionData of sessions) {
                yield sessionModel.create(sessionData);
            }
            const deletedCount = yield sessionModel.deleteByUserId(testUserId);
            expect(deletedCount).toBe(2);
            const userSessions = yield sessionModel.findByUserId(testUserId);
            expect(userSessions).toHaveLength(0);
        }));
    });
    describe('deleteExpired', () => {
        it('should delete only expired sessions', () => __awaiter(void 0, void 0, void 0, function* () {
            const validExpiresAt = new Date(Date.now() + 3600000);
            const expiredExpiresAt = new Date(Date.now() - 3600000);
            yield sessionModel.create({
                userId: testUserId,
                token: 'valid-token',
                expiresAt: validExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'expired-token-1',
                expiresAt: expiredExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'expired-token-2',
                expiresAt: expiredExpiresAt,
            });
            const deletedCount = yield sessionModel.deleteExpired();
            expect(deletedCount).toBe(2);
            const remainingSessions = yield sessionModel.findByUserId(testUserId);
            expect(remainingSessions).toHaveLength(1);
            expect(remainingSessions[0].token).toBe('valid-token');
        }));
    });
    describe('extendSession', () => {
        it('should extend session expiration', () => __awaiter(void 0, void 0, void 0, function* () {
            const originalExpiresAt = new Date(Date.now() + 3600000);
            const sessionData = {
                userId: testUserId,
                token: 'extend-token',
                expiresAt: originalExpiresAt,
            };
            yield sessionModel.create(sessionData);
            const newExpiresAt = new Date(Date.now() + 7200000); // 2 hours from now
            const extendedSession = yield sessionModel.extendSession(sessionData.token, newExpiresAt);
            expect(extendedSession).not.toBeNull();
            expect(extendedSession.expiresAt).toEqual(newExpiresAt);
            expect(extendedSession.expiresAt).not.toEqual(originalExpiresAt);
        }));
        it('should return null for non-existent token', () => __awaiter(void 0, void 0, void 0, function* () {
            const newExpiresAt = new Date(Date.now() + 7200000);
            const result = yield sessionModel.extendSession('non-existent-token', newExpiresAt);
            expect(result).toBeNull();
        }));
    });
    describe('isTokenValid', () => {
        it('should return true for valid token', () => __awaiter(void 0, void 0, void 0, function* () {
            const sessionData = {
                userId: testUserId,
                token: 'valid-check-token',
                expiresAt: new Date(Date.now() + 3600000),
            };
            yield sessionModel.create(sessionData);
            const isValid = yield sessionModel.isTokenValid(sessionData.token);
            expect(isValid).toBe(true);
        }));
        it('should return false for expired token', () => __awaiter(void 0, void 0, void 0, function* () {
            const sessionData = {
                userId: testUserId,
                token: 'expired-check-token',
                expiresAt: new Date(Date.now() - 3600000),
            };
            yield sessionModel.create(sessionData);
            const isValid = yield sessionModel.isTokenValid(sessionData.token);
            expect(isValid).toBe(false);
        }));
        it('should return false for non-existent token', () => __awaiter(void 0, void 0, void 0, function* () {
            const isValid = yield sessionModel.isTokenValid('non-existent-token');
            expect(isValid).toBe(false);
        }));
    });
    describe('count methods', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const validExpiresAt = new Date(Date.now() + 3600000);
            const expiredExpiresAt = new Date(Date.now() - 3600000);
            yield sessionModel.create({
                userId: testUserId,
                token: 'count-valid-1',
                expiresAt: validExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'count-valid-2',
                expiresAt: validExpiresAt,
            });
            yield sessionModel.create({
                userId: testUserId,
                token: 'count-expired',
                expiresAt: expiredExpiresAt,
            });
        }));
        it('should count all sessions', () => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield sessionModel.count();
            expect(count).toBe(3);
        }));
        it('should count only valid sessions', () => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield sessionModel.countValid();
            expect(count).toBe(2);
        }));
        it('should count sessions by user id', () => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield sessionModel.countByUserId(testUserId);
            expect(count).toBe(3);
        }));
    });
});

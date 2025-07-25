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
describe('User Model', () => {
    let userModel;
    beforeEach(() => {
        const models = getModels();
        userModel = models.user;
    });
    describe('create', () => {
        it('should create a new user with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'user',
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                },
            };
            const user = yield userModel.create(userData);
            expect(user.id).toBeDefined();
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            expect(user.role).toBe(userData.role);
            expect(user.profile.firstName).toBe((_a = userData.profile) === null || _a === void 0 ? void 0 : _a.firstName);
            expect(user.profile.lastName).toBe((_b = userData.profile) === null || _b === void 0 ? void 0 : _b.lastName);
            expect(user.password).not.toBe(userData.password); // Should be hashed
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        }));
        it('should create a user with default role when not specified', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'testuser2',
                email: 'test2@example.com',
                password: 'password123',
            };
            const user = yield userModel.create(userData);
            expect(user.role).toBe('user');
            expect(user.profile.firstName).toBeUndefined();
            expect(user.profile.lastName).toBeUndefined();
        }));
        it('should throw error for duplicate username', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'duplicate',
                email: 'test1@example.com',
                password: 'password123',
            };
            yield userModel.create(userData);
            const duplicateData = {
                username: 'duplicate',
                email: 'test2@example.com',
                password: 'password123',
            };
            yield expect(userModel.create(duplicateData)).rejects.toThrow();
        }));
        it('should throw error for duplicate email', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'user1',
                email: 'duplicate@example.com',
                password: 'password123',
            };
            yield userModel.create(userData);
            const duplicateData = {
                username: 'user2',
                email: 'duplicate@example.com',
                password: 'password123',
            };
            yield expect(userModel.create(duplicateData)).rejects.toThrow();
        }));
    });
    describe('findById', () => {
        it('should find user by id', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'findtest',
                email: 'find@example.com',
                password: 'password123',
            };
            const createdUser = yield userModel.create(userData);
            const foundUser = yield userModel.findById(createdUser.id);
            expect(foundUser).not.toBeNull();
            expect(foundUser.id).toBe(createdUser.id);
            expect(foundUser.username).toBe(userData.username);
        }));
        it('should return null for non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
            const foundUser = yield userModel.findById('non-existent-id');
            expect(foundUser).toBeNull();
        }));
    });
    describe('findByEmail', () => {
        it('should find user by email', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'emailtest',
                email: 'email@example.com',
                password: 'password123',
            };
            yield userModel.create(userData);
            const foundUser = yield userModel.findByEmail(userData.email);
            expect(foundUser).not.toBeNull();
            expect(foundUser.email).toBe(userData.email);
        }));
        it('should return null for non-existent email', () => __awaiter(void 0, void 0, void 0, function* () {
            const foundUser = yield userModel.findByEmail('nonexistent@example.com');
            expect(foundUser).toBeNull();
        }));
    });
    describe('findByUsername', () => {
        it('should find user by username', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'usernametest',
                email: 'username@example.com',
                password: 'password123',
            };
            yield userModel.create(userData);
            const foundUser = yield userModel.findByUsername(userData.username);
            expect(foundUser).not.toBeNull();
            expect(foundUser.username).toBe(userData.username);
        }));
        it('should return null for non-existent username', () => __awaiter(void 0, void 0, void 0, function* () {
            const foundUser = yield userModel.findByUsername('nonexistent');
            expect(foundUser).toBeNull();
        }));
    });
    describe('findAll', () => {
        it('should return all users', () => __awaiter(void 0, void 0, void 0, function* () {
            const users = [
                {
                    username: 'user1',
                    email: 'user1@example.com',
                    password: 'password123',
                },
                {
                    username: 'user2',
                    email: 'user2@example.com',
                    password: 'password123',
                },
                {
                    username: 'user3',
                    email: 'user3@example.com',
                    password: 'password123',
                },
            ];
            for (const userData of users) {
                yield userModel.create(userData);
            }
            const allUsers = yield userModel.findAll();
            expect(allUsers).toHaveLength(3);
        }));
        it('should support pagination', () => __awaiter(void 0, void 0, void 0, function* () {
            const users = [
                {
                    username: 'user1',
                    email: 'user1@example.com',
                    password: 'password123',
                },
                {
                    username: 'user2',
                    email: 'user2@example.com',
                    password: 'password123',
                },
                {
                    username: 'user3',
                    email: 'user3@example.com',
                    password: 'password123',
                },
            ];
            for (const userData of users) {
                yield userModel.create(userData);
            }
            const firstPage = yield userModel.findAll(2, 0);
            const secondPage = yield userModel.findAll(2, 2);
            expect(firstPage).toHaveLength(2);
            expect(secondPage).toHaveLength(1);
        }));
    });
    describe('update', () => {
        it('should update user data', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const userData = {
                username: 'updatetest',
                email: 'update@example.com',
                password: 'password123',
            };
            const user = yield userModel.create(userData);
            const updateData = {
                username: 'updateduser',
                profile: {
                    firstName: 'Updated',
                    lastName: 'Name',
                },
            };
            const updatedUser = yield userModel.update(user.id, updateData);
            expect(updatedUser).not.toBeNull();
            expect(updatedUser.username).toBe(updateData.username);
            expect(updatedUser.profile.firstName).toBe((_a = updateData.profile) === null || _a === void 0 ? void 0 : _a.firstName);
            expect(updatedUser.profile.lastName).toBe((_b = updateData.profile) === null || _b === void 0 ? void 0 : _b.lastName);
            expect(updatedUser.email).toBe(userData.email); // Should remain unchanged
        }));
        it('should return null for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                username: 'newname',
            };
            const result = yield userModel.update('non-existent-id', updateData);
            expect(result).toBeNull();
        }));
        it('should hash password when updating', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'passwordtest',
                email: 'password@example.com',
                password: 'oldpassword',
            };
            const user = yield userModel.create(userData);
            const originalPassword = user.password;
            const updateData = {
                password: 'newpassword',
            };
            const updatedUser = yield userModel.update(user.id, updateData);
            expect(updatedUser.password).not.toBe('newpassword');
            expect(updatedUser.password).not.toBe(originalPassword);
        }));
    });
    describe('delete', () => {
        it('should delete user', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'deletetest',
                email: 'delete@example.com',
                password: 'password123',
            };
            const user = yield userModel.create(userData);
            const deleted = yield userModel.delete(user.id);
            expect(deleted).toBe(true);
            const foundUser = yield userModel.findById(user.id);
            expect(foundUser).toBeNull();
        }));
        it('should return false for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const deleted = yield userModel.delete('non-existent-id');
            expect(deleted).toBe(false);
        }));
    });
    describe('verifyPassword', () => {
        it('should verify correct password', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'verifytest',
                email: 'verify@example.com',
                password: 'correctpassword',
            };
            const user = yield userModel.create(userData);
            const isValid = yield userModel.verifyPassword(user, 'correctpassword');
            expect(isValid).toBe(true);
        }));
        it('should reject incorrect password', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'verifytest2',
                email: 'verify2@example.com',
                password: 'correctpassword',
            };
            const user = yield userModel.create(userData);
            const isValid = yield userModel.verifyPassword(user, 'wrongpassword');
            expect(isValid).toBe(false);
        }));
    });
    describe('count', () => {
        it('should return correct user count', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield userModel.count()).toBe(0);
            yield userModel.create({
                username: 'count1',
                email: 'count1@example.com',
                password: 'password123',
            });
            expect(yield userModel.count()).toBe(1);
            yield userModel.create({
                username: 'count2',
                email: 'count2@example.com',
                password: 'password123',
            });
            expect(yield userModel.count()).toBe(2);
        }));
    });
});

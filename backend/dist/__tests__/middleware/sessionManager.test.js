import jwt from 'jsonwebtoken';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken, } from '../../middleware/sessionManager';
// Mock user data
const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
};
describe('Session Manager', () => {
    describe('Token Generation', () => {
        it('should generate access and refresh token pair', () => {
            const tokenPair = generateTokenPair(mockUser);
            expect(tokenPair.accessToken).toBeDefined();
            expect(tokenPair.refreshToken).toBeDefined();
            expect(tokenPair.accessTokenExpiresAt).toBeInstanceOf(Date);
            expect(tokenPair.refreshTokenExpiresAt).toBeInstanceOf(Date);
            // Refresh token should expire later than access token
            expect(tokenPair.refreshTokenExpiresAt.getTime()).toBeGreaterThan(tokenPair.accessTokenExpiresAt.getTime());
        });
        it('should generate different tokens for each call', () => {
            const tokenPair1 = generateTokenPair(mockUser);
            const tokenPair2 = generateTokenPair(mockUser);
            expect(tokenPair1.accessToken).not.toBe(tokenPair2.accessToken);
            expect(tokenPair1.refreshToken).not.toBe(tokenPair2.refreshToken);
        });
    });
    describe('Token Verification', () => {
        let tokenPair;
        beforeEach(() => {
            tokenPair = generateTokenPair(mockUser);
        });
        describe('Access Token Verification', () => {
            it('should verify valid access token', () => {
                const decoded = verifyAccessToken(tokenPair.accessToken);
                expect(decoded.userId).toBe(mockUser.id);
                expect(decoded.username).toBe(mockUser.username);
                expect(decoded.email).toBe(mockUser.email);
                expect(decoded.role).toBe(mockUser.role);
                expect(decoded.tokenType).toBe('access');
            });
            it('should reject refresh token as access token', () => {
                expect(() => {
                    verifyAccessToken(tokenPair.refreshToken);
                }).toThrow('Invalid token type');
            });
            it('should reject invalid access token', () => {
                expect(() => {
                    verifyAccessToken('invalid-token');
                }).toThrow();
            });
            it('should reject expired access token', () => {
                // Create an expired token
                const expiredPayload = {
                    userId: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email,
                    role: mockUser.role,
                    tokenType: 'access',
                };
                const expiredToken = jwt.sign(expiredPayload, process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production', { expiresIn: '-1h' } // Expired 1 hour ago
                );
                expect(() => {
                    verifyAccessToken(expiredToken);
                }).toThrow(jwt.TokenExpiredError);
            });
        });
        describe('Refresh Token Verification', () => {
            it('should verify valid refresh token', () => {
                const decoded = verifyRefreshToken(tokenPair.refreshToken);
                expect(decoded.userId).toBe(mockUser.id);
                expect(decoded.username).toBe(mockUser.username);
                expect(decoded.email).toBe(mockUser.email);
                expect(decoded.role).toBe(mockUser.role);
                expect(decoded.tokenType).toBe('refresh');
            });
            it('should reject access token as refresh token', () => {
                expect(() => {
                    verifyRefreshToken(tokenPair.accessToken);
                }).toThrow('Invalid token type');
            });
            it('should reject invalid refresh token', () => {
                expect(() => {
                    verifyRefreshToken('invalid-token');
                }).toThrow();
            });
            it('should reject expired refresh token', () => {
                // Create an expired token
                const expiredPayload = {
                    userId: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email,
                    role: mockUser.role,
                    tokenType: 'refresh',
                };
                const expiredToken = jwt.sign(expiredPayload, process.env.JWT_REFRESH_SECRET ||
                    'refresh-secret-change-in-production', { expiresIn: '-1h' } // Expired 1 hour ago
                );
                expect(() => {
                    verifyRefreshToken(expiredToken);
                }).toThrow(jwt.TokenExpiredError);
            });
        });
    });
    describe('Token Payload Structure', () => {
        it('should include all required fields in access token', () => {
            const tokenPair = generateTokenPair(mockUser);
            const decoded = verifyAccessToken(tokenPair.accessToken);
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('username');
            expect(decoded).toHaveProperty('email');
            expect(decoded).toHaveProperty('role');
            expect(decoded).toHaveProperty('tokenType');
            expect(decoded).toHaveProperty('iat');
            expect(decoded).toHaveProperty('exp');
        });
        it('should include all required fields in refresh token', () => {
            const tokenPair = generateTokenPair(mockUser);
            const decoded = verifyRefreshToken(tokenPair.refreshToken);
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('username');
            expect(decoded).toHaveProperty('email');
            expect(decoded).toHaveProperty('role');
            expect(decoded).toHaveProperty('tokenType');
            expect(decoded).toHaveProperty('iat');
            expect(decoded).toHaveProperty('exp');
        });
    });
    describe('Token Expiration Times', () => {
        it('should set correct expiration times', () => {
            const beforeGeneration = new Date();
            const tokenPair = generateTokenPair(mockUser);
            const afterGeneration = new Date();
            // Access token should expire in ~15 minutes
            const accessTokenExpectedExpiry = new Date(beforeGeneration.getTime() + 15 * 60 * 1000);
            expect(tokenPair.accessTokenExpiresAt.getTime()).toBeGreaterThanOrEqual(accessTokenExpectedExpiry.getTime() - 1000 // Allow 1 second tolerance
            );
            expect(tokenPair.accessTokenExpiresAt.getTime()).toBeLessThanOrEqual(new Date(afterGeneration.getTime() + 15 * 60 * 1000).getTime());
            // Refresh token should expire in ~7 days
            const refreshTokenExpectedExpiry = new Date(beforeGeneration.getTime() + 7 * 24 * 60 * 60 * 1000);
            expect(tokenPair.refreshTokenExpiresAt.getTime()).toBeGreaterThanOrEqual(refreshTokenExpectedExpiry.getTime() - 1000 // Allow 1 second tolerance
            );
            expect(tokenPair.refreshTokenExpiresAt.getTime()).toBeLessThanOrEqual(new Date(afterGeneration.getTime() + 7 * 24 * 60 * 60 * 1000).getTime());
        });
    });
    describe('Different User Roles', () => {
        it('should handle admin user tokens', () => {
            const adminUser = Object.assign(Object.assign({}, mockUser), { role: 'admin' });
            const tokenPair = generateTokenPair(adminUser);
            const accessDecoded = verifyAccessToken(tokenPair.accessToken);
            const refreshDecoded = verifyRefreshToken(tokenPair.refreshToken);
            expect(accessDecoded.role).toBe('admin');
            expect(refreshDecoded.role).toBe('admin');
        });
        it('should handle guest user tokens', () => {
            const guestUser = Object.assign(Object.assign({}, mockUser), { role: 'guest' });
            const tokenPair = generateTokenPair(guestUser);
            const accessDecoded = verifyAccessToken(tokenPair.accessToken);
            const refreshDecoded = verifyRefreshToken(tokenPair.refreshToken);
            expect(accessDecoded.role).toBe('guest');
            expect(refreshDecoded.role).toBe('guest');
        });
    });
});

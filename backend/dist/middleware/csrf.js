import crypto from 'crypto';
import logger from '../utils/logger.js';
/**
 * Simple CSRF protection middleware
 * Generates and validates CSRF tokens
 */
export function csrfProtection(options = {}) {
    const { secret = process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production', tokenLength = 32, cookieName = 'csrf-token', headerName = 'x-csrf-token', ignoreMethods = ['GET', 'HEAD', 'OPTIONS'], } = options;
    return (req, res, next) => {
        try {
            // Generate CSRF token function
            req.csrfToken = () => {
                const token = crypto.randomBytes(tokenLength).toString('hex');
                const signature = crypto
                    .createHmac('sha256', secret)
                    .update(token)
                    .digest('hex');
                const csrfToken = `${token}.${signature}`;
                // Set token in cookie for client-side access
                res.cookie(cookieName, csrfToken, {
                    httpOnly: false, // Allow client-side access for forms
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                });
                return csrfToken;
            };
            // Skip validation for safe methods
            if (ignoreMethods.includes(req.method)) {
                next();
                return;
            }
            // Get token from header or body
            const token = req.headers[headerName] || req.body._csrf;
            if (!token) {
                logger.warn(`CSRF token missing for ${req.method} ${req.path} from IP: ${req.ip}`);
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'CSRF_TOKEN_MISSING',
                        message: 'CSRF token is required',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            // Validate token format
            const tokenParts = token.split('.');
            if (tokenParts.length !== 2) {
                logger.warn(`Invalid CSRF token format for ${req.method} ${req.path} from IP: ${req.ip}`);
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'CSRF_TOKEN_INVALID',
                        message: 'Invalid CSRF token format',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const [tokenValue, signature] = tokenParts;
            // Verify token signature
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(tokenValue)
                .digest('hex');
            if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
                logger.warn(`Invalid CSRF token signature for ${req.method} ${req.path} from IP: ${req.ip}`);
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'CSRF_TOKEN_INVALID',
                        message: 'Invalid CSRF token',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            // Token is valid, proceed
            next();
        }
        catch (error) {
            logger.error('CSRF protection error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CSRF_ERROR',
                    message: 'CSRF protection error',
                },
                timestamp: new Date().toISOString(),
            });
        }
    };
}
/**
 * Endpoint to get CSRF token
 */
export function getCsrfToken(req, res) {
    try {
        if (!req.csrfToken) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CSRF_NOT_INITIALIZED',
                    message: 'CSRF protection not initialized',
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const token = req.csrfToken();
        res.json({
            success: true,
            data: {
                csrfToken: token,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error('Error generating CSRF token:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'CSRF_TOKEN_ERROR',
                message: 'Failed to generate CSRF token',
            },
            timestamp: new Date().toISOString(),
        });
    }
}

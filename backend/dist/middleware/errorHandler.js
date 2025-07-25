import logger from '../utils/logger';
// Custom error class
export class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
// Send error response for development
const sendErrorDev = (err, res) => {
    const errorResponse = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message,
            details: err.statusCode >= 500 ? 'Internal server error occurred' : undefined,
        },
        timestamp: new Date().toISOString(),
        stack: err.stack,
    };
    res.status(err.statusCode).json(errorResponse);
};
// Send error response for production
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        const errorResponse = {
            success: false,
            error: {
                code: err.code || 'OPERATIONAL_ERROR',
                message: err.message,
            },
            timestamp: new Date().toISOString(),
        };
        res.status(err.statusCode).json(errorResponse);
    }
    else {
        // Programming or other unknown error: don't leak error details
        logger.error('ERROR:', err);
        const errorResponse = {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Something went wrong!',
            },
            timestamp: new Date().toISOString(),
        };
        res.status(500).json(errorResponse);
    }
};
// Handle specific error types
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_DATA');
};
const handleDuplicateFieldsDB = (err) => {
    var _a, _b;
    const value = (_b = (_a = err.errmsg) === null || _a === void 0 ? void 0 : _a.match(/(["'])(\\?.)*?\1/)) === null || _b === void 0 ? void 0 : _b[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400, 'DUPLICATE_FIELD');
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');
// Global error handling middleware
export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Preserve original stack trace
    const originalStack = err.stack;
    // Handle specific error types first (applies to both dev and prod)
    let error = Object.assign({}, err);
    error.message = err.message;
    if (error.name === 'CastError')
        error = handleCastErrorDB(error);
    if (error.code === 11000)
        error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
        error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError')
        error = handleJWTError();
    if (error.name === 'TokenExpiredError')
        error = handleJWTExpiredError();
    // Preserve stack trace for development
    if (!error.stack && originalStack) {
        error.stack = originalStack;
    }
    // Log the error
    logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    }
    else {
        sendErrorProd(error, res);
    }
};
// Async error handler wrapper
export const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
// 404 handler
export const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
    next(err);
};

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { AppError, catchAsync } from '../middleware/errorHandler';
import logger from '../utils/logger';
const router = express.Router();
// Test endpoint for simulating delays
router.get('/delay/:ms', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const delay = parseInt(req.params.ms);
    if (isNaN(delay) || delay < 0) {
        throw new AppError('Invalid delay value. Must be a positive number.', 400, 'INVALID_DELAY');
    }
    if (delay > 30000) {
        throw new AppError('Delay too long. Maximum allowed is 30 seconds.', 400, 'DELAY_TOO_LONG');
    }
    logger.info(`Simulating delay of ${delay}ms`);
    yield new Promise((resolve) => setTimeout(resolve, delay));
    res.json({
        success: true,
        data: {
            message: `Delayed response after ${delay}ms`,
            delay: delay,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
})));
// Test endpoint for simulating specific HTTP error codes
router.get('/error/:code', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errorCode = parseInt(req.params.code);
    logger.warn(`Simulating error with code ${errorCode}`);
    switch (errorCode) {
        case 400:
            throw new AppError('Bad Request - This is a simulated 400 error', 400, 'BAD_REQUEST');
        case 401:
            throw new AppError('Unauthorized - This is a simulated 401 error', 401, 'UNAUTHORIZED');
        case 403:
            throw new AppError('Forbidden - This is a simulated 403 error', 403, 'FORBIDDEN');
        case 404:
            throw new AppError('Not Found - This is a simulated 404 error', 404, 'NOT_FOUND');
        case 409:
            throw new AppError('Conflict - This is a simulated 409 error', 409, 'CONFLICT');
        case 422:
            throw new AppError('Unprocessable Entity - This is a simulated 422 error', 422, 'UNPROCESSABLE_ENTITY');
        case 429:
            throw new AppError('Too Many Requests - This is a simulated 429 error', 429, 'TOO_MANY_REQUESTS');
        case 500:
            throw new AppError('Internal Server Error - This is a simulated 500 error', 500, 'INTERNAL_SERVER_ERROR');
        case 502:
            throw new AppError('Bad Gateway - This is a simulated 502 error', 502, 'BAD_GATEWAY');
        case 503:
            throw new AppError('Service Unavailable - This is a simulated 503 error', 503, 'SERVICE_UNAVAILABLE');
        case 504:
            throw new AppError('Gateway Timeout - This is a simulated 504 error', 504, 'GATEWAY_TIMEOUT');
        default:
            throw new AppError(`Unsupported error code: ${errorCode}. Supported codes: 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504`, 400, 'UNSUPPORTED_ERROR_CODE');
    }
})));
// Test endpoint for echoing request data
router.post('/echo', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.info('Echo endpoint called');
    res.json({
        success: true,
        data: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.body || {},
            query: req.query,
            params: req.params,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
})));
// Test endpoint for generating large datasets
router.get('/large-dataset', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const count = parseInt(req.query.count) || 1000;
    const delay = parseInt(req.query.delay) || 0;
    if (count > 10000) {
        throw new AppError('Dataset too large. Maximum allowed is 10,000 items.', 400, 'DATASET_TOO_LARGE');
    }
    logger.info(`Generating large dataset with ${count} items`);
    if (delay > 0) {
        yield new Promise((resolve) => setTimeout(resolve, delay));
    }
    const data = Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: `Item ${index + 1}`,
        description: `This is a description for item ${index + 1}`,
        value: Math.floor(Math.random() * 1000),
        category: `Category ${Math.floor(index / 100) + 1}`,
        active: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    res.json({
        success: true,
        data: {
            items: data,
            count: data.length,
            generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
})));
// Test endpoint for simulating memory-intensive operations
router.get('/memory-intensive', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const size = parseInt(req.query.size) || 1000000; // 1MB default
    if (size > 10000000) {
        // 10MB limit
        throw new AppError('Memory allocation too large. Maximum allowed is 10MB.', 400, 'MEMORY_LIMIT_EXCEEDED');
    }
    logger.info(`Simulating memory-intensive operation with ${size} bytes`);
    // Create a large array to simulate memory usage
    const largeArray = new Array(size).fill('x');
    // Simulate some processing time
    yield new Promise((resolve) => setTimeout(resolve, 100));
    res.json({
        success: true,
        data: {
            message: 'Memory-intensive operation completed',
            allocatedBytes: size,
            arrayLength: largeArray.length,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
})));
// Test endpoint for simulating random failures
router.get('/random-failure', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const failureRate = req.query.rate
        ? parseFloat(req.query.rate)
        : 0.5; // 50% failure rate by default
    if (failureRate < 0 || failureRate > 1) {
        throw new AppError('Failure rate must be between 0 and 1', 400, 'INVALID_FAILURE_RATE');
    }
    logger.info(`Random failure endpoint called with ${failureRate * 100}% failure rate`);
    if (Math.random() < failureRate) {
        const errorMessages = [
            'Random database connection error',
            'Random network timeout',
            'Random service unavailable',
            'Random validation error',
            'Random authentication failure',
        ];
        const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        throw new AppError(randomMessage, 500, 'RANDOM_FAILURE');
    }
    res.json({
        success: true,
        data: {
            message: 'Random failure test passed',
            failureRate: failureRate,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
})));
// Test endpoint for simulating console errors
router.get('/console-error', catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errorType = req.query.type || 'error';
    logger.info(`Generating console ${errorType}`);
    switch (errorType) {
        case 'error':
            console.error('This is a simulated console error for testing');
            logger.error('Simulated console error generated');
            break;
        case 'warn':
            console.warn('This is a simulated console warning for testing');
            logger.warn('Simulated console warning generated');
            break;
        case 'info':
            console.info('This is a simulated console info for testing');
            logger.info('Simulated console info generated');
            break;
        case 'debug':
            console.debug('This is a simulated console debug for testing');
            logger.debug('Simulated console debug generated');
            break;
        default:
            throw new AppError(`Unsupported error type: ${errorType}. Supported types: error, warn, info, debug`, 400, 'UNSUPPORTED_ERROR_TYPE');
    }
    res.json({
        success: true,
        data: {
            message: `Console ${errorType} generated successfully`,
            type: errorType,
            timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
})));
export default router;

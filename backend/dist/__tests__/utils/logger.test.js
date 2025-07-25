import winston from 'winston';
import logger from '../../utils/logger';
describe('Logger', () => {
    it('should be a winston logger instance', () => {
        expect(logger).toBeInstanceOf(winston.Logger);
    });
    it('should have correct log levels', () => {
        const levels = ['error', 'warn', 'info', 'http', 'debug'];
        levels.forEach((level) => {
            expect(typeof logger[level]).toBe('function');
        });
    });
    it('should handle different log levels correctly', () => {
        // Test that all log level methods exist and are functions
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.http).toBe('function');
        expect(typeof logger.debug).toBe('function');
    });
    it('should set appropriate log level based on NODE_ENV', () => {
        // The logger should have a level property
        expect(logger.level).toBeDefined();
        // In test environment, it should be debug level
        if (process.env.NODE_ENV !== 'production') {
            expect(logger.level).toBe('debug');
        }
    });
    it('should have transports configured', () => {
        // Check that logger has transports
        expect(logger.transports).toBeDefined();
        expect(logger.transports.length).toBeGreaterThan(0);
    });
    it('should handle logging without throwing errors', () => {
        // Test that logging methods don't throw errors
        expect(() => {
            logger.error('Test error message');
            logger.warn('Test warning message');
            logger.info('Test info message');
            logger.http('Test http message');
            logger.debug('Test debug message');
        }).not.toThrow();
    });
    it('should handle error objects', () => {
        const error = new Error('Test error with stack');
        expect(() => {
            logger.error('Error occurred', error);
        }).not.toThrow();
    });
    it('should have exception and rejection handlers', () => {
        // Check that exception and rejection handlers are configured
        expect(logger.exceptions).toBeDefined();
        expect(logger.rejections).toBeDefined();
    });
});

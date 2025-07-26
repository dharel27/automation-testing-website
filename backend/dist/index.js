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
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase } from './database/init.js';
import { globalErrorHandler, notFoundHandler, } from './middleware/errorHandler.js';
import { sanitizeInput, generalRateLimit, securityHeaders, } from './middleware/security.js';
import { csrfProtection, getCsrfToken } from './middleware/csrf.js';
import { cleanupExpiredSessions } from './middleware/sessionManager.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import fileRoutes from './routes/files.js';
import testRoutes from './routes/test.js';
import notificationRoutes from './routes/notifications.js';
import testDataRoutes from './routes/test-data.js';
import errorRoutes from './routes/errors.js';
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});
const PORT = process.env.PORT || 3001;
// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(generalRateLimit);
// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
    },
}));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-csrf-token',
        'x-refresh-token',
    ],
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Input sanitization
app.use(sanitizeInput);
// CSRF protection (applied to state-changing operations)
app.use(csrfProtection());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/test', testRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test-data', testDataRoutes);
app.use('/api/errors', errorRoutes);
// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);
// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Automation Testing Website API is running',
        timestamp: new Date().toISOString(),
    });
});
// 404 handler for unmatched routes
app.all('*', notFoundHandler);
// Global error handling middleware (must be last)
app.use(globalErrorHandler);
// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    // Join notification room
    socket.join('notifications');
    // Handle client disconnect
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
    // Handle custom events
    socket.on('join-room', (room) => {
        socket.join(room);
        logger.info(`Client ${socket.id} joined room: ${room}`);
    });
    socket.on('leave-room', (room) => {
        socket.leave(room);
        logger.info(`Client ${socket.id} left room: ${room}`);
    });
});
// Make io available to routes
app.set('io', io);
// Initialize database and start server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize database
            yield initializeDatabase();
            logger.info('Database initialized successfully');
            // Set up periodic session cleanup (every hour)
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield cleanupExpiredSessions();
                }
                catch (error) {
                    logger.error('Session cleanup error:', error);
                }
            }), 60 * 60 * 1000); // 1 hour
            // Start server
            server.listen(PORT, () => {
                logger.info(`Server is running on port ${PORT}`);
                logger.info(`Health check: http://localhost:${PORT}/api/health`);
                logger.info(`WebSocket server is ready`);
                logger.info('Session cleanup scheduled every hour');
            });
        }
        catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    });
}
startServer();
export default app;

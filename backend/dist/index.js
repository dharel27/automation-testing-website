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
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase } from './database/init.js';
import { globalErrorHandler, notFoundHandler, } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import fileRoutes from './routes/files.js';
import testRoutes from './routes/test.js';
import notificationRoutes from './routes/notifications.js';
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});
const PORT = process.env.PORT || 3001;
// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/test', testRoutes);
app.use('/api/notifications', notificationRoutes);
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
            // Start server
            server.listen(PORT, () => {
                logger.info(`Server is running on port ${PORT}`);
                logger.info(`Health check: http://localhost:${PORT}/api/health`);
                logger.info(`WebSocket server is ready`);
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

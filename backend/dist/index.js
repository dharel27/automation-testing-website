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
import { initializeDatabase } from './database/init.js';
import { globalErrorHandler, notFoundHandler, } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import fileRoutes from './routes/files.js';
import testRoutes from './routes/test.js';
const app = express();
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
// Initialize database and start server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize database
            yield initializeDatabase();
            logger.info('Database initialized successfully');
            // Start server
            app.listen(PORT, () => {
                logger.info(`Server is running on port ${PORT}`);
                logger.info(`Health check: http://localhost:${PORT}/api/health`);
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

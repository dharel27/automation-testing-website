import express, { Request, Response } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = express.Router();

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  errorType: 'javascript' | 'network' | 'boundary' | 'unhandled';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

// Store error reports in memory (in production, you'd use a database)
const errorReports: ErrorReport[] = [];
const MAX_STORED_REPORTS = 1000;

// Endpoint to receive error reports from frontend
router.post(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const errorReport: ErrorReport = req.body;

    // Validate required fields
    if (!errorReport.message || !errorReport.timestamp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ERROR_REPORT',
          message: 'Error report must include message and timestamp',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Add server-side timestamp
    const enrichedReport = {
      ...errorReport,
      receivedAt: new Date().toISOString(),
      serverTimestamp: Date.now(),
    };

    // Store the error report
    errorReports.push(enrichedReport);

    // Maintain array size
    if (errorReports.length > MAX_STORED_REPORTS) {
      errorReports.shift();
    }

    // Log based on severity
    const logMessage = `Frontend Error [${errorReport.errorType}/${errorReport.severity}]: ${errorReport.message}`;

    switch (errorReport.severity) {
      case 'critical':
        logger.error(logMessage, {
          errorReport: enrichedReport,
          stack: errorReport.stack,
          url: errorReport.url,
          userAgent: errorReport.userAgent,
        });
        break;
      case 'high':
        logger.error(logMessage, { errorReport: enrichedReport });
        break;
      case 'medium':
        logger.warn(logMessage, { errorReport: enrichedReport });
        break;
      case 'low':
        logger.info(logMessage, { errorReport: enrichedReport });
        break;
      default:
        logger.warn(logMessage, { errorReport: enrichedReport });
    }

    // In production, you might want to:
    // 1. Send alerts for critical errors
    // 2. Store in a database
    // 3. Send to external monitoring service (Sentry, LogRocket, etc.)
    // 4. Aggregate similar errors
    // 5. Rate limit error reports per session

    res.json({
      success: true,
      data: {
        message: 'Error report received successfully',
        reportId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Endpoint to retrieve error reports (for debugging/monitoring)
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const severity = req.query.severity as string;
    const errorType = req.query.errorType as string;
    const sessionId = req.query.sessionId as string;

    let filteredReports = [...errorReports];

    // Apply filters
    if (severity) {
      filteredReports = filteredReports.filter(
        (report) => report.severity === severity
      );
    }

    if (errorType) {
      filteredReports = filteredReports.filter(
        (report) => report.errorType === errorType
      );
    }

    if (sessionId) {
      filteredReports = filteredReports.filter(
        (report) => report.sessionId === sessionId
      );
    }

    // Sort by timestamp (newest first)
    filteredReports.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        reports: paginatedReports,
        pagination: {
          page,
          limit,
          total: filteredReports.length,
          totalPages: Math.ceil(filteredReports.length / limit),
        },
        filters: {
          severity,
          errorType,
          sessionId,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Endpoint to get error statistics
router.get(
  '/stats',
  catchAsync(async (req: Request, res: Response) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentReports = errorReports.filter(
      (report) => new Date(report.timestamp) >= last24Hours
    );

    const weeklyReports = errorReports.filter(
      (report) => new Date(report.timestamp) >= lastWeek
    );

    // Count by severity
    const severityStats = errorReports.reduce(
      (acc, report) => {
        acc[report.severity] = (acc[report.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Count by error type
    const typeStats = errorReports.reduce(
      (acc, report) => {
        acc[report.errorType] = (acc[report.errorType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Top error messages
    const messageStats = errorReports.reduce(
      (acc, report) => {
        acc[report.message] = (acc[report.message] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topMessages = Object.entries(messageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    res.json({
      success: true,
      data: {
        total: errorReports.length,
        last24Hours: recentReports.length,
        lastWeek: weeklyReports.length,
        bySeverity: severityStats,
        byType: typeStats,
        topMessages,
        oldestReport:
          errorReports.length > 0
            ? errorReports[errorReports.length - 1].timestamp
            : null,
        newestReport:
          errorReports.length > 0 ? errorReports[0].timestamp : null,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Endpoint to clear error reports (for testing)
router.delete(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const clearedCount = errorReports.length;
    errorReports.length = 0; // Clear the array

    logger.info(`Cleared ${clearedCount} error reports`);

    res.json({
      success: true,
      data: {
        message: `Cleared ${clearedCount} error reports`,
        clearedCount,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;

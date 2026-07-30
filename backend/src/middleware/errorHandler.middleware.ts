import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service.js';

/**
 * 404 handler — must be registered AFTER all routes.
 * Catches any request that didn't match a defined route.
 */
export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
}

/**
 * Global error handler — must be the LAST middleware registered.
 * Catches any error thrown or passed via next(err) from controllers.
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Log with appropriate severity
  if (status >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${status}`, {
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${status}: ${err.message}`);
  }

  // Structured error response — never leak stack traces in production
  res.status(status).json({
    error: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV !== 'production' && err.stack
      ? { stack: err.stack }
      : {})
  });
}

/**
 * asyncHandler — wraps async route handlers so thrown errors
 * are forwarded to Express's error handler via next(err),
 * instead of causing unhandled promise rejections.
 *
 * Usage:
 *   router.get('/path', asyncHandler(myController))
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

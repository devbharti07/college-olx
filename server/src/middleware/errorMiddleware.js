import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import config from '../config/environment.js';

/**
 * 404 Not Found Middleware for unmatched routes.
 * Always returns a clean JSON error response, avoiding default Express HTML error pages.
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    404,
    'ROUTE_NOT_FOUND',
    `The requested route ${req.method} ${req.originalUrl} was not found.`
  );
  next(error);
};

/**
 * Centralized error-handling middleware.
 * Handles ApiError, malformed JSON bodies, Prisma ORM exceptions, and unhandled server errors.
 */
export const errorHandler = (err, req, res, next) => {
  // If response has already started sending, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handle SyntaxError for malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'The request body contains invalid JSON syntax.',
      },
    });
  }

  // 2. Handle known ApiError instances
  if (err instanceof ApiError) {
    const responsePayload = {
      success: false,
      error: {
        code: err.code || 'BAD_REQUEST',
        message: err.message,
      },
    };

    if (err.details) {
      responsePayload.error.details = err.details;
    }

    return res.status(err.statusCode || 400).json(responsePayload);
  }

  // 3. Handle Prisma Known Request Errors (e.g. P2002, P2025, P2003)
  if (err instanceof Prisma.PrismaClientKnownRequestError || (err.code && typeof err.code === 'string' && err.code.startsWith('P'))) {
    // P2002: Unique constraint violation
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(', ')
        : (err.meta?.target || 'field');

      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: `A record with that ${target} already exists.`,
        },
      });
    }

    // P2025: Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record could not be found in the database.',
        },
      });
    }

    // P2003: Foreign key constraint failure
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced related record does not exist or relation is invalid.',
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed.',
      },
    });
  }

  // 4. Handle Prisma Schema Validation Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database schema validation failed for the provided data.',
      },
    });
  }

  // 5. Handle unexpected internal server errors
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = config.isProduction;

  // Log server errors in non-test environments for debugging
  if (!config.isTest) {
    console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl}:`, err);
  }

  const responsePayload = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected internal server error occurred.'
        : err.message || 'An unexpected internal server error occurred.',
    },
  };

  // Only expose stack trace in non-production environments
  if (!isProduction && err.stack) {
    responsePayload.error.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

export default {
  notFoundHandler,
  errorHandler,
};

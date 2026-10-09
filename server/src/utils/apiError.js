/**
 * Custom application error class for standardized API error responses.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param {string} code - Machine-readable error code (e.g. 'VALIDATION_ERROR', 'ROUTE_NOT_FOUND')
   * @param {string} message - Human-readable error message
   * @param {Array|Object|null} [details=null] - Additional validation or contextual details
   */
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'Resource Not Found', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static internal(message = 'Internal Server Error', code = 'INTERNAL_SERVER_ERROR') {
    return new ApiError(500, code, message);
  }
}

export default ApiError;

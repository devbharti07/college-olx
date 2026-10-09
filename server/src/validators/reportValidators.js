import { ApiError } from '../utils/apiError.js';
import { ALLOWED_REPORT_REASONS, isValidUUID } from '../constants/marketplace.js';

const ALLOWED_BODY_FIELDS = ['listingId', 'reportedUserId', 'reason', 'description'];

/**
 * Validate POST /api/reports payload.
 * Defends against mass assignment, validates target identifiers, reason enums, and description.
 */
export const validateCreateReport = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Request body must be a valid JSON object.'));
  }

  // 1. Mass assignment defense: Reject unexpected or privileged fields
  const providedFields = Object.keys(body);
  const forbiddenFields = providedFields.filter((f) => !ALLOWED_BODY_FIELDS.includes(f));
  if (forbiddenFields.length > 0) {
    return next(
      new ApiError(
        400,
        'UNEXPECTED_FIELD',
        `Disallowed fields in request body: [${forbiddenFields.join(', ')}]. You cannot set internal status or metadata.`
      )
    );
  }

  const { listingId, reportedUserId, reason, description } = body;

  // 2. Target validation: at least one target must be specified
  const hasListing = listingId !== undefined && listingId !== null && String(listingId).trim() !== '';
  const hasUser = reportedUserId !== undefined && reportedUserId !== null && String(reportedUserId).trim() !== '';

  if (!hasListing && !hasUser) {
    return next(
      new ApiError(
        400,
        'VALIDATION_ERROR',
        'A report must specify at least one valid target: either "listingId" or "reportedUserId".'
      )
    );
  }

  let cleanListingId = null;
  if (hasListing) {
    if (typeof listingId !== 'string' || !isValidUUID(listingId.trim())) {
      return next(
        new ApiError(
          400,
          'INVALID_IDENTIFIER',
          'The provided "listingId" is not a valid UUID.'
        )
      );
    }
    cleanListingId = listingId.trim();
  }

  let cleanReportedUserId = null;
  if (hasUser) {
    if (typeof reportedUserId !== 'string' || !isValidUUID(reportedUserId.trim())) {
      return next(
        new ApiError(
          400,
          'INVALID_IDENTIFIER',
          'The provided "reportedUserId" is not a valid UUID.'
        )
      );
    }
    cleanReportedUserId = reportedUserId.trim();
  }

  // 3. Reason validation: must be a string and one of ALLOWED_REPORT_REASONS
  if (reason === undefined || reason === null || typeof reason !== 'string') {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Report "reason" category is required and must be a string.')
    );
  }

  const trimmedReason = reason.trim().toLowerCase();
  if (!ALLOWED_REPORT_REASONS.includes(trimmedReason)) {
    return next(
      new ApiError(
        400,
        'INVALID_REPORT_REASON',
        `Invalid report reason "${reason}". Allowed categories: [${ALLOWED_REPORT_REASONS.join(', ')}].`
      )
    );
  }

  // 4. Description validation: if provided, must be string between 5 and 1000 characters
  let cleanDescription = '';
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      return next(new ApiError(400, 'VALIDATION_ERROR', 'Report "description" must be a string.'));
    }
    const trimmedDesc = description.trim();
    if (trimmedDesc.length > 0 && trimmedDesc.length < 5) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Report description must be at least 5 characters long to provide meaningful context.'
        )
      );
    }
    if (trimmedDesc.length > 1000) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Report description cannot exceed 1000 characters.'
        )
      );
    }
    cleanDescription = trimmedDesc;
  }

  req.cleanReportData = {
    listingId: cleanListingId,
    reportedUserId: cleanReportedUserId,
    reason: trimmedReason,
    description: cleanDescription,
  };

  next();
};

/**
 * Validate pagination parameters for GET /api/reports/mine.
 */
export const validateReportPagination = (req, res, next) => {
  let page = 1;
  let limit = 20;

  if (req.query.page !== undefined) {
    const rawPage = req.query.page;
    const parsed = Number(rawPage);
    if (!Number.isInteger(parsed) || parsed < 1 || String(rawPage).trim() !== String(parsed)) {
      return next(
        new ApiError(
          400,
          'INVALID_PAGINATION',
          'Query parameter "page" must be a positive integer greater than or equal to 1.'
        )
      );
    }
    page = parsed;
  }

  if (req.query.limit !== undefined) {
    const rawLimit = req.query.limit;
    const parsed = Number(rawLimit);
    if (
      !Number.isInteger(parsed) ||
      parsed < 1 ||
      parsed > 50 ||
      String(rawLimit).trim() !== String(parsed)
    ) {
      return next(
        new ApiError(
          400,
          'INVALID_PAGINATION',
          'Query parameter "limit" must be a positive integer between 1 and 50.'
        )
      );
    }
    limit = parsed;
  }

  req.pagination = { page, limit };
  next();
};

export default {
  validateCreateReport,
  validateReportPagination,
};

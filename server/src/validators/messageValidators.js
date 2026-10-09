import { ApiError } from '../utils/apiError.js';
import { isValidUUID } from '../constants/marketplace.js';

/**
 * Validate UUID in request parameter :conversationId.
 */
export const validateConversationId = (req, res, next) => {
  const { conversationId } = req.params;

  if (
    !conversationId ||
    typeof conversationId !== 'string' ||
    !isValidUUID(conversationId.trim())
  ) {
    return next(
      new ApiError(
        400,
        'INVALID_IDENTIFIER',
        `The provided conversation identifier "${conversationId}" is not a valid UUID.`
      )
    );
  }

  req.params.conversationId = conversationId.trim();
  next();
};

/**
 * Validate POST /api/messages/conversations payload.
 * Requires valid listingId and optional initialMessage.
 */
export const validateCreateConversation = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Request body must be a valid JSON object.')
    );
  }

  const { listingId, initialMessage } = body;

  if (!listingId || typeof listingId !== 'string' || !isValidUUID(listingId.trim())) {
    return next(
      new ApiError(
        400,
        'INVALID_IDENTIFIER',
        'A valid "listingId" UUID is required to start a conversation.'
      )
    );
  }

  req.cleanConversationData = {
    listingId: listingId.trim(),
  };

  if (initialMessage !== undefined && initialMessage !== null) {
    if (typeof initialMessage !== 'string') {
      return next(
        new ApiError(400, 'VALIDATION_ERROR', 'Initial message must be a string.')
      );
    }
    const trimmed = initialMessage.trim();
    if (trimmed.length > 1000) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Initial message cannot exceed 1000 characters.'
        )
      );
    }
    if (trimmed.length > 0) {
      req.cleanConversationData.initialMessage = trimmed;
    }
  }

  next();
};

/**
 * Validate POST /api/messages/conversations/:conversationId/messages payload.
 * Requires text (string, 1 to 1000 characters).
 */
export const validateSendMessage = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Request body must be a valid JSON object.')
    );
  }

  const { text } = body;

  if (text === undefined || text === null || typeof text !== 'string') {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Message "text" is required and must be a string.')
    );
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Message text cannot be empty or whitespace only.')
    );
  }

  if (trimmed.length > 1000) {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Message text cannot exceed 1000 characters.')
    );
  }

  req.cleanMessageText = trimmed;
  next();
};

/**
 * Validate pagination parameters for conversation and message queries.
 */
export const validatePagination = (req, res, next) => {
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
      parsed > 100 ||
      String(rawLimit).trim() !== String(parsed)
    ) {
      return next(
        new ApiError(
          400,
          'INVALID_PAGINATION',
          'Query parameter "limit" must be a positive integer between 1 and 100.'
        )
      );
    }
    limit = parsed;
  }

  req.pagination = { page, limit };
  next();
};

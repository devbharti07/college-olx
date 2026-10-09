import { ApiError } from '../utils/apiError.js';
import {
  ALLOWED_CATEGORIES,
  ALLOWED_CONDITIONS,
  isValidUUID,
} from '../constants/marketplace.js';

// Editable listing fields permitted for updates
const ALLOWED_UPDATE_FIELDS = [
  'title',
  'description',
  'price',
  'category',
  'condition',
  'location',
];

/**
 * Validate UUID in request parameter :id.
 * Prevents unhandled database errors when malformed listing IDs are queried.
 */
export const validateListingId = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !isValidUUID(id.trim())) {
    return next(
      new ApiError(
        400,
        'INVALID_IDENTIFIER',
        `The provided listing identifier "${id}" is not a valid UUID.`
      )
    );
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validate query parameters for marketplace listing browse (GET /api/listings and /api/listings/mine).
 * Supports:
 * - q / search (search keyword across title & description, max 100 chars)
 * - category (enum in ALLOWED_CATEGORIES)
 * - condition (enum in ALLOWED_CONDITIONS)
 * - minPrice (numeric, >= 0, finite)
 * - maxPrice (numeric, >= 0, finite)
 * - location (string, max 100 chars)
 * - sort (whitelist: newest, oldest, price-low, price-high)
 * - page (positive integer >= 1)
 * - limit (integer 1..50)
 *
 * Enforces strict security against query parameter operator injection and ReDoS abuse.
 */
export const validateListingQuery = (req, res, next) => {
  // 1. Guard against query parameter operator injection (prohibit '$' prefixes, dots, and object values)
  for (const [key, val] of Object.entries(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      return next(
        new ApiError(
          400,
          'INVALID_QUERY_PARAMETER',
          `Query parameter name "${key}" contains prohibited characters.`
        )
      );
    }
    if (typeof val === 'object' && val !== null) {
      return next(
        new ApiError(
          400,
          'INVALID_QUERY_PARAMETER',
          `Query parameter "${key}" must be a primitive value, not an object or array.`
        )
      );
    }
  }

  const cleanFilter = {};

  // 2. Validate Pagination (page & limit)
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

  // 3. Validate Search Query (q or search alias)
  const rawSearch = req.query.q !== undefined ? req.query.q : req.query.search;
  if (rawSearch !== undefined) {
    if (typeof rawSearch !== 'string') {
      return next(
        new ApiError(400, 'INVALID_SEARCH_QUERY', 'Search query parameter must be a string.')
      );
    }
    const trimmedSearch = rawSearch.trim();
    if (trimmedSearch.length > 100) {
      return next(
        new ApiError(
          400,
          'INVALID_SEARCH_QUERY',
          'Search query cannot exceed 100 characters.'
        )
      );
    }
    if (trimmedSearch.length > 0) {
      cleanFilter.q = trimmedSearch;
    }
  }

  // 4. Validate Category
  if (req.query.category !== undefined) {
    if (typeof req.query.category !== 'string') {
      return next(new ApiError(400, 'INVALID_CATEGORY', 'Category parameter must be a string.'));
    }
    const cat = req.query.category.trim().toLowerCase();
    if (cat !== '' && cat !== 'all') {
      if (!ALLOWED_CATEGORIES.includes(cat)) {
        return next(
          new ApiError(
            400,
            'INVALID_CATEGORY',
            `Invalid category "${req.query.category}". Allowed values: ${ALLOWED_CATEGORIES.join(', ')}.`
          )
        );
      }
      cleanFilter.category = cat;
    }
  }

  // 5. Validate Condition
  if (req.query.condition !== undefined) {
    if (typeof req.query.condition !== 'string') {
      return next(new ApiError(400, 'INVALID_CONDITION', 'Condition parameter must be a string.'));
    }
    const cond = req.query.condition.trim().toLowerCase();
    if (cond !== '' && cond !== 'all') {
      if (!ALLOWED_CONDITIONS.includes(cond)) {
        return next(
          new ApiError(
            400,
            'INVALID_CONDITION',
            `Invalid condition "${req.query.condition}". Allowed values: ${ALLOWED_CONDITIONS.join(', ')}.`
          )
        );
      }
      cleanFilter.condition = cond;
    }
  }

  // 6. Validate Price Range (minPrice & maxPrice)
  if (req.query.minPrice !== undefined && String(req.query.minPrice).trim() !== '') {
    const rawMin = req.query.minPrice;
    const parsedMin = Number(rawMin);
    if (isNaN(parsedMin) || !Number.isFinite(parsedMin) || parsedMin < 0) {
      return next(
        new ApiError(
          400,
          'INVALID_PRICE_RANGE',
          'Query parameter "minPrice" must be a non-negative finite number.'
        )
      );
    }
    cleanFilter.minPrice = parsedMin;
  }

  if (req.query.maxPrice !== undefined && String(req.query.maxPrice).trim() !== '') {
    const rawMax = req.query.maxPrice;
    const parsedMax = Number(rawMax);
    if (isNaN(parsedMax) || !Number.isFinite(parsedMax) || parsedMax < 0) {
      return next(
        new ApiError(
          400,
          'INVALID_PRICE_RANGE',
          'Query parameter "maxPrice" must be a non-negative finite number.'
        )
      );
    }
    cleanFilter.maxPrice = parsedMax;
  }

  // Cross-price constraint: minPrice <= maxPrice
  if (cleanFilter.minPrice !== undefined && cleanFilter.maxPrice !== undefined) {
    if (cleanFilter.minPrice > cleanFilter.maxPrice) {
      return next(
        new ApiError(
          400,
          'INVALID_PRICE_RANGE',
          'Query parameter "minPrice" cannot be greater than "maxPrice".'
        )
      );
    }
  }

  // 7. Validate Location
  if (req.query.location !== undefined) {
    if (typeof req.query.location !== 'string') {
      return next(new ApiError(400, 'INVALID_LOCATION', 'Location parameter must be a string.'));
    }
    const trimmedLocation = req.query.location.trim();
    if (trimmedLocation.length > 100) {
      return next(
        new ApiError(
          400,
          'INVALID_LOCATION',
          'Location parameter cannot exceed 100 characters.'
        )
      );
    }
    if (trimmedLocation.length > 0) {
      cleanFilter.location = trimmedLocation;
    }
  }

  // 8. Validate Sort (whitelist only)
  const ALLOWED_SORTS = ['newest', 'oldest', 'price-low', 'price-high'];
  if (req.query.sort !== undefined && String(req.query.sort).trim() !== '') {
    const rawSort = String(req.query.sort).trim();
    if (!ALLOWED_SORTS.includes(rawSort)) {
      return next(
        new ApiError(
          400,
          'INVALID_SORT',
          `Query parameter "sort" must be one of: ${ALLOWED_SORTS.join(', ')}.`
        )
      );
    }
    cleanFilter.sort = rawSort;
  } else {
    cleanFilter.sort = 'newest';
  }

  req.pagination = { page, limit };
  req.cleanFilter = cleanFilter;
  next();
};

/**
 * Validate and sanitize POST /api/listings payload.
 * Defends against mass assignment and verifies data integrity.
 */
export const validateCreateListing = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(
      new ApiError(400, 'VALIDATION_ERROR', 'Request body must be a valid JSON object.')
    );
  }

  const errors = {};
  const cleanData = {};

  // 1. Title validation
  if (!body.title || typeof body.title !== 'string') {
    errors.title = 'Listing title is required and must be a string.';
  } else {
    const trimmedTitle = body.title.trim();
    if (trimmedTitle.length < 3) {
      errors.title = 'Title must be at least 3 characters long.';
    } else if (trimmedTitle.length > 100) {
      errors.title = 'Title cannot exceed 100 characters.';
    } else {
      cleanData.title = trimmedTitle;
    }
  }

  // 2. Description validation
  if (!body.description || typeof body.description !== 'string') {
    errors.description = 'Listing description is required and must be a string.';
  } else {
    const trimmedDesc = body.description.trim();
    if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    } else if (trimmedDesc.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters.';
    } else {
      cleanData.description = trimmedDesc;
    }
  }

  // 3. Price validation
  if (body.price === undefined || body.price === null || body.price === '') {
    errors.price = 'Price is required.';
  } else if (typeof body.price !== 'number' && typeof body.price !== 'string') {
    errors.price = 'Price must be a valid numeric amount.';
  } else {
    const numericPrice = Number(body.price);
    if (!Number.isFinite(numericPrice) || Number.isNaN(numericPrice)) {
      errors.price = 'Price must be a finite numeric value.';
    } else if (numericPrice < 0) {
      errors.price = 'Price must be greater than or equal to 0 (INR).';
    } else if (numericPrice > 10000000) {
      errors.price = 'Price cannot exceed 10,000,000 INR.';
    } else {
      cleanData.price = Math.round(numericPrice * 100) / 100;
    }
  }

  // 4. Category validation
  if (!body.category || typeof body.category !== 'string') {
    errors.category = `Item category is required. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}.`;
  } else {
    const trimmedCat = body.category.trim().toLowerCase();
    if (!ALLOWED_CATEGORIES.includes(trimmedCat)) {
      errors.category = `Invalid category "${trimmedCat}". Allowed values: ${ALLOWED_CATEGORIES.join(', ')}.`;
    } else {
      cleanData.category = trimmedCat;
    }
  }

  // 5. Condition validation (optional, defaults to 'good')
  if (body.condition !== undefined && body.condition !== null && body.condition !== '') {
    if (typeof body.condition !== 'string') {
      errors.condition = `Condition must be a string. Allowed values: ${ALLOWED_CONDITIONS.join(', ')}.`;
    } else {
      const trimmedCond = body.condition.trim().toLowerCase();
      if (!ALLOWED_CONDITIONS.includes(trimmedCond)) {
        errors.condition = `Invalid condition "${trimmedCond}". Allowed values: ${ALLOWED_CONDITIONS.join(', ')}.`;
      } else {
        cleanData.condition = trimmedCond;
      }
    }
  } else {
    cleanData.condition = 'good';
  }

  // 6. Location validation
  if (!body.location || typeof body.location !== 'string') {
    errors.location = 'Meetup location is required and must be a string.';
  } else {
    const trimmedLoc = body.location.trim();
    if (trimmedLoc.length < 2) {
      errors.location = 'Location must be at least 2 characters long.';
    } else if (trimmedLoc.length > 120) {
      errors.location = 'Location cannot exceed 120 characters.';
    } else {
      cleanData.location = trimmedLoc;
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Listing creation validation failed.', errors));
  }

  // Attach sanitized data only; client-supplied seller, status, viewsCount, etc. are neutralized
  req.cleanListingData = cleanData;
  next();
};

/**
 * Validate and sanitize PATCH /api/listings/:id payload.
 * Enforces true PATCH semantics and rejects empty or forbidden updates.
 */
export const validateUpdateListing = (req, res, next) => {
  const body = req.body;

  // 1. Reject empty update payloads
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    return next(
      new ApiError(
        400,
        'EMPTY_UPDATE',
        'At least one editable listing field must be provided for update.'
      )
    );
  }

  // 2. Reject payloads that contain zero editable fields
  const suppliedKeys = Object.keys(body);
  const editableKeysPresent = suppliedKeys.filter((k) => ALLOWED_UPDATE_FIELDS.includes(k));

  if (editableKeysPresent.length === 0) {
    return next(
      new ApiError(
        400,
        'NO_EDITABLE_FIELDS',
        `None of the provided fields can be updated via this endpoint. Allowed fields: ${ALLOWED_UPDATE_FIELDS.join(
          ', '
        )}.`
      )
    );
  }

  const errors = {};
  const cleanUpdates = {};

  // Title
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.title = 'Listing title cannot be empty.';
    } else {
      const trimmed = body.title.trim();
      if (trimmed.length < 3) {
        errors.title = 'Title must be at least 3 characters long.';
      } else if (trimmed.length > 100) {
        errors.title = 'Title cannot exceed 100 characters.';
      } else {
        cleanUpdates.title = trimmed;
      }
    }
  }

  // Description
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      errors.description = 'Listing description cannot be empty.';
    } else {
      const trimmed = body.description.trim();
      if (trimmed.length < 10) {
        errors.description = 'Description must be at least 10 characters long.';
      } else if (trimmed.length > 2000) {
        errors.description = 'Description cannot exceed 2000 characters.';
      } else {
        cleanUpdates.description = trimmed;
      }
    }
  }

  // Price
  if (body.price !== undefined) {
    if (typeof body.price !== 'number' && typeof body.price !== 'string') {
      errors.price = 'Price must be a valid numeric amount.';
    } else {
      const numericPrice = Number(body.price);
      if (!Number.isFinite(numericPrice) || Number.isNaN(numericPrice)) {
        errors.price = 'Price must be a finite numeric value.';
      } else if (numericPrice < 0) {
        errors.price = 'Price must be greater than or equal to 0 (INR).';
      } else if (numericPrice > 10000000) {
        errors.price = 'Price cannot exceed 10,000,000 INR.';
      } else {
        cleanUpdates.price = Math.round(numericPrice * 100) / 100;
      }
    }
  }

  // Category
  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !body.category.trim()) {
      errors.category = `Category cannot be empty. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}.`;
    } else {
      const trimmedCat = body.category.trim().toLowerCase();
      if (!ALLOWED_CATEGORIES.includes(trimmedCat)) {
        errors.category = `Invalid category "${trimmedCat}". Allowed values: ${ALLOWED_CATEGORIES.join(', ')}.`;
      } else {
        cleanUpdates.category = trimmedCat;
      }
    }
  }

  // Condition
  if (body.condition !== undefined) {
    if (typeof body.condition !== 'string' || !body.condition.trim()) {
      errors.condition = `Condition cannot be empty. Allowed values: ${ALLOWED_CONDITIONS.join(', ')}.`;
    } else {
      const trimmedCond = body.condition.trim().toLowerCase();
      if (!ALLOWED_CONDITIONS.includes(trimmedCond)) {
        errors.condition = `Invalid condition "${trimmedCond}". Allowed values: ${ALLOWED_CONDITIONS.join(', ')}.`;
      } else {
        cleanUpdates.condition = trimmedCond;
      }
    }
  }

  // Location
  if (body.location !== undefined) {
    if (typeof body.location !== 'string' || !body.location.trim()) {
      errors.location = 'Location cannot be empty.';
    } else {
      const trimmedLoc = body.location.trim();
      if (trimmedLoc.length < 2) {
        errors.location = 'Location must be at least 2 characters long.';
      } else if (trimmedLoc.length > 120) {
        errors.location = 'Location cannot exceed 120 characters.';
      } else {
        cleanUpdates.location = trimmedLoc;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Listing update validation failed.', errors));
  }

  req.cleanListingUpdates = cleanUpdates;
  next();
};

/**
 * Validate and sanitize PATCH /api/listings/:id/status payload.
 * Allows only owner-controlled transitions between 'active' and 'sold'.
 */
export const validateUpdateListingStatus = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Request body must be a valid JSON object.'));
  }

  if (!body.status || typeof body.status !== 'string') {
    return next(
      new ApiError(
        400,
        'VALIDATION_ERROR',
        'Status field is required and must be either "active" or "sold".'
      )
    );
  }

  const targetStatus = body.status.trim().toLowerCase();

  if (targetStatus === 'removed') {
    return next(
      new ApiError(
        400,
        'INVALID_STATUS_TRANSITION',
        'Listing status cannot be set to "removed" via status update. Use DELETE /api/listings/:id to remove a listing.'
      )
    );
  }

  if (!['active', 'sold'].includes(targetStatus)) {
    return next(
      new ApiError(
        400,
        'INVALID_STATUS',
        `Invalid listing status "${targetStatus}". Permitted values: active, sold.`
      )
    );
  }

  req.cleanStatus = targetStatus;
  next();
};

/**
 * Validate image publicId parameter for image deletion.
 * Supports publicId passed via JSON body, URL parameter, or query string.
 */
export const validateDeleteImage = (req, res, next) => {
  const publicId = req.body?.publicId || req.params?.publicId || req.query?.publicId;

  if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
    return next(
      new ApiError(
        400,
        'VALIDATION_ERROR',
        'Image publicId is required for deletion.'
      )
    );
  }

  req.cleanPublicId = publicId.trim();
  next();
};

export default {
  validateListingId,
  validateListingQuery,
  validateCreateListing,
  validateUpdateListing,
  validateUpdateListingStatus,
  validateDeleteImage,
};

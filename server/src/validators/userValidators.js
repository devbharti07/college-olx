import { ApiError } from '../utils/apiError.js';
import { isValidUUID } from '../constants/marketplace.js';

// List of profile fields explicitly permitted for student updates
const ALLOWED_PROFILE_UPDATE_FIELDS = [
  'name',
  'avatar',
  'department',
  'pickupSpot',
  'college',
];

// Protocol regex for safe avatar image URLs
const SAFE_URL_REGEX = /^(https?:\/\/|\/)/i;

/**
 * Validate UUID format in request parameter :id.
 * Prevents database query errors when malformed IDs are requested.
 */
export const validateUserId = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !isValidUUID(id.trim())) {
    return next(
      new ApiError(
        400,
        'INVALID_IDENTIFIER',
        `The provided user identifier "${id}" is not a valid UUID.`
      )
    );
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validate and sanitize PATCH /api/users/me profile updates.
 * Defends against mass assignment by extracting and validating only allowed fields.
 */
export const validateUpdateProfile = (req, res, next) => {
  const body = req.body;

  // 1. Reject empty update requests
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    return next(
      new ApiError(
        400,
        'EMPTY_UPDATE',
        'At least one editable profile field must be provided for update.'
      )
    );
  }

  // 2. Reject requests containing only forbidden or unknown fields
  const suppliedKeys = Object.keys(body);
  const editableKeysPresent = suppliedKeys.filter((k) =>
    ALLOWED_PROFILE_UPDATE_FIELDS.includes(k)
  );

  if (editableKeysPresent.length === 0) {
    return next(
      new ApiError(
        400,
        'NO_EDITABLE_FIELDS',
        'None of the provided fields can be updated. Allowed fields: name, avatar, department, pickupSpot, college.'
      )
    );
  }

  const errors = {};
  const cleanUpdates = {};

  // 3. Validate editable fields if present
  // Field: name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      errors.name = 'Full name cannot be empty.';
    } else if (body.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters long.';
    } else if (body.name.trim().length > 100) {
      errors.name = 'Full name cannot exceed 100 characters.';
    } else {
      cleanUpdates.name = body.name.trim();
    }
  }

  // Field: college
  if (body.college !== undefined) {
    if (typeof body.college !== 'string' || !body.college.trim()) {
      errors.college = 'College/University name cannot be empty.';
    } else if (body.college.trim().length < 2) {
      errors.college = 'College name must be at least 2 characters long.';
    } else if (body.college.trim().length > 150) {
      errors.college = 'College name cannot exceed 150 characters.';
    } else {
      cleanUpdates.college = body.college.trim();
    }
  }

  // Field: department
  if (body.department !== undefined) {
    if (body.department === null || body.department === '') {
      cleanUpdates.department = '';
    } else if (typeof body.department !== 'string') {
      errors.department = 'Department must be a string.';
    } else if (body.department.trim().length > 100) {
      errors.department = 'Department cannot exceed 100 characters.';
    } else {
      cleanUpdates.department = body.department.trim();
    }
  }

  // Field: pickupSpot
  if (body.pickupSpot !== undefined) {
    if (body.pickupSpot === null || body.pickupSpot === '') {
      cleanUpdates.pickupSpot = 'Campus Library / Student Center';
    } else if (typeof body.pickupSpot !== 'string') {
      errors.pickupSpot = 'Pickup spot must be a string.';
    } else if (body.pickupSpot.trim().length > 150) {
      errors.pickupSpot = 'Pickup spot cannot exceed 150 characters.';
    } else {
      cleanUpdates.pickupSpot = body.pickupSpot.trim();
    }
  }

  // Field: avatar
  if (body.avatar !== undefined) {
    if (body.avatar === null || body.avatar === '') {
      cleanUpdates.avatar = null;
    } else if (typeof body.avatar !== 'string') {
      errors.avatar = 'Avatar must be a valid URL string or null.';
    } else {
      const trimmedAvatar = body.avatar.trim();
      // Block unsafe protocols (e.g. javascript:, data:, vbscript:)
      if (!SAFE_URL_REGEX.test(trimmedAvatar)) {
        errors.avatar = 'Avatar URL must use a safe HTTP/HTTPS or relative path protocol.';
      } else if (trimmedAvatar.length > 500) {
        errors.avatar = 'Avatar URL cannot exceed 500 characters.';
      } else {
        cleanUpdates.avatar = trimmedAvatar;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Profile validation failed.', errors));
  }

  // Attach sanitized updates exclusively
  req.cleanProfileUpdates = cleanUpdates;
  next();
};

export default {
  validateUserId,
  validateUpdateProfile,
};

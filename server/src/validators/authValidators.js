import { ApiError } from '../utils/apiError.js';
import { validateInstitutionalDomain } from '../config/institutionalDomains.js';

// Standard RFC 5322 simplified email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware validator for institutional college email submission.
 */
export const validateCollegeEmail = (req, res, next) => {
  const { collegeEmail } = req.body;

  if (!collegeEmail || typeof collegeEmail !== 'string' || !collegeEmail.trim()) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Institutional college email is required.'));
  }

  const normalized = collegeEmail.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalized) || normalized.length > 254) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Please provide a valid institutional email address.'));
  }

  const domainValidation = validateInstitutionalDomain(normalized);
  if (!domainValidation.isInstitutional) {
    return next(
      new ApiError(
        400,
        'VALIDATION_ERROR',
        domainValidation.reason ||
          'Institutional email must belong to an approved collegiate domain (.edu, .edu.in, .ac.in).'
      )
    );
  }

  next();
};

/**
 * Middleware validator for verifying email via single-use token.
 */
export const validateVerifyEmail = (req, res, next) => {
  const token = req.query.token || req.body.token;

  if (!token || typeof token !== 'string' || !token.trim()) {
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Verification token is required.'));
  }

  const cleanToken = token.trim();
  if (cleanToken.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanToken)) {
    return next(new ApiError(400, 'INVALID_TOKEN', 'Verification token format is invalid.'));
  }

  req.verificationToken = cleanToken;
  next();
};

export default {
  validateCollegeEmail,
  validateVerifyEmail,
};

import { ApiError } from '../utils/apiError.js';
import { verifyKeycloakToken } from '../services/keycloakService.js';
import { findOrCreateUserFromKeycloak } from '../services/userService.js';
import { prisma } from '../config/database.js';

/**
 * Extract bearer token from HTTP Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[1].trim()) {
      return parts[1].trim();
    }
  }

  // 2. Check HTTP-only cookie (auth_token) fallback
  if (req.headers.cookie && typeof req.headers.cookie === 'string') {
    const match = req.headers.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return null;
};

/**
 * Authentication middleware enforcing valid Keycloak user session.
 * Validates Keycloak signature via JWKS, checks issuer, expiry, extracts subject,
 * provisions or loads the PostgreSQL user record via keycloakUserId, and enforces account status.
 *
 * NOTE: This middleware does NOT enforce email_verified or college verification.
 * Use requireKeycloakEmailVerified and requireVerifiedUser for those checks.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new ApiError(401, 'MISSING_TOKEN', 'Authentication required. No access token provided.');
    }

    // 1. Verify token signature, issuer, and claims via Keycloak JWKS
    const decoded = await verifyKeycloakToken(token);

    if (!decoded || !decoded.sub) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Keycloak access token missing subject identifier.');
    }

    // 2. Provision or resolve application user from PostgreSQL via keycloakUserId
    const user = await findOrCreateUserFromKeycloak(decoded);

    if (!user) {
      throw new ApiError(401, 'USER_NOT_FOUND', 'Unable to resolve application user account.');
    }

    // 3. Verify account status
    const status = (user.accountStatus || '').toLowerCase();
    if (status === 'banned') {
      throw new ApiError(403, 'ACCOUNT_BANNED', 'Your account has been permanently banned from Campus Classifieds.');
    }

    if (status === 'suspended') {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact campus administration.');
    }

    // 4. Attach verified user, userId, and Keycloak claims to request context
    req.user = user;
    req.userId = user.id;
    req.keycloakToken = decoded;
    // Expose Keycloak email_verified claim on request for downstream middleware
    req.keycloakEmailVerified = Boolean(decoded.email_verified);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware enforcing that the Keycloak account's email has been verified.
 *
 * This is SEPARATE from college verification (requireVerifiedUser).
 * Keycloak email verification = "user owns this email address" (basic account security).
 * College verification = "this email belongs to an approved institution" (marketplace eligibility).
 *
 * Must run after requireAuth.
 */
export const requireKeycloakEmailVerified = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required.'));
  }

  if (!req.keycloakEmailVerified) {
    return next(
      new ApiError(
        403,
        'KEYCLOAK_EMAIL_UNVERIFIED',
        'Please verify your email address before using this feature. Check your inbox for a verification link from Campus Classifieds.'
      )
    );
  }

  next();
};

/**
 * Role-based authorization middleware factory.
 * @param {...string} allowedRoles - Array of allowed role names (e.g. 'admin', 'student')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required before checking permissions.'));
    }

    const currentRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowed.includes(currentRole)) {
      return next(
        new ApiError(
          403,
          'INSUFFICIENT_PERMISSIONS',
          `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`
        )
      );
    }

    next();
  };
};

/**
 * Middleware ensuring the authenticated user has verified their institutional collegiate email.
 * This is the COLLEGE / MARKETPLACE verification layer (isVerified in PostgreSQL).
 *
 * Must run after requireAuth. Optionally combine with requireKeycloakEmailVerified.
 */
export const requireVerifiedUser = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required before checking verification status.'));
  }

  // Tier 1: Keycloak Identity Email Verification
  if (!req.keycloakEmailVerified) {
    return next(
      new ApiError(
        403,
        'KEYCLOAK_EMAIL_UNVERIFIED',
        'Please verify your email address before using this feature. Check your inbox for a verification link from Campus Classifieds.'
      )
    );
  }

  // Tier 2: Institutional College Domain Verification
  if (!req.user.isVerified) {
    return next(
      new ApiError(
        403,
        'UNVERIFIED_COLLEGE_USER',
        'Institutional college email verification is required to perform this action. Please verify your college email address.'
      )
    );
  }

  next();
};

/**
 * Middleware ensuring the authenticated user is the legitimate owner of the target listing.
 */
export const requireListingOwner = async (req, res, next) => {
  try {
    if (!req.user || !req.userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const listingId = req.params.id || req.params.listingId;
    if (!listingId) {
      throw new ApiError(400, 'MISSING_IDENTIFIER', 'Target listing identifier is required.');
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing || listing.status === 'REMOVED') {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
    }

    if (listing.sellerId !== req.userId) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied. You do not own this listing.');
    }

    req.listing = listing;
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  requireAuth,
  requireKeycloakEmailVerified,
  requireRole,
  requireVerifiedUser,
  requireListingOwner,
};

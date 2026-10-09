import { ApiError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';
import { isValidUUID, fromDbEnum } from '../constants/marketplace.js';
import { isInstitutionalEmail } from '../config/institutionalDomains.js';

/**
 * Format private user profile for authenticated self-management.
 * Excludes sensitive authentication credentials and verification secrets.
 */
export const sanitizePrivateProfile = (user, keycloakEmailVerified = null) => ({
  id: user.id,
  keycloakUserId: user.keycloakUserId,
  name: user.name,
  email: user.email,
  collegeEmail: user.collegeEmail || null,
  collegeId: user.collegeId || '',
  avatar: user.avatar || null,
  college: user.college,
  department: user.department || '',
  pickupSpot: user.pickupSpot || 'Campus Library / Student Center',
  role: fromDbEnum(user.role),
  isVerified: Boolean(user.isVerified),
  // keycloakEmailVerified: reflects Keycloak email_verified claim if provided
  // null means unknown (middleware did not pass it); true/false are authoritative
  keycloakEmailVerified: keycloakEmailVerified !== null ? Boolean(keycloakEmailVerified) : null,
  accountStatus: fromDbEnum(user.accountStatus),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * Format strictly sanitized public profile for external viewing.
 * Never leaks private emails, institutional credentials, or internal roles.
 */
const sanitizePublicProfile = (user) => ({
  id: user.id,
  name: user.name,
  avatar: user.avatar || null,
  college: user.college,
  department: user.department || '',
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt,
});

/**
 * Retrieve current authenticated student profile.
 * @param {string} userId - User identifier (UUID)
 * @returns {Promise<Object>} Sanitized user profile
 */
export const getCurrentUserProfile = async (userId) => {
  if (!isValidUUID(userId)) {
    throw new ApiError(400, 'INVALID_IDENTIFIER', 'Invalid user identifier format.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User profile not found.');
  }

  const status = fromDbEnum(user.accountStatus);
  if (status === 'suspended') {
    throw new ApiError(
      403,
      'ACCOUNT_SUSPENDED',
      'Your account has been suspended. Please contact campus administration.'
    );
  }

  if (status === 'banned') {
    throw new ApiError(
      403,
      'ACCOUNT_BANNED',
      'Your account has been permanently banned from Campus Classifieds.'
    );
  }

  return sanitizePrivateProfile(user);
};

/**
 * Update current authenticated student profile fields.
 * Uses strict whitelist to guarantee protected fields remain unchanged.
 * @param {string} userId - User identifier (UUID)
 * @param {Object} allowedUpdates - Whitelisted update fields
 * @returns {Promise<Object>} Updated sanitized profile
 */
export const updateCurrentUserProfile = async (userId, allowedUpdates) => {
  if (!isValidUUID(userId)) {
    throw new ApiError(400, 'INVALID_IDENTIFIER', 'Invalid user identifier format.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User profile not found.');
  }

  const status = fromDbEnum(user.accountStatus);
  if (status === 'suspended') {
    throw new ApiError(
      403,
      'ACCOUNT_SUSPENDED',
      'Your account has been suspended. Please contact campus administration.'
    );
  }

  if (status === 'banned') {
    throw new ApiError(
      403,
      'ACCOUNT_BANNED',
      'Your account has been permanently banned from Campus Classifieds.'
    );
  }

  // Update only whitelisted fields
  const permittedFields = ['name', 'avatar', 'department', 'pickupSpot', 'college'];
  const dataToUpdate = {};
  for (const field of permittedFields) {
    if (allowedUpdates[field] !== undefined) {
      dataToUpdate[field] = allowedUpdates[field];
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });

  return sanitizePrivateProfile(updatedUser);
};

/**
 * Retrieve public seller profile by user ID.
 * Returns only non-sensitive public metadata suitable for marketplace display.
 * @param {string} targetUserId - Target user UUID
 * @returns {Promise<Object>} Public profile DTO
 */
export const getPublicProfileById = async (targetUserId) => {
  if (!isValidUUID(targetUserId)) {
    throw new ApiError(400, 'INVALID_IDENTIFIER', 'Invalid user identifier format.');
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      avatar: true,
      college: true,
      department: true,
      isVerified: true,
      createdAt: true,
      accountStatus: true,
    },
  });

  if (!user || fromDbEnum(user.accountStatus) === 'banned') {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User profile not found.');
  }

  return sanitizePublicProfile(user);
};

/**
 * Idempotently find or provision an application User from verified Keycloak identity claims.
 * Ensures Keycloak is the single source of identity without password storage.
 *
 * @param {Object} keycloakPayload - Verified Keycloak token payload
 * @returns {Promise<Object>} Live application User record from PostgreSQL
 */
export const findOrCreateUserFromKeycloak = async (keycloakPayload) => {
  const { sub, email, name, preferred_username, roles = [] } = keycloakPayload;

  if (!sub) {
    throw new ApiError(400, 'INVALID_TOKEN', 'Missing Keycloak user identifier (sub).');
  }

  // 1. Check if user already exists with this keycloakUserId
  let user = await prisma.user.findUnique({
    where: { keycloakUserId: sub },
  });

  const isAdminRole = roles.some((r) => String(r).toLowerCase() === 'admin');

  if (user) {
    // If role changed to admin in Keycloak, sync it to PostgreSQL
    if (isAdminRole && user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    }
    return user;
  }

  // 2. Check if account with same email already exists (seamless migration/account linking)
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          keycloakUserId: sub,
          role: isAdminRole ? 'ADMIN' : existingByEmail.role,
        },
      });
      return user;
    }
  }

  // 3. New user provisioning
  const displayName = (name || preferred_username || 'Student User').trim();
  const userEmail = normalizedEmail || `${sub}@campus.local`;
  const isEdu = isInstitutionalEmail(userEmail);

  try {
    user = await prisma.user.create({
      data: {
        keycloakUserId: sub,
        name: displayName,
        email: userEmail,
        // Store college email if institutional, but do NOT auto-verify.
        // isVerified must be earned through the explicit college email verification flow.
        collegeEmail: isEdu ? userEmail : null,
        college: 'Campus',
        department: '',
        pickupSpot: 'Campus Library / Student Center',
        role: isAdminRole ? 'ADMIN' : 'STUDENT',
        isVerified: false, // Always false on creation — must complete college verification flow
        accountStatus: 'ACTIVE',
      },
    });
    return user;
  } catch (err) {
    // Handle concurrent first login gracefully
    if (err.code === 'P2002') {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ keycloakUserId: sub }, { email: userEmail }],
        },
      });
      if (existing) return existing;
    }
    throw err;
  }
};

export default {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getPublicProfileById,
  findOrCreateUserFromKeycloak,
  sanitizePrivateProfile,
};

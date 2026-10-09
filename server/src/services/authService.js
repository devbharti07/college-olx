import crypto from 'crypto';
import config from '../config/environment.js';
import { ApiError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';
import { isInstitutionalEmail } from '../config/institutionalDomains.js';
import { sendVerificationEmail } from './emailService.js';

/**
 * Format strictly sanitized user object for API responses.
 * Guarantees no password credentials or internal verification tokens are leaked.
 */
export const sanitizeUserDTO = (user) => {
  if (!user) return null;
  return {
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
    role: (user.role || 'student').toLowerCase(),
    isVerified: Boolean(user.isVerified),
    accountStatus: (user.accountStatus || 'active').toLowerCase(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Generate a cryptographically secure raw verification token, its SHA-256 hash, and expiry date.
 */
export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + (config.verification.expiresMinutes || 15) * 60 * 1000);

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
};

/**
 * Retrieve current user profile by user ID.
 * Enforces accountStatus checks for active access.
 */
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(401, 'USER_NOT_FOUND', 'User session is invalid or user account no longer exists.');
  }

  const status = (user.accountStatus || '').toLowerCase();
  if (status === 'suspended') {
    throw new ApiError(
      403,
      'ACCOUNT_SUSPENDED',
      'Your account has been temporarily suspended. Please contact campus administration.'
    );
  }

  if (status === 'banned') {
    throw new ApiError(
      403,
      'ACCOUNT_BANNED',
      'Your account has been permanently banned from Campus Classifieds.'
    );
  }

  return sanitizeUserDTO(user);
};

/**
 * Submit or update institutional college email for marketplace verification.
 * Enforces collegiate domain rules and sends cryptographic verification link.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {string} collegeEmail - Institutional collegiate email address
 */
export const submitCollegeEmail = async (userId, collegeEmail) => {
  const normalizedEmail = (collegeEmail || '').trim().toLowerCase();

  if (!isInstitutionalEmail(normalizedEmail)) {
    throw new ApiError(
      400,
      'INVALID_COLLEGIATE_EMAIL',
      'Institutional college email must belong to an approved collegiate domain (.edu, .edu.in, .ac.in).'
    );
  }

  // Ensure college email is not already bound to another student
  const existing = await prisma.user.findFirst({
    where: {
      collegeEmail: normalizedEmail,
      NOT: { id: userId },
    },
  });

  if (existing) {
    throw new ApiError(409, 'DUPLICATE_RESOURCE', 'This institutional college email is already associated with another account.');
  }

  const { rawToken, hashedToken, expiresAt } = generateVerificationToken();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      collegeEmail: normalizedEmail,
      verificationToken: hashedToken,
      verificationTokenExpiry: expiresAt,
    },
  });

  const verificationUrl = `${config.clientUrl}/verify-email?token=${rawToken}`;
  await sendVerificationEmail({
    to: normalizedEmail,
    name: user.name,
    verificationUrl,
    expiresMinutes: config.verification.expiresMinutes,
  });

  return {
    user: sanitizeUserDTO(user),
    sent: true,
    message: 'Verification link sent to your institutional college email.',
  };
};

/**
 * Verify institutional email using raw verification token.
 * Hashes incoming token, verifies expiration, activates marketplace verification, and invalidates token.
 * @param {string} rawToken - Plain verification token string
 */
export const verifyEmailToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new ApiError(400, 'INVALID_TOKEN', 'Verification token is required.');
  }

  const hashedToken = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const user = await prisma.user.findFirst({
    where: { verificationToken: hashedToken },
  });

  if (!user) {
    throw new ApiError(
      400,
      'INVALID_TOKEN',
      'Verification token is invalid, expired, or has already been used.'
    );
  }

  if (!user.verificationTokenExpiry || new Date(user.verificationTokenExpiry) < new Date()) {
    throw new ApiError(
      400,
      'TOKEN_EXPIRED',
      'Verification link has expired. Please request a new verification email.'
    );
  }

  const status = (user.accountStatus || '').toLowerCase();
  if (status === 'suspended') {
    throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended. Please contact campus administration.');
  }

  if (status === 'banned') {
    throw new ApiError(403, 'ACCOUNT_BANNED', 'Your account has been permanently banned from Campus Classifieds.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return sanitizeUserDTO(updatedUser);
};

/**
 * Resend college verification link to authenticated user's registered institutional email.
 * @param {string} userId - Authenticated user UUID
 */
export const resendCollegeVerification = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User account not found.');
  }

  if (user.isVerified) {
    return {
      sent: false,
      alreadyVerified: true,
      message: 'Account is already verified.',
    };
  }

  if (!user.collegeEmail) {
    throw new ApiError(400, 'MISSING_COLLEGE_EMAIL', 'No institutional college email is set. Please provide your college email first.');
  }

  if (!isInstitutionalEmail(user.collegeEmail)) {
    throw new ApiError(
      400,
      'INVALID_COLLEGIATE_EMAIL',
      'Registered institutional email does not meet current collegiate domain policy.'
    );
  }

  const { rawToken, hashedToken, expiresAt } = generateVerificationToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: hashedToken,
      verificationTokenExpiry: expiresAt,
    },
  });

  const verificationUrl = `${config.clientUrl}/verify-email?token=${rawToken}`;
  await sendVerificationEmail({
    to: user.collegeEmail,
    name: user.name,
    verificationUrl,
    expiresMinutes: config.verification.expiresMinutes,
  });

  return {
    sent: true,
    message: 'A fresh verification link has been dispatched to your institutional email.',
  };
};

export default {
  generateVerificationToken,
  getCurrentUser,
  submitCollegeEmail,
  verifyEmailToken,
  resendCollegeVerification,
  sanitizeUserDTO,
};

/**
 * Marketplace Constants & Enums
 * Defines domain enums, allowed sets, and validation helpers for Campus Classifieds.
 */

// User Roles
export const ALLOWED_ROLES = ['student', 'admin'];

// Account Statuses
export const ALLOWED_ACCOUNT_STATUSES = ['active', 'suspended', 'banned'];

// Listing Categories (API values match kebab-case, DB enums map to uppercase)
export const ALLOWED_CATEGORIES = [
  'books',
  'electronics',
  'lab-equipment',
  'cycles',
  'notes',
  'clothing',
  'hostel-items',
  'other',
];

// Listing Conditions
export const ALLOWED_CONDITIONS = [
  'new',
  'like-new',
  'good',
  'fair',
  'poor',
];

// Listing Statuses
export const ALLOWED_LISTING_STATUSES = [
  'active',
  'sold',
  'removed',
];

// Report Reasons
export const ALLOWED_REPORT_REASONS = [
  'spam',
  'scam',
  'inappropriate',
  'misleading',
  'duplicate',
  'prohibited-item',
  'other',
];

// Report Statuses
export const ALLOWED_REPORT_STATUSES = [
  'pending',
  'reviewing',
  'resolved',
  'rejected',
];

// UUID v4 format regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate standard UUID (v1-v5) format.
 * @param {*} val
 * @returns {boolean}
 */
export const isValidUUID = (val) => {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
};

/**
 * Convert API kebab-case/lowercase enum to Prisma uppercase enum.
 * e.g., 'lab-equipment' -> 'LAB_EQUIPMENT', 'like-new' -> 'LIKE_NEW'
 */
export const toDbEnum = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.trim().toUpperCase().replace(/-/g, '_');
};

/**
 * Convert Prisma uppercase enum to API kebab-case/lowercase enum.
 * e.g., 'LAB_EQUIPMENT' -> 'lab-equipment', 'LIKE_NEW' -> 'like-new'
 */
export const fromDbEnum = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.trim().toLowerCase().replace(/_/g, '-');
};

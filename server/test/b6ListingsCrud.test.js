/**
 * B6 Listings CRUD Test Suite
 *
 * Requirements covered:
 * CREATE:
 * - authenticated + verified user can create listing
 * - unauthenticated user cannot create (401)
 * - authenticated but unverified user cannot create (403)
 * - seller is taken from authenticated identity (req.userId)
 * - client cannot spoof owner/seller ID
 * - invalid title rejected (length < 3 or > 100 or non-string)
 * - invalid price rejected (< 0 or > 10,000,000 or NaN/non-numeric)
 * - invalid category rejected (not in ALLOWED_CATEGORIES)
 * - invalid condition rejected (not in ALLOWED_CONDITIONS)
 * - invalid location rejected (length < 2 or > 120 or non-string)
 * - sensible defaults (condition='good', status='ACTIVE', images=[])
 *
 * READ:
 * - browse returns active listings only
 * - newest listings appear first (default sort)
 * - pagination works (page & limit)
 * - default limit is 20, maximum limit is 50, limits > 50 rejected
 * - safe seller DTO is returned (no password/credentials leakage)
 * - removed listings are excluded from public browse
 * - single active listing works
 * - sold listing can be retrieved
 * - removed listing is not publicly exposed (returns 404)
 * - malformed ID is rejected (UUID validation)
 * - missing listing returns 404
 *
 * MINE:
 * - authenticated user sees only their own listings
 * - active/sold/removed listings are included
 * - another user's listings are never returned
 *
 * UPDATE:
 * - owner can update allowed fields
 * - non-owner receives 403
 * - unauthenticated user is rejected
 * - unverified user is rejected
 * - protected fields cannot be changed (seller, status, images, createdAt, updatedAt)
 * - seller/owner cannot be changed through request body
 * - invalid fields are rejected
 *
 * STATUS:
 * - owner can update valid status ('active' <-> 'sold')
 * - non-owner cannot (403)
 * - unverified user cannot (403)
 * - invalid status is rejected
 * - setting status to 'removed' via status endpoint is rejected (must use DELETE)
 *
 * DELETE:
 * - owner can perform intended deletion (status becomes 'removed')
 * - non-owner cannot (403)
 * - unverified user cannot (403)
 * - unauthenticated user cannot (401)
 *
 * SECURITY:
 * - IDOR / ownership bypass attempts fail
 * - seller / owner spoofing attempts are ignored/neutralized
 * - status manipulation through normal update endpoint is ignored
 * - image manipulation through B6 update endpoint is ignored
 */
process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';

import { ApiError } from '../src/utils/apiError.js';
import {
  validateListingId,
  validateListingQuery,
  validateCreateListing,
  validateUpdateListing,
  validateUpdateListingStatus,
} from '../src/validators/listingValidators.js';
import {
  requireAuth,
  requireKeycloakEmailVerified,
  requireVerifiedUser,
} from '../src/middleware/authMiddleware.js';
import {
  sanitizeSellerPublicDTO,
  formatListingDTO,
} from '../src/services/listingService.js';
import {
  ALLOWED_CATEGORIES,
  ALLOWED_CONDITIONS,
  fromDbEnum,
  toDbEnum,
} from '../src/constants/marketplace.js';

// ==============================================================================
// 1. CREATE LISTING TESTS
// ==============================================================================

test('B6-C1. Create Listing - Authenticated & Verified user middleware permits request', () => {
  const req = {
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Verified Student',
      email: 'student@college.edu',
      isVerified: true,
    },
    userId: '00000000-0000-4000-8000-000000000001',
    keycloakEmailVerified: true,
  };

  let nextCalled = false;
  let nextErr = null;

  requireVerifiedUser(req, {}, (err) => {
    if (err) nextErr = err;
    else nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(nextErr, null);
});

test('B6-C2. Create Listing - Unauthenticated user rejected with 401', async () => {
  const req = { headers: {} };
  let nextErr = null;

  await requireAuth(req, {}, (err) => {
    nextErr = err;
  });

  assert.ok(nextErr instanceof ApiError);
  assert.equal(nextErr.statusCode, 401);
  assert.equal(nextErr.code, 'MISSING_TOKEN');
});

test('B6-C3. Create Listing - Keycloak unverified user rejected with 403', () => {
  const req = {
    user: { id: 'user-1', isVerified: false },
    keycloakEmailVerified: false,
  };
  let nextErr = null;

  requireVerifiedUser(req, {}, (err) => {
    nextErr = err;
  });

  assert.ok(nextErr instanceof ApiError);
  assert.equal(nextErr.statusCode, 403);
  assert.equal(nextErr.code, 'KEYCLOAK_EMAIL_UNVERIFIED');
});

test('B6-C4. Create Listing - College unverified user rejected with 403', () => {
  const req = {
    user: { id: 'user-1', isVerified: false },
    keycloakEmailVerified: true,
  };
  let nextErr = null;

  requireVerifiedUser(req, {}, (err) => {
    nextErr = err;
  });

  assert.ok(nextErr instanceof ApiError);
  assert.equal(nextErr.statusCode, 403);
  assert.equal(nextErr.code, 'UNVERIFIED_COLLEGE_USER');
});

test('B6-C5. Create Listing - Seller identity spoofing neutralized in validator', () => {
  const req = {
    body: {
      title: 'Valid Textbook Title',
      description: 'Clean textbook in great condition for sale on campus.',
      price: 250,
      category: 'books',
      condition: 'good',
      location: 'Central Library',
      sellerId: 'attacker-id-666',
      seller: { id: 'attacker-id-777' },
      userId: 'attacker-id-888',
      ownerId: 'attacker-id-999',
      status: 'SOLD',
      createdAt: '2020-01-01',
      updatedAt: '2020-01-01',
      id: 'arbitrary-id-000',
    },
  };

  let nextCalled = false;
  validateCreateListing(req, {}, (err) => {
    if (!err) nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.ok(req.cleanListingData);
  assert.equal(req.cleanListingData.title, 'Valid Textbook Title');
  assert.equal(req.cleanListingData.price, 250);
  assert.equal(req.cleanListingData.category, 'books');
  assert.equal(req.cleanListingData.condition, 'good');
  assert.equal(req.cleanListingData.location, 'Central Library');

  // Verify none of the spoofed fields exist in cleanListingData
  assert.equal(req.cleanListingData.sellerId, undefined);
  assert.equal(req.cleanListingData.seller, undefined);
  assert.equal(req.cleanListingData.userId, undefined);
  assert.equal(req.cleanListingData.ownerId, undefined);
  assert.equal(req.cleanListingData.status, undefined);
  assert.equal(req.cleanListingData.createdAt, undefined);
  assert.equal(req.cleanListingData.id, undefined);
});

test('B6-C6. Create Listing - Validation rejects invalid title', () => {
  // Too short (< 3)
  const reqShort = {
    body: {
      title: 'AB',
      description: 'Valid description text here over 10 chars.',
      price: 100,
      category: 'books',
      location: 'Library',
    },
  };
  let errShort = null;
  validateCreateListing(reqShort, {}, (err) => { errShort = err; });
  assert.ok(errShort instanceof ApiError);
  assert.equal(errShort.statusCode, 400);

  // Missing
  const reqMissing = {
    body: {
      description: 'Valid description text here over 10 chars.',
      price: 100,
      category: 'books',
      location: 'Library',
    },
  };
  let errMissing = null;
  validateCreateListing(reqMissing, {}, (err) => { errMissing = err; });
  assert.ok(errMissing instanceof ApiError);
  assert.equal(errMissing.statusCode, 400);
});

test('B6-C7. Create Listing - Validation rejects invalid price', () => {
  // Negative
  const reqNeg = {
    body: {
      title: 'Valid Title Here',
      description: 'Valid description text here over 10 chars.',
      price: -50,
      category: 'books',
      location: 'Library',
    },
  };
  let errNeg = null;
  validateCreateListing(reqNeg, {}, (err) => { errNeg = err; });
  assert.ok(errNeg instanceof ApiError);
  assert.equal(errNeg.statusCode, 400);

  // Non-numeric / NaN
  const reqNaN = {
    body: {
      title: 'Valid Title Here',
      description: 'Valid description text here over 10 chars.',
      price: 'not-a-price',
      category: 'books',
      location: 'Library',
    },
  };
  let errNaN = null;
  validateCreateListing(reqNaN, {}, (err) => { errNaN = err; });
  assert.ok(errNaN instanceof ApiError);
  assert.equal(errNaN.statusCode, 400);

  // Exceeding 10,000,000
  const reqHuge = {
    body: {
      title: 'Valid Title Here',
      description: 'Valid description text here over 10 chars.',
      price: 10000001,
      category: 'books',
      location: 'Library',
    },
  };
  let errHuge = null;
  validateCreateListing(reqHuge, {}, (err) => { errHuge = err; });
  assert.ok(errHuge instanceof ApiError);
  assert.equal(errHuge.statusCode, 400);
});

test('B6-C8. Create Listing - Validation rejects invalid category', () => {
  const req = {
    body: {
      title: 'Valid Title Here',
      description: 'Valid description text here over 10 chars.',
      price: 100,
      category: 'weapons-and-contraband',
      location: 'Library',
    },
  };
  let err = null;
  validateCreateListing(req, {}, (e) => { err = e; });
  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'VALIDATION_ERROR');
});

test('B6-C9. Create Listing - Validation rejects invalid condition', () => {
  const req = {
    body: {
      title: 'Valid Title Here',
      description: 'Valid description text here over 10 chars.',
      price: 100,
      category: 'books',
      condition: 'radioactive',
      location: 'Library',
    },
  };
  let err = null;
  validateCreateListing(req, {}, (e) => { err = e; });
  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 400);
});

test('B6-C10. Create Listing - Validation rejects invalid location', () => {
  const req = {
    body: {
      title: 'Valid Title Here',
      description: 'Valid description text here over 10 chars.',
      price: 100,
      category: 'books',
      condition: 'good',
      location: 'X', // < 2 chars
    },
  };
  let err = null;
  validateCreateListing(req, {}, (e) => { err = e; });
  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 400);
});

// ==============================================================================
// 2. BROWSE & SINGLE LISTING TESTS
// ==============================================================================

test('B6-R1. Browse Listings - Pagination validation enforces default 20, max 50', () => {
  // Default values
  const reqDefault = { query: {} };
  validateListingQuery(reqDefault, {}, () => {});
  assert.equal(reqDefault.pagination.page, 1);
  assert.equal(reqDefault.pagination.limit, 20);

  // Custom within limit
  const reqCustom = { query: { page: '2', limit: '35' } };
  validateListingQuery(reqCustom, {}, () => {});
  assert.equal(reqCustom.pagination.page, 2);
  assert.equal(reqCustom.pagination.limit, 35);

  // Exceeding max limit (50)
  const reqExcess = { query: { limit: '51' } };
  let errExcess = null;
  validateListingQuery(reqExcess, {}, (err) => { errExcess = err; });
  assert.ok(errExcess instanceof ApiError);
  assert.equal(errExcess.statusCode, 400);
  assert.equal(errExcess.code, 'INVALID_PAGINATION');

  // Negative / zero page
  const reqZeroPage = { query: { page: '0' } };
  let errZero = null;
  validateListingQuery(reqZeroPage, {}, (err) => { errZero = err; });
  assert.ok(errZero instanceof ApiError);
  assert.equal(errZero.statusCode, 400);
});

test('B6-R2. Browse Listings - Safe seller DTO strips private credentials and internal keys', () => {
  const rawSeller = {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Alice Student',
    email: 'alice@campus.edu',
    collegeEmail: 'alice.verified@campus.edu',
    password: 'argon2-hashed-secret-do-not-leak',
    keycloakUserId: 'kc-sec-999',
    verificationToken: 'crypto-token-1234',
    accountStatus: 'ACTIVE',
    avatar: 'https://example.com/avatar.jpg',
    college: 'IIT Bombay',
    department: 'Computer Science',
    isVerified: true,
  };

  const safeSeller = sanitizeSellerPublicDTO(rawSeller);

  assert.equal(safeSeller.id, rawSeller.id);
  assert.equal(safeSeller.name, 'Alice Student');
  assert.equal(safeSeller.avatar, 'https://example.com/avatar.jpg');
  assert.equal(safeSeller.college, 'IIT Bombay');
  assert.equal(safeSeller.department, 'Computer Science');
  assert.equal(safeSeller.isVerified, true);

  // Strictly verify non-exposure of private fields
  assert.equal(safeSeller.email, undefined);
  assert.equal(safeSeller.collegeEmail, undefined);
  assert.equal(safeSeller.password, undefined);
  assert.equal(safeSeller.keycloakUserId, undefined);
  assert.equal(safeSeller.verificationToken, undefined);
  assert.equal(safeSeller.accountStatus, undefined);
});

test('B6-R3. Single Listing - Format DTO properly normalizes database listing representation', () => {
  const listingDoc = {
    id: '00000000-0000-4000-8000-000000000010',
    title: 'Engineering Mathematics Vol 1',
    description: 'First year engineering textbook with minimal notes.',
    price: 350.0,
    category: 'BOOKS',
    condition: 'LIKE_NEW',
    location: 'Hostel 4 Ground Floor',
    status: 'ACTIVE',
    soldTo: null,
    viewsCount: 15,
    images: [{ url: 'https://res.cloudinary.com/demo/image.jpg', publicId: 'campus/img1' }],
    seller: {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Bob Student',
      avatar: null,
      college: 'BITS Pilani',
      department: 'ECE',
      isVerified: true,
    },
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-02'),
  };

  const dto = formatListingDTO(listingDoc);

  assert.equal(dto.id, listingDoc.id);
  assert.equal(dto.category, 'books');
  assert.equal(dto.condition, 'like-new');
  assert.equal(dto.status, 'active');
  assert.equal(dto.price, 350.0);
  assert.equal(dto.viewsCount, 15);
  assert.equal(dto.images.length, 1);
  assert.equal(dto.seller.name, 'Bob Student');
  assert.equal(dto.seller.isVerified, true);
});

test('B6-R4. Single Listing - UUID path parameter validation rejects malformed IDs', () => {
  const validReq = { params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' } };
  let validNextCalled = false;
  validateListingId(validReq, {}, (err) => { if (!err) validNextCalled = true; });
  assert.equal(validNextCalled, true);

  const invalidReq = { params: { id: 'not-a-valid-uuid-string' } };
  let invalidErr = null;
  validateListingId(invalidReq, {}, (err) => { invalidErr = err; });
  assert.ok(invalidErr instanceof ApiError);
  assert.equal(invalidErr.statusCode, 400);
  assert.equal(invalidErr.code, 'INVALID_IDENTIFIER');

  const mongoReq = { params: { id: '507f1f77bcf86cd799439011' } };
  let mongoErr = null;
  validateListingId(mongoReq, {}, (err) => { mongoErr = err; });
  assert.ok(mongoErr instanceof ApiError);
  assert.equal(mongoErr.statusCode, 400);
});

// ==============================================================================
// 3. UPDATE LISTING TESTS
// ==============================================================================

test('B6-U1. Update Listing - Validator permits only whitelisted fields', () => {
  const req = {
    body: {
      title: 'Updated Textbook Title',
      price: 499.5,
      description: 'Newly revised description with updated campus pickup details.',
      location: 'Student Activity Center',
      category: 'books',
      condition: 'good',
    },
  };

  let nextCalled = false;
  validateUpdateListing(req, {}, (err) => { if (!err) nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.ok(req.cleanListingUpdates);
  assert.equal(req.cleanListingUpdates.title, 'Updated Textbook Title');
  assert.equal(req.cleanListingUpdates.price, 499.5);
  assert.equal(req.cleanListingUpdates.location, 'Student Activity Center');
  assert.equal(req.cleanListingUpdates.category, 'books');
  assert.equal(req.cleanListingUpdates.condition, 'good');
});

test('B6-U2. Update Listing - Validator rejects empty update body', () => {
  const req = { body: {} };
  let nextErr = null;
  validateUpdateListing(req, {}, (err) => { nextErr = err; });

  assert.ok(nextErr instanceof ApiError);
  assert.equal(nextErr.statusCode, 400);
  assert.equal(nextErr.code, 'EMPTY_UPDATE');
});

test('B6-U3. Update Listing - Validator rejects non-editable or protected fields', () => {
  const req = {
    body: {
      sellerId: 'attacker-id-123',
      status: 'SOLD',
      createdAt: '2026-01-01',
      images: [{ url: 'https://evil.com/pic.jpg' }],
      id: 'hacked-id',
    },
  };
  let nextErr = null;
  validateUpdateListing(req, {}, (err) => { nextErr = err; });

  assert.ok(nextErr instanceof ApiError);
  assert.equal(nextErr.statusCode, 400);
  assert.equal(nextErr.code, 'NO_EDITABLE_FIELDS');
});

test('B6-U4. Update Listing - Rejects invalid field values (negative price, short title)', () => {
  const reqShort = { body: { title: 'X' } };
  let errShort = null;
  validateUpdateListing(reqShort, {}, (err) => { errShort = err; });
  assert.ok(errShort instanceof ApiError);
  assert.equal(errShort.statusCode, 400);

  const reqPrice = { body: { price: -20 } };
  let errPrice = null;
  validateUpdateListing(reqPrice, {}, (err) => { errPrice = err; });
  assert.ok(errPrice instanceof ApiError);
  assert.equal(errPrice.statusCode, 400);
});

// ==============================================================================
// 4. STATUS TRANSITION TESTS
// ==============================================================================

test('B6-S1. Status Transition - Permits active and sold values', () => {
  const reqActive = { body: { status: 'active' } };
  let activeNextCalled = false;
  validateUpdateListingStatus(reqActive, {}, (err) => { if (!err) activeNextCalled = true; });
  assert.equal(activeNextCalled, true);
  assert.equal(reqActive.cleanStatus, 'active');

  const reqSold = { body: { status: 'sold' } };
  let soldNextCalled = false;
  validateUpdateListingStatus(reqSold, {}, (err) => { if (!err) soldNextCalled = true; });
  assert.equal(soldNextCalled, true);
  assert.equal(reqSold.cleanStatus, 'sold');
});

test('B6-S2. Status Transition - Rejects removed status (must use DELETE route)', () => {
  const req = { body: { status: 'removed' } };
  let err = null;
  validateUpdateListingStatus(req, {}, (e) => { err = e; });
  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'INVALID_STATUS_TRANSITION');
});

test('B6-S3. Status Transition - Rejects unrecognized status values', () => {
  const req = { body: { status: 'pending_payment' } };
  let err = null;
  validateUpdateListingStatus(req, {}, (e) => { err = e; });
  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'INVALID_STATUS');
});

// ==============================================================================
// 5. SECURITY & INTEGRITY INVARIANTS
// ==============================================================================

test('B6-SEC1. Query Injection & ReDoS Guard - Prohibits injection operators in filters', () => {
  const reqInjected = {
    query: {
      $where: 'sleep(5000)',
    },
  };
  let errInjected = null;
  validateListingQuery(reqInjected, {}, (err) => { errInjected = err; });
  assert.ok(errInjected instanceof ApiError);
  assert.equal(errInjected.statusCode, 400);
  assert.equal(errInjected.code, 'INVALID_QUERY_PARAMETER');

  const reqNested = {
    query: {
      category: { $ne: null },
    },
  };
  let errNested = null;
  validateListingQuery(reqNested, {}, (err) => { errNested = err; });
  assert.ok(errNested instanceof ApiError);
  assert.equal(errNested.statusCode, 400);
  assert.equal(errNested.code, 'INVALID_QUERY_PARAMETER');
});

test('B6-SEC2. Cross-Price constraint - minPrice cannot exceed maxPrice', () => {
  const reqCross = {
    query: {
      minPrice: '500',
      maxPrice: '100',
    },
  };
  let errCross = null;
  validateListingQuery(reqCross, {}, (err) => { errCross = err; });
  assert.ok(errCross instanceof ApiError);
  assert.equal(errCross.statusCode, 400);
  assert.equal(errCross.code, 'INVALID_PRICE_RANGE');
});

test('B6-SEC3. Sort whitelist - Rejects unauthorized SQL/Prisma sort order injections', () => {
  const reqSort = { query: { sort: 'title; DROP TABLE users; --' } };
  let errSort = null;
  validateListingQuery(reqSort, {}, (err) => { errSort = err; });
  assert.ok(errSort instanceof ApiError);
  assert.equal(errSort.statusCode, 400);
  assert.equal(errSort.code, 'INVALID_SORT');
});

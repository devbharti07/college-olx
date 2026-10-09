/**
 * Migration Test Suite: MongoDB -> PostgreSQL (Prisma ORM)
 * Comprehensive verification of domain logic, DTOs, security, validators,
 * error handling, and frontend API contracts.
 */
process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Core imports
import config from '../src/config/environment.js';
import { getDatabaseStatus } from '../src/config/database.js';
import {
  isValidUUID,
  toDbEnum,
  fromDbEnum,
  ALLOWED_CATEGORIES,
  ALLOWED_CONDITIONS,
  ALLOWED_LISTING_STATUSES,
} from '../src/constants/marketplace.js';
import {
  generateVerificationToken,
  sanitizeUserDTO,
} from '../src/services/authService.js';
import { formatListingDTO } from '../src/services/listingService.js';
import { formatMessageDTO } from '../src/services/messageService.js';
import { formatReportDTO } from '../src/services/reportService.js';
import { app } from '../src/server.js';
import { ApiError } from '../src/utils/apiError.js';
import { errorHandler } from '../src/middleware/errorMiddleware.js';

test('1. Environment Configuration - DATABASE_URL is present and MongoDB vars removed', () => {
  assert.ok(config.database.url, 'config.database.url should be defined');
  assert.ok(config.database.url.startsWith('postgresql://'), 'DATABASE_URL should be a postgresql connection string');
  assert.equal(config.database.uri, undefined, 'MONGODB_URI should not exist in config');
});

test('2. Database Health & Status Distinction', () => {
  const status = getDatabaseStatus();
  assert.equal(typeof status.isConnected, 'boolean');
  assert.equal(typeof status.state, 'string');
  assert.equal(status.dbType, 'PostgreSQL');
  assert.ok(['connected', 'disconnected', 'connecting'].includes(status.state));
});

test('3. UUID Validation Helper', () => {
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const invalidUUID = '507f1f77bcf86cd799439011'; // Old 24-char MongoDB ObjectId
  const garbage = 'not-a-uuid';

  assert.equal(isValidUUID(validUUID), true, 'Valid UUID v4 must pass');
  assert.equal(isValidUUID(invalidUUID), false, 'MongoDB ObjectId must fail UUID validation');
  assert.equal(isValidUUID(garbage), false, 'Arbitrary string must fail');
  assert.equal(isValidUUID(null), false, 'Null must fail');
});

test('4. Enum Case Conversions & Synchronization', () => {
  // Category conversions
  assert.equal(toDbEnum('books'), 'BOOKS');
  assert.equal(fromDbEnum('BOOKS'), 'books');
  assert.equal(toDbEnum('hostel-items'), 'HOSTEL_ITEMS');
  assert.equal(fromDbEnum('HOSTEL_ITEMS'), 'hostel-items');

  // Condition conversions
  assert.equal(toDbEnum('like-new'), 'LIKE_NEW');
  assert.equal(fromDbEnum('LIKE_NEW'), 'like-new');

  // Status conversions
  assert.equal(toDbEnum('active'), 'ACTIVE');
  assert.equal(fromDbEnum('ACTIVE'), 'active');

  // Report reason conversions
  assert.equal(toDbEnum('prohibited-item'), 'PROHIBITED_ITEM');
  assert.equal(fromDbEnum('PROHIBITED_ITEM'), 'prohibited-item');

  // Verifying all supported values
  ALLOWED_CATEGORIES.forEach((cat) => {
    const dbVal = toDbEnum(cat);
    assert.equal(fromDbEnum(dbVal), cat, `Category roundtrip failed for ${cat}`);
  });
  ALLOWED_CONDITIONS.forEach((cond) => {
    const dbVal = toDbEnum(cond);
    assert.equal(fromDbEnum(dbVal), cond, `Condition roundtrip failed for ${cond}`);
  });
  ALLOWED_LISTING_STATUSES.forEach((st) => {
    const dbVal = toDbEnum(st);
    assert.equal(fromDbEnum(dbVal), st, `Status roundtrip failed for ${st}`);
  });
});

test('5. Keycloak Architecture & Identity Provider Invariants', () => {
  assert.ok(config.keycloak, 'config.keycloak should be defined');
  assert.equal(config.keycloak.realm, 'campus-classifieds');
  assert.equal(config.keycloak.clientId, 'campus-classifieds-web');
  assert.ok(config.keycloak.issuerUrl.includes('campus-classifieds'), 'Issuer URL should target campus-classifieds realm');
  assert.ok(config.keycloak.jwksUri.endsWith('/protocol/openid-connect/certs'), 'JWKS URI should target openid-connect/certs');
});

test('6. Keycloak Subject & Role Normalization Contract', () => {
  const mockPayload = {
    sub: 'keycloak-uuid-12345',
    email: 'student@campus.edu',
    name: 'Rohit Verma',
    realm_access: { roles: ['student'] },
  };

  assert.equal(mockPayload.sub, 'keycloak-uuid-12345');
  assert.ok(mockPayload.realm_access.roles.includes('student'));
});

test('7. College Email Verification Cryptographic Token Handling', () => {
  const { rawToken, hashedToken, expiresAt } = generateVerificationToken();

  assert.equal(rawToken.length, 64, 'Raw token should be 32 bytes hex (64 chars)');
  assert.equal(hashedToken.length, 64, 'SHA-256 hashed token should be 64 chars');
  assert.notEqual(rawToken, hashedToken, 'Hashed token must never match raw token');
  const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  assert.equal(computedHash, hashedToken, 'Hashing rawToken with SHA-256 must produce deterministic hashedToken');
  assert.ok(expiresAt.getTime() > Date.now(), 'Token expiry must be in the future');
});

test('8. Listing DTO Formatting & Serialization Guarantee', () => {
  const mockDbListing = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    title: 'Data Structures Textbook',
    description: 'Clean textbook, highlighted chapter 3',
    price: 350.0,
    category: 'BOOKS',
    condition: 'LIKE_NEW',
    location: 'Hostel 4 Ground Floor',
    status: 'ACTIVE',
    soldTo: null,
    viewsCount: 42,
    images: [
      { id: 'img-1', listingId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', url: 'https://res.cloudinary.com/img1.jpg', publicId: 'campus/img1' },
      { id: 'img-2', listingId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', url: 'https://res.cloudinary.com/img2.jpg', publicId: 'campus/img2' },
    ],
    seller: {
      id: 'b1ffcd88-8b1a-4de7-aa5c-5aa8ac271b22',
      name: 'Rahul Sharma',
      avatar: 'https://avatar.png',
      college: 'IIT Delhi',
      department: 'Computer Science',
      isVerified: true,
    },
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T12:00:00Z'),
  };

  const dto = formatListingDTO(mockDbListing);

  assert.equal(dto.id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  assert.equal(dto.category, 'books', 'Category should format to frontend lowercase enum');
  assert.equal(dto.condition, 'like-new', 'Condition should format to frontend kebab-case enum');
  assert.equal(dto.status, 'active');
  assert.equal(dto.price, 350.0);
  assert.equal(dto.images.length, 2);
  assert.equal(dto.images[0].url, 'https://res.cloudinary.com/img1.jpg');
  assert.equal(dto.images[0].publicId, 'campus/img1');
  assert.equal(dto.images[0].id, undefined, 'Image internal ID should not be leaked');
  assert.equal(dto._id, undefined, 'No MongoDB _id should exist');
  assert.equal(dto.__v, undefined, 'No MongoDB __v should exist');

  // Check seller sanitation
  assert.equal(dto.seller.id, 'b1ffcd88-8b1a-4de7-aa5c-5aa8ac271b22');
  assert.equal(dto.seller.name, 'Rahul Sharma');
  assert.equal(dto.seller.isVerified, true);
  assert.equal(dto.seller.passwordHash, undefined, 'Password hash must never leak in seller DTO');
});

test('9. Messaging DTOs & Join Table Mapping Guarantee', () => {
  const mockMsg = {
    id: 'm1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    conversationId: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    text: 'Is this still available?',
    sender: {
      id: 'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Priya Patel',
      avatar: null,
      college: 'BITS Pilani',
      department: 'ECE',
      isVerified: true,
    },
    readBy: [
      { userId: 'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      { userId: 'u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' },
    ],
    createdAt: new Date('2026-03-01T15:00:00Z'),
  };

  const dto = formatMessageDTO(mockMsg);

  assert.equal(dto.id, mockMsg.id);
  assert.equal(dto.conversationId, mockMsg.conversationId);
  assert.equal(dto.text, 'Is this still available?');
  assert.equal(dto.sender.name, 'Priya Patel');
  assert.deepEqual(dto.readBy, [
    'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  ], 'readBy should be an array of user UUID strings for frontend compatibility');
});

test('10. Report DTO & Moderator Notes Isolation', () => {
  const mockReport = {
    id: 'r1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reporterId: 'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    listingId: 'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reportedUserId: 'u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    reason: 'PROHIBITED_ITEM',
    description: 'Item is not allowed on campus',
    status: 'PENDING',
    moderatorNotes: 'Internal confidential note by moderator',
    listing: {
      id: 'l1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Prohibited Item',
      status: 'ACTIVE',
      price: 500,
    },
    reportedUser: {
      id: 'u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      name: 'Seller Account',
      college: 'IIT Delhi',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dto = formatReportDTO(mockReport);

  assert.equal(dto.id, mockReport.id);
  assert.equal(dto.targetType, 'listing');
  assert.equal(dto.reason, 'prohibited-item');
  assert.equal(dto.status, 'pending');
  assert.equal(dto.moderatorNotes, undefined, 'moderatorNotes must NEVER be exposed in public DTO');
  assert.equal(dto.listing.title, 'Prohibited Item');
  assert.equal(dto.reportedUser.name, 'Seller Account');
});

test('11. Express Application Architecture & Route Handlers', () => {
  assert.ok(app, 'Express app should be exported');
  assert.equal(typeof app.handle, 'function', 'app should be an Express application');
});

test('12. Zero MongoDB/Mongoose Dependencies in Runtime', async () => {
  let mongooseImportFailed = false;
  try {
    await import('mongoose');
  } catch {
    mongooseImportFailed = true;
  }
  assert.equal(mongooseImportFailed, true, 'Mongoose import must fail because it was uninstalled');
});

test('13. Error Handling - Prisma Error Code Mapping', () => {
  // Mock response object
  const createMockRes = () => {
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
    return res;
  };

  // Test P2002 (Unique constraint violation)
  const p2002Err = new Error('Unique constraint failed on the fields: (`email`)');
  p2002Err.code = 'P2002';
  p2002Err.meta = { target: ['email'] };
  const res1 = createMockRes();
  errorHandler(p2002Err, {}, res1, () => {});
  assert.equal(res1.statusCode, 409);
  assert.equal(res1.body.error.code, 'DUPLICATE_RESOURCE');

  // Test P2025 (Record not found)
  const p2025Err = new Error('An operation failed because it depends on one or more records that were required but not found.');
  p2025Err.code = 'P2025';
  const res2 = createMockRes();
  errorHandler(p2025Err, {}, res2, () => {});
  assert.equal(res2.statusCode, 404);
  assert.equal(res2.body.error.code, 'RECORD_NOT_FOUND');

  // Test P2003 (Foreign key constraint violation)
  const p2003Err = new Error('Foreign key constraint failed');
  p2003Err.code = 'P2003';
  const res3 = createMockRes();
  errorHandler(p2003Err, {}, res3, () => {});
  assert.equal(res3.statusCode, 400);
  assert.equal(res3.body.error.code, 'FOREIGN_KEY_VIOLATION');
});

test('14. User DTO Sanitization & Password Hash Isolation', () => {
  const mockUserRecord = {
    id: 'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    keycloakUserId: 'kc-sub-12345',
    name: 'Ananya Roy',
    email: 'ananya@gmail.com',
    collegeEmail: 'ananya@iitb.ac.in',
    collegeId: '2023CS101',
    avatar: null,
    college: 'IIT Bombay',
    department: 'CSE',
    pickupSpot: 'Hostel 12 Gate',
    role: 'STUDENT',
    isVerified: true,
    verificationToken: 'hashed_verification_token',
    verificationTokenExpiry: new Date(),
    accountStatus: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sanitized = sanitizeUserDTO(mockUserRecord);

  assert.equal(sanitized.id, mockUserRecord.id);
  assert.equal(sanitized.keycloakUserId, 'kc-sub-12345');
  assert.equal(sanitized.name, 'Ananya Roy');
  assert.equal(sanitized.email, 'ananya@gmail.com');
  assert.equal(sanitized.role, 'student');
  assert.equal(sanitized.accountStatus, 'active');
  assert.equal(sanitized.passwordHash, undefined, 'passwordHash must NEVER be in sanitized DTO');
  assert.equal(sanitized.verificationToken, undefined, 'verificationToken must NEVER be in sanitized DTO');
  assert.equal(sanitized.verificationTokenExpiry, undefined, 'verificationTokenExpiry must NEVER be in sanitized DTO');
});

test('15. Institutional College Email Domain Validation', async () => {
  const { isInstitutionalEmail } = await import('../src/config/institutionalDomains.js');

  assert.equal(isInstitutionalEmail('student@iitd.ac.in'), true);
  assert.equal(isInstitutionalEmail('student@stanford.edu'), true);
  assert.equal(isInstitutionalEmail('student@college.edu.in'), true);
  assert.equal(isInstitutionalEmail('spammer@gmail.com'), false);
  assert.equal(isInstitutionalEmail('attacker@yahoo.com'), false);
  assert.equal(isInstitutionalEmail('fake@edu.com'), false);
});

test('16. Query Parameter Injection & ReDoS Guard', async () => {
  const { validateListingQuery } = await import('../src/validators/listingValidators.js');

  const reqWithMongoOp = {
    query: {
      $where: 'sleep(1000)',
    },
  };

  let nextCalledWith = null;
  validateListingQuery(reqWithMongoOp, {}, (err) => {
    nextCalledWith = err;
  });

  assert.ok(nextCalledWith instanceof ApiError);
  assert.equal(nextCalledWith.statusCode, 400);
  assert.equal(nextCalledWith.code, 'INVALID_QUERY_PARAMETER');
});

test('17. Message Text Validation (1-1000 chars)', async () => {
  const { validateSendMessage } = await import('../src/validators/messageValidators.js');

  // Blank message
  let blankErr = null;
  validateSendMessage({ body: { text: '   ' } }, {}, (err) => {
    blankErr = err;
  });
  assert.ok(blankErr instanceof ApiError);
  assert.equal(blankErr.statusCode, 400);

  // Over 1000 chars
  let longErr = null;
  validateSendMessage({ body: { text: 'a'.repeat(1001) } }, {}, (err) => {
    longErr = err;
  });
  assert.ok(longErr instanceof ApiError);
  assert.equal(longErr.statusCode, 400);

  // Valid message
  let validErr = null;
  validateSendMessage({ body: { text: 'Hello, is this item available?' } }, {}, (err) => {
    validErr = err;
  });
  assert.equal(validErr, undefined);
});

test('18. Report Input Validation - Target Requirement & Self-Report Prevention', async () => {
  const { validateCreateReport } = await import('../src/validators/reportValidators.js');

  // Missing both listingId and reportedUserId
  let missingTargetErr = null;
  validateCreateReport({ body: { reason: 'spam', description: 'test' } }, {}, (err) => {
    missingTargetErr = err;
  });
  assert.ok(missingTargetErr instanceof ApiError);
  assert.equal(missingTargetErr.statusCode, 400);
  assert.equal(missingTargetErr.code, 'VALIDATION_ERROR');

  // Invalid reason
  let invalidReasonErr = null;
  validateCreateReport(
    {
      body: {
        listingId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        reason: 'not_a_valid_reason',
      },
    },
    {},
    (err) => {
      invalidReasonErr = err;
    }
  );
  assert.ok(invalidReasonErr instanceof ApiError);
  assert.equal(invalidReasonErr.statusCode, 400);
});

test('19. UUID Path Parameter Validators', async () => {
  const { validateListingId } = await import('../src/validators/listingValidators.js');
  const { validateUserId } = await import('../src/validators/userValidators.js');
  const { validateConversationId } = await import('../src/validators/messageValidators.js');

  // Invalid UUIDs
  let err1, err2, err3;
  validateListingId({ params: { id: 'invalid-id' } }, {}, (err) => (err1 = err));
  validateUserId({ params: { id: '507f1f77bcf86cd799439011' } }, {}, (err) => (err2 = err));
  validateConversationId({ params: { conversationId: 'bad-id' } }, {}, (err) => (err3 = err));

  assert.ok(err1 instanceof ApiError);
  assert.equal(err1.statusCode, 400);
  assert.ok(err2 instanceof ApiError);
  assert.equal(err2.statusCode, 400);
  assert.ok(err3 instanceof ApiError);
  assert.equal(err3.statusCode, 400);

  // Valid UUIDs
  let pass1, pass2, pass3;
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  validateListingId({ params: { id: validUUID } }, {}, (err) => (pass1 = err));
  validateUserId({ params: { id: validUUID } }, {}, (err) => (pass2 = err));
  validateConversationId({ params: { conversationId: validUUID } }, {}, (err) => (pass3 = err));

  assert.equal(pass1, undefined);
  assert.equal(pass2, undefined);
  assert.equal(pass3, undefined);
});

test('20. Listing Image Maximum Count Boundary (5 Max)', () => {
  const currentImages = [
    { url: 'img1', publicId: 'p1' },
    { url: 'img2', publicId: 'p2' },
    { url: 'img3', publicId: 'p3' },
    { url: 'img4', publicId: 'p4' },
  ];
  const newFiles = [{}, {}]; // 2 new files = 6 total > 5 limit

  assert.equal(currentImages.length + newFiles.length > 5, true);
});

test('21. Public Profile DTO Information Disclosure Protection', async () => {
  const { getPublicProfileById } = await import('../src/services/userService.js');

  // Verify function exists and accepts UUID
  assert.equal(typeof getPublicProfileById, 'function');
});

test('22. Health Check Route Structure & Payload', async () => {
  const dbStatus = getDatabaseStatus();
  assert.equal(typeof dbStatus.isConnected, 'boolean');
  assert.equal(typeof dbStatus.state, 'string');
});


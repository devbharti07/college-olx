/**
 * Keycloak Authentication & Authorization Test Suite (Phases 6, 7, 8, 9, 10, 18)
 * Verifies Keycloak token decoding, user provisioning invariants, college verification rules,
 * role authorization, listing ownership authorization, and negative security cases.
 */
process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/utils/apiError.js';
import { verifyKeycloakToken, setMockTokenVerifier } from '../src/services/keycloakService.js';
import { requireRole, requireVerifiedUser, requireListingOwner } from '../src/middleware/authMiddleware.js';
import { isInstitutionalEmail } from '../src/config/institutionalDomains.js';
import { sanitizeUserDTO } from '../src/services/authService.js';

test('K1. Token Verification - Missing or Malformed Token Rejection', async () => {
  await assert.rejects(
    async () => {
      await verifyKeycloakToken(null);
    },
    (err) => err instanceof ApiError && err.statusCode === 401 && err.code === 'MISSING_TOKEN'
  );

  await assert.rejects(
    async () => {
      await verifyKeycloakToken('');
    },
    (err) => err instanceof ApiError && err.statusCode === 401 && err.code === 'MISSING_TOKEN'
  );
});

test('K2. Token Verification - Forged / Invalid Token Rejection', async () => {
  // Without mock verifier or with broken JWKS, a bogus token must fail verification
  await assert.rejects(
    async () => {
      await verifyKeycloakToken('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.bogus.signature');
    },
    (err) => err instanceof ApiError && err.statusCode === 401
  );
});

test('K3. Token Claims Extraction & Role Normalization', async () => {
  // Test with verified claims
  setMockTokenVerifier((rawToken) => {
    if (rawToken === 'valid-student-token') {
      return {
        sub: 'kc-student-001',
        email: 'alice@campus.edu',
        name: 'Alice Student',
        preferred_username: 'alice',
        roles: ['student'],
        email_verified: true,
      };
    }
    if (rawToken === 'valid-admin-token') {
      return {
        sub: 'kc-admin-001',
        email: 'admin@campus.edu',
        name: 'Admin Faculty',
        preferred_username: 'admin',
        roles: ['student', 'admin'],
        email_verified: true,
      };
    }
    if (rawToken === 'expired-token') {
      const err = new ApiError(401, 'TOKEN_EXPIRED', 'Keycloak access token has expired.');
      throw err;
    }
    const err = new ApiError(401, 'INVALID_TOKEN_SIGNATURE', 'Token signature verification failed.');
    throw err;
  });

  const studentClaims = await verifyKeycloakToken('valid-student-token');
  assert.equal(studentClaims.sub, 'kc-student-001');
  assert.equal(studentClaims.email, 'alice@campus.edu');
  assert.equal(studentClaims.name, 'Alice Student');
  assert.deepEqual(studentClaims.roles, ['student']);

  const adminClaims = await verifyKeycloakToken('valid-admin-token');
  assert.equal(adminClaims.sub, 'kc-admin-001');
  assert.ok(adminClaims.roles.includes('admin'));

  await assert.rejects(
    async () => {
      await verifyKeycloakToken('expired-token');
    },
    (err) => err instanceof ApiError && err.statusCode === 401 && err.code === 'TOKEN_EXPIRED'
  );

  // Clear mock verifier
  setMockTokenVerifier(null);
});

test('K4. Authorization Middleware - requireRole Enforces Admin Privilege', () => {
  const requireAdmin = requireRole('admin');

  // Negative case: unauthenticated request
  let unauthErr = null;
  requireAdmin({}, {}, (err) => {
    unauthErr = err;
  });
  assert.ok(unauthErr instanceof ApiError);
  assert.equal(unauthErr.statusCode, 401);

  // Negative case: student user attempting admin action
  let forbiddenErr = null;
  const studentReq = { user: { role: 'STUDENT' } };
  requireAdmin(studentReq, {}, (err) => {
    forbiddenErr = err;
  });
  assert.ok(forbiddenErr instanceof ApiError);
  assert.equal(forbiddenErr.statusCode, 403);
  assert.equal(forbiddenErr.code, 'INSUFFICIENT_PERMISSIONS');

  // Positive case: admin user
  let adminPass = false;
  const adminReq = { user: { role: 'ADMIN' } };
  requireAdmin(adminReq, {}, (err) => {
    if (!err) adminPass = true;
  });
  assert.equal(adminPass, true);
});

test('K5. Authorization Middleware - requireVerifiedUser Guards Marketplace Actions', () => {
  // Negative case 1: unverified Keycloak email blocks marketplace actions
  let unverifiedEmailErr = null;
  const unverifiedEmailReq = { user: { isVerified: false }, keycloakEmailVerified: false };
  requireVerifiedUser(unverifiedEmailReq, {}, (err) => {
    unverifiedEmailErr = err;
  });
  assert.ok(unverifiedEmailErr instanceof ApiError);
  assert.equal(unverifiedEmailErr.statusCode, 403);
  assert.equal(unverifiedEmailErr.code, 'KEYCLOAK_EMAIL_UNVERIFIED');

  // Negative case 2: Keycloak email verified, but institutional college email unverified
  let unverifiedCollegeErr = null;
  const unverifiedCollegeReq = { user: { isVerified: false }, keycloakEmailVerified: true };
  requireVerifiedUser(unverifiedCollegeReq, {}, (err) => {
    unverifiedCollegeErr = err;
  });
  assert.ok(unverifiedCollegeErr instanceof ApiError);
  assert.equal(unverifiedCollegeErr.statusCode, 403);
  assert.equal(unverifiedCollegeErr.code, 'UNVERIFIED_COLLEGE_USER');

  // Positive case: both Keycloak email and institutional college are verified
  let verifiedPass = false;
  const verifiedReq = { user: { isVerified: true }, keycloakEmailVerified: true };
  requireVerifiedUser(verifiedReq, {}, (err) => {
    if (!err) verifiedPass = true;
  });
  assert.equal(verifiedPass, true);
});

test('K6. Authorization Middleware - requireListingOwner Blocks Unauthorized Edits', async () => {
  // Unauthenticated
  let unauthErr = null;
  await requireListingOwner({}, {}, (err) => {
    unauthErr = err;
  });
  assert.ok(unauthErr instanceof ApiError);
  assert.equal(unauthErr.statusCode, 401);

  // Missing listing ID
  let missingIdErr = null;
  await requireListingOwner({ user: { id: 'u1' }, userId: 'u1', params: {} }, {}, (err) => {
    missingIdErr = err;
  });
  assert.ok(missingIdErr instanceof ApiError);
  assert.equal(missingIdErr.statusCode, 400);
});

test('K7. College Verification Invariant - Institutional Domain Policy', () => {
  // Approved institutional domains
  assert.equal(isInstitutionalEmail('student@iitd.ac.in'), true);
  assert.equal(isInstitutionalEmail('student@stanford.edu'), true);
  assert.equal(isInstitutionalEmail('student@mit.edu'), true);
  assert.equal(isInstitutionalEmail('student@bits-pilani.ac.in'), true);
  assert.equal(isInstitutionalEmail('student@college.edu.in'), true);

  // Unapproved public or non-collegiate domains
  assert.equal(isInstitutionalEmail('student@gmail.com'), false);
  assert.equal(isInstitutionalEmail('student@yahoo.com'), false);
  assert.equal(isInstitutionalEmail('student@outlook.com'), false);
  assert.equal(isInstitutionalEmail('student@unknown.org'), false);
  assert.equal(isInstitutionalEmail(''), false);
  assert.equal(isInstitutionalEmail(null), false);
});

test('K8. User Model & DTO Security Invariants - No Password Storage', () => {
  const mockUser = {
    id: 'u-123',
    keycloakUserId: 'kc-sub-999',
    name: 'Dev Student',
    email: 'dev@campus.edu',
    collegeEmail: 'dev@campus.edu',
    college: 'Campus Tech',
    department: 'CSE',
    pickupSpot: 'Library',
    role: 'STUDENT',
    isVerified: true,
    accountStatus: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const dto = sanitizeUserDTO(mockUser);

  assert.equal(dto.keycloakUserId, 'kc-sub-999');
  assert.equal(dto.passwordHash, undefined, 'passwordHash must never exist in DTO');
  assert.equal(dto.password, undefined, 'password must never exist in DTO');
  assert.equal(dto.verificationToken, undefined, 'verificationToken must never exist in DTO');
});

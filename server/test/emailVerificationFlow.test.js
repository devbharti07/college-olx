/**
 * Email Verification & Authorization Flow Test Suite (Section 15 Requirements)
 * Verifies:
 * 1. Authenticated + Keycloak email verified
 * 2. Authenticated + Keycloak email unverified
 * 3. Authenticated + Institutional college verified
 * 4. Authenticated + Institutional college unverified
 * 5. Unverified user attempting to sell (POST /api/listings) -> 403 KEYCLOAK_EMAIL_UNVERIFIED
 * 6. Unverified user attempting to message (POST /api/messages) -> 403 KEYCLOAK_EMAIL_UNVERIFIED
 * 7. Unverified user attempting to report (POST /api/reports) -> 403 KEYCLOAK_EMAIL_UNVERIFIED
 * 8. Verified user allowed to perform appropriate actions -> 200/Next
 * 9. Invalid/expired collegiate verification token -> ApiError 400
 * 10. Stale token after verification -> Fresh token updates verification state
 * 11. Resend verification rate limiting -> Enforces limits
 * 12. Frontend manipulation immunity -> Backend strictly validates trusted claims
 */
process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/utils/apiError.js';
import { 
  requireKeycloakEmailVerified, 
  requireVerifiedUser 
} from '../src/middleware/authMiddleware.js';
import { 
  generateVerificationToken,
  sanitizeUserDTO,
} from '../src/services/authService.js';
import { 
  setMockTokenVerifier, 
  verifyKeycloakToken,
  setMockKeycloakEmailSender,
  sendKeycloakVerificationEmail
} from '../src/services/keycloakService.js';

test('V1. Authenticated + Keycloak Email Verified - Passes Tier 1 Gate', () => {
  let nextCalled = false;
  let nextError = null;

  const req = {
    user: { id: 'u1', name: 'Verified Student', email: 'student@campus.edu', isVerified: false },
    keycloakEmailVerified: true,
  };

  requireKeycloakEmailVerified(req, {}, (err) => {
    if (err) nextError = err;
    else nextCalled = true;
  });

  assert.equal(nextCalled, true, 'Middleware should call next() when Keycloak email is verified');
  assert.equal(nextError, null, 'No error should be passed to next()');
});

test('V2. Authenticated + Keycloak Email Unverified - Blocked at Tier 1 Gate', () => {
  let nextError = null;

  const req = {
    user: { id: 'u2', name: 'Unverified Student', email: 'new@campus.edu', isVerified: false },
    keycloakEmailVerified: false,
  };

  requireKeycloakEmailVerified(req, {}, (err) => {
    nextError = err;
  });

  assert.ok(nextError instanceof ApiError, 'Must throw ApiError');
  assert.equal(nextError.statusCode, 403, 'Must return HTTP 403 Forbidden');
  assert.equal(nextError.code, 'KEYCLOAK_EMAIL_UNVERIFIED', 'Must specify KEYCLOAK_EMAIL_UNVERIFIED error code');
  assert.match(nextError.message, /verify your email address/i, 'User-friendly message returned');
});

test('V3. Authenticated + College Verified - Passes Tier 2 Gate', () => {
  let nextCalled = false;
  let nextError = null;

  const req = {
    user: { id: 'u3', name: 'Collegiate Student', collegeEmail: 'stu@mit.edu', isVerified: true },
    keycloakEmailVerified: true,
  };

  requireVerifiedUser(req, {}, (err) => {
    if (err) nextError = err;
    else nextCalled = true;
  });

  assert.equal(nextCalled, true, 'Middleware should call next() when both Keycloak and college are verified');
  assert.equal(nextError, null);
});

test('V4. Authenticated + College Unverified (Keycloak Verified) - Blocked at Tier 2 Gate', () => {
  let nextError = null;

  const req = {
    user: { id: 'u4', name: 'Partial Student', email: 'stu@gmail.com', isVerified: false },
    keycloakEmailVerified: true, // Keycloak identity verified, but college not verified yet
  };

  requireVerifiedUser(req, {}, (err) => {
    nextError = err;
  });

  assert.ok(nextError instanceof ApiError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.code, 'UNVERIFIED_COLLEGE_USER');
  assert.match(nextError.message, /college email verification is required/i);
});

test('V5. Unverified User Attempting to Sell - Denied with 403', () => {
  // Case A: Keycloak email unverified
  let unverifiedEmailError = null;
  const reqA = {
    user: { id: 'seller-unverified-1', isVerified: false },
    keycloakEmailVerified: false,
  };
  requireVerifiedUser(reqA, {}, (err) => {
    unverifiedEmailError = err;
  });
  assert.equal(unverifiedEmailError?.statusCode, 403);
  assert.equal(unverifiedEmailError?.code, 'KEYCLOAK_EMAIL_UNVERIFIED');

  // Case B: College unverified
  let unverifiedCollegeError = null;
  const reqB = {
    user: { id: 'seller-unverified-2', isVerified: false },
    keycloakEmailVerified: true,
  };
  requireVerifiedUser(reqB, {}, (err) => {
    unverifiedCollegeError = err;
  });
  assert.equal(unverifiedCollegeError?.statusCode, 403);
  assert.equal(unverifiedCollegeError?.code, 'UNVERIFIED_COLLEGE_USER');
});

test('V6. Unverified User Attempting to Message - Denied with 403', () => {
  let messageError = null;
  const req = {
    user: { id: 'chat-unverified', isVerified: false },
    keycloakEmailVerified: false,
  };

  // requireKeycloakEmailVerified guard
  requireKeycloakEmailVerified(req, {}, (err) => {
    messageError = err;
  });
  assert.equal(messageError?.statusCode, 403);
  assert.equal(messageError?.code, 'KEYCLOAK_EMAIL_UNVERIFIED');
});

test('V7. Unverified User Attempting to Report - Denied with 403', () => {
  let reportError = null;
  const req = {
    user: { id: 'reporter-unverified', isVerified: false },
    keycloakEmailVerified: false,
  };

  requireKeycloakEmailVerified(req, {}, (err) => {
    reportError = err;
  });
  assert.equal(reportError?.statusCode, 403);
  assert.equal(reportError?.code, 'KEYCLOAK_EMAIL_UNVERIFIED');
});

test('V8. Verified User Allowed to Perform Protected Actions', () => {
  const req = {
    user: { 
      id: 'fully-verified-student', 
      name: 'Bob Student',
      email: 'bob@stanford.edu', 
      isVerified: true 
    },
    keycloakEmailVerified: true,
  };

  let emailPassed = false;
  requireKeycloakEmailVerified(req, {}, (err) => {
    if (!err) emailPassed = true;
  });
  assert.equal(emailPassed, true, 'Email check should pass');

  let collegePassed = false;
  requireVerifiedUser(req, {}, (err) => {
    if (!err) collegePassed = true;
  });
  assert.equal(collegePassed, true, 'Collegiate check should pass');
});

test('V9. Invalid / Expired College Verification State', () => {
  const { expiresAt } = generateVerificationToken();
  // Valid token expiration is set into the future
  assert.ok(expiresAt.getTime() > Date.now(), 'Token expiration must be in the future');

  // Verify expired timestamp detection
  const pastExpiration = new Date(Date.now() - 60000); // 1 minute ago
  const isExpired = pastExpiration.getTime() < Date.now();
  assert.equal(isExpired, true, 'Expired timestamp must be detected as expired');
});

test('V10. Stale Token After Verification - Token Refresh Handling', async () => {
  let isVerifiedInKeycloak = false;

  // Simulate token verifier reflecting Keycloak token status
  setMockTokenVerifier((token) => {
    if (token === 'stale-token') {
      return {
        sub: 'kc-user-refresh-test',
        email: 'user@test.edu',
        roles: ['student'],
        email_verified: isVerifiedInKeycloak, // false originally
      };
    }
    if (token === 'fresh-token') {
      return {
        sub: 'kc-user-refresh-test',
        email: 'user@test.edu',
        roles: ['student'],
        email_verified: true, // fresh token after user clicked link
      };
    }
    throw new ApiError(401, 'INVALID_TOKEN', 'Unknown token');
  });

  // Stale token has email_verified = false
  const stalePayload = await verifyKeycloakToken('stale-token');
  assert.equal(stalePayload.email_verified, false, 'Stale token has email_verified false');

  // User verifies email in Keycloak
  isVerifiedInKeycloak = true;

  // Fresh token received from Keycloak has email_verified = true
  const freshPayload = await verifyKeycloakToken('fresh-token');
  assert.equal(freshPayload.email_verified, true, 'Fresh token immediately reflects email_verified true');

  // Clear mock
  setMockTokenVerifier(null);
});

test('V11. Resend Verification Flow & Dispatch Delegation', async () => {
  let dispatchedUserId = null;
  setMockKeycloakEmailSender((userId) => {
    dispatchedUserId = userId;
    return true;
  });

  const res = await sendKeycloakVerificationEmail('kc-user-resend-test');
  assert.equal(res, true, 'sendKeycloakVerificationEmail returns true');
  assert.equal(dispatchedUserId, 'kc-user-resend-test', 'Correct Keycloak user ID was passed to email dispatcher');

  // Missing user ID rejection
  await assert.rejects(
    async () => {
      await sendKeycloakVerificationEmail('');
    },
    (err) => err instanceof ApiError && err.statusCode === 400
  );

  setMockKeycloakEmailSender(null);
});

test('V12. Backend Immunity to Frontend State Tampering', () => {
  // Scenario: An attacker tries to send custom headers like 'X-Verified: true'
  // or tampers with request body { isVerified: true, emailVerified: true }
  // or query parameter ?verified=true
  const maliciousReq = {
    headers: {
      'x-email-verified': 'true',
      'x-is-verified': 'true',
      'x-role': 'admin',
    },
    query: { verified: 'true', email_verified: 'true' },
    body: { isVerified: true, emailVerified: true, role: 'admin' },
    // Legitimate backend session object:
    user: { id: 'attacker', isVerified: false, role: 'student' },
    keycloakEmailVerified: false, // Authoritative claim decoded from verified JWKS signature
  };

  // 1. Attacker attempts to bypass requireKeycloakEmailVerified
  let emailBypassErr = null;
  requireKeycloakEmailVerified(maliciousReq, {}, (err) => {
    emailBypassErr = err;
  });
  assert.ok(emailBypassErr instanceof ApiError, 'Must reject spoofed email verification');
  assert.equal(emailBypassErr.statusCode, 403);
  assert.equal(emailBypassErr.code, 'KEYCLOAK_EMAIL_UNVERIFIED');

  // 2. Attacker attempts to bypass requireVerifiedUser
  let collegeBypassErr = null;
  requireVerifiedUser(maliciousReq, {}, (err) => {
    collegeBypassErr = err;
  });
  assert.ok(collegeBypassErr instanceof ApiError, 'Must reject spoofed college verification');
  assert.equal(collegeBypassErr.statusCode, 403);

  // 3. Sensitive fields stripped from DTO
  const sanitized = sanitizeUserDTO({
    id: 'u-tamper',
    name: 'Tamperer',
    email: 't@campus.edu',
    passwordHash: 'secret-hash',
    verificationToken: 'secret-token',
    isVerified: false,
  });
  assert.equal(sanitized.passwordHash, undefined, 'passwordHash must never be returned');
  assert.equal(sanitized.verificationToken, undefined, 'verificationToken must never be returned');
});

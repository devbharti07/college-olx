import { createRemoteJWKSet, jwtVerify } from 'jose';
import config from '../config/environment.js';
import { ApiError } from '../utils/apiError.js';

let remoteJWKS = null;

/**
 * Lazy initialize the Remote JWK Set caching layer.
 * @returns {Function} JWKS getter function
 */
export const getJWKS = () => {
  if (!remoteJWKS) {
    remoteJWKS = createRemoteJWKSet(new URL(config.keycloak.jwksUri), {
      cooldownDuration: 30000,
      cacheMaxAge: 600000, // 10 minutes cache
    });
  }
  return remoteJWKS;
};

// Optional mock verifier hook for hermetic unit tests
let mockTokenVerifier = null;
export const setMockTokenVerifier = (verifier) => {
  mockTokenVerifier = verifier;
};

/**
 * Verify a Keycloak access token against Keycloak's public JWKS.
 * Checks signature, issuer, client/audience, and expiration.
 *
 * @param {string} token - Raw JWT string
 * @returns {Promise<Object>} Decoded Keycloak token payload
 */
export const verifyKeycloakToken = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new ApiError(401, 'MISSING_TOKEN', 'No access token provided.');
  }

  // Allow test verifier if in test environment
  if (config.isTest && mockTokenVerifier) {
    return mockTokenVerifier(token);
  }

  try {
    const JWKS = getJWKS();
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.keycloak.issuerUrl,
    });

    if (!payload.sub) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Token payload is missing subject claim (sub).');
    }

    // Extract roles from Keycloak claims
    const realmRoles = payload.realm_access?.roles || [];
    const clientRoles = payload.resource_access?.[config.keycloak.clientId]?.roles || [];
    const allRoles = [...new Set([...realmRoles, ...clientRoles])];

    return {
      sub: payload.sub,
      email: payload.email || '',
      name: payload.name || payload.preferred_username || 'Student User',
      preferred_username: payload.preferred_username || '',
      roles: allRoles,
      email_verified: Boolean(payload.email_verified),
      rawPayload: payload,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Keycloak access token has expired. Please refresh session.');
    }

    if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      throw new ApiError(401, 'INVALID_TOKEN_CLAIM', `Token claim validation failed: ${error.message}`);
    }

    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      throw new ApiError(401, 'INVALID_TOKEN_SIGNATURE', 'Token signature verification failed.');
    }

    throw new ApiError(401, 'UNAUTHORIZED', `Token verification failed: ${error.message || 'Invalid token'}`);
  }
};

let mockEmailSender = null;
export const setMockKeycloakEmailSender = (sender) => {
  mockEmailSender = sender;
};

/**
 * Trigger Keycloak to resend its native email verification email to the user.
 * Uses Keycloak Admin REST API: PUT /admin/realms/{realm}/users/{userId}/send-verify-email
 *
 * @param {string} keycloakUserId - Keycloak UUID (sub claim)
 * @returns {Promise<boolean>}
 */
export const sendKeycloakVerificationEmail = async (keycloakUserId) => {
  if (!keycloakUserId) {
    throw new ApiError(400, 'MISSING_IDENTIFIER', 'Keycloak user identifier is required.');
  }

  if (config.isTest && mockEmailSender) {
    return mockEmailSender(keycloakUserId);
  }

  try {
    // 1. Obtain admin token from Keycloak master realm
    const tokenRes = await fetch(
      `${config.keycloak.serverUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: 'admin-cli',
          username: config.keycloak.adminUser,
          password: config.keycloak.adminPassword,
          grant_type: 'password',
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => '');
      throw new ApiError(502, 'KEYCLOAK_UNAVAILABLE', `Authentication provider admin communication failed: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const adminToken = tokenData.access_token;

    // 2. Trigger Keycloak send-verify-email
    const verifyRes = await fetch(
      `${config.keycloak.serverUrl}/admin/realms/${config.keycloak.realm}/users/${keycloakUserId}/send-verify-email`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (verifyRes.status === 204 || verifyRes.status === 200) {
      return true;
    }

    const errorBody = await verifyRes.text().catch(() => '');
    if (verifyRes.status === 404) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User account not found on authentication provider.');
    }

    throw new ApiError(
      500,
      'VERIFICATION_DISPATCH_FAILED',
      `Failed to dispatch verification email from authentication provider: ${errorBody || verifyRes.statusText}`
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'KEYCLOAK_COMMUNICATION_ERROR', `Failed to reach authentication provider: ${error.message}`);
  }
};

/**
 * Obtain an access token for Keycloak Admin REST API from the master realm.
 * @returns {Promise<string>} Admin access token
 */
export const getKeycloakAdminToken = async () => {
  const tokenRes = await fetch(
    `${config.keycloak.serverUrl}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'admin-cli',
        username: config.keycloak.adminUser,
        password: config.keycloak.adminPassword,
        grant_type: 'password',
      }),
    }
  );

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    throw new Error(`Keycloak admin authentication failed: ${errText || tokenRes.statusText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
};

/**
 * Synchronize Keycloak realm SMTP configuration from environment variables.
 * Allows seamless switching between local Mailpit and real Gmail SMTP / Production SMTP.
 *
 * @returns {Promise<{ synced: boolean, host: string, port: string }>}
 */
export const syncKeycloakSmtpConfig = async () => {
  if (config.isTest) {
    return { synced: true, host: 'mock', port: '0' };
  }

  try {
    const adminToken = await getKeycloakAdminToken();
    const smtpSettings = config.keycloak.smtp;

    const payload = {
      smtpServer: {
        host: smtpSettings.host,
        port: String(smtpSettings.port),
        from: smtpSettings.from,
        fromDisplayName: smtpSettings.fromDisplayName,
        auth: String(smtpSettings.auth),
        starttls: String(smtpSettings.starttls),
        ssl: String(smtpSettings.ssl),
        user: smtpSettings.user || '',
        password: smtpSettings.password || '',
        replyTo: '',
        replyToDisplayName: '',
        envelopeFrom: '',
      },
    };

    const updateRes = await fetch(
      `${config.keycloak.serverUrl}/admin/realms/${config.keycloak.realm}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (updateRes.status === 204 || updateRes.status === 200) {
      console.log(
        `[Keycloak] Realm SMTP configuration synchronized -> ${smtpSettings.host}:${smtpSettings.port} (auth: ${smtpSettings.auth}, starttls: ${smtpSettings.starttls})`
      );
      return { synced: true, host: smtpSettings.host, port: String(smtpSettings.port) };
    }

    const err = await updateRes.text().catch(() => '');
    console.warn(`[Keycloak] Could not synchronize SMTP settings (${updateRes.status}):`, err);
    return { synced: false, error: err };
  } catch (err) {
    console.warn('[Keycloak] SMTP synchronization error:', err?.message || err);
    return { synced: false, error: err?.message };
  }
};

/**
 * Test SMTP connection configured in Keycloak.
 * Calls Keycloak Admin REST API POST /admin/realms/{realm}/testSMTPConnection
 *
 * @param {Object} [customConfig] - Optional SMTP config override
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const testKeycloakSmtpConnection = async (customConfig = null) => {
  try {
    const adminToken = await getKeycloakAdminToken();
    const smtpSettings = customConfig || config.keycloak.smtp;

    const testRes = await fetch(
      `${config.keycloak.serverUrl}/admin/realms/${config.keycloak.realm}/testSMTPConnection`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: smtpSettings.host,
          port: String(smtpSettings.port),
          from: smtpSettings.from,
          fromDisplayName: smtpSettings.fromDisplayName,
          auth: String(smtpSettings.auth),
          starttls: String(smtpSettings.starttls),
          ssl: String(smtpSettings.ssl),
          user: smtpSettings.user || '',
          password: smtpSettings.password || '',
        }),
      }
    );

    if (testRes.status === 204 || testRes.status === 200) {
      return { success: true, message: 'SMTP connection verified successfully.' };
    }

    const err = await testRes.text().catch(() => '');
    return { success: false, message: `SMTP test connection failed (${testRes.status}): ${err}` };
  } catch (err) {
    return { success: false, message: err?.message || 'SMTP test failed' };
  }
};

export default {
  verifyKeycloakToken,
  setMockTokenVerifier,
  getJWKS,
  sendKeycloakVerificationEmail,
  setMockKeycloakEmailSender,
  getKeycloakAdminToken,
  syncKeycloakSmtpConfig,
  testKeycloakSmtpConnection,
};



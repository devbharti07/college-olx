/**
 * ============================================================================
 * Authentication Service (Keycloak Identity + Backend API Layer)
 * ============================================================================
 * Coordinates with Keycloak Identity Provider for authentication (login,
 * registration, logout) and backend endpoints under /api/auth for application
 * profile rehydration (/me) and institutional college email verification.
 * ============================================================================
 */

import apiClient from './apiClient.js';
import { login as keycloakLogin, register as keycloakRegister, logout as keycloakLogout, getValidToken } from '../auth/keycloak.js';

export const authService = {
  /**
   * Redirect to Keycloak authentication flow.
   * @param {Object} options - { redirectUri, idpHint, etc. }
   */
  login: async (options = {}) => {
    return keycloakLogin(options);
  },

  /**
   * Redirect to Keycloak registration flow.
   * @param {Object} options - { redirectUri }
   */
  register: async (options = {}) => {
    return keycloakRegister(options);
  },

  /**
   * Rehydrate current authenticated user session from backend.
   * GET /api/auth/me
   * @returns {Promise<{ user: Object }>}
   */
  getMe: async () => {
    return apiClient.get('/auth/me');
  },

  /**
   * Log out of Keycloak session and notify backend.
   * POST /api/auth/logout + Keycloak logout
   */
  logout: async (options = {}) => {
    try {
      await apiClient.post('/auth/logout', {}).catch(() => {});
    } finally {
      await keycloakLogout(options);
    }
    return { success: true };
  },

  /**
   * Submit institutional college email for verification.
   * POST /api/auth/college-email
   * @param {string} collegeEmail
   */
  submitCollegeEmail: async (collegeEmail) => {
    return apiClient.post('/auth/college-email', { collegeEmail });
  },

  /**
   * Verify college email with cryptographic token.
   * POST /api/auth/verify-email
   * @param {string} token
   */
  verifyEmail: async (token) => {
    return apiClient.post('/auth/verify-email', { token });
  },

  /**
   * Resend institutional verification email to registered college address.
   * POST /api/auth/resend-verification
   */
  resendVerification: async () => {
    return apiClient.post('/auth/resend-verification', {});
  },

  /**
   * Check if user is currently authenticated with a valid token.
   * @returns {Promise<boolean>}
   */
  isAuthenticated: async () => {
    const token = await getValidToken();
    return Boolean(token);
  },

  getToken: getValidToken,
};

export default authService;

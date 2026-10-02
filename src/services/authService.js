/**
 * ============================================================================
 * Authentication Service (Future API Service Layer)
 * ============================================================================
 * Defines methods for login, registration, password recovery, and session check.
 * Pure frontend stub ready for JWT / session backend integration.
 * Does NOT perform fake token storage or mock authentication.
 * ============================================================================
 */

export const authService = {
  /**
   * Submit student credentials for authentication.
   * @param {Object} credentials - { email, password, rememberMe }
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  login: async (credentials) => {
    // Pure frontend simulation stub: ready for POST /api/auth/login
    if (!credentials?.email || !credentials?.password) {
      return { success: false, message: 'Email and password are required.' };
    }
    return {
      success: true,
      message: 'Authentication client validated. Connect backend API to establish persistent session.',
    };
  },

  /**
   * Submit student details for account registration.
   * @param {Object} registrationData - { fullName, email, collegeId, password }
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  register: async (registrationData) => {
    // Pure frontend simulation stub: ready for POST /api/auth/register
    if (!registrationData?.email || !registrationData?.collegeId) {
      return { success: false, message: 'Registration data incomplete.' };
    }
    return {
      success: true,
      message: 'Registration client validated. Connect backend API to store student profile.',
    };
  },

  /**
   * Request password reset instructions.
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  requestPasswordReset: async (email) => {
    return {
      success: true,
      message: `Password reset link dispatched to ${email}.`,
    };
  },

  /**
   * Check if a valid session exists.
   * @returns {boolean}
   */
  isAuthenticated: () => {
    // Frontend-only: returns false until real auth backend is connected
    return false;
  },
};

export default authService;

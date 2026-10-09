import { apiResponse } from '../utils/apiResponse.js';
import {
  getCurrentUser,
  submitCollegeEmail,
  verifyEmailToken,
  resendCollegeVerification,
} from '../services/authService.js';
import { sendKeycloakVerificationEmail } from '../services/keycloakService.js';

/**
 * Retrieve current authenticated student profile.
 * GET /api/auth/me
 *
 * Returns both Keycloak email_verified state (from the trusted JWT claim)
 * and college isVerified state (from PostgreSQL).
 */
export const getMe = async (req, res, next) => {
  try {
    const userProfile = await getCurrentUser(req.userId);

    // Attach the Keycloak email_verified claim from the verified JWT
    // This is authoritative — never trust a client-provided value
    const enrichedProfile = {
      ...userProfile,
      keycloakEmailVerified: Boolean(req.keycloakEmailVerified),
    };

    return res.status(200).json(
      apiResponse.success({
        user: enrichedProfile,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Submit or update collegiate email for institutional verification.
 * POST /api/auth/college-email
 */
export const setCollegeEmail = async (req, res, next) => {
  try {
    const result = await submitCollegeEmail(req.userId, req.body.collegeEmail);

    return res.status(200).json(
      apiResponse.success(
        {
          user: result.user,
          sent: result.sent,
        },
        { message: result.message }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify college email using single-use verification token.
 * GET /api/auth/verify-email?token=<TOKEN>
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.verificationToken || req.query.token || req.body.token;
    const verifiedUser = await verifyEmailToken(token);

    return res.status(200).json(
      apiResponse.success(
        {
          user: verifiedUser,
        },
        { message: 'Institutional college email verified successfully. Your student account is now verified.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification link.
 * POST /api/auth/resend-verification
 *
 * If req.body.type === 'keycloak' or (!req.keycloakEmailVerified):
 *   Dispatches Keycloak native verification email via Keycloak Admin API.
 * Otherwise:
 *   Dispatches institutional college verification link to collegeEmail.
 */
export const resendVerification = async (req, res, next) => {
  try {
    const requestedType = req.body?.type;

    // Route to Keycloak email verification if explicitly requested or if Keycloak email is unverified
    if (requestedType === 'keycloak' || (!requestedType && !req.keycloakEmailVerified)) {
      if (req.keycloakEmailVerified) {
        return res.status(200).json(
          apiResponse.success(
            { sent: false, alreadyVerified: true, type: 'keycloak' },
            { message: 'Your account email address is already verified.' }
          )
        );
      }

      await sendKeycloakVerificationEmail(req.user.keycloakUserId);

      return res.status(200).json(
        apiResponse.success(
          {
            sent: true,
            alreadyVerified: false,
            type: 'keycloak',
          },
          { message: 'Verification email dispatched. Please check your inbox and spam folder.' }
        )
      );
    }

    // Otherwise dispatch institutional college verification email
    const result = await resendCollegeVerification(req.userId);

    return res.status(200).json(
      apiResponse.success(
        {
          sent: result.sent,
          alreadyVerified: Boolean(result.alreadyVerified),
          type: 'college',
        },
        { message: result.message }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user logout by clearing auth cookie if present.
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('auth_token');

    return res.status(200).json(
      apiResponse.success(
        { message: 'Logged out successfully.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getMe,
  setCollegeEmail,
  verifyEmail,
  resendVerification,
  logout,
};

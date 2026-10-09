import express from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config/environment.js';
import {
  getMe,
  setCollegeEmail,
  verifyEmail,
  resendVerification,
  logout,
} from '../controllers/authController.js';
import {
  validateCollegeEmail,
  validateVerifyEmail,
} from '../validators/authValidators.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for verification email dispatch (5 attempts / hour)
export const verificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many verification email requests from this IP address. Please try again after an hour.',
      },
    });
  },
});

// ==============================================================================
// AUTHENTICATION & VERIFICATION ENDPOINTS (KEYCLOAK-BACKED)
// ==============================================================================

// GET /api/auth/me - Retrieve current authenticated profile from Keycloak session
router.get('/me', requireAuth, getMe);

// POST /api/auth/college-email - Submit or update institutional college email for verification
router.post(
  '/college-email',
  requireAuth,
  verificationRateLimiter,
  validateCollegeEmail,
  setCollegeEmail
);

// GET /api/auth/verify-email?token=<TOKEN> - Verify email via query token
router.get('/verify-email', validateVerifyEmail, verifyEmail);

// POST /api/auth/verify-email - Verify email via request body { token }
router.post('/verify-email', validateVerifyEmail, verifyEmail);

// POST /api/auth/resend-verification - Request fresh verification link
router.post(
  '/resend-verification',
  requireAuth,
  verificationRateLimiter,
  resendVerification
);

// POST /api/auth/logout - Invalidate student session (clears any cookie)
router.post('/logout', logout);

export default router;

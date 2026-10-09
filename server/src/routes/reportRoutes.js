import express from 'express';
import rateLimit from 'express-rate-limit';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { validateCreateReport, validateReportPagination } from '../validators/reportValidators.js';
import { requireAuth, requireKeycloakEmailVerified, requireVerifiedUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==============================================================================
// RATE LIMITING
// 10 report submissions per hour per user to prevent abuse and report flooding
// ==============================================================================
export const reportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Max 10 reports per hour per user/IP
  keyGenerator: (req) => req.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'REPORT_RATE_LIMIT_EXCEEDED',
        message: 'You have submitted too many reports recently. Please wait before submitting more.',
      },
    });
  },
});

// All report endpoints require authenticated and verified collegiate students
router.use(requireAuth, requireKeycloakEmailVerified, requireVerifiedUser);

// ==============================================================================
// REPORT ENDPOINTS
// ==============================================================================

// POST /api/reports - File an infraction report against a listing or student user
router.post('/', reportRateLimiter, validateCreateReport, createReport);

// GET /api/reports/mine - Retrieve reports filed by the authenticated student
router.get('/mine', validateReportPagination, getMyReports);

export default router;

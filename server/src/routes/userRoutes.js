import express from 'express';
import { getMe, updateMe, getPublicUser } from '../controllers/userController.js';
import { validateUserId, validateUpdateProfile } from '../validators/userValidators.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==============================================================================
// USER & PROFILE ROUTES
// ==============================================================================

// GET /api/users/me - Current authenticated student profile
router.get('/me', requireAuth, getMe);

// PATCH /api/users/me - Update allowed profile fields for current student
router.patch('/me', requireAuth, validateUpdateProfile, updateMe);

// GET /api/users/:id - Public seller profile (sanitized public DTO)
router.get('/:id', validateUserId, getPublicUser);

export default router;

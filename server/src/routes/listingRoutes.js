import express from 'express';
import {
  createListing,
  getListings,
  getListingById,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing,
  uploadListingImages,
  deleteListingImage,
} from '../controllers/listingController.js';
import {
  validateListingId,
  validateListingQuery,
  validateCreateListing,
  validateUpdateListing,
  validateUpdateListingStatus,
  validateDeleteImage,
} from '../validators/listingValidators.js';
import { requireAuth, requireKeycloakEmailVerified, requireVerifiedUser } from '../middleware/authMiddleware.js';
import { uploadListingImagesMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ==============================================================================
// PUBLIC BROWSE & RETRIEVAL
// ==============================================================================

// GET /api/listings - Base marketplace browse (active items, paginated)
router.get('/', validateListingQuery, getListings);

// ==============================================================================
// AUTHENTICATED USER LISTINGS
// IMPORTANT: /mine is registered BEFORE /:id to prevent route shadowing
// ==============================================================================

// GET /api/listings/mine - Retrieve listings belonging to the authenticated student
router.get('/mine', requireAuth, requireKeycloakEmailVerified, validateListingQuery, getMyListings);

// ==============================================================================
// PUBLIC SINGLE LISTING
// ==============================================================================

// GET /api/listings/:id - Retrieve single listing by UUID (active & sold viewable)
router.get('/:id', validateListingId, getListingById);

// ==============================================================================
// VERIFIED STUDENT MANAGEMENT (requireAuth + requireVerifiedUser)
// ==============================================================================

// POST /api/listings - Create a new item listing
router.post('/', requireAuth, requireKeycloakEmailVerified, requireVerifiedUser, validateCreateListing, createListing);

// POST /api/listings/:id/images - Upload images to an owned listing (max 5 total)
router.post(
  '/:id/images',
  requireAuth,
  requireKeycloakEmailVerified,
  requireVerifiedUser,
  validateListingId,
  uploadListingImagesMiddleware,
  uploadListingImages
);

// DELETE /api/listings/:id/images - Delete an image from owned listing by publicId in body
router.delete(
  '/:id/images',
  requireAuth,
  requireVerifiedUser,
  validateListingId,
  validateDeleteImage,
  deleteListingImage
);

// DELETE /api/listings/:id/images/:publicId(*) - Delete an image by publicId in path
router.delete(
  '/:id/images/:publicId(*)',
  requireAuth,
  requireVerifiedUser,
  validateListingId,
  validateDeleteImage,
  deleteListingImage
);

// PATCH /api/listings/:id/status - Toggle listing status (active <-> sold)
router.patch(
  '/:id/status',
  requireAuth,
  requireKeycloakEmailVerified,
  requireVerifiedUser,
  validateListingId,
  validateUpdateListingStatus,
  updateListingStatus
);

// PATCH /api/listings/:id - Update editable listing fields
router.patch(
  '/:id',
  requireAuth,
  requireKeycloakEmailVerified,
  requireVerifiedUser,
  validateListingId,
  validateUpdateListing,
  updateListing
);

// DELETE /api/listings/:id - Soft-delete owned listing (status becomes removed)
router.delete(
  '/:id',
  requireAuth,
  requireKeycloakEmailVerified,
  requireVerifiedUser,
  validateListingId,
  deleteListing
);

export default router;

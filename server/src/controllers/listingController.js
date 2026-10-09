import { apiResponse } from '../utils/apiResponse.js';
import {
  createListing as createListingService,
  getListings as getListingsService,
  getListingById as getListingByIdService,
  getMyListings as getMyListingsService,
  updateListing as updateListingService,
  updateListingStatus as updateListingStatusService,
  softDeleteListing as softDeleteListingService,
  addListingImages as addListingImagesService,
  deleteListingImage as deleteListingImageService,
} from '../services/listingService.js';

/**
 * Create a new item listing.
 * POST /api/listings
 */
export const createListing = async (req, res, next) => {
  try {
    const listing = await createListingService(req.userId, req.cleanListingData);
    return res.status(201).json(
      apiResponse.success({ listing }, { message: 'Listing created successfully.' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated active marketplace listings.
 * GET /api/listings
 */
export const getListings = async (req, res, next) => {
  try {
    const result = await getListingsService({
      ...req.pagination,
      ...(req.cleanFilter || {}),
    });
    return res.status(200).json(
      apiResponse.success(
        { listings: result.listings, pagination: result.pagination },
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single listing by ID.
 * GET /api/listings/:id
 */
export const getListingById = async (req, res, next) => {
  try {
    const listing = await getListingByIdService(req.params.id);
    return res.status(200).json(apiResponse.success({ listing }));
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve listings created by the authenticated student.
 * GET /api/listings/mine
 */
export const getMyListings = async (req, res, next) => {
  try {
    const result = await getMyListingsService(req.userId, {
      ...req.pagination,
      ...(req.cleanFilter || {}),
    });
    return res.status(200).json(
      apiResponse.success(
        { listings: result.listings, pagination: result.pagination },
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update allowed fields of an owned listing.
 * PATCH /api/listings/:id
 */
export const updateListing = async (req, res, next) => {
  try {
    const listing = await updateListingService(
      req.params.id,
      req.userId,
      req.cleanListingUpdates
    );
    return res.status(200).json(
      apiResponse.success({ listing }, { message: 'Listing updated successfully.' })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update status of an owned listing (active <-> sold).
 * PATCH /api/listings/:id/status
 */
export const updateListingStatus = async (req, res, next) => {
  try {
    const listing = await updateListingStatusService(
      req.params.id,
      req.userId,
      req.cleanStatus
    );
    return res.status(200).json(
      apiResponse.success(
        { listing },
        { message: `Listing status updated to ${req.cleanStatus}.` }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete an owned listing.
 * DELETE /api/listings/:id
 */
export const deleteListing = async (req, res, next) => {
  try {
    const result = await softDeleteListingService(req.params.id, req.userId);
    return res.status(200).json(
      apiResponse.success(
        { id: result.id, status: result.status },
        { message: result.alreadyRemoved ? 'Listing has already been removed.' : 'Listing removed successfully.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload and attach images to an owned listing.
 * POST /api/listings/:id/images
 */
export const uploadListingImages = async (req, res, next) => {
  try {
    const listing = await addListingImagesService(
      req.params.id,
      req.userId,
      req.files
    );
    return res.status(200).json(
      apiResponse.success(
        { listing },
        { message: 'Images uploaded and attached to listing successfully.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific image from an owned listing.
 * DELETE /api/listings/:id/images
 */
export const deleteListingImage = async (req, res, next) => {
  try {
    const listing = await deleteListingImageService(
      req.params.id,
      req.userId,
      req.cleanPublicId
    );
    return res.status(200).json(
      apiResponse.success(
        { listing },
        { message: 'Image deleted from listing successfully.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createListing,
  getListings,
  getListingById,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing,
  uploadListingImages,
  deleteListingImage,
};

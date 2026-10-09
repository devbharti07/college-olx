import { ApiError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';
import {
  isValidUUID,
  toDbEnum,
  fromDbEnum,
} from '../constants/marketplace.js';
import {
  uploadListingImagesBatch,
  deleteCloudinaryAsset,
  deleteCloudinaryAssets,
} from './imageService.js';

/**
 * Format strictly sanitized public seller DTO.
 * Guarantees zero leakage of private credentials, emails, or moderation states.
 * @param {Object} sellerDoc
 * @returns {Object|null}
 */
export const sanitizeSellerPublicDTO = (sellerDoc) => {
  if (!sellerDoc) return null;

  if (typeof sellerDoc === 'string') {
    return { id: sellerDoc };
  }

  return {
    id: sellerDoc.id || '',
    name: sellerDoc.name || 'Campus Student',
    avatar: sellerDoc.avatar || null,
    college: sellerDoc.college || '',
    department: sellerDoc.department || '',
    isVerified: Boolean(sellerDoc.isVerified),
  };
};

/**
 * Format listing record into standardized API response representation.
 * Preserves existing contract: { id, title, description, price, category, condition, location, images, status, soldTo, viewsCount, seller, createdAt, updatedAt }
 * @param {Object} listingDoc
 * @returns {Object|null}
 */
export const formatListingDTO = (listingDoc) => {
  if (!listingDoc) return null;

  const images = Array.isArray(listingDoc.images)
    ? listingDoc.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      }))
    : [];

  return {
    id: listingDoc.id,
    title: listingDoc.title,
    description: listingDoc.description,
    price: typeof listingDoc.price === 'number' ? listingDoc.price : parseFloat(listingDoc.price) || 0,
    category: fromDbEnum(listingDoc.category),
    condition: fromDbEnum(listingDoc.condition),
    location: listingDoc.location,
    images,
    status: fromDbEnum(listingDoc.status),
    soldTo: listingDoc.soldTo || null,
    viewsCount: listingDoc.viewsCount || 0,
    seller: sanitizeSellerPublicDTO(listingDoc.seller),
    createdAt: listingDoc.createdAt,
    updatedAt: listingDoc.updatedAt,
  };
};

/**
 * Create a new item listing.
 * Authenticated and verified student ownership is strictly bound to req.userId.
 * @param {string} userId - Authenticated student identifier
 * @param {Object} cleanData - Sanitized listing data from validator
 * @returns {Promise<Object>} Formatted listing DTO
 */
export const createListing = async (userId, cleanData) => {
  const listing = await prisma.listing.create({
    data: {
      sellerId: userId,
      title: cleanData.title,
      description: cleanData.description,
      price: cleanData.price,
      category: toDbEnum(cleanData.category),
      condition: toDbEnum(cleanData.condition || 'good'),
      location: cleanData.location,
      status: 'ACTIVE',
      soldToId: null,
      viewsCount: 0,
    },
    include: {
      images: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          college: true,
          department: true,
          isVerified: true,
        },
      },
    },
  });

  return formatListingDTO(listing);
};

/**
 * Retrieve paginated active marketplace listings matching search, category, condition,
 * price range, location, and sorting filters.
 *
 * Enforces strict public visibility: status='active' ONLY. Soft-deleted and sold items are excluded.
 *
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.q] - Keyword query against title and description
 * @param {string} [options.category] - Item category
 * @param {string} [options.condition] - Item condition
 * @param {number} [options.minPrice] - Minimum price (INR)
 * @param {number} [options.maxPrice] - Maximum price (INR)
 * @param {string} [options.location] - Campus location query
 * @param {string} [options.sort='newest'] - Sort option: newest, oldest, price-low, price-high
 * @returns {Promise<Object>} { listings, pagination }
 */
export const getListings = async ({
  page = 1,
  limit = 20,
  q,
  category,
  condition,
  minPrice,
  maxPrice,
  location,
  sort = 'newest',
} = {}) => {
  // 1. Mandatory Public Visibility: only active listings are accessible in public browse
  const where = {
    status: 'ACTIVE',
  };

  // 2. Category filter
  if (category) {
    where.category = toDbEnum(category);
  }

  // 3. Condition filter
  if (condition) {
    where.condition = toDbEnum(condition);
  }

  // 4. Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  // 5. Location filter (case-insensitive substring match)
  if (location && typeof location === 'string' && location.trim()) {
    where.location = {
      contains: location.trim(),
      mode: 'insensitive',
    };
  }

  // 6. Search query across title and description (case-insensitive substring match)
  if (q && typeof q === 'string' && q.trim()) {
    const trimmed = q.trim();
    where.OR = [
      { title: { contains: trimmed, mode: 'insensitive' } },
      { description: { contains: trimmed, mode: 'insensitive' } },
    ];
  }

  // 7. Whitelisted deterministic sort order with secondary id tie-breaker
  let orderBy;
  switch (sort) {
    case 'oldest':
      orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
      break;
    case 'price-low':
      orderBy = [{ price: 'asc' }, { id: 'asc' }];
      break;
    case 'price-high':
      orderBy = [{ price: 'desc' }, { id: 'desc' }];
      break;
    case 'newest':
    default:
      orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
      break;
  }

  // 8. Execute count and findMany with pagination
  const [total, records] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            college: true,
            department: true,
            isVerified: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  const listings = records.map(formatListingDTO);

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    listings,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      hasNextPage: hasNext,
      hasPreviousPage: hasPrev,
    },
  };
};

/**
 * Retrieve single listing by its UUID identifier.
 * Active and sold listings are viewable; soft-deleted (removed) items return 404.
 * @param {string} listingId - Listing identifier (UUID)
 * @returns {Promise<Object>} Formatted listing DTO
 */
export const getListingById = async (listingId) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found or is no longer available.');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          college: true,
          department: true,
          isVerified: true,
        },
      },
    },
  });

  if (!listing || fromDbEnum(listing.status) === 'removed') {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found or is no longer available.');
  }

  return formatListingDTO(listing);
};

/**
 * Retrieve listings created by the authenticated student.
 * Returns listings across all seller-owned statuses (active, sold, removed).
 * @param {string} userId - Authenticated user identifier
 * @param {Object} options - { page, limit, status, sort }
 * @returns {Promise<Object>} { listings, pagination }
 */
export const getMyListings = async (userId, { page = 1, limit = 20, status, sort = 'newest' } = {}) => {
  const where = { sellerId: userId };

  if (status && ['active', 'sold', 'removed'].includes(status)) {
    where.status = toDbEnum(status);
  }

  let orderBy;
  switch (sort) {
    case 'oldest':
      orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
      break;
    case 'price-low':
      orderBy = [{ price: 'asc' }, { id: 'asc' }];
      break;
    case 'price-high':
      orderBy = [{ price: 'desc' }, { id: 'desc' }];
      break;
    case 'newest':
    default:
      orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
      break;
  }

  const [total, records] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            college: true,
            department: true,
            isVerified: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  const listings = records.map(formatListingDTO);

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    listings,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      hasNextPage: hasNext,
      hasPreviousPage: hasPrev,
    },
  };
};

/**
 * Update an existing listing.
 * Enforces ownership: only the creating seller may update the listing.
 * Removed listings cannot be updated.
 * @param {string} listingId - Listing identifier
 * @param {string} userId - Requesting user identifier
 * @param {Object} cleanUpdates - Whitelisted update fields
 * @returns {Promise<Object>} Updated listing DTO
 */
export const updateListing = async (listingId, userId, cleanUpdates) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (fromDbEnum(listing.status) === 'removed') {
    throw new ApiError(409, 'LISTING_REMOVED', 'Removed listings cannot be updated.');
  }

  // Ownership verification
  if (listing.sellerId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to modify this listing.');
  }

  // Whitelisted updates
  const updateData = {};
  if (cleanUpdates.title !== undefined) updateData.title = cleanUpdates.title;
  if (cleanUpdates.description !== undefined) updateData.description = cleanUpdates.description;
  if (cleanUpdates.price !== undefined) updateData.price = cleanUpdates.price;
  if (cleanUpdates.category !== undefined) updateData.category = toDbEnum(cleanUpdates.category);
  if (cleanUpdates.condition !== undefined) updateData.condition = toDbEnum(cleanUpdates.condition);
  if (cleanUpdates.location !== undefined) updateData.location = cleanUpdates.location;

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    include: {
      images: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          college: true,
          department: true,
          isVerified: true,
        },
      },
    },
  });

  return formatListingDTO(updatedListing);
};

/**
 * Update status of an owned listing (active <-> sold).
 * Enforces ownership and disallows transitions on removed listings.
 * @param {string} listingId - Listing identifier
 * @param {string} userId - Requesting user identifier
 * @param {string} newStatus - Target status ('active' or 'sold')
 * @returns {Promise<Object>} Updated listing DTO
 */
export const updateListingStatus = async (listingId, userId, newStatus) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (fromDbEnum(listing.status) === 'removed') {
    throw new ApiError(409, 'LISTING_REMOVED', 'Cannot change status of a removed listing.');
  }

  // Ownership verification
  if (listing.sellerId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to modify this listing.');
  }

  const updatedListing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: toDbEnum(newStatus),
    },
    include: {
      images: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          college: true,
          department: true,
          isVerified: true,
        },
      },
    },
  });

  return formatListingDTO(updatedListing);
};

/**
 * Soft-delete an owned listing.
 * Sets status to 'REMOVED' without deleting the PostgreSQL record to preserve relational integrity.
 * @param {string} listingId - Listing identifier
 * @param {string} userId - Requesting user identifier
 * @returns {Promise<Object>} { id, status, alreadyRemoved }
 */
export const softDeleteListing = async (listingId, userId) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  // Ownership verification
  if (listing.sellerId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to delete this listing.');
  }

  if (fromDbEnum(listing.status) === 'removed') {
    return {
      id: listing.id,
      status: 'removed',
      alreadyRemoved: true,
    };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: 'REMOVED' },
  });

  return {
    id: listing.id,
    status: 'removed',
    alreadyRemoved: false,
  };
};

/**
 * Upload and attach images to an owned listing.
 * Validates ownership, checks that total images will not exceed 5,
 * uploads to Cloudinary with rollback, and persists to PostgreSQL.
 *
 * @param {string} listingId - Listing identifier
 * @param {string} userId - Requesting user identifier
 * @param {Array<{ buffer: Buffer, originalname: string }>} files - Uploaded files
 * @returns {Promise<Object>} Updated listing DTO
 */
export const addListingImages = async (listingId, userId, files) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (fromDbEnum(listing.status) === 'removed') {
    throw new ApiError(409, 'LISTING_REMOVED', 'Cannot add images to a removed listing.');
  }

  // Ownership verification
  if (listing.sellerId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to upload images for this listing.');
  }

  // Total count verification: max 5 images per listing
  const currentCount = Array.isArray(listing.images) ? listing.images.length : 0;
  const newCount = files.length;
  if (currentCount + newCount > 5) {
    throw new ApiError(
      400,
      'IMAGE_LIMIT_EXCEEDED',
      `A listing can contain at most 5 images. Current count: ${currentCount}, attempted to add: ${newCount}.`
    );
  }

  // Upload to Cloudinary with atomic batch rollback
  const uploadedAssets = await uploadListingImagesBatch(files, listingId);

  try {
    await prisma.listingImage.createMany({
      data: uploadedAssets.map((asset) => ({
        listingId,
        url: asset.url,
        publicId: asset.publicId,
      })),
    });
  } catch (dbError) {
    // If PostgreSQL persistence fails, rollback newly uploaded Cloudinary assets
    console.warn('[LISTING_SERVICE] PostgreSQL save failed after image upload. Rolling back Cloudinary assets...');
    await deleteCloudinaryAssets(uploadedAssets.map((img) => img.publicId));
    throw dbError;
  }

  const updatedListing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          college: true,
          department: true,
          isVerified: true,
        },
      },
    },
  });

  return formatListingDTO(updatedListing);
};

/**
 * Delete a specific image from an owned listing.
 * Verifies ownership, confirms the image belongs to the listing,
 * deletes the Cloudinary asset, and removes the record from PostgreSQL.
 *
 * @param {string} listingId - Listing identifier
 * @param {string} userId - Requesting user identifier
 * @param {string} publicId - Target Cloudinary publicId
 * @returns {Promise<Object>} Updated listing DTO
 */
export const deleteListingImage = async (listingId, userId, publicId) => {
  if (!isValidUUID(listingId)) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });

  if (!listing) {
    throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  }

  if (fromDbEnum(listing.status) === 'removed') {
    throw new ApiError(409, 'LISTING_REMOVED', 'Cannot delete images from a removed listing.');
  }

  // Ownership verification
  if (listing.sellerId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to delete images from this listing.');
  }

  // Verify the image belongs to this listing
  const targetImage = listing.images.find((img) => img.publicId === publicId);
  if (!targetImage) {
    throw new ApiError(
      404,
      'IMAGE_NOT_FOUND',
      `Image with publicId "${publicId}" does not exist on this listing.`
    );
  }

  // Delete from Cloudinary
  await deleteCloudinaryAsset(publicId);

  // Remove from PostgreSQL
  await prisma.listingImage.delete({
    where: { id: targetImage.id },
  });

  const updatedListing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          college: true,
          department: true,
          isVerified: true,
        },
      },
    },
  });

  return formatListingDTO(updatedListing);
};

export default {
  sanitizeSellerPublicDTO,
  formatListingDTO,
  createListing,
  getListings,
  getListingById,
  getMyListings,
  updateListing,
  updateListingStatus,
  softDeleteListing,
  addListingImages,
  deleteListingImage,
};

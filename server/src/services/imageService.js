import { Readable } from 'stream';
import { cloudinary, ensureCloudinaryConfigured } from '../config/cloudinary.js';
import config from '../config/environment.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Upload an image buffer to Cloudinary using a readable stream.
 * Applies optimal quality and format transformations without destructive downsampling.
 *
 * @param {Buffer} buffer - In-memory image buffer from Multer
 * @param {Object} [options={}] - Cloudinary upload options
 * @param {string} [options.listingId] - Target listing identifier for folder grouping
 * @param {string} [options.customFolder] - Optional custom folder path
 * @returns {Promise<{ url: string, publicId: string }>} Upload result
 */
export const uploadImageStream = (buffer, options = {}) => {
  ensureCloudinaryConfigured();

  const folder =
    options.customFolder ||
    (options.listingId
      ? `${config.cloudinary.folder}/${options.listingId}`
      : config.cloudinary.folder);

  const uploadOptions = {
    folder,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(
              502,
              'CLOUDINARY_UPLOAD_FAILED',
              `Cloudinary upload failed: ${error.message || 'Unknown provider error.'}`
            )
          );
        }

        if (!result || (!result.secure_url && !result.url)) {
          return reject(
            new ApiError(
              502,
              'CLOUDINARY_UPLOAD_FAILED',
              'Cloudinary returned an invalid upload response with missing URL.'
            )
          );
        }

        resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
        });
      }
    );

    // Pipe in-memory buffer to Cloudinary stream
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a single asset from Cloudinary by its publicId.
 * Idempotent: treats missing or already-deleted assets as successful removals.
 *
 * @param {string} publicId - Cloudinary asset identifier
 * @returns {Promise<{ result: string }>}
 */
export const deleteCloudinaryAsset = async (publicId) => {
  ensureCloudinaryConfigured();

  if (!publicId || typeof publicId !== 'string') {
    throw new ApiError(400, 'INVALID_PUBLIC_ID', 'Valid Cloudinary publicId is required for deletion.');
  }

  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    // Cloudinary responds with { result: 'ok' } or { result: 'not found' }
    return { result: response.result || 'ok' };
  } catch (err) {
    throw new ApiError(
      502,
      'CLOUDINARY_DELETION_FAILED',
      `Cloudinary asset deletion failed: ${err.message || 'Unknown provider error.'}`
    );
  }
};

/**
 * Clean up multiple assets in Cloudinary.
 * Used for rollback on partial multi-file upload failures and DB transaction aborts.
 *
 * @param {string[]} publicIds - Array of Cloudinary asset publicIds
 * @returns {Promise<void>}
 */
export const deleteCloudinaryAssets = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return;

  await Promise.allSettled(
    publicIds.map((id) =>
      deleteCloudinaryAsset(id).catch((err) => {
        // Non-blocking log for cleanup rollback
        console.warn(`[IMAGE_SERVICE] Cleanup failure for asset "${id}":`, err.message);
      })
    )
  );
};

/**
 * Upload multiple files to Cloudinary with all-or-nothing rollback.
 * If any file fails to upload, all previously uploaded files in the batch are purged.
 *
 * @param {Array<{ buffer: Buffer, originalname: string }>} files - Uploaded files
 * @param {string} listingId - Listing identifier
 * @returns {Promise<Array<{ url: string, publicId: string }>>}
 */
export const uploadListingImagesBatch = async (files, listingId) => {
  const uploadedAssets = [];

  try {
    for (const file of files) {
      const asset = await uploadImageStream(file.buffer, { listingId });
      uploadedAssets.push(asset);
    }
    return uploadedAssets;
  } catch (error) {
    // Partial failure cleanup: remove any assets already uploaded in this batch
    if (uploadedAssets.length > 0) {
      console.warn(
        `[IMAGE_SERVICE] Upload batch failed. Purging ${uploadedAssets.length} orphan asset(s)...`
      );
      await deleteCloudinaryAssets(uploadedAssets.map((a) => a.publicId));
    }
    throw error;
  }
};

export default {
  uploadImageStream,
  deleteCloudinaryAsset,
  deleteCloudinaryAssets,
  uploadListingImagesBatch,
};

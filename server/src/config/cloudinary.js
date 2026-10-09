import { v2 as cloudinary } from 'cloudinary';
import config from './environment.js';
import { ApiError } from '../utils/apiError.js';

// Initialize Cloudinary with environment credentials
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * Check if Cloudinary credentials are fully configured.
 * @returns {boolean}
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  );
};

/**
 * Enforce that Cloudinary is configured before performing upload/delete operations.
 * Throws 500 error if configuration is absent in production or test.
 */
export const ensureCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      500,
      'CLOUDINARY_NOT_CONFIGURED',
      'Image upload service is not configured. Missing Cloudinary credentials in server environment.'
    );
  }
};

export { cloudinary };
export default cloudinary;

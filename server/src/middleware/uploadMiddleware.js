import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/apiError.js';

// Configuration constants
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_REQUEST = 5;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

/**
 * Verify image buffer magic-byte signature to defend against MIME-spoofing attacks.
 * Validates actual binary contents: JPEG, PNG, WebP, or AVIF.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export const isValidImageBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  // 1. JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // 2. PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // 3. WebP: starts with "RIFF" and contains "WEBP" at bytes 8-11
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  // 4. AVIF: ISO Base Media File Format with ftypavif or ftypmif1
  if (buffer.length >= 12) {
    const ftyp = buffer.toString('ascii', 4, 8);
    if (ftyp === 'ftyp') {
      const brand = buffer.toString('ascii', 8, 12);
      if (brand === 'avif' || brand === 'mif1' || brand === 'avis') {
        return true;
      }
    }
  }

  return false;
};

// Memory storage engine: files kept in memory buffer, never written to disk
const storage = multer.memoryStorage();

// File filter inspecting extension and MIME type
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mime) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new ApiError(
        400,
        'INVALID_FILE_TYPE',
        `File "${file.originalname}" has an unsupported format. Only JPEG, PNG, WebP, and AVIF images are accepted.`
      )
    );
  }

  cb(null, true);
};

// Base multer upload instance
const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },
  fileFilter,
}).array('images', MAX_FILES_PER_REQUEST);

/**
 * Middleware handling multipart image uploads.
 * Intercepts Multer errors (file size, count, invalid fields) and validates image signatures.
 */
export const uploadListingImagesMiddleware = (req, res, next) => {
  multerUpload(req, res, (err) => {
    // 1. Handle Multer-specific errors
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(
              400,
              'FILE_TOO_LARGE',
              `An uploaded image exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            new ApiError(
              400,
              'TOO_MANY_FILES',
              `Cannot upload more than ${MAX_FILES_PER_REQUEST} images in a single request.`
            )
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new ApiError(
              400,
              'UNEXPECTED_FIELD',
              'Unexpected form field. Please upload files under the "images" field name.'
            )
          );
        }
        return next(new ApiError(400, 'UPLOAD_ERROR', `File upload error: ${err.message}`));
      }
      return next(err);
    }

    // 2. Validate that at least one file was provided
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next(
        new ApiError(
          400,
          'NO_FILES_UPLOADED',
          'No image files were provided. Please select at least one image to upload.'
        )
      );
    }

    // 3. Binary Magic-Byte inspection on every uploaded file buffer
    for (const file of req.files) {
      if (!isValidImageBuffer(file.buffer)) {
        return next(
          new ApiError(
            400,
            'INVALID_IMAGE_DATA',
            `File "${file.originalname}" does not contain valid image binary data.`
          )
        );
      }
    }

    next();
  });
};

export default {
  uploadListingImagesMiddleware,
  isValidImageBuffer,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REQUEST,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};

import multer from "multer";
import type { Request } from "express";

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  PROFILE_AND_GALLERY: 5 * 1024 * 1024, // 5MB
  MENU_ITEM: 3 * 1024 * 1024 // 3MB
};

/**
 * Configure multer storage to use memory storage
 * Files will be available as Buffer in req.file.buffer
 */
const storage = multer.memoryStorage();

/**
 * File filter function to validate image types
 */
function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`
      )
    );
  }
}

/**
 * Multer middleware for profile and gallery image uploads (5MB limit)
 * Use this for:
 * - Vendor profile images
 * - Vendor logos
 * - Gallery images
 */
export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.PROFILE_AND_GALLERY,
    files: 1
  }
}).single("image");

/**
 * Multer middleware for menu item image uploads (3MB limit)
 * Use this for:
 * - Menu item images
 */
export const uploadMenuItemImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.MENU_ITEM,
    files: 1
  }
}).single("image");

/**
 * Error messages for common multer errors
 */
export function getUploadErrorMessage(error: any): string {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return "File size exceeds the maximum allowed limit";
      case "LIMIT_FILE_COUNT":
        return "Too many files uploaded";
      case "LIMIT_UNEXPECTED_FILE":
        return "Unexpected file field";
      default:
        return `Upload error: ${error.message}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown upload error occurred";
}

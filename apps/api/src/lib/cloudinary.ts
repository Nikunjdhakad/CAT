import { v2 as cloudinary } from "cloudinary";
import type { Env } from "../env.js";

/**
 * Cloudinary service for image uploads
 * Handles configuration and upload operations for different image types
 */

let isConfigured = false;

/**
 * Configure Cloudinary with credentials from environment
 * @param env - Environment configuration object
 * @throws Error if Cloudinary credentials are missing
 */
export function configureCloudinary(env: Env): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    );
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });

  isConfigured = true;
}

/**
 * Check if Cloudinary is configured
 * @returns true if configured, false otherwise
 */
export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}

/**
 * Upload options for Cloudinary
 */
interface UploadOptions {
  folder: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  };
}

/**
 * Upload result from Cloudinary
 */
export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image to Cloudinary
 * @param fileBuffer - Buffer containing the image data
 * @param options - Upload options (folder, transformations)
 * @returns Promise resolving to upload result with secure URL
 * @throws Error if upload fails or Cloudinary is not configured
 */
async function uploadImage(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult> {
  if (!isConfigured) {
    throw new Error("Cloudinary is not configured. Call configureCloudinary() first.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "image",
        transformation: options.transformation
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed: No result returned"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Upload a vendor profile image
 * Profile images are optimized for display in vendor cards and profile pages
 * @param fileBuffer - Buffer containing the image data
 * @param vendorId - ID of the vendor (used for organizing uploads)
 * @returns Promise resolving to upload result with secure URL
 */
export async function uploadProfileImage(fileBuffer: Buffer, vendorId: string): Promise<UploadResult> {
  return uploadImage(fileBuffer, {
    folder: `cat/vendors/${vendorId}/profile`,
    transformation: {
      width: 800,
      height: 800,
      crop: "fill",
      quality: "auto:good"
    }
  });
}

/**
 * Upload a vendor logo image
 * Logos are optimized for smaller display sizes and transparency support
 * @param fileBuffer - Buffer containing the image data
 * @param vendorId - ID of the vendor (used for organizing uploads)
 * @returns Promise resolving to upload result with secure URL
 */
export async function uploadLogoImage(fileBuffer: Buffer, vendorId: string): Promise<UploadResult> {
  return uploadImage(fileBuffer, {
    folder: `cat/vendors/${vendorId}/logo`,
    transformation: {
      width: 400,
      height: 400,
      crop: "fit",
      quality: "auto:good"
    }
  });
}

/**
 * Upload a gallery image
 * Gallery images are optimized for display in image galleries and carousels
 * @param fileBuffer - Buffer containing the image data
 * @param vendorId - ID of the vendor (used for organizing uploads)
 * @returns Promise resolving to upload result with secure URL
 */
export async function uploadGalleryImage(fileBuffer: Buffer, vendorId: string): Promise<UploadResult> {
  return uploadImage(fileBuffer, {
    folder: `cat/vendors/${vendorId}/gallery`,
    transformation: {
      width: 1200,
      height: 900,
      crop: "fill",
      quality: "auto:good"
    }
  });
}

/**
 * Upload a menu item image
 * Menu item images are optimized for display in menu cards and detail views
 * @param fileBuffer - Buffer containing the image data
 * @param vendorId - ID of the vendor (used for organizing uploads)
 * @param menuItemId - ID of the menu item (used for organizing uploads)
 * @returns Promise resolving to upload result with secure URL
 */
export async function uploadMenuItemImage(
  fileBuffer: Buffer,
  vendorId: string,
  menuItemId: string
): Promise<UploadResult> {
  return uploadImage(fileBuffer, {
    folder: `cat/vendors/${vendorId}/menu/${menuItemId}`,
    transformation: {
      width: 600,
      height: 600,
      crop: "fill",
      quality: "auto:good"
    }
  });
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise resolving when deletion is complete
 * @throws Error if deletion fails or Cloudinary is not configured
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!isConfigured) {
    throw new Error("Cloudinary is not configured. Call configureCloudinary() first.");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
    throw new Error("Cloudinary deletion failed: Unknown error");
  }
}

import type { Request, Response, NextFunction } from "express";
import { ImageUploadTracking } from "../models/ImageUploadTracking.js";

/**
 * Rate limit configuration
 */
const UPLOAD_LIMIT = 10; // Maximum uploads per window
const WINDOW_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Middleware to enforce rate limiting for image uploads
 * Limits users to 10 image uploads per hour
 * 
 * Requirements:
 * - Track uploads per user using ImageUploadTracking model
 * - Return 429 status when limit exceeded
 * - Include Retry-After header indicating when user can upload again
 * 
 * @param req - Express request object (must have req.auth.userId)
 * @param res - Express response object
 * @param next - Express next function
 */
export async function rateLimitImageUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Ensure user is authenticated
    if (!req.auth || !req.auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.auth.userId;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - WINDOW_DURATION_MS);

    // Find or create tracking record for this user
    let tracking = await ImageUploadTracking.findOne({ userId });

    if (!tracking) {
      // First upload for this user - create new tracking record
      tracking = await ImageUploadTracking.create({
        userId,
        uploads: [{ timestamp: now }],
        windowStart: now
      });
      next();
      return;
    }

    // Filter out uploads older than 1 hour
    const recentUploads = tracking.uploads.filter(
      (upload) => upload.timestamp > oneHourAgo
    );

    // Check if user has exceeded the limit
    if (recentUploads.length >= UPLOAD_LIMIT) {
      // Calculate when the oldest upload will expire
      const oldestUpload = recentUploads[0].timestamp;
      const retryAfterMs = oldestUpload.getTime() + WINDOW_DURATION_MS - now.getTime();
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      res
        .status(429)
        .header("Retry-After", retryAfterSeconds.toString())
        .json({
          error: "Rate limit exceeded",
          message: `You have exceeded the maximum of ${UPLOAD_LIMIT} image uploads per hour`,
          retryAfter: retryAfterSeconds,
          retryAfterDate: new Date(now.getTime() + retryAfterMs).toISOString()
        });
      return;
    }

    // Add current upload to tracking
    tracking.uploads = [...recentUploads, { timestamp: now }];
    
    // Update windowStart if this is a new window
    if (recentUploads.length === 0) {
      tracking.windowStart = now;
    }

    await tracking.save();

    // Allow the upload to proceed
    next();
  } catch (error) {
    console.error("Rate limit middleware error:", error);
    // On error, allow the request to proceed (fail open)
    // This prevents rate limiting errors from blocking legitimate uploads
    next();
  }
}

/**
 * Get current upload count for a user
 * Useful for displaying remaining uploads to users
 * 
 * @param userId - User ID to check
 * @returns Object with current count and limit
 */
export async function getUploadCount(userId: string): Promise<{
  current: number;
  limit: number;
  remaining: number;
  resetsAt: Date | null;
}> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - WINDOW_DURATION_MS);

  const tracking = await ImageUploadTracking.findOne({ userId });

  if (!tracking) {
    return {
      current: 0,
      limit: UPLOAD_LIMIT,
      remaining: UPLOAD_LIMIT,
      resetsAt: null
    };
  }

  const recentUploads = tracking.uploads.filter(
    (upload) => upload.timestamp > oneHourAgo
  );

  const resetsAt = recentUploads.length > 0
    ? new Date(recentUploads[0].timestamp.getTime() + WINDOW_DURATION_MS)
    : null;

  return {
    current: recentUploads.length,
    limit: UPLOAD_LIMIT,
    remaining: Math.max(0, UPLOAD_LIMIT - recentUploads.length),
    resetsAt
  };
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { rateLimitImageUploads } from "./rate-limit.js";
import { ImageUploadTracking } from "../models/ImageUploadTracking.js";

// Mock the ImageUploadTracking model
vi.mock("../models/ImageUploadTracking.js", () => ({
  ImageUploadTracking: {
    findOne: vi.fn(),
    create: vi.fn()
  }
}));

describe("rateLimitImageUploads middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    jsonMock = vi.fn();
    setMock = vi.fn().mockReturnThis();
    statusMock = vi.fn().mockReturnValue({
      json: jsonMock,
      set: setMock
    });

    req = {
      auth: {
        userId: "user123",
        role: "vendor"
      }
    };

    res = {
      status: statusMock,
      json: jsonMock,
      set: setMock
    };

    next = vi.fn();
  });

  it("should return 401 if user is not authenticated", async () => {
    req.auth = undefined;

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow first upload and create tracking record", async () => {
    vi.mocked(ImageUploadTracking.findOne).mockResolvedValue(null);
    vi.mocked(ImageUploadTracking.create).mockResolvedValue({
      userId: "user123",
      uploads: [{ timestamp: new Date() }],
      windowStart: new Date()
    } as any);

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    expect(ImageUploadTracking.findOne).toHaveBeenCalledWith({ userId: "user123" });
    expect(ImageUploadTracking.create).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should allow uploads within limit (9 previous uploads)", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    const mockTracking = {
      userId: "user123",
      uploads: Array(9).fill(null).map(() => ({ timestamp: windowStart })),
      windowStart,
      save: vi.fn().mockResolvedValue(undefined)
    };

    vi.mocked(ImageUploadTracking.findOne).mockResolvedValue(mockTracking as any);

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    expect(mockTracking.save).toHaveBeenCalled();
    expect(mockTracking.uploads).toHaveLength(10);
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should block 11th upload within window and return 429 with Retry-After header", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    const mockTracking = {
      userId: "user123",
      uploads: Array(10).fill(null).map(() => ({ timestamp: windowStart })),
      windowStart,
      save: vi.fn()
    };

    vi.mocked(ImageUploadTracking.findOne).mockResolvedValue(mockTracking as any);

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    expect(mockTracking.save).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(setMock).toHaveBeenCalledWith("Retry-After", expect.any(String));
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Rate limit exceeded",
      retryAfter: expect.any(Number)
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reset window after 1 hour and allow new uploads", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 61 * 60 * 1000); // 61 minutes ago (expired)
    
    const mockTracking = {
      userId: "user123",
      uploads: Array(10).fill(null).map(() => ({ timestamp: windowStart })),
      windowStart,
      save: vi.fn().mockResolvedValue(undefined)
    };

    vi.mocked(ImageUploadTracking.findOne).mockResolvedValue(mockTracking as any);

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    expect(mockTracking.save).toHaveBeenCalled();
    expect(mockTracking.uploads).toHaveLength(1); // Reset to 1 upload
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should calculate correct Retry-After seconds", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    const mockTracking = {
      userId: "user123",
      uploads: Array(10).fill(null).map(() => ({ timestamp: windowStart })),
      windowStart,
      save: vi.fn()
    };

    vi.mocked(ImageUploadTracking.findOne).mockResolvedValue(mockTracking as any);

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    const callArgs = jsonMock.mock.calls[0][0];
    expect(callArgs.retryAfter).toBeGreaterThan(1700); // ~30 minutes remaining
    expect(callArgs.retryAfter).toBeLessThan(1900); // Allow some variance
  });

  it("should handle database errors gracefully and allow request", async () => {
    vi.mocked(ImageUploadTracking.findOne).mockRejectedValue(new Error("DB error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Rate limiting error:", expect.any(Error));
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should filter uploads outside current window", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const oldUpload = new Date(now.getTime() - 90 * 60 * 1000); // 90 minutes ago (outside window)
    
    const mockTracking = {
      userId: "user123",
      uploads: [
        { timestamp: oldUpload }, // This should be filtered out
        ...Array(9).fill(null).map(() => ({ timestamp: windowStart }))
      ],
      windowStart,
      save: vi.fn().mockResolvedValue(undefined)
    };

    vi.mocked(ImageUploadTracking.findOne).mockResolvedValue(mockTracking as any);

    const middleware = rateLimitImageUploads();
    await middleware(req as Request, res as Response, next);

    // Should allow upload since only 9 uploads are in current window
    expect(mockTracking.save).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});

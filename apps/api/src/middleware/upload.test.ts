import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  uploadProfileImage,
  uploadMenuItemImage,
  uploadMultipleImages,
} from "./upload.js";

// Mock multer
vi.mock("multer", () => {
  const multerMock = vi.fn(() => ({
    single: vi.fn(() => (req: Request, res: Response, cb: Function) => {
      cb(null);
    }),
    array: vi.fn(() => (req: Request, res: Response, cb: Function) => {
      cb(null);
    }),
  }));
  
  multerMock.memoryStorage = vi.fn();
  
  return {
    default: multerMock,
  };
});

describe("Upload Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));

    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = vi.fn();
  });

  describe("uploadProfileImage", () => {
    it("should reject request when no file is uploaded", () => {
      mockReq.file = undefined;

      uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "No file uploaded. Please provide an image file.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject file larger than 5MB", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "large.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 6 * 1024 * 1024, // 6MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "File size exceeds maximum limit",
        message: "Profile and gallery images must be under 5MB.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept valid JPEG file under 5MB", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "valid.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 4 * 1024 * 1024, // 4MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should accept valid PNG file under 5MB", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "valid.png",
        encoding: "7bit",
        mimetype: "image/png",
        size: 3 * 1024 * 1024, // 3MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should accept valid WebP file under 5MB", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "valid.webp",
        encoding: "7bit",
        mimetype: "image/webp",
        size: 2 * 1024 * 1024, // 2MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe("uploadMenuItemImage", () => {
    it("should reject request when no file is uploaded", () => {
      mockReq.file = undefined;

      uploadMenuItemImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "No file uploaded. Please provide an image file.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject file larger than 3MB", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "large.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 4 * 1024 * 1024, // 4MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadMenuItemImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "File size exceeds maximum limit",
        message: "Menu item images must be under 3MB.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept valid JPEG file under 3MB", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "valid.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 2 * 1024 * 1024, // 2MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadMenuItemImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should accept file exactly at 3MB limit", () => {
      mockReq.file = {
        fieldname: "image",
        originalname: "exact.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 3 * 1024 * 1024, // Exactly 3MB
        buffer: Buffer.from(""),
        stream: {} as any,
        destination: "",
        filename: "",
        path: "",
      };

      uploadMenuItemImage(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe("uploadMultipleImages", () => {
    it("should reject request when no files are uploaded", () => {
      mockReq.files = [];

      const middleware = uploadMultipleImages(5);
      middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "No files uploaded. Please provide image files.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject if any file is larger than 5MB", () => {
      mockReq.files = [
        {
          fieldname: "images",
          originalname: "valid.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          size: 2 * 1024 * 1024, // 2MB
          buffer: Buffer.from(""),
          stream: {} as any,
          destination: "",
          filename: "",
          path: "",
        },
        {
          fieldname: "images",
          originalname: "large.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          size: 6 * 1024 * 1024, // 6MB - exceeds limit
          buffer: Buffer.from(""),
          stream: {} as any,
          destination: "",
          filename: "",
          path: "",
        },
      ];

      const middleware = uploadMultipleImages(5);
      middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "File size exceeds maximum limit",
        message: "All images must be under 5MB.",
        oversizedFiles: ["large.jpg"],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept multiple valid files under 5MB", () => {
      mockReq.files = [
        {
          fieldname: "images",
          originalname: "image1.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          size: 2 * 1024 * 1024, // 2MB
          buffer: Buffer.from(""),
          stream: {} as any,
          destination: "",
          filename: "",
          path: "",
        },
        {
          fieldname: "images",
          originalname: "image2.png",
          encoding: "7bit",
          mimetype: "image/png",
          size: 3 * 1024 * 1024, // 3MB
          buffer: Buffer.from(""),
          stream: {} as any,
          destination: "",
          filename: "",
          path: "",
        },
        {
          fieldname: "images",
          originalname: "image3.webp",
          encoding: "7bit",
          mimetype: "image/webp",
          size: 4 * 1024 * 1024, // 4MB
          buffer: Buffer.from(""),
          stream: {} as any,
          destination: "",
          filename: "",
          path: "",
        },
      ];

      const middleware = uploadMultipleImages(5);
      middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});

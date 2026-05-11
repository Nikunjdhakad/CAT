import type { Request, Response, NextFunction } from "express";
import { requireAuth, requireRole } from "./auth.js";
import { verifyAccessToken } from "../lib/tokens.js";
import type { Env } from "../env.js";

// Mock the tokens module
jest.mock("../lib/tokens.js");

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockEnv: Env;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    mockEnv = {
      JWT_SECRET: "test-secret",
      MONGODB_URI: "mongodb://localhost:27017/test",
      PORT: 3000,
      NODE_ENV: "test",
    } as Env;
  });

  describe("requireAuth", () => {
    it("should return 401 when Authorization header is missing", () => {
      const middleware = requireAuth(mockEnv);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing or invalid Authorization header",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header does not start with Bearer", () => {
      mockRequest.headers = { authorization: "Basic token123" };
      const middleware = requireAuth(mockEnv);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing or invalid Authorization header",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 when token is invalid", () => {
      mockRequest.headers = { authorization: "Bearer invalid-token" };
      (verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const middleware = requireAuth(mockEnv);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should set req.auth and call next() when token is valid", () => {
      mockRequest.headers = { authorization: "Bearer valid-token" };
      const mockPayload = {
        sub: "user123",
        role: "vendor" as const,
      };
      (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      const middleware = requireAuth(mockEnv);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.auth).toEqual({
        userId: "user123",
        role: "vendor",
      });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should return 401 when req.auth is not set", () => {
      const middleware = requireRole("admin");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Unauthorized",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 403 when user role is not in allowed roles", () => {
      mockRequest.auth = {
        userId: "user123",
        role: "customer",
      };

      const middleware = requireRole("admin", "vendor");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should call next() when user has vendor role and vendor is allowed", () => {
      mockRequest.auth = {
        userId: "user123",
        role: "vendor",
      };

      const middleware = requireRole("vendor");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next() when user has customer role and customer is allowed", () => {
      mockRequest.auth = {
        userId: "user123",
        role: "customer",
      };

      const middleware = requireRole("customer");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next() when user has admin role and admin is allowed", () => {
      mockRequest.auth = {
        userId: "user123",
        role: "admin",
      };

      const middleware = requireRole("admin");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should support multiple allowed roles", () => {
      mockRequest.auth = {
        userId: "user123",
        role: "vendor",
      };

      const middleware = requireRole("vendor", "admin");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should work with all three roles (vendor, customer, admin)", () => {
      // Test vendor
      mockRequest.auth = { userId: "user1", role: "vendor" };
      let middleware = requireRole("vendor", "customer", "admin");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(1);

      // Test customer
      mockRequest.auth = { userId: "user2", role: "customer" };
      middleware = requireRole("vendor", "customer", "admin");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(2);

      // Test admin
      mockRequest.auth = { userId: "user3", role: "admin" };
      middleware = requireRole("vendor", "customer", "admin");
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledTimes(3);
    });
  });
});

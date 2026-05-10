import type { NextFunction, Request, Response } from "express";
import type { Env } from "../env.js";
import { verifyAccessToken } from "../lib/tokens.js";
import type { UserRole } from "../models/User.js";

function getBearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return null;
  }
  return h.slice("Bearer ".length).trim() || null;
}

export function requireAuth(env: Env) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Missing or invalid Authorization header" });
      return;
    }
    try {
      const payload = verifyAccessToken(token, env.JWT_SECRET);
      req.auth = { userId: payload.sub, role: payload.role };
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

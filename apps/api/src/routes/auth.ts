import { Router } from "express";
import { z } from "zod";
import type { Env } from "../env.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken } from "../lib/tokens.js";
import { requireAuth } from "../middleware/auth.js";
import { USER_ROLES, User } from "../models/User.js";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(120),
  role: z.enum(USER_ROLES).optional().default("customer")
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export function createAuthRouter(env: Env) {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const body = RegisterSchema.parse(req.body);
      if (body.role === "admin" && env.ALLOW_ADMIN_REGISTER !== "true") {
        res.status(403).json({ error: "Admin registration is disabled" });
        return;
      }
      const existing = await User.findOne({ email: body.email });
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      const passwordHash = await hashPassword(body.password);
      const user = await User.create({
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role
      });
      const token = signAccessToken(env.JWT_SECRET, env.JWT_EXPIRES_IN, {
        sub: user.id,
        role: user.role
      });
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (e) {
      next(e);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const body = LoginSchema.parse(req.body);
      const user = await User.findOne({ email: body.email });
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const ok = await verifyPassword(body.password, user.passwordHash);
      if (!ok) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const token = signAccessToken(env.JWT_SECRET, env.JWT_EXPIRES_IN, {
        sub: user.id,
        role: user.role
      });
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/me", requireAuth(env), async (req, res, next) => {
    try {
      const doc = await User.findById(req.auth!.userId).select("-passwordHash").lean();
      if (!doc || Array.isArray(doc)) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        user: {
          id: String(doc._id),
          email: doc.email,
          name: doc.name,
          role: doc.role,
          createdAt: doc.createdAt
        }
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

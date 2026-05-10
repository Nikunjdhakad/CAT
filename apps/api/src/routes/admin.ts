import { Router } from "express";
import type { Env } from "../env.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

/** Example admin-only route — extend with verification queues, analytics, etc. */
export function createAdminRouter(env: Env) {
  const router = Router();
  router.use(requireAuth(env), requireRole("admin"));

  router.get("/ping", (_req, res) => {
    res.json({ ok: true, message: "Admin access granted" });
  });

  return router;
}

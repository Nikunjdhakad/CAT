import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import type { Env } from "./env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";

export function createApp(env: Env) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => res.json({ ok: true, service: "@cat/api" }));
  app.use("/health", healthRouter);
  app.use("/auth", createAuthRouter(env));
  app.use("/admin", createAdminRouter(env));

  app.use(errorHandler);

  return app;
}


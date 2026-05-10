import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const msg = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    res.status(400).json({ error: msg });
    return;
  }
  if (err instanceof Error && err.message === "Invalid token payload") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

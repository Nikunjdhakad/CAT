import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../models/User.js";

export type JwtPayload = {
  sub: string;
  role: UserRole;
};

export function signAccessToken(
  secret: string,
  expiresIn: string,
  payload: JwtPayload
): string {
  const options = {
    expiresIn,
    subject: payload.sub
  } as SignOptions;
  return jwt.sign({ role: payload.role }, secret, options);
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { role?: UserRole };
  const sub = typeof decoded.sub === "string" ? decoded.sub : undefined;
  if (!sub || !decoded.role) {
    throw new Error("Invalid token payload");
  }
  return { sub, role: decoded.role };
}

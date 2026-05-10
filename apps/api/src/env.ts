import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/cat"),
    JWT_SECRET: z.string().default("local-dev-only-change-me-min-32-chars"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    /** Set to "true" to allow POST /auth/register with role=admin (bootstrap only). */
    ALLOW_ADMIN_REGISTER: z.enum(["true", "false"]).default("false")
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        message: "JWT_SECRET must be at least 32 characters in production",
        path: ["JWT_SECRET"]
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(processEnv: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    // Keep error readable for boot failures
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment:\n${msg}`);
  }
  return parsed.data;
}


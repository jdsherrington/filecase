import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    SESSION_COOKIE_NAME: z.string().min(1),
    SESSION_SECRET: z.string().min(16),
    APP_ORIGIN: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SEED_ADMIN_EMAIL: z.string().email().default("admin@demo.local"),
    SEED_ADMIN_PASSWORD: z.string().min(8).default("change-me-now"),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_ENDPOINT: z.string().url().optional().or(z.literal("")),
    R2_PUBLIC_BASE_URL: z.string().url().optional().or(z.literal("")),
    FILE_DOWNLOAD_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(3600)
      .default(300),
    MAX_UPLOAD_BYTES: z.coerce.number().int().min(1).default(52_428_800),
    ALLOWED_UPLOAD_MIME_TYPES: z
      .string()
      .min(1)
      .default(
        "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg",
      ),
    RATE_LIMIT_LOGIN_IP_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .default(20),
    RATE_LIMIT_LOGIN_IP_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(300),
    RATE_LIMIT_LOGIN_EMAIL_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .default(10),
    RATE_LIMIT_LOGIN_EMAIL_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(300),
    RATE_LIMIT_UPLOAD_USER_MAX_PER_MINUTE: z.coerce
      .number()
      .int()
      .min(1)
      .default(30),
    RATE_LIMIT_UPLOAD_FIRM_MAX_PER_MINUTE: z.coerce
      .number()
      .int()
      .min(1)
      .default(120),
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error", "fatal", "silent"])
      .default("info"),
    HEALTHCHECK_R2_ENABLED: z.coerce.boolean().default(false),
  })
  .transform((raw) => ({
    ...raw,
    ALLOWED_UPLOAD_MIME_TYPES: raw.ALLOWED_UPLOAD_MIME_TYPES.split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  }))
  .superRefine((env, context) => {
    if (env.NODE_ENV === "production") {
      if (env.SESSION_SECRET.length < 32) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SESSION_SECRET"],
          message:
            "SESSION_SECRET must be at least 32 characters in production.",
        });
      }

      if (!env.APP_ORIGIN.startsWith("https://")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["APP_ORIGIN"],
          message: "APP_ORIGIN must use https:// in production.",
        });
      }
    }
  });

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const env: Record<string, string> = {};
  const contents = readFileSync(filePath, "utf8");

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function loadEnvCandidates(): Record<string, string> {
  const serverDir = dirname(fileURLToPath(import.meta.url));
  const appRoot = path.resolve(serverDir, "../..");
  const repoRoot = path.resolve(appRoot, "../..");
  const candidates = [
    path.resolve(repoRoot, ".env"),
    path.resolve(appRoot, ".env"),
    path.resolve(repoRoot, ".env.local"),
    path.resolve(appRoot, ".env.local"),
  ];
  const env: Record<string, string> = {};

  for (const candidate of candidates) {
    Object.assign(env, parseEnvFile(candidate));
  }

  return env;
}

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const merged = {
    ...loadEnvCandidates(),
    ...process.env,
  };

  if (
    typeof merged.DATABASE_URL === "string" &&
    merged.DATABASE_URL.startsWith("DATABASE_URL=")
  ) {
    throw new Error(
      "Invalid environment configuration:\n- DATABASE_URL: Remove duplicated key name. Expected `DATABASE_URL=postgres://...`.",
    );
  }

  const parsed = envSchema.safeParse(merged);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "env";
        return `- ${field}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

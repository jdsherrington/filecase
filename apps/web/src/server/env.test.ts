import { afterEach, describe, expect, test, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const REQUIRED_BASE_ENV = {
  DATABASE_URL: "postgres://filecase:filecase@localhost:5432/filecase",
  SESSION_COOKIE_NAME: "filecase_session",
  SESSION_SECRET: "1234567890123456",
  APP_ORIGIN: "http://localhost:3000",
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "access",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_NAME: "filecase",
};

async function loadEnvModule() {
  vi.resetModules();
  return import("./env");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env validation", () => {
  test("loads with required values", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...REQUIRED_BASE_ENV,
      NODE_ENV: "test",
    };

    const { getEnv } = await loadEnvModule();
    const env = getEnv();

    expect(env.SESSION_COOKIE_NAME).toBe("filecase_session");
    expect(env.MAX_UPLOAD_BYTES).toBeGreaterThan(0);
    expect(env.ALLOWED_UPLOAD_MIME_TYPES.length).toBeGreaterThan(0);
  });

  test("fails fast when production SESSION_SECRET is too short", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...REQUIRED_BASE_ENV,
      NODE_ENV: "production",
      SESSION_SECRET: "too-short-production-secret",
      APP_ORIGIN: "https://filecase.example.com",
    };

    const { getEnv } = await loadEnvModule();

    expect(() => getEnv()).toThrow("SESSION_SECRET must be at least 32");
  });

  test("fails fast when production APP_ORIGIN is not https", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...REQUIRED_BASE_ENV,
      NODE_ENV: "production",
      SESSION_SECRET: "this-is-a-very-long-production-secret-value-1234",
      APP_ORIGIN: "http://filecase.example.com",
    };

    const { getEnv } = await loadEnvModule();

    expect(() => getEnv()).toThrow("APP_ORIGIN must use https://");
  });
});

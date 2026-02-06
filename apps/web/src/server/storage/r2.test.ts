import { describe, expect, test, vi } from "vitest";

const { sendMock, signedUrlMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  signedUrlMock: vi.fn().mockResolvedValue("https://signed.example"),
}));

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = sendMock;
  }

  class PutObjectCommand {
    constructor(public input: unknown) {}
  }

  class DeleteObjectCommand {
    constructor(public input: unknown) {}
  }

  class GetObjectCommand {
    constructor(public input: unknown) {}
  }

  return {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: signedUrlMock,
}));

vi.mock("../env", () => ({
  getEnv: () => ({
    DATABASE_URL: "postgres://test",
    SESSION_COOKIE_NAME: "filecase_session",
    SESSION_SECRET: "test-secret-123456789",
    APP_ORIGIN: "http://localhost:3000",
    NODE_ENV: "test",
    SEED_ADMIN_EMAIL: "admin@demo.local",
    SEED_ADMIN_PASSWORD: "change-me-now",
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "bucket",
    R2_ENDPOINT: "",
    R2_PUBLIC_BASE_URL: "",
    FILE_DOWNLOAD_TTL_SECONDS: 300,
    MAX_UPLOAD_BYTES: 52_428_800,
  }),
}));

import { __resetStorageClientForTests, getStorageClient } from "./r2";

describe("r2 storage client", () => {
  test("calls signer with ttl for download URL", async () => {
    __resetStorageClientForTests();
    const storage = getStorageClient();

    const url = await storage.getSignedDownloadUrl(
      "firms/f1/documents/d1/v1/a.pdf",
      120,
    );

    expect(url).toBe("https://signed.example");
    expect(signedUrlMock).toHaveBeenCalledTimes(1);
    const signerOptions = signedUrlMock.mock.calls[0]?.[2];
    expect(signerOptions).toMatchObject({ expiresIn: 120 });
  });
});

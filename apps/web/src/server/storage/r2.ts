import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getEnv } from "../env";

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  size: number;
};

export type StorageClient = {
  putObject: (input: PutObjectInput) => Promise<void>;
  deleteObject: (key: string) => Promise<void>;
  getSignedDownloadUrl: (key: string, ttlSeconds?: number) => Promise<string>;
};

function resolveR2Endpoint() {
  const env = getEnv();
  if (env.R2_ENDPOINT && env.R2_ENDPOINT.length > 0) {
    return env.R2_ENDPOINT;
  }

  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

function createR2S3Client(): S3Client {
  const env = getEnv();

  return new S3Client({
    region: "auto",
    endpoint: resolveR2Endpoint(),
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

let cachedStorageClient: StorageClient | null = null;

export function getStorageClient(): StorageClient {
  if (cachedStorageClient) {
    return cachedStorageClient;
  }

  const env = getEnv();
  const s3 = createR2S3Client();

  cachedStorageClient = {
    async putObject(input) {
      await s3.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          ContentLength: input.size,
        }),
      );
    },
    async deleteObject(key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
        }),
      );
    },
    async getSignedDownloadUrl(key, ttlSeconds) {
      const expiresIn = ttlSeconds ?? env.FILE_DOWNLOAD_TTL_SECONDS;

      const command = new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      });

      return getSignedUrl(s3, command, { expiresIn });
    },
  };

  return cachedStorageClient;
}

export function __resetStorageClientForTests() {
  cachedStorageClient = null;
}

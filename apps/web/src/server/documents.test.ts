import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  putObjectMock,
  deleteObjectMock,
  signedUrlMock,
  logAuditMock,
  transactionMock,
  findEngagementMock,
  findEngagementAssignmentMock,
  findClientMock,
  findDocumentMock,
  findDocumentsMock,
  findVersionMock,
  insertValuesMock,
  updateSetMock,
  updateWhereMock,
  selectLimitMock,
} = vi.hoisted(() => ({
  putObjectMock: vi.fn(),
  deleteObjectMock: vi.fn(),
  signedUrlMock: vi.fn().mockResolvedValue("https://signed.example/download"),
  logAuditMock: vi.fn(),
  transactionMock: vi.fn(),
  findEngagementMock: vi.fn(),
  findEngagementAssignmentMock: vi.fn(),
  findClientMock: vi.fn(),
  findDocumentMock: vi.fn(),
  findDocumentsMock: vi.fn(),
  findVersionMock: vi.fn(),
  insertValuesMock: vi.fn(),
  updateSetMock: vi.fn(() => ({ where: updateWhereMock })),
  updateWhereMock: vi.fn(),
  selectLimitMock: vi.fn(),
}));

vi.mock("./storage/r2", () => ({
  getStorageClient: () => ({
    putObject: putObjectMock,
    deleteObject: deleteObjectMock,
    getSignedDownloadUrl: signedUrlMock,
  }),
}));

vi.mock("./audit", () => ({
  logAuditEvent: logAuditMock,
}));

vi.mock("./env", () => ({
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
    ALLOWED_UPLOAD_MIME_TYPES: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/png",
      "image/jpeg",
    ],
  }),
}));

vi.mock("./db/client", () => ({
  db: {
    query: {
      engagements: { findFirst: findEngagementMock },
      engagementAssignments: { findFirst: findEngagementAssignmentMock },
      clients: { findFirst: findClientMock },
      documents: { findFirst: findDocumentMock, findMany: findDocumentsMock },
      documentVersions: { findFirst: findVersionMock },
    },
    transaction: transactionMock,
    update: vi.fn(() => ({ set: updateSetMock })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        groupBy: vi.fn(() => ({
          as: vi.fn(() => ({
            documentId: "document_id",
            latestVersionNumber: 1,
          })),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectLimitMock,
            orderBy: vi.fn(() => ({
              limit: selectLimitMock,
            })),
          })),
        })),
      })),
    })),
  },
}));

import {
  bulkUpdateDocumentStatus,
  createDocumentWithInitialVersion,
  createSignedDownloadForVersion,
} from "./documents";

describe("document service integration", () => {
  beforeEach(() => {
    putObjectMock.mockReset();
    deleteObjectMock.mockReset();
    signedUrlMock.mockReset();
    signedUrlMock.mockResolvedValue("https://signed.example/download");
    logAuditMock.mockReset();
    transactionMock.mockReset();
    findEngagementMock.mockReset();
    findEngagementAssignmentMock.mockReset();
    findClientMock.mockReset();
    findDocumentMock.mockReset();
    findDocumentsMock.mockReset();
    findVersionMock.mockReset();
    insertValuesMock.mockReset();
    updateWhereMock.mockReset();
    updateSetMock.mockReset();
    updateSetMock.mockImplementation(() => ({ where: updateWhereMock }));
    selectLimitMock.mockReset();
  });

  test("upload creates document/version and uploads object", async () => {
    findEngagementMock.mockResolvedValue({ id: "eng-1" });

    transactionMock.mockImplementation(
      async (
        callback: (tx: { insert: ReturnType<typeof vi.fn> }) => Promise<void>,
      ) => {
        const tx = {
          insert: vi.fn(() => ({
            values: insertValuesMock,
          })),
        };
        await callback(tx);
      },
    );

    insertValuesMock.mockResolvedValue(undefined);
    putObjectMock.mockResolvedValue(undefined);

    const result = await createDocumentWithInitialVersion({
      user: {
        id: "user-1",
        firmId: "firm-1",
        role: "admin",
      },
      clientId: "client-1",
      engagementId: "eng-1",
      title: "Tax return",
      documentType: "tax-return",
      fileName: "return.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 2048,
      fileBuffer: Buffer.from("pdf"),
    });

    expect(result.versionNumber).toBe(1);
    expect(putObjectMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock).toHaveBeenCalledTimes(1);
  });

  test("download requires scoped document and writes audit log", async () => {
    selectLimitMock.mockResolvedValue([{ id: "version-match" }]);
    findDocumentMock.mockResolvedValue({
      id: "doc-1",
      firmId: "firm-1",
      engagementId: "eng-1",
    });
    findEngagementMock.mockResolvedValue({ id: "eng-1" });
    findEngagementAssignmentMock.mockResolvedValue({ id: "eng-assignment-1" });
    findVersionMock.mockResolvedValue({
      id: "ver-1",
      versionNumber: 1,
      fileName: "return.pdf",
      storageKey:
        "firms/firm-1/clients/client-1/engagements/eng-1/documents/doc-1/v1/return.pdf",
    });

    const result = await createSignedDownloadForVersion({
      user: {
        id: "user-1",
        firmId: "firm-1",
        role: "admin",
      },
      documentId: "doc-1",
      versionNumber: 1,
    });

    expect(result.url).toContain("signed.example");
    expect(signedUrlMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock).toHaveBeenCalledTimes(1);
  });

  test("staff cannot download unassigned document versions", async () => {
    selectLimitMock.mockResolvedValue([{ id: "version-match" }]);
    findDocumentMock.mockResolvedValue({
      id: "doc-1",
      firmId: "firm-1",
      engagementId: "eng-1",
    });
    findEngagementMock.mockResolvedValue({ id: "eng-1" });
    findEngagementAssignmentMock.mockResolvedValue(null);

    await expect(
      createSignedDownloadForVersion({
        user: {
          id: "staff-1",
          firmId: "firm-1",
          role: "staff",
        },
        documentId: "doc-1",
        versionNumber: 1,
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(signedUrlMock).toHaveBeenCalledTimes(0);
    expect(logAuditMock).toHaveBeenCalledTimes(0);
  });

  test("staff cannot bulk-update unassigned documents", async () => {
    findDocumentsMock.mockResolvedValue([
      {
        id: "doc-1",
        firmId: "firm-1",
        status: "in_review",
      },
    ]);
    findDocumentMock.mockResolvedValue({
      id: "doc-1",
      firmId: "firm-1",
    });

    await expect(
      bulkUpdateDocumentStatus({
        user: {
          id: "staff-1",
          firmId: "firm-1",
          role: "staff",
        },
        documentIds: ["doc-1"],
        nextStatus: "final",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

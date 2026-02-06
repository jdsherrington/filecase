import { describe, expect, test } from "vitest";

import { buildDocumentVersionObjectKey, sanitizeFileName } from "./key";

describe("document storage key", () => {
  test("builds namespaced key with version", () => {
    const key = buildDocumentVersionObjectKey({
      firmId: "firm-1",
      clientId: "client-1",
      engagementId: "eng-1",
      documentId: "doc-1",
      versionNumber: 2,
      fileName: "statement.pdf",
    });

    expect(key).toBe(
      "firms/firm-1/clients/client-1/engagements/eng-1/documents/doc-1/v2/statement.pdf",
    );
  });

  test("sanitizes potentially unsafe file names", () => {
    expect(sanitizeFileName("../../secrets?.pdf")).toBe("secrets_.pdf");
    expect(sanitizeFileName("report final(1).pdf")).toBe("report_final_1_.pdf");
  });
});

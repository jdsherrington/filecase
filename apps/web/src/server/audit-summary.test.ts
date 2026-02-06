import { describe, expect, test } from "vitest";

import { formatAuditSummary } from "./audit-summary";

describe("formatAuditSummary", () => {
  test("formats status change", () => {
    expect(
      formatAuditSummary({
        action: "status_change",
        entityType: "document",
        metadata: {
          previous_status: "uploaded",
          new_status: "in_review",
        },
      }),
    ).toContain("uploaded -> in_review");
  });

  test("formats bulk update", () => {
    expect(
      formatAuditSummary({
        action: "bulk_update",
        entityType: "document",
        metadata: {
          count: 4,
        },
      }),
    ).toContain("4");
  });

  test("falls back to generic format", () => {
    expect(
      formatAuditSummary({
        action: "custom_action",
        entityType: "document",
        metadata: {},
      }),
    ).toBe("custom_action on document");
  });
});

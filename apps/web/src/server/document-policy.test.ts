import { describe, expect, test } from "vitest";

import { canTransitionDocumentStatus } from "./document-policy";

describe("document status transition policy", () => {
  test("allows forward transitions", () => {
    expect(
      canTransitionDocumentStatus({
        role: "manager",
        currentStatus: "uploaded",
        nextStatus: "in_review",
      }),
    ).toBe(true);

    expect(
      canTransitionDocumentStatus({
        role: "staff",
        currentStatus: "in_review",
        nextStatus: "final",
      }),
    ).toBe(true);
  });

  test("only admin/manager can move final back to in_review", () => {
    expect(
      canTransitionDocumentStatus({
        role: "admin",
        currentStatus: "final",
        nextStatus: "in_review",
      }),
    ).toBe(true);
    expect(
      canTransitionDocumentStatus({
        role: "manager",
        currentStatus: "final",
        nextStatus: "in_review",
      }),
    ).toBe(true);
    expect(
      canTransitionDocumentStatus({
        role: "staff",
        currentStatus: "final",
        nextStatus: "in_review",
      }),
    ).toBe(false);
  });

  test("blocks unsupported transitions", () => {
    expect(
      canTransitionDocumentStatus({
        role: "admin",
        currentStatus: "uploaded",
        nextStatus: "final",
      }),
    ).toBe(false);
    expect(
      canTransitionDocumentStatus({
        role: "admin",
        currentStatus: "final",
        nextStatus: "uploaded",
      }),
    ).toBe(false);
  });
});

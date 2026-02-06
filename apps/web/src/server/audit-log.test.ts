import { describe, expect, test, vi } from "vitest";

vi.mock("./db/client", () => ({
  db: {},
}));

import {
  canReadFirmWideAudit,
  exportAuditEventsCsv,
  listAuditEvents,
} from "./audit-log";

describe("audit log authorization", () => {
  test("admin and manager can read firm-wide audit", () => {
    expect(
      canReadFirmWideAudit({ id: "u1", firmId: "f1", role: "admin" }),
    ).toBe(true);
    expect(
      canReadFirmWideAudit({ id: "u2", firmId: "f1", role: "manager" }),
    ).toBe(true);
  });

  test("staff cannot read firm-wide audit", () => {
    expect(
      canReadFirmWideAudit({ id: "u3", firmId: "f1", role: "staff" }),
    ).toBe(false);
  });

  test("staff cannot export audit csv", async () => {
    await expect(
      exportAuditEventsCsv({
        user: { id: "staff-1", firmId: "firm-1", role: "staff" },
        query: {},
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  test("staff cannot request another user's events", async () => {
    await expect(
      listAuditEvents({
        user: { id: "staff-1", firmId: "firm-1", role: "staff" },
        query: {
          userId: "other-user-id",
          limit: 20,
          offset: 0,
        },
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

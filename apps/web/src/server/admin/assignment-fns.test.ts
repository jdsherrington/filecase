import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  findUserMock,
  findClientMock,
  findClientAssignmentMock,
  findEngagementMock,
  findEngagementAssignmentMock,
  insertValuesMock,
  deleteWhereMock,
  logAuditMock,
} = vi.hoisted(() => ({
  findUserMock: vi.fn(),
  findClientMock: vi.fn(),
  findClientAssignmentMock: vi.fn(),
  findEngagementMock: vi.fn(),
  findEngagementAssignmentMock: vi.fn(),
  insertValuesMock: vi.fn(),
  deleteWhereMock: vi.fn(),
  logAuditMock: vi.fn(),
}));

vi.mock("../audit", () => ({
  logAuditEvent: logAuditMock,
}));

vi.mock("../db/client", () => ({
  db: {
    query: {
      users: { findFirst: findUserMock },
      clients: { findFirst: findClientMock },
      clientAssignments: { findFirst: findClientAssignmentMock },
      engagements: { findFirst: findEngagementMock },
      engagementAssignments: { findFirst: findEngagementAssignmentMock },
    },
    insert: vi.fn(() => ({ values: insertValuesMock })),
    delete: vi.fn(() => ({ where: deleteWhereMock })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => []),
          })),
        })),
      })),
    })),
  },
}));

import { assignClient, unassignClient } from "./assignments";

describe("assignment service", () => {
  beforeEach(() => {
    findUserMock.mockReset();
    findClientMock.mockReset();
    findClientAssignmentMock.mockReset();
    findEngagementMock.mockReset();
    findEngagementAssignmentMock.mockReset();
    insertValuesMock.mockReset();
    deleteWhereMock.mockReset();
    logAuditMock.mockReset();
  });

  test("assign client writes assignment and audit", async () => {
    findUserMock.mockResolvedValue({ id: "staff-1" });
    findClientMock.mockResolvedValue({ id: "client-1" });
    findClientAssignmentMock.mockResolvedValue(null);

    await assignClient({
      firmId: "firm-1",
      actorUserId: "manager-1",
      targetUserId: "staff-1",
      clientId: "client-1",
    });

    expect(insertValuesMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock.mock.calls[0]?.[0]).toMatchObject({
      action: "permission_change",
      entityType: "client_assignment",
      metadata: {
        target_user_id: "staff-1",
        client_id: "client-1",
        change: "assign",
      },
    });
  });

  test("unassign client deletes assignment and audits", async () => {
    findUserMock.mockResolvedValue({ id: "staff-1" });

    await unassignClient({
      firmId: "firm-1",
      actorUserId: "manager-1",
      targetUserId: "staff-1",
      clientId: "client-1",
    });

    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock).toHaveBeenCalledTimes(1);
    expect(logAuditMock.mock.calls[0]?.[0]).toMatchObject({
      action: "permission_change",
      entityType: "client_assignment",
      metadata: {
        target_user_id: "staff-1",
        client_id: "client-1",
        change: "unassign",
      },
    });
  });
});

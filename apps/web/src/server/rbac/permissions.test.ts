import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  findClientMock,
  findClientAssignmentMock,
  findEngagementMock,
  findEngagementAssignmentMock,
  findDocumentMock,
  selectLimitMock,
} = vi.hoisted(() => ({
  findClientMock: vi.fn(),
  findClientAssignmentMock: vi.fn(),
  findEngagementMock: vi.fn(),
  findEngagementAssignmentMock: vi.fn(),
  findDocumentMock: vi.fn(),
  selectLimitMock: vi.fn(),
}));

vi.mock("../db/client", () => ({
  db: {
    query: {
      clients: { findFirst: findClientMock },
      clientAssignments: { findFirst: findClientAssignmentMock },
      engagements: { findFirst: findEngagementMock },
      engagementAssignments: { findFirst: findEngagementAssignmentMock },
      documents: { findFirst: findDocumentMock },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectLimitMock,
          })),
        })),
      })),
    })),
  },
}));

import {
  canManageAssignments,
  canManageUsers,
  canReadClient,
  canReadDocument,
  canReadEngagement,
  canWriteDocument,
} from "./permissions";

const staffUser = {
  id: "staff-1",
  firmId: "firm-1",
  role: "staff" as const,
};

describe("rbac permissions", () => {
  beforeEach(() => {
    findClientMock.mockReset();
    findClientAssignmentMock.mockReset();
    findEngagementMock.mockReset();
    findEngagementAssignmentMock.mockReset();
    findDocumentMock.mockReset();
    selectLimitMock.mockReset();
  });

  test("admin/manager can manage assignments; only admin manages users", () => {
    expect(canManageAssignments("admin")).toBe(true);
    expect(canManageAssignments("manager")).toBe(true);
    expect(canManageAssignments("staff")).toBe(false);
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("manager")).toBe(false);
  });

  test("staff can read directly assigned client", async () => {
    findClientMock.mockResolvedValue({ id: "client-1" });
    findClientAssignmentMock.mockResolvedValue({ id: "assignment-1" });

    await expect(canReadClient(staffUser, "client-1")).resolves.toBe(true);
  });

  test("staff cannot read unassigned client", async () => {
    findClientMock.mockResolvedValue({ id: "client-2" });
    findClientAssignmentMock.mockResolvedValue(null);
    selectLimitMock.mockResolvedValue([]);

    await expect(canReadClient(staffUser, "client-2")).resolves.toBe(false);
  });

  test("staff can read engagement only when assigned", async () => {
    findEngagementMock.mockResolvedValue({ id: "eng-1" });
    findEngagementAssignmentMock.mockResolvedValue({ id: "eng-assignment-1" });

    await expect(canReadEngagement(staffUser, "eng-1")).resolves.toBe(true);

    findEngagementAssignmentMock.mockResolvedValue(null);

    await expect(canReadEngagement(staffUser, "eng-1")).resolves.toBe(false);
  });

  test("staff can read document only when engagement is assigned", async () => {
    findDocumentMock.mockResolvedValue({ id: "doc-1", engagementId: "eng-1" });
    findEngagementMock.mockResolvedValue({ id: "eng-1" });
    findEngagementAssignmentMock.mockResolvedValue({ id: "eng-assignment-1" });

    await expect(canReadDocument(staffUser, "doc-1")).resolves.toBe(true);

    findEngagementAssignmentMock.mockResolvedValue(null);

    await expect(canReadDocument(staffUser, "doc-1")).resolves.toBe(false);
  });

  test("staff cannot write documents", async () => {
    await expect(canWriteDocument(staffUser, "doc-1")).resolves.toBe(false);
  });
});

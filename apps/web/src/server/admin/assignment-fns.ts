import { z } from "zod";

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getAuditRequestContext } from "../audit";
import { canManageAssignments } from "../rbac/permissions";
import { resolveTenantContext } from "../tenant/context";
import {
  assignClient,
  assignEngagement,
  getUserAssignments,
  listFirmClients,
  listFirmEngagements,
  listUsersForFirm,
  unassignClient,
  unassignEngagement,
} from "./assignments";

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

const assignClientSchema = z.object({
  userId: z.string().uuid(),
  clientId: z.string().uuid(),
});

const assignEngagementSchema = z.object({
  userId: z.string().uuid(),
  engagementId: z.string().uuid(),
});

async function requireAssignmentManager(request: Request) {
  const tenant = await resolveTenantContext(request);

  if (!canManageAssignments(tenant.user.role)) {
    throw new Error("FORBIDDEN");
  }

  return tenant;
}

export const listUsersServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const tenant = await requireAssignmentManager(request);

    const rows = await listUsersForFirm(tenant.firmId);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
    }));
  },
);

export const getUserAssignmentsServerFn = createServerFn({ method: "GET" })
  .inputValidator(userIdSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await requireAssignmentManager(request);

    return getUserAssignments({
      firmId: tenant.firmId,
      userId: data.userId,
    });
  });

export const listFirmClientsServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const request = getRequest();
  const tenant = await requireAssignmentManager(request);

  return listFirmClients(tenant.firmId);
});

export const listFirmEngagementsServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const request = getRequest();
  const tenant = await requireAssignmentManager(request);

  return listFirmEngagements(tenant.firmId);
});

export const assignClientServerFn = createServerFn({ method: "POST" })
  .inputValidator(assignClientSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await requireAssignmentManager(request);
    const requestContext = getAuditRequestContext(request);

    await assignClient({
      firmId: tenant.firmId,
      actorUserId: tenant.user.id,
      targetUserId: data.userId,
      clientId: data.clientId,
      requestContext,
    });

    return { ok: true };
  });

export const unassignClientServerFn = createServerFn({ method: "POST" })
  .inputValidator(assignClientSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await requireAssignmentManager(request);
    const requestContext = getAuditRequestContext(request);

    await unassignClient({
      firmId: tenant.firmId,
      actorUserId: tenant.user.id,
      targetUserId: data.userId,
      clientId: data.clientId,
      requestContext,
    });

    return { ok: true };
  });

export const assignEngagementServerFn = createServerFn({ method: "POST" })
  .inputValidator(assignEngagementSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await requireAssignmentManager(request);
    const requestContext = getAuditRequestContext(request);

    await assignEngagement({
      firmId: tenant.firmId,
      actorUserId: tenant.user.id,
      targetUserId: data.userId,
      engagementId: data.engagementId,
      requestContext,
    });

    return { ok: true };
  });

export const unassignEngagementServerFn = createServerFn({ method: "POST" })
  .inputValidator(assignEngagementSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await requireAssignmentManager(request);
    const requestContext = getAuditRequestContext(request);

    await unassignEngagement({
      firmId: tenant.firmId,
      actorUserId: tenant.user.id,
      targetUserId: data.userId,
      engagementId: data.engagementId,
      requestContext,
    });

    return { ok: true };
  });

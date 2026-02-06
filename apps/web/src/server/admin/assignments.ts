import { and, asc, eq } from "drizzle-orm";

import { logAuditEvent } from "../audit";
import type { AuditRequestContext } from "../audit";
import { db } from "../db/client";
import {
  clientAssignments,
  clients,
  engagementAssignments,
  engagements,
  users,
} from "../db/schema";

export async function ensureTargetUser(input: {
  firmId: string;
  userId: string;
}) {
  const user = await db.query.users.findFirst({
    where: and(eq(users.firmId, input.firmId), eq(users.id, input.userId)),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("NOT_FOUND");
  }

  return user;
}

export async function listUsersForFirm(firmId: string) {
  return db.query.users.findMany({
    where: eq(users.firmId, firmId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: [asc(users.createdAt)],
  });
}

export async function getUserAssignments(input: {
  firmId: string;
  userId: string;
}) {
  const user = await ensureTargetUser(input);

  const assignedClients = await db
    .select({
      assignmentId: clientAssignments.id,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(clientAssignments)
    .innerJoin(clients, eq(clients.id, clientAssignments.clientId))
    .where(
      and(
        eq(clientAssignments.firmId, input.firmId),
        eq(clientAssignments.userId, input.userId),
      ),
    )
    .orderBy(asc(clients.name));

  const assignedEngagements = await db
    .select({
      assignmentId: engagementAssignments.id,
      engagementId: engagements.id,
      engagementName: engagements.name,
      clientId: engagements.clientId,
    })
    .from(engagementAssignments)
    .innerJoin(
      engagements,
      eq(engagements.id, engagementAssignments.engagementId),
    )
    .where(
      and(
        eq(engagementAssignments.firmId, input.firmId),
        eq(engagementAssignments.userId, input.userId),
      ),
    )
    .orderBy(asc(engagements.name));

  return {
    user,
    clients: assignedClients,
    engagements: assignedEngagements,
  };
}

export async function listFirmClients(firmId: string) {
  return db.query.clients.findMany({
    where: eq(clients.firmId, firmId),
    columns: { id: true, name: true, status: true },
    orderBy: [asc(clients.name)],
  });
}

export async function listFirmEngagements(firmId: string) {
  return db
    .select({
      id: engagements.id,
      name: engagements.name,
      clientId: engagements.clientId,
      clientName: clients.name,
      status: engagements.status,
    })
    .from(engagements)
    .innerJoin(clients, eq(clients.id, engagements.clientId))
    .where(eq(engagements.firmId, firmId))
    .orderBy(asc(clients.name), asc(engagements.name));
}

export async function assignClient(input: {
  firmId: string;
  actorUserId: string;
  targetUserId: string;
  clientId: string;
  requestContext?: AuditRequestContext;
}) {
  await ensureTargetUser({ firmId: input.firmId, userId: input.targetUserId });

  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, input.clientId),
      eq(clients.firmId, input.firmId),
    ),
    columns: { id: true },
  });

  if (!client) {
    throw new Error("NOT_FOUND");
  }

  const existing = await db.query.clientAssignments.findFirst({
    where: and(
      eq(clientAssignments.firmId, input.firmId),
      eq(clientAssignments.clientId, input.clientId),
      eq(clientAssignments.userId, input.targetUserId),
    ),
    columns: { id: true },
  });

  if (!existing) {
    await db.insert(clientAssignments).values({
      firmId: input.firmId,
      clientId: input.clientId,
      userId: input.targetUserId,
      createdByUserId: input.actorUserId,
    });
  }

  await logAuditEvent({
    firmId: input.firmId,
    userId: input.actorUserId,
    action: "permission_change",
    entityType: "client_assignment",
    entityId: input.clientId,
    metadata: {
      target_user_id: input.targetUserId,
      client_id: input.clientId,
      change: "assign",
    },
    requestContext: input.requestContext,
  });
}

export async function unassignClient(input: {
  firmId: string;
  actorUserId: string;
  targetUserId: string;
  clientId: string;
  requestContext?: AuditRequestContext;
}) {
  await ensureTargetUser({ firmId: input.firmId, userId: input.targetUserId });

  await db
    .delete(clientAssignments)
    .where(
      and(
        eq(clientAssignments.firmId, input.firmId),
        eq(clientAssignments.clientId, input.clientId),
        eq(clientAssignments.userId, input.targetUserId),
      ),
    );

  await logAuditEvent({
    firmId: input.firmId,
    userId: input.actorUserId,
    action: "permission_change",
    entityType: "client_assignment",
    entityId: input.clientId,
    metadata: {
      target_user_id: input.targetUserId,
      client_id: input.clientId,
      change: "unassign",
    },
    requestContext: input.requestContext,
  });
}

export async function assignEngagement(input: {
  firmId: string;
  actorUserId: string;
  targetUserId: string;
  engagementId: string;
  requestContext?: AuditRequestContext;
}) {
  await ensureTargetUser({ firmId: input.firmId, userId: input.targetUserId });

  const engagement = await db.query.engagements.findFirst({
    where: and(
      eq(engagements.id, input.engagementId),
      eq(engagements.firmId, input.firmId),
    ),
    columns: { id: true },
  });

  if (!engagement) {
    throw new Error("NOT_FOUND");
  }

  const existing = await db.query.engagementAssignments.findFirst({
    where: and(
      eq(engagementAssignments.firmId, input.firmId),
      eq(engagementAssignments.engagementId, input.engagementId),
      eq(engagementAssignments.userId, input.targetUserId),
    ),
    columns: { id: true },
  });

  if (!existing) {
    await db.insert(engagementAssignments).values({
      firmId: input.firmId,
      engagementId: input.engagementId,
      userId: input.targetUserId,
      createdByUserId: input.actorUserId,
    });
  }

  await logAuditEvent({
    firmId: input.firmId,
    userId: input.actorUserId,
    action: "permission_change",
    entityType: "engagement_assignment",
    entityId: input.engagementId,
    metadata: {
      target_user_id: input.targetUserId,
      engagement_id: input.engagementId,
      change: "assign",
    },
    requestContext: input.requestContext,
  });
}

export async function unassignEngagement(input: {
  firmId: string;
  actorUserId: string;
  targetUserId: string;
  engagementId: string;
  requestContext?: AuditRequestContext;
}) {
  await ensureTargetUser({ firmId: input.firmId, userId: input.targetUserId });

  await db
    .delete(engagementAssignments)
    .where(
      and(
        eq(engagementAssignments.firmId, input.firmId),
        eq(engagementAssignments.engagementId, input.engagementId),
        eq(engagementAssignments.userId, input.targetUserId),
      ),
    );

  await logAuditEvent({
    firmId: input.firmId,
    userId: input.actorUserId,
    action: "permission_change",
    entityType: "engagement_assignment",
    entityId: input.engagementId,
    metadata: {
      target_user_id: input.targetUserId,
      engagement_id: input.engagementId,
      change: "unassign",
    },
    requestContext: input.requestContext,
  });
}

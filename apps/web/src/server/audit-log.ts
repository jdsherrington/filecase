import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import type { PaginatedAuditQuery } from "@filecase/shared";

import { db } from "./db/client";
import { auditLogs, users } from "./db/schema";
import type { PolicyUser } from "./rbac/permissions";

const MAX_EXPORT_ROWS = 10_000;

function escapeCsvCell(value: string): string {
  if (!value.includes(",") && !value.includes("\n") && !value.includes('"')) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function serializeCsvRow(columns: string[]): string {
  return columns.map(escapeCsvCell).join(",");
}

function buildAuditFilter(input: {
  user: PolicyUser;
  query: PaginatedAuditQuery;
}) {
  const whereClauses = [eq(auditLogs.firmId, input.user.firmId)];

  if (input.user.role === "staff") {
    whereClauses.push(eq(auditLogs.userId, input.user.id));
  }

  if (input.query.startDate) {
    whereClauses.push(
      gte(auditLogs.createdAt, new Date(input.query.startDate)),
    );
  }

  if (input.query.endDate) {
    whereClauses.push(lte(auditLogs.createdAt, new Date(input.query.endDate)));
  }

  if (input.query.action) {
    whereClauses.push(eq(auditLogs.action, input.query.action));
  }

  if (input.query.entityType) {
    whereClauses.push(eq(auditLogs.entityType, input.query.entityType));
  }

  if (input.query.userId) {
    whereClauses.push(eq(auditLogs.userId, input.query.userId));
  }

  if (input.query.clientId) {
    whereClauses.push(
      sql`${auditLogs.metadata} ->> 'client_id' = ${input.query.clientId}`,
    );
  }

  if (input.query.engagementId) {
    whereClauses.push(
      sql`${auditLogs.metadata} ->> 'engagement_id' = ${input.query.engagementId}`,
    );
  }

  return whereClauses;
}

export function canReadFirmWideAudit(user: PolicyUser): boolean {
  return user.role === "admin" || user.role === "manager";
}

export async function listAuditEvents(input: {
  user: PolicyUser;
  query: PaginatedAuditQuery;
}) {
  if (
    input.user.role === "staff" &&
    input.query.userId &&
    input.query.userId !== input.user.id
  ) {
    throw new Error("FORBIDDEN");
  }

  const whereClauses = buildAuditFilter(input);

  const rows = await db
    .select({
      id: auditLogs.id,
      createdAt: auditLogs.createdAt,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      actorUserId: users.id,
      actorEmail: users.email,
      actorName: users.name,
    })
    .from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.userId))
    .where(and(...whereClauses))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(input.query.limit)
    .offset(input.query.offset);

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(and(...whereClauses));

  return {
    items: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
      actorUserId: row.actorUserId,
      actorEmail: row.actorEmail,
      actorName: row.actorName,
    })),
    total: Number(countRows[0]?.count ?? 0),
    limit: input.query.limit,
    offset: input.query.offset,
  };
}

export async function exportAuditEventsCsv(input: {
  user: PolicyUser;
  query: Omit<PaginatedAuditQuery, "limit" | "offset">;
}) {
  if (!canReadFirmWideAudit(input.user)) {
    throw new Error("FORBIDDEN");
  }

  const paginatedQuery: PaginatedAuditQuery = {
    ...input.query,
    limit: MAX_EXPORT_ROWS + 1,
    offset: 0,
  };

  const whereClauses = buildAuditFilter({
    user: input.user,
    query: paginatedQuery,
  });

  const rows = await db
    .select({
      createdAt: auditLogs.createdAt,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .innerJoin(users, eq(users.id, auditLogs.userId))
    .where(and(...whereClauses))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(MAX_EXPORT_ROWS + 1);

  const truncated = rows.length > MAX_EXPORT_ROWS;
  const limitedRows = rows.slice(0, MAX_EXPORT_ROWS);

  const header = serializeCsvRow([
    "created_at",
    "user_email",
    "action",
    "entity_type",
    "entity_id",
    "metadata_json",
  ]);

  const csvRows = limitedRows.map((row) =>
    serializeCsvRow([
      row.createdAt.toISOString(),
      row.actorEmail,
      row.action,
      row.entityType,
      row.entityId,
      JSON.stringify(row.metadata),
    ]),
  );

  return {
    csv: [header, ...csvRows].join("\n"),
    truncated,
    rowCount: limitedRows.length,
    maxRows: MAX_EXPORT_ROWS,
  };
}

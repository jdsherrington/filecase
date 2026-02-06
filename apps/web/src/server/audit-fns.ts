import {
  exportAuditCsvQuerySchema,
  paginatedAuditQuerySchema,
} from "@filecase/shared";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { asc, eq } from "drizzle-orm";

import { exportAuditEventsCsv, listAuditEvents } from "./audit-log";
import { formatAuditSummary } from "./audit-summary";
import { db } from "./db/client";
import { users } from "./db/schema";
import { resolveTenantContext } from "./tenant/context";

function getMetadataString(metadata: Record<string, unknown>): string {
  return JSON.stringify(metadata);
}

function getMetadataValue(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

export const listAuditEventsServerFn = createServerFn({ method: "GET" })
  .inputValidator(paginatedAuditQuerySchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await resolveTenantContext(request);

    const result = await listAuditEvents({
      user: tenant.user,
      query: data,
    });

    return {
      ...result,
      items: result.items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        actorUserId: item.actorUserId,
        actorEmail: item.actorEmail,
        actorName: item.actorName,
        summary: formatAuditSummary({
          action: item.action,
          entityType: item.entityType,
          metadata: item.metadata,
        }),
        metadataJson: getMetadataString(item.metadata),
        relatedDocumentId: getMetadataValue(item.metadata, "document_id"),
        relatedClientId: getMetadataValue(item.metadata, "client_id"),
        relatedEngagementId: getMetadataValue(item.metadata, "engagement_id"),
      })),
    };
  });

export const exportAuditCsvServerFn = createServerFn({ method: "GET" })
  .inputValidator(exportAuditCsvQuerySchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const tenant = await resolveTenantContext(request);

    const result = await exportAuditEventsCsv({
      user: tenant.user,
      query: data,
    });

    const dateStamp = new Date().toISOString().slice(0, 10);

    return {
      ...result,
      fileName: `audit-export-${dateStamp}.csv`,
    };
  });

export const listAuditUsersServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const tenant = await resolveTenantContext(request);

    if (tenant.user.role !== "admin" && tenant.user.role !== "manager") {
      throw new Error("FORBIDDEN");
    }

    const rows = await db.query.users.findMany({
      where: eq(users.firmId, tenant.firmId),
      columns: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [asc(users.name)],
    });

    return rows;
  },
);

export const recentAuditActivityServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const request = getRequest();
  const tenant = await resolveTenantContext(request);

  if (tenant.user.role !== "admin" && tenant.user.role !== "manager") {
    return [];
  }

  const result = await listAuditEvents({
    user: tenant.user,
    query: {
      limit: 20,
      offset: 0,
    },
  });

  return result.items.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    actorName: item.actorName,
    actorEmail: item.actorEmail,
    summary: formatAuditSummary({
      action: item.action,
      entityType: item.entityType,
      metadata: item.metadata,
    }),
    metadataJson: getMetadataString(item.metadata),
  }));
});

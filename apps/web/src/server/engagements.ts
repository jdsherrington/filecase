import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "./db/client";
import { documents, engagementAssignments, engagements } from "./db/schema";
import {
  type PolicyUser,
  canReadEngagement,
  isPrivilegedUser,
} from "./rbac/permissions";

export async function listEngagementsForClient(input: {
  user: PolicyUser;
  clientId: string;
}) {
  if (isPrivilegedUser(input.user)) {
    return db.query.engagements.findMany({
      where: and(
        eq(engagements.firmId, input.user.firmId),
        eq(engagements.clientId, input.clientId),
      ),
      orderBy: [asc(engagements.createdAt)],
    });
  }

  return db
    .select({
      id: engagements.id,
      firmId: engagements.firmId,
      clientId: engagements.clientId,
      name: engagements.name,
      financialYear: engagements.financialYear,
      status: engagements.status,
      dueDate: engagements.dueDate,
      createdAt: engagements.createdAt,
    })
    .from(engagements)
    .innerJoin(
      engagementAssignments,
      and(
        eq(engagementAssignments.firmId, input.user.firmId),
        eq(engagementAssignments.userId, input.user.id),
        eq(engagementAssignments.engagementId, engagements.id),
      ),
    )
    .where(
      and(
        eq(engagements.firmId, input.user.firmId),
        eq(engagements.clientId, input.clientId),
      ),
    )
    .orderBy(asc(engagements.createdAt));
}

export async function getEngagementOverview(input: {
  user: PolicyUser;
  clientId: string;
  engagementId: string;
}) {
  if (!(await canReadEngagement(input.user, input.engagementId))) {
    throw new Error("NOT_FOUND");
  }

  const engagement = await db.query.engagements.findFirst({
    where: and(
      eq(engagements.id, input.engagementId),
      eq(engagements.firmId, input.user.firmId),
      eq(engagements.clientId, input.clientId),
    ),
  });

  if (!engagement) {
    throw new Error("NOT_FOUND");
  }

  const summaryRows = await db
    .select({
      documentType: documents.documentType,
      status: documents.status,
      count: sql<number>`count(*)`,
    })
    .from(documents)
    .where(
      and(
        eq(documents.firmId, input.user.firmId),
        eq(documents.clientId, input.clientId),
        eq(documents.engagementId, input.engagementId),
      ),
    )
    .groupBy(documents.documentType, documents.status)
    .orderBy(asc(documents.documentType), asc(documents.status));

  return {
    engagement: {
      id: engagement.id,
      clientId: engagement.clientId,
      name: engagement.name,
      financialYear: engagement.financialYear,
      status: engagement.status,
      dueDate: engagement.dueDate?.toISOString() ?? null,
    },
    documentSummary: summaryRows.map((row) => ({
      documentType: row.documentType,
      status: row.status,
      count: Number(row.count),
    })),
  };
}

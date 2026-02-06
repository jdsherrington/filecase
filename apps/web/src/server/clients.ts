import { and, asc, eq, isNotNull, or } from "drizzle-orm";

import { db } from "./db/client";
import {
  clientAssignments,
  clients,
  engagementAssignments,
  engagements,
} from "./db/schema";
import { type PolicyUser, isPrivilegedUser } from "./rbac/permissions";

export async function listClientsForUser(user: PolicyUser) {
  if (isPrivilegedUser(user)) {
    return db.query.clients.findMany({
      where: eq(clients.firmId, user.firmId),
      orderBy: [asc(clients.createdAt)],
    });
  }

  return db
    .selectDistinct({
      id: clients.id,
      firmId: clients.firmId,
      name: clients.name,
      externalReference: clients.externalReference,
      status: clients.status,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .leftJoin(
      clientAssignments,
      and(
        eq(clientAssignments.firmId, user.firmId),
        eq(clientAssignments.clientId, clients.id),
        eq(clientAssignments.userId, user.id),
      ),
    )
    .leftJoin(
      engagements,
      and(
        eq(engagements.firmId, user.firmId),
        eq(engagements.clientId, clients.id),
      ),
    )
    .leftJoin(
      engagementAssignments,
      and(
        eq(engagementAssignments.firmId, user.firmId),
        eq(engagementAssignments.engagementId, engagements.id),
        eq(engagementAssignments.userId, user.id),
      ),
    )
    .where(
      and(
        eq(clients.firmId, user.firmId),
        or(
          isNotNull(clientAssignments.id),
          isNotNull(engagementAssignments.id),
        ),
      ),
    )
    .orderBy(asc(clients.createdAt));
}

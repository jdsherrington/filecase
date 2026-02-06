import type { UserRole } from "@filecase/shared";
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import {
  clientAssignments,
  clients,
  documentVersions,
  documents,
  engagementAssignments,
  engagements,
} from "../db/schema";

export type PolicyUser = {
  id: string;
  firmId: string;
  role: UserRole;
};

function isPrivilegedRole(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canManageAssignments(role: UserRole): boolean {
  return isPrivilegedRole(role);
}

export function canListClients(user: PolicyUser): boolean {
  return (
    user.role === "admin" || user.role === "manager" || user.role === "staff"
  );
}

export async function canReadClient(
  user: PolicyUser,
  clientId: string,
): Promise<boolean> {
  const scopedClient = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.firmId, user.firmId)),
    columns: { id: true },
  });

  if (!scopedClient) {
    return false;
  }

  if (isPrivilegedRole(user.role)) {
    return true;
  }

  const directAssignment = await db.query.clientAssignments.findFirst({
    where: and(
      eq(clientAssignments.firmId, user.firmId),
      eq(clientAssignments.clientId, clientId),
      eq(clientAssignments.userId, user.id),
    ),
    columns: { id: true },
  });

  if (directAssignment) {
    return true;
  }

  const engagementAssignment = await db
    .select({ id: engagementAssignments.id })
    .from(engagementAssignments)
    .innerJoin(
      engagements,
      and(
        eq(engagements.id, engagementAssignments.engagementId),
        eq(engagements.firmId, user.firmId),
      ),
    )
    .where(
      and(
        eq(engagementAssignments.firmId, user.firmId),
        eq(engagementAssignments.userId, user.id),
        eq(engagements.clientId, clientId),
      ),
    )
    .limit(1);

  return engagementAssignment.length > 0;
}

export async function canWriteClient(
  user: PolicyUser,
  clientId: string,
): Promise<boolean> {
  if (!isPrivilegedRole(user.role)) {
    return false;
  }

  const scopedClient = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.firmId, user.firmId)),
    columns: { id: true },
  });

  return Boolean(scopedClient);
}

export async function canListEngagements(
  user: PolicyUser,
  clientId?: string,
): Promise<boolean> {
  if (isPrivilegedRole(user.role)) {
    return true;
  }

  if (!clientId) {
    return true;
  }

  return canReadClient(user, clientId);
}

export async function canReadEngagement(
  user: PolicyUser,
  engagementId: string,
): Promise<boolean> {
  const scopedEngagement = await db.query.engagements.findFirst({
    where: and(
      eq(engagements.id, engagementId),
      eq(engagements.firmId, user.firmId),
    ),
    columns: { id: true },
  });

  if (!scopedEngagement) {
    return false;
  }

  if (isPrivilegedRole(user.role)) {
    return true;
  }

  const assignment = await db.query.engagementAssignments.findFirst({
    where: and(
      eq(engagementAssignments.firmId, user.firmId),
      eq(engagementAssignments.engagementId, engagementId),
      eq(engagementAssignments.userId, user.id),
    ),
    columns: { id: true },
  });

  return Boolean(assignment);
}

export async function canWriteEngagement(
  user: PolicyUser,
  engagementId: string,
): Promise<boolean> {
  if (!isPrivilegedRole(user.role)) {
    return false;
  }

  const scopedEngagement = await db.query.engagements.findFirst({
    where: and(
      eq(engagements.id, engagementId),
      eq(engagements.firmId, user.firmId),
    ),
    columns: { id: true },
  });

  return Boolean(scopedEngagement);
}

export async function canReadDocument(
  user: PolicyUser,
  documentId: string,
): Promise<boolean> {
  const scopedDocument = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.firmId, user.firmId)),
    columns: { id: true, engagementId: true },
  });

  if (!scopedDocument) {
    return false;
  }

  if (isPrivilegedRole(user.role)) {
    return true;
  }

  return canReadEngagement(user, scopedDocument.engagementId);
}

export async function canWriteDocument(
  user: PolicyUser,
  documentId: string,
): Promise<boolean> {
  if (!isPrivilegedRole(user.role)) {
    return false;
  }

  const scopedDocument = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.firmId, user.firmId)),
    columns: { id: true },
  });

  return Boolean(scopedDocument);
}

export async function canCreateDocumentVersion(input: {
  user: PolicyUser;
  clientId: string;
  engagementId: string;
}): Promise<boolean> {
  if (!isPrivilegedRole(input.user.role)) {
    return false;
  }

  const scopedEngagement = await db.query.engagements.findFirst({
    where: and(
      eq(engagements.id, input.engagementId),
      eq(engagements.firmId, input.user.firmId),
      eq(engagements.clientId, input.clientId),
    ),
    columns: { id: true },
  });

  return Boolean(scopedEngagement);
}

export async function canReadDocumentVersion(input: {
  user: PolicyUser;
  documentId: string;
  versionNumber: number;
}): Promise<boolean> {
  const scopedVersion = await db
    .select({
      id: documentVersions.id,
      documentId: documentVersions.documentId,
    })
    .from(documentVersions)
    .innerJoin(documents, eq(documents.id, documentVersions.documentId))
    .where(
      and(
        eq(documents.id, input.documentId),
        eq(documentVersions.versionNumber, input.versionNumber),
        eq(documents.firmId, input.user.firmId),
      ),
    )
    .limit(1);

  if (scopedVersion.length === 0) {
    return false;
  }

  return canReadDocument(input.user, input.documentId);
}

export function isPrivilegedUser(user: PolicyUser): boolean {
  return isPrivilegedRole(user.role);
}

import { randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import type {
  DocumentSortBy,
  DocumentStatus,
  PaginatedDocumentsQuery,
} from "@filecase/shared";

import { logAuditEvent } from "./audit";
import type { AuditRequestContext } from "./audit";
import { db } from "./db/client";
import {
  documentVersions,
  documents,
  engagementAssignments,
  users,
} from "./db/schema";
import { canTransitionDocumentStatus } from "./document-policy";
import { getEnv } from "./env";
import {
  type PolicyUser,
  canCreateDocumentVersion,
  canReadDocument,
  canReadDocumentVersion,
  canReadEngagement,
  canWriteDocument,
  isPrivilegedUser,
} from "./rbac/permissions";
import { buildDocumentVersionObjectKey } from "./storage/key";
import { getStorageClient } from "./storage/r2";

type TenantUser = PolicyUser;

const latestVersionByDocument = db
  .select({
    documentId: documentVersions.documentId,
    latestVersionNumber: sql<number>`max(${documentVersions.versionNumber})`.as(
      "latest_version_number",
    ),
  })
  .from(documentVersions)
  .groupBy(documentVersions.documentId)
  .as("latest_version_by_document");

function getDocumentSort(sortBy: DocumentSortBy) {
  if (sortBy === "title") {
    return documents.title;
  }

  if (sortBy === "created_at") {
    return documents.createdAt;
  }

  if (sortBy === "status") {
    return documents.status;
  }

  return documents.updatedAt;
}

function buildDocumentFilters(input: {
  user: TenantUser;
  query: PaginatedDocumentsQuery;
}) {
  const whereClauses = [eq(documents.firmId, input.user.firmId)];

  if (input.query.clientId) {
    whereClauses.push(eq(documents.clientId, input.query.clientId));
  }

  if (input.query.engagementId) {
    whereClauses.push(eq(documents.engagementId, input.query.engagementId));
  }

  if (input.query.status) {
    whereClauses.push(eq(documents.status, input.query.status));
  }

  if (input.query.documentType) {
    whereClauses.push(eq(documents.documentType, input.query.documentType));
  }

  if (input.query.uploadedDateStart) {
    whereClauses.push(
      gte(documentVersions.uploadedAt, new Date(input.query.uploadedDateStart)),
    );
  }

  if (input.query.uploadedDateEnd) {
    whereClauses.push(
      lte(documentVersions.uploadedAt, new Date(input.query.uploadedDateEnd)),
    );
  }

  if (input.query.uploadedByUserId) {
    whereClauses.push(
      eq(documentVersions.uploadedByUserId, input.query.uploadedByUserId),
    );
  }

  if (input.query.fileType) {
    whereClauses.push(
      ilike(documentVersions.mimeType, `%${input.query.fileType}%`),
    );
  }

  if (input.query.q) {
    const searchFilter = or(
      ilike(documents.title, `%${input.query.q}%`),
      ilike(documentVersions.fileName, `%${input.query.q}%`),
    );

    if (!searchFilter) {
      return whereClauses;
    }

    whereClauses.push(searchFilter);
  }

  return whereClauses;
}

export async function listDocuments(input: {
  user: TenantUser;
  query: PaginatedDocumentsQuery;
}) {
  const whereClauses = buildDocumentFilters(input);
  const sortColumn = getDocumentSort(input.query.sortBy);
  const sortDirection = input.query.sortDirection === "asc" ? asc : desc;

  const baseSelect = {
    id: documents.id,
    clientId: documents.clientId,
    engagementId: documents.engagementId,
    title: documents.title,
    documentType: documents.documentType,
    status: documents.status,
    createdAt: documents.createdAt,
    updatedAt: documents.updatedAt,
    latestVersion: documentVersions.versionNumber,
    latestFileName: documentVersions.fileName,
    latestMimeType: documentVersions.mimeType,
    latestUploadedAt: documentVersions.uploadedAt,
    latestUploadedByUserId: documentVersions.uploadedByUserId,
    latestUploadedBy: users.name,
  };

  const rows = isPrivilegedUser(input.user)
    ? await db
        .select(baseSelect)
        .from(documents)
        .innerJoin(
          latestVersionByDocument,
          eq(latestVersionByDocument.documentId, documents.id),
        )
        .innerJoin(
          documentVersions,
          and(
            eq(documentVersions.documentId, documents.id),
            eq(
              documentVersions.versionNumber,
              latestVersionByDocument.latestVersionNumber,
            ),
          ),
        )
        .leftJoin(users, eq(users.id, documentVersions.uploadedByUserId))
        .where(and(...whereClauses))
        .orderBy(sortDirection(sortColumn), desc(documents.id))
        .limit(input.query.limit)
        .offset(input.query.offset)
    : await db
        .select(baseSelect)
        .from(documents)
        .innerJoin(
          latestVersionByDocument,
          eq(latestVersionByDocument.documentId, documents.id),
        )
        .innerJoin(
          documentVersions,
          and(
            eq(documentVersions.documentId, documents.id),
            eq(
              documentVersions.versionNumber,
              latestVersionByDocument.latestVersionNumber,
            ),
          ),
        )
        .innerJoin(
          engagementAssignments,
          and(
            eq(engagementAssignments.firmId, input.user.firmId),
            eq(engagementAssignments.userId, input.user.id),
            eq(engagementAssignments.engagementId, documents.engagementId),
          ),
        )
        .leftJoin(users, eq(users.id, documentVersions.uploadedByUserId))
        .where(and(...whereClauses))
        .orderBy(sortDirection(sortColumn), desc(documents.id))
        .limit(input.query.limit)
        .offset(input.query.offset);

  const countRows = isPrivilegedUser(input.user)
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .innerJoin(
          latestVersionByDocument,
          eq(latestVersionByDocument.documentId, documents.id),
        )
        .innerJoin(
          documentVersions,
          and(
            eq(documentVersions.documentId, documents.id),
            eq(
              documentVersions.versionNumber,
              latestVersionByDocument.latestVersionNumber,
            ),
          ),
        )
        .where(and(...whereClauses))
    : await db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .innerJoin(
          latestVersionByDocument,
          eq(latestVersionByDocument.documentId, documents.id),
        )
        .innerJoin(
          documentVersions,
          and(
            eq(documentVersions.documentId, documents.id),
            eq(
              documentVersions.versionNumber,
              latestVersionByDocument.latestVersionNumber,
            ),
          ),
        )
        .innerJoin(
          engagementAssignments,
          and(
            eq(engagementAssignments.firmId, input.user.firmId),
            eq(engagementAssignments.userId, input.user.id),
            eq(engagementAssignments.engagementId, documents.engagementId),
          ),
        )
        .where(and(...whereClauses));

  const total = Number(countRows[0]?.count ?? 0);

  return {
    items: rows.map((row) => ({
      id: row.id,
      clientId: row.clientId,
      engagementId: row.engagementId,
      title: row.title,
      documentType: row.documentType,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      latestVersion: row.latestVersion,
      latestFileName: row.latestFileName,
      latestMimeType: row.latestMimeType,
      latestUploadedAt: row.latestUploadedAt.toISOString(),
      latestUploadedByUserId: row.latestUploadedByUserId,
      latestUploadedBy: row.latestUploadedBy ?? "-",
    })),
    total,
    limit: input.query.limit,
    offset: input.query.offset,
  };
}

function assertUploadSize(size: number) {
  const env = getEnv();
  if (size > env.MAX_UPLOAD_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
}

function assertAllowedMimeType(mimeType: string) {
  const env = getEnv();
  if (!env.ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
    throw new Error("UNSUPPORTED_MIME_TYPE");
  }
}

async function putObjectOrThrow(input: {
  key: string;
  body: Buffer;
  contentType: string;
  size: number;
}) {
  try {
    await getStorageClient().putObject(input);
  } catch {
    throw new Error("UPLOAD_STORAGE_FAILED");
  }
}

export async function createDocumentWithInitialVersion(input: {
  user: TenantUser;
  clientId: string;
  engagementId: string;
  title: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileBuffer: Buffer;
  requestContext?: AuditRequestContext;
}) {
  const canWrite = await canCreateDocumentVersion({
    user: input.user,
    clientId: input.clientId,
    engagementId: input.engagementId,
  });

  if (!canWrite) {
    throw new Error("FORBIDDEN");
  }

  assertUploadSize(input.fileSizeBytes);
  assertAllowedMimeType(input.mimeType);

  const documentId = randomUUID();
  const versionId = randomUUID();
  const versionNumber = 1;
  const now = new Date();

  const storageKey = buildDocumentVersionObjectKey({
    firmId: input.user.firmId,
    clientId: input.clientId,
    engagementId: input.engagementId,
    documentId,
    versionNumber,
    fileName: input.fileName,
  });

  try {
    await db.transaction(async (tx) => {
      await tx.insert(documents).values({
        id: documentId,
        firmId: input.user.firmId,
        clientId: input.clientId,
        engagementId: input.engagementId,
        title: input.title,
        documentType: input.documentType,
        status: "uploaded",
        createdByUserId: input.user.id,
        updatedAt: now,
      });

      await tx.insert(documentVersions).values({
        id: versionId,
        documentId,
        versionNumber,
        storageKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        uploadedByUserId: input.user.id,
      });

      await putObjectOrThrow({
        key: storageKey,
        body: input.fileBuffer,
        contentType: input.mimeType,
        size: input.fileSizeBytes,
      });
    });
  } catch (error) {
    await getStorageClient()
      .deleteObject(storageKey)
      .catch(() => undefined);
    throw error;
  }

  await logAuditEvent({
    firmId: input.user.firmId,
    userId: input.user.id,
    action: "upload",
    entityType: "document_version",
    entityId: versionId,
    metadata: {
      file_name: input.fileName,
      mime_type: input.mimeType,
      size: input.fileSizeBytes,
      client_id: input.clientId,
      engagement_id: input.engagementId,
      document_id: documentId,
      document_version_id: versionId,
      version_number: versionNumber,
    },
    requestContext: input.requestContext,
  });

  return {
    documentId,
    versionId,
    versionNumber,
  };
}

export async function getDocumentDetail(input: {
  user: TenantUser;
  documentId: string;
}) {
  const canRead = await canReadDocument(input.user, input.documentId);

  if (!canRead) {
    throw new Error("NOT_FOUND");
  }

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, input.documentId),
      eq(documents.firmId, input.user.firmId),
    ),
  });

  if (!doc) {
    throw new Error("NOT_FOUND");
  }

  const versions = await db
    .select({
      id: documentVersions.id,
      versionNumber: documentVersions.versionNumber,
      fileName: documentVersions.fileName,
      mimeType: documentVersions.mimeType,
      fileSizeBytes: documentVersions.fileSizeBytes,
      uploadedAt: documentVersions.uploadedAt,
      uploadedBy: users.name,
      uploadedByUserId: documentVersions.uploadedByUserId,
    })
    .from(documentVersions)
    .innerJoin(users, eq(users.id, documentVersions.uploadedByUserId))
    .where(eq(documentVersions.documentId, doc.id))
    .orderBy(desc(documentVersions.versionNumber));

  return {
    id: doc.id,
    clientId: doc.clientId,
    engagementId: doc.engagementId,
    title: doc.title,
    documentType: doc.documentType,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    versions: versions.map((version) => ({
      ...version,
      uploadedAt: version.uploadedAt.toISOString(),
      uploadedBy: version.uploadedBy ?? "-",
    })),
  };
}

export async function createDocumentReplacementVersion(input: {
  user: TenantUser;
  documentId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileBuffer: Buffer;
  requestContext?: AuditRequestContext;
}) {
  const canWrite = await canWriteDocument(input.user, input.documentId);

  if (!canWrite) {
    throw new Error("FORBIDDEN");
  }

  assertUploadSize(input.fileSizeBytes);
  assertAllowedMimeType(input.mimeType);

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, input.documentId),
      eq(documents.firmId, input.user.firmId),
    ),
  });

  if (!doc) {
    throw new Error("NOT_FOUND");
  }

  const latest = await db.query.documentVersions.findFirst({
    where: eq(documentVersions.documentId, doc.id),
    orderBy: [desc(documentVersions.versionNumber)],
  });

  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const versionId = randomUUID();
  const now = new Date();

  const storageKey = buildDocumentVersionObjectKey({
    firmId: input.user.firmId,
    clientId: doc.clientId,
    engagementId: doc.engagementId,
    documentId: doc.id,
    versionNumber,
    fileName: input.fileName,
  });

  try {
    await db.transaction(async (tx) => {
      await tx.insert(documentVersions).values({
        id: versionId,
        documentId: doc.id,
        versionNumber,
        storageKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        uploadedByUserId: input.user.id,
      });

      await tx
        .update(documents)
        .set({
          updatedAt: now,
        })
        .where(eq(documents.id, doc.id));

      await putObjectOrThrow({
        key: storageKey,
        body: input.fileBuffer,
        contentType: input.mimeType,
        size: input.fileSizeBytes,
      });
    });
  } catch (error) {
    await getStorageClient()
      .deleteObject(storageKey)
      .catch(() => undefined);
    throw error;
  }

  await logAuditEvent({
    firmId: input.user.firmId,
    userId: input.user.id,
    action: "upload",
    entityType: "document_version",
    entityId: versionId,
    metadata: {
      file_name: input.fileName,
      mime_type: input.mimeType,
      size: input.fileSizeBytes,
      client_id: doc.clientId,
      engagement_id: doc.engagementId,
      document_id: doc.id,
      document_version_id: versionId,
      version_number: versionNumber,
    },
    requestContext: input.requestContext,
  });

  return {
    documentId: doc.id,
    versionId,
    versionNumber,
  };
}

export async function updateDocumentStatus(input: {
  user: TenantUser;
  documentId: string;
  nextStatus: DocumentStatus;
  requestContext?: AuditRequestContext;
}) {
  const canWrite = await canWriteDocument(input.user, input.documentId);

  if (!canWrite) {
    throw new Error("FORBIDDEN");
  }

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, input.documentId),
      eq(documents.firmId, input.user.firmId),
    ),
  });

  if (!doc) {
    throw new Error("NOT_FOUND");
  }

  if (
    !canTransitionDocumentStatus({
      role: input.user.role,
      currentStatus: doc.status,
      nextStatus: input.nextStatus,
    })
  ) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  const now = new Date();

  await db
    .update(documents)
    .set({
      status: input.nextStatus,
      updatedAt: now,
    })
    .where(eq(documents.id, doc.id));

  await logAuditEvent({
    firmId: input.user.firmId,
    userId: input.user.id,
    action: "status_change",
    entityType: "document",
    entityId: doc.id,
    metadata: {
      previous_status: doc.status,
      new_status: input.nextStatus,
      client_id: doc.clientId,
      engagement_id: doc.engagementId,
      document_id: doc.id,
    },
    requestContext: input.requestContext,
  });

  return {
    ok: true,
  };
}

export async function bulkUpdateDocumentStatus(input: {
  user: TenantUser;
  documentIds: string[];
  nextStatus: DocumentStatus;
  requestContext?: AuditRequestContext;
}) {
  if (input.documentIds.length === 0) {
    throw new Error("NO_DOCUMENTS");
  }
  const firstDocumentId = input.documentIds[0];
  if (!firstDocumentId) {
    throw new Error("NO_DOCUMENTS");
  }

  const scopedDocuments = await db.query.documents.findMany({
    where: and(
      eq(documents.firmId, input.user.firmId),
      inArray(documents.id, input.documentIds),
    ),
  });

  if (scopedDocuments.length !== input.documentIds.length) {
    throw new Error("NOT_FOUND");
  }

  for (const doc of scopedDocuments) {
    if (!(await canWriteDocument(input.user, doc.id))) {
      throw new Error("FORBIDDEN");
    }

    if (
      !canTransitionDocumentStatus({
        role: input.user.role,
        currentStatus: doc.status,
        nextStatus: input.nextStatus,
      })
    ) {
      throw new Error("INVALID_STATUS_TRANSITION");
    }
  }

  const now = new Date();

  await db
    .update(documents)
    .set({
      status: input.nextStatus,
      updatedAt: now,
    })
    .where(
      and(
        eq(documents.firmId, input.user.firmId),
        inArray(documents.id, input.documentIds),
      ),
    );

  await logAuditEvent({
    firmId: input.user.firmId,
    userId: input.user.id,
    action: "bulk_update",
    entityType: "document",
    entityId: firstDocumentId,
    metadata: {
      document_ids: input.documentIds,
      changes: {
        status: input.nextStatus,
      },
      count: input.documentIds.length,
    },
    requestContext: input.requestContext,
  });

  return {
    ok: true,
    count: input.documentIds.length,
  };
}

export async function createSignedDownloadForVersion(input: {
  user: TenantUser;
  documentId: string;
  versionNumber: number;
  requestContext?: AuditRequestContext;
}) {
  const canRead = await canReadDocumentVersion({
    user: input.user,
    documentId: input.documentId,
    versionNumber: input.versionNumber,
  });

  if (!canRead) {
    throw new Error("NOT_FOUND");
  }

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, input.documentId),
      eq(documents.firmId, input.user.firmId),
    ),
  });

  if (!doc) {
    throw new Error("NOT_FOUND");
  }

  if (!(await canReadEngagement(input.user, doc.engagementId))) {
    throw new Error("NOT_FOUND");
  }

  const version = await db.query.documentVersions.findFirst({
    where: and(
      eq(documentVersions.documentId, doc.id),
      eq(documentVersions.versionNumber, input.versionNumber),
    ),
  });

  if (!version) {
    throw new Error("NOT_FOUND");
  }

  const env = getEnv();
  let url: string;
  try {
    url = await getStorageClient().getSignedDownloadUrl(
      version.storageKey,
      env.FILE_DOWNLOAD_TTL_SECONDS,
    );
  } catch {
    throw new Error("DOWNLOAD_URL_GENERATION_FAILED");
  }

  await logAuditEvent({
    firmId: input.user.firmId,
    userId: input.user.id,
    action: "download",
    entityType: "document_version",
    entityId: version.id,
    metadata: {
      document_id: doc.id,
      client_id: doc.clientId,
      engagement_id: doc.engagementId,
      document_version_id: version.id,
      version_number: version.versionNumber,
      storage_key: version.storageKey,
    },
    requestContext: input.requestContext,
  });

  return {
    url,
    fileName: version.fileName,
    versionNumber: version.versionNumber,
  };
}

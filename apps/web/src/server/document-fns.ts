import { z } from "zod";

import {
  bulkDocumentStatusUpdateSchema,
  documentIdSchema,
  documentStatusUpdateSchema,
  documentVersionDownloadSchema,
  paginatedDocumentsQuerySchema,
} from "@filecase/shared";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getAuditRequestContext } from "./audit";
import {
  bulkUpdateDocumentStatus,
  createDocumentReplacementVersion,
  createDocumentWithInitialVersion,
  createSignedDownloadForVersion,
  getDocumentDetail,
  listDocuments,
  updateDocumentStatus,
} from "./documents";
import { getEngagementOverview, listEngagementsForClient } from "./engagements";
import { getEnv } from "./env";
import {
  logRequestFailure,
  logRequestSuccess,
  startRequestLog,
} from "./logger";
import { consumeRateLimit, createRateLimitResponse } from "./rate-limit";
import {
  canListEngagements,
  canReadClient,
  canReadEngagement,
} from "./rbac/permissions";
import { resolveTenantContext } from "./tenant/context";

const listEngagementsInputSchema = z.object({
  clientId: z.string().uuid(),
});

const engagementOverviewInputSchema = z.object({
  clientId: z.string().uuid(),
  engagementId: z.string().uuid(),
});

function getRequiredString(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`MISSING_FIELD:${field}`);
  }

  return value.trim();
}

function getRequiredFile(formData: FormData, field: string): File {
  const value = formData.get(field);

  if (!(value instanceof File)) {
    throw new Error(`MISSING_FILE:${field}`);
  }

  return value;
}

export const listEngagementsServerFn = createServerFn({ method: "GET" })
  .inputValidator(listEngagementsInputSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "engagements.list");
    try {
      const tenant = await resolveTenantContext(request);

      if (!(await canListEngagements(tenant.user, data.clientId))) {
        throw new Error("NOT_FOUND");
      }

      if (!(await canReadClient(tenant.user, data.clientId))) {
        throw new Error("NOT_FOUND");
      }

      const rows = await listEngagementsForClient({
        user: tenant.user,
        clientId: data.clientId,
      });

      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return rows.map((row) => ({
        id: row.id,
        clientId: row.clientId,
        name: row.name,
        status: row.status,
        financialYear: row.financialYear,
        dueDate: row.dueDate?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      }));
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const getEngagementOverviewServerFn = createServerFn({ method: "GET" })
  .inputValidator(engagementOverviewInputSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "engagement.getOverview");
    try {
      const tenant = await resolveTenantContext(request);

      const result = await getEngagementOverview({
        user: tenant.user,
        clientId: data.clientId,
        engagementId: data.engagementId,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const listDocumentsServerFn = createServerFn({ method: "GET" })
  .inputValidator(paginatedDocumentsQuerySchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.list");
    try {
      const tenant = await resolveTenantContext(request);

      if (data.clientId && !(await canReadClient(tenant.user, data.clientId))) {
        throw new Error("NOT_FOUND");
      }

      if (data.clientIds?.length) {
        for (const clientId of data.clientIds) {
          if (!(await canReadClient(tenant.user, clientId))) {
            throw new Error("NOT_FOUND");
          }
        }
      }

      if (
        data.engagementId &&
        !(await canReadEngagement(tenant.user, data.engagementId))
      ) {
        throw new Error("NOT_FOUND");
      }

      const result = await listDocuments({
        user: tenant.user,
        query: data,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const uploadInitialDocumentServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as FormData)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.upload");
    const tenant = await resolveTenantContext(request);
    const requestContext = getAuditRequestContext(request);
    const env = getEnv();

    const userLimit = await consumeRateLimit({
      key: `upload:user:${tenant.user.id}`,
      maxAttempts: env.RATE_LIMIT_UPLOAD_USER_MAX_PER_MINUTE,
      windowSeconds: 60,
    });

    if (!userLimit.allowed) {
      throw createRateLimitResponse(userLimit.retryAfterSeconds);
    }

    const firmLimit = await consumeRateLimit({
      key: `upload:firm:${tenant.firmId}`,
      maxAttempts: env.RATE_LIMIT_UPLOAD_FIRM_MAX_PER_MINUTE,
      windowSeconds: 60,
    });

    if (!firmLimit.allowed) {
      throw createRateLimitResponse(firmLimit.retryAfterSeconds);
    }

    const formData = data;
    const title = getRequiredString(formData, "title");
    const documentType = getRequiredString(formData, "document_type");
    const clientId = getRequiredString(formData, "client_id");
    const engagementId = getRequiredString(formData, "engagement_id");
    const file = getRequiredFile(formData, "file");

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      const result = await createDocumentWithInitialVersion({
        user: tenant.user,
        title,
        documentType,
        clientId,
        engagementId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        fileBuffer,
        requestContext,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      throw error;
    }
  });

export const getDocumentDetailServerFn = createServerFn({ method: "GET" })
  .inputValidator(documentIdSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.detail");
    try {
      const tenant = await resolveTenantContext(request);

      const result = await getDocumentDetail({
        user: tenant.user,
        documentId: data.documentId,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const replaceDocumentVersionServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as FormData)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.replaceVersion");
    const tenant = await resolveTenantContext(request);
    const requestContext = getAuditRequestContext(request);
    const env = getEnv();

    const userLimit = await consumeRateLimit({
      key: `upload:user:${tenant.user.id}`,
      maxAttempts: env.RATE_LIMIT_UPLOAD_USER_MAX_PER_MINUTE,
      windowSeconds: 60,
    });

    if (!userLimit.allowed) {
      throw createRateLimitResponse(userLimit.retryAfterSeconds);
    }

    const firmLimit = await consumeRateLimit({
      key: `upload:firm:${tenant.firmId}`,
      maxAttempts: env.RATE_LIMIT_UPLOAD_FIRM_MAX_PER_MINUTE,
      windowSeconds: 60,
    });

    if (!firmLimit.allowed) {
      throw createRateLimitResponse(firmLimit.retryAfterSeconds);
    }

    const formData = data;
    const documentId = getRequiredString(formData, "document_id");
    const file = getRequiredFile(formData, "file");

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      const result = await createDocumentReplacementVersion({
        user: tenant.user,
        documentId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        fileBuffer,
        requestContext,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      throw error;
    }
  });

export const updateDocumentStatusServerFn = createServerFn({ method: "POST" })
  .inputValidator(documentStatusUpdateSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.updateStatus");
    try {
      const tenant = await resolveTenantContext(request);
      const requestContext = getAuditRequestContext(request);

      const result = await updateDocumentStatus({
        user: tenant.user,
        documentId: data.documentId,
        nextStatus: data.nextStatus,
        requestContext,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const bulkUpdateDocumentStatusServerFn = createServerFn({
  method: "POST",
})
  .inputValidator(bulkDocumentStatusUpdateSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.bulkUpdateStatus");
    try {
      const tenant = await resolveTenantContext(request);
      const requestContext = getAuditRequestContext(request);

      const result = await bulkUpdateDocumentStatus({
        user: tenant.user,
        documentIds: data.documentIds,
        nextStatus: data.nextStatus,
        requestContext,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

export const getDocumentDownloadUrlServerFn = createServerFn({ method: "GET" })
  .inputValidator(documentVersionDownloadSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const scope = startRequestLog(request, "documents.getDownloadUrl");
    try {
      const tenant = await resolveTenantContext(request);
      const requestContext = getAuditRequestContext(request);

      const result = await createSignedDownloadForVersion({
        user: tenant.user,
        documentId: data.documentId,
        versionNumber: data.versionNumber,
        requestContext,
      });
      logRequestSuccess(scope, {
        firmId: tenant.firmId,
        userId: tenant.user.id,
      });
      return result;
    } catch (error) {
      logRequestFailure(scope, error);
      throw error;
    }
  });

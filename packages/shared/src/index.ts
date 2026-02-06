import { z } from "zod";

export const documentCategorySchema = z.enum([
  "tax-return",
  "invoice",
  "bank-statement",
  "receipt",
]);

export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const userRoleSchema = z.enum(["admin", "manager", "staff"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const engagementDocumentsFilterSchema = z.object({
  clientId: z.string().uuid(),
  engagementId: z.string().uuid(),
  status: z.enum(["uploaded", "in_review", "final"]).optional(),
  documentType: z.string().trim().min(1).optional(),
});

export const documentIdSchema = z.object({
  documentId: z.string().uuid(),
});

export const documentVersionDownloadSchema = z.object({
  documentId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
});

export const documentStatusSchema = z.enum(["uploaded", "in_review", "final"]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const documentSortBySchema = z.enum([
  "title",
  "created_at",
  "updated_at",
  "status",
]);
export type DocumentSortBy = z.infer<typeof documentSortBySchema>;

export const paginatedDocumentsQuerySchema = z.object({
  clientId: z.string().uuid().optional(),
  engagementId: z.string().uuid().optional(),
  q: z.string().trim().min(1).optional(),
  status: documentStatusSchema.optional(),
  documentType: z.string().trim().min(1).optional(),
  uploadedDateStart: z.string().datetime().optional(),
  uploadedDateEnd: z.string().datetime().optional(),
  uploadedByUserId: z.string().uuid().optional(),
  fileType: z.string().trim().min(1).optional(),
  sortBy: documentSortBySchema.default("updated_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type PaginatedDocumentsQuery = z.infer<
  typeof paginatedDocumentsQuerySchema
>;

export const documentStatusUpdateSchema = z.object({
  documentId: z.string().uuid(),
  nextStatus: documentStatusSchema,
});

export const bulkDocumentStatusUpdateSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(200),
  nextStatus: documentStatusSchema,
});

export const paginatedAuditQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  action: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  userId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  engagementId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(200).default(20),
  offset: z.number().int().min(0).default(0),
});

export type PaginatedAuditQuery = z.infer<typeof paginatedAuditQuerySchema>;

export const exportAuditCsvQuerySchema = paginatedAuditQuerySchema.omit({
  limit: true,
  offset: true,
});

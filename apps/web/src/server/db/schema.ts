import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "staff"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "archived"]);
export const engagementStatusEnum = pgEnum("engagement_status", [
  "open",
  "closed",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "in_review",
  "final",
]);

export const firms = pgTable("firms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => ({
    firmIndex: index("users_firm_id_idx").on(table.firmId),
    emailUnique: unique("users_email_unique").on(table.email),
  }),
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    externalReference: text("external_reference"),
    status: clientStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    firmIndex: index("clients_firm_id_idx").on(table.firmId),
  }),
);

export const engagements = pgTable(
  "engagements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    financialYear: integer("financial_year").notNull(),
    status: engagementStatusEnum("status").notNull().default("open"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    firmIndex: index("engagements_firm_id_idx").on(table.firmId),
    clientIndex: index("engagements_client_id_idx").on(table.clientId),
  }),
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    documentType: text("document_type").notNull(),
    status: documentStatusEnum("status").notNull().default("uploaded"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    firmIndex: index("documents_firm_id_idx").on(table.firmId),
    clientIndex: index("documents_client_id_idx").on(table.clientId),
    engagementIndex: index("documents_engagement_id_idx").on(
      table.engagementId,
    ),
    updatedAtIndex: index("documents_updated_at_idx").on(table.updatedAt),
  }),
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => ({
    documentIndex: index("document_versions_document_id_idx").on(
      table.documentId,
    ),
    documentVersionUnique: unique(
      "document_versions_document_version_unique",
    ).on(table.documentId, table.versionNumber),
  }),
);

export const clientAssignments = pgTable(
  "client_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => ({
    uniqueClientUser: unique("client_assignments_client_user_unique").on(
      table.clientId,
      table.userId,
    ),
    firmUserIndex: index("client_assignments_firm_user_idx").on(
      table.firmId,
      table.userId,
    ),
    firmClientIndex: index("client_assignments_firm_client_idx").on(
      table.firmId,
      table.clientId,
    ),
  }),
);

export const engagementAssignments = pgTable(
  "engagement_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => ({
    uniqueEngagementUser: unique(
      "engagement_assignments_engagement_user_unique",
    ).on(table.engagementId, table.userId),
    firmUserIndex: index("engagement_assignments_firm_user_idx").on(
      table.firmId,
      table.userId,
    ),
    firmEngagementIndex: index("engagement_assignments_firm_engagement_idx").on(
      table.firmId,
      table.engagementId,
    ),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    firmIndex: index("audit_logs_firm_id_idx").on(table.firmId),
    userIndex: index("audit_logs_user_id_idx").on(table.userId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    firmIndex: index("sessions_firm_id_idx").on(table.firmId),
    userIndex: index("sessions_user_id_idx").on(table.userId),
    expiresAtIndex: index("sessions_expires_at_idx").on(table.expiresAt),
  }),
);

export const rateLimitCounters = pgTable(
  "rate_limit_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    keyWindowUnique: unique("rate_limit_counters_key_window_unique").on(
      table.key,
      table.windowStart,
    ),
    keyIndex: index("rate_limit_counters_key_idx").on(table.key),
    updatedAtIndex: index("rate_limit_counters_updated_at_idx").on(
      table.updatedAt,
    ),
  }),
);

export const firmRelations = relations(firms, ({ many }) => ({
  users: many(users),
  sessions: many(sessions),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  firm: one(firms, {
    fields: [users.firmId],
    references: [firms.id],
  }),
  sessions: many(sessions),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  firm: one(firms, {
    fields: [sessions.firmId],
    references: [firms.id],
  }),
}));

export type UserRole = (typeof userRoleEnum.enumValues)[number];

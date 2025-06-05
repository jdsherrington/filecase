// apps/api/src/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  clerkOrganizationId: varchar('clerk_organization_id', {
    length: 256,
  }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(), // Your internal ID
  clerkUserId: varchar('clerk_user_id', { length: 256 }).notNull().unique(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  firstName: varchar('first_name', { length: 256 }),
  lastName: varchar('last_name', { length: 256 }),
  // If using Clerk organizations, you'll want a way to link users to them.
  // This could be a direct link or through a join table if users can be in multiple orgs.
  // For simplicity now, let's assume a user belongs to one primary org in your app.
  primaryOrganizationId: uuid('primary_organization_id').references(
    () => organizations.id,
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

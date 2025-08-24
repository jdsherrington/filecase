import { pgTable, uuid, varchar, timestamp, text, integer, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const usersorgs = pgTable("usersorgs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	orgId: uuid().notNull(),
	isActive: varchar({ length: 1 }).default('Y').notNull(),
	role: varchar({ length: 80 }).notNull(),
	lastAccessed: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	email: varchar({ length: 80 }),
	phone: varchar({ length: 20 }),
	company: varchar({ length: 80 }),
	notes: text(),
	ownerId: uuid().notNull(),
	dateCreated: timestamp({ mode: 'string' }).defaultNow().notNull(),
	dateModified: timestamp({ mode: 'string' }).defaultNow().notNull(),
	orgId: uuid().notNull(),
});

export const files = pgTable("files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 80 }).notNull(),
	filetype: varchar({ length: 12 }).notNull(),
	filesize: integer().notNull(),
	tags: varchar({ length: 80 }).array(),
	orgId: uuid().notNull(),
	ownerId: uuid().notNull(),
	storageId: varchar({ length: 256 }).notNull(),
	dateCreated: timestamp({ mode: 'string' }).defaultNow().notNull(),
	dateModified: timestamp({ mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 80 }),
	contactId: uuid(),
	isDeleted: varchar({ length: 1 }).default('N').notNull(),
});

export const library = pgTable("library", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 80 }).notNull(),
	orgId: uuid().notNull(),
	ownerId: uuid().notNull(),
	dateCreated: timestamp({ mode: 'string' }).defaultNow().notNull(),
	dateModified: timestamp({ mode: 'string' }).defaultNow().notNull(),
	isDeleted: varchar({ length: 1 }).default('N').notNull(),
});

export const orgs = pgTable("orgs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 80 }).notNull(),
	dateCreated: timestamp({ mode: 'string' }).defaultNow().notNull(),
	dateModified: timestamp({ mode: 'string' }).defaultNow().notNull(),
	accentColor: varchar({ length: 10 }),
	avatarStorageId: varchar({ length: 256 }),
	filesStatus: varchar({ length: 80 }).array().default(["RAY['Draft'::text", "'Final'::tex"]),
	libraryStatus: varchar({ length: 80 }).array().default(["RAY['Draft'::text", "'Published'::tex"]),
	isDeleted: varchar({ length: 1 }).default('N').notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clerkId: varchar({ length: 256 }).notNull(),
	email: varchar({ length: 80 }).notNull(),
	firstname: varchar({ length: 80 }),
	lastname: varchar({ length: 80 }),
	dateCreated: timestamp({ mode: 'string' }).defaultNow().notNull(),
	dateModified: timestamp({ mode: 'string' }).defaultNow().notNull(),
	isDeleted: varchar({ length: 1 }).default('N').notNull(),
}, (table) => [
	unique("users_clerkId_unique").on(table.clerkId),
	unique("users_email_unique").on(table.email),
]);

CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"email" varchar(80),
	"phone" varchar(20),
	"company" varchar(80),
	"notes" text,
	"ownerId" uuid NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"dateModified" timestamp DEFAULT now() NOT NULL,
	"orgId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"filetype" varchar(12) NOT NULL,
	"filesize" integer NOT NULL,
	"tags" varchar(80)[],
	"orgId" uuid NOT NULL,
	"ownerId" uuid NOT NULL,
	"storageId" varchar(256) NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"dateModified" timestamp DEFAULT now() NOT NULL,
	"status" varchar(80),
	"contactId" uuid,
	"isDeleted" varchar(1) DEFAULT 'N' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"orgId" uuid NOT NULL,
	"ownerId" uuid NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"dateModified" timestamp DEFAULT now() NOT NULL,
	"isDeleted" varchar(1) DEFAULT 'N' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"dateModified" timestamp DEFAULT now() NOT NULL,
	"accentColor" varchar(10),
	"avatarStorageId" varchar(256),
	"filesStatus" varchar(80)[] DEFAULT '{"RAY['Draft'::text","'Final'::tex"}',
	"libraryStatus" varchar(80)[] DEFAULT '{"RAY['Draft'::text","'Published'::tex"}',
	"isDeleted" varchar(1) DEFAULT 'N' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usersorgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"orgId" uuid NOT NULL,
	"isActive" varchar(1) DEFAULT 'Y' NOT NULL,
	"role" varchar(80) NOT NULL,
	"lastAccessed" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_clerk_user_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_primary_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerkId" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "firstname" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastname" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dateCreated" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dateModified" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isDeleted" varchar(1) DEFAULT 'N' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_user_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "primary_organization_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId");
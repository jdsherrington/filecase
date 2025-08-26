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
	"filesStatus" varchar(80)[] DEFAULT '{"Draft","Final"}',
	"libraryStatus" varchar(80)[] DEFAULT '{"Draft","Published"}',
	"isDeleted" varchar(1) DEFAULT 'N' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerkId" varchar(256) NOT NULL,
	"email" varchar(80) NOT NULL,
	"firstname" varchar(80),
	"lastname" varchar(80),
	"dateCreated" timestamp DEFAULT now() NOT NULL,
	"dateModified" timestamp DEFAULT now() NOT NULL,
	"isDeleted" varchar(1) DEFAULT 'N' NOT NULL,
	CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usersorgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"orgId" uuid NOT NULL,
	"isActive" varchar(1) DEFAULT 'Y' NOT NULL,
	"role" varchar(80) NOT NULL,
	"lastAccessed" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usersorgs" ADD CONSTRAINT "usersorgs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
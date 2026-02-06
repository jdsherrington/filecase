CREATE TABLE "client_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	CONSTRAINT "client_assignments_client_user_unique" UNIQUE("client_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "engagement_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"engagement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	CONSTRAINT "engagement_assignments_engagement_user_unique" UNIQUE("engagement_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_assignments" ADD CONSTRAINT "client_assignments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_assignments" ADD CONSTRAINT "engagement_assignments_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_assignments" ADD CONSTRAINT "engagement_assignments_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_assignments" ADD CONSTRAINT "engagement_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_assignments" ADD CONSTRAINT "engagement_assignments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_assignments_firm_user_idx" ON "client_assignments" USING btree ("firm_id","user_id");--> statement-breakpoint
CREATE INDEX "client_assignments_firm_client_idx" ON "client_assignments" USING btree ("firm_id","client_id");--> statement-breakpoint
CREATE INDEX "engagement_assignments_firm_user_idx" ON "engagement_assignments" USING btree ("firm_id","user_id");--> statement-breakpoint
CREATE INDEX "engagement_assignments_firm_engagement_idx" ON "engagement_assignments" USING btree ("firm_id","engagement_id");
CREATE TABLE "rate_limit_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_counters_key_window_unique" UNIQUE("key","window_start")
);
--> statement-breakpoint
CREATE INDEX "rate_limit_counters_key_idx" ON "rate_limit_counters" USING btree ("key");--> statement-breakpoint
CREATE INDEX "rate_limit_counters_updated_at_idx" ON "rate_limit_counters" USING btree ("updated_at");
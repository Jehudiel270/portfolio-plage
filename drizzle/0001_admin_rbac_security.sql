CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"action" text NOT NULL,
	"target" text DEFAULT '' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_recovery_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_recovery_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "admin_users" DROP CONSTRAINT "admin_users_role_check";--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "admin_users" SET "permissions" = '[{"module":"projects","access":"write"},{"module":"skills","access":"write"},{"module":"journey","access":"write"},{"module":"categories","access":"write"},{"module":"profile","access":"write"},{"module":"appearance","access":"write"},{"module":"display","access":"write"},{"module":"labels","access":"write"},{"module":"seo","access":"write"},{"module":"contact","access":"write"},{"module":"messages","access":"write"},{"module":"security","access":"write"},{"module":"media","access":"write"}]'::jsonb;--> statement-breakpoint
UPDATE "admin_users" SET "role" = 'superadmin' WHERE "id" = (SELECT "id" FROM "admin_users" ORDER BY "id" LIMIT 1);--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_admin_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_recovery_codes" ADD CONSTRAINT "admin_recovery_codes_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_logs_created_idx" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_logs_actor_idx" ON "admin_audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "admin_recovery_codes_admin_idx" ON "admin_recovery_codes" USING btree ("admin_id");--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_check" CHECK ("admin_users"."role" in ('superadmin', 'admin', 'editor'));
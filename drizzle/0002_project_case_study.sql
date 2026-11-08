ALTER TABLE "projects" ADD COLUMN "role" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "results" jsonb DEFAULT '[]'::jsonb NOT NULL;

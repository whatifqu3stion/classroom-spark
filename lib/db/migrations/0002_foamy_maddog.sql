ALTER TABLE "activities" ADD COLUMN "resource_note" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "materials" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "teacher_note" text;
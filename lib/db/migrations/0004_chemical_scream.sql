CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"concepts_topics" text DEFAULT '' NOT NULL,
	"skills" text DEFAULT '' NOT NULL,
	"standards_objectives" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "technology_mode" text DEFAULT 'no_computer' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "source_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "source_unit_name" text;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_source_unit_id_units_id_fk" FOREIGN KEY ("source_unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"grade" text NOT NULL,
	"subject" text NOT NULL,
	"curriculum_framework" text,
	"curriculum_details" text,
	"general_context" text,
	"arrival_routine" text,
	"default_device_mode" text NOT NULL,
	"default_duration" integer NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructional_contexts" (
	"class_id" uuid PRIMARY KEY NOT NULL,
	"unit_or_project" text DEFAULT '' NOT NULL,
	"concepts_topics" text DEFAULT '' NOT NULL,
	"skills" text DEFAULT '' NOT NULL,
	"standards_objectives" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"eyebrow" text,
	"title" text NOT NULL,
	"task" text NOT NULL,
	"prompts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duration_minutes" integer NOT NULL,
	"device_mode" text NOT NULL,
	"arrival_instructions" text,
	"resource_url" text,
	"source_topic" text,
	"source_goal" text,
	"source_chip_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"style" text,
	"favorite" boolean DEFAULT false NOT NULL,
	"duplicated_from" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"active_class_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instructional_contexts" ADD CONSTRAINT "instructional_contexts_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chips" ADD CONSTRAINT "chips_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_state" ADD CONSTRAINT "app_state_active_class_id_classes_id_fk" FOREIGN KEY ("active_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
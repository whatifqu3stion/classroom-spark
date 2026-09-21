CREATE TABLE "curriculum_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"unit_id" uuid,
	"kind" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"subject" text NOT NULL,
	"framework" text,
	"programme_year" text,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"object_key" text,
	"content_hash" text NOT NULL,
	"publisher" text,
	"url" text,
	"edition" text,
	"retrieved_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "programme_year" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "curriculum_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "curriculum_sources" ADD CONSTRAINT "curriculum_sources_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_sources" ADD CONSTRAINT "curriculum_sources_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "curriculum_content_unique" ON "curriculum_sources" USING btree ("class_id","content_hash");
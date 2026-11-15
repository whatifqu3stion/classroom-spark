CREATE TABLE "homebases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid,
	"name" text NOT NULL,
	"tone" text DEFAULT 'paper' NOT NULL,
	"widgets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "homebases" ADD CONSTRAINT "homebases_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
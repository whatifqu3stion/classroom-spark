CREATE TABLE "context_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"details" text,
	"category_id" uuid,
	"scope" text NOT NULL,
	"class_id" uuid,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "source_activity_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "saved_context_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_contexts" ADD CONSTRAINT "saved_contexts_category_id_context_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."context_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "context_categories_name_idx" ON "context_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "saved_contexts_class_idx" ON "saved_contexts" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "saved_contexts_scope_idx" ON "saved_contexts" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "saved_contexts_archived_idx" ON "saved_contexts" USING btree ("archived");
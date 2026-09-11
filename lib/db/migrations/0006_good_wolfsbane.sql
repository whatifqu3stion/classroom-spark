ALTER TABLE "activities" ADD COLUMN "visuals" jsonb DEFAULT '[]'::jsonb NOT NULL;
UPDATE "activities"
SET "visuals" = jsonb_build_array(
  jsonb_build_object('url', "visual_url", 'description', "visual_description")
)
WHERE "visual_url" IS NOT NULL
  AND jsonb_array_length("visuals") = 0;
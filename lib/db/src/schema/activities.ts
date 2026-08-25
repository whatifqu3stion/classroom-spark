import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export type PresentationThemeSelection = {
  kind: "curated" | "custom";
  themeId?: string;
  accentId?: string;
  typographyId?: string;
  sourceThemeId?: string;
  anchors?: { background: string; text: string; accent: string };
};

export const activitiesTable = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classesTable.id, { onDelete: "cascade" }),
  eyebrow: text("eyebrow"),
  title: text("title").notNull(),
  task: text("task").notNull(),
  prompts: jsonb("prompts").$type<string[]>().notNull().default([]),
  durationMinutes: integer("duration_minutes").notNull(),
  deviceMode: text("device_mode").notNull(),
  arrivalInstructions: text("arrival_instructions"),
  resourceUrl: text("resource_url"),
  resourceNote: text("resource_note"),
  visualUrl: text("visual_url"),
  visualDescription: text("visual_description"),
  materials: jsonb("materials").$type<string[]>().notNull().default([]),
  teacherNote: text("teacher_note"),
  sourceTopic: text("source_topic"),
  sourceGoal: text("source_goal"),
  sourceChipIds: jsonb("source_chip_ids").$type<string[]>().notNull().default([]),
  style: text("style"),
  presentationTheme: jsonb("presentation_theme")
    .$type<PresentationThemeSelection | null>(),
  favorite: boolean("favorite").notNull().default(false),
  duplicatedFrom: uuid("duplicated_from"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;

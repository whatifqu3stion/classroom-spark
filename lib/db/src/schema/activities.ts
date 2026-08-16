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
  sourceTopic: text("source_topic"),
  sourceGoal: text("source_goal"),
  sourceChipIds: jsonb("source_chip_ids").$type<string[]>().notNull().default([]),
  style: text("style"),
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

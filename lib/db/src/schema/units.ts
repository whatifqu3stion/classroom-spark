import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Units are intentionally independent from classes so a teacher can reuse
 * the same unit across school years or multiple class sections.
 */
export const unitsTable = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  conceptsTopics: text("concepts_topics").notNull().default(""),
  skills: text("skills").notNull().default(""),
  standardsObjectives: text("standards_objectives").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertUnitSchema = createInsertSchema(unitsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof unitsTable.$inferSelect;
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const instructionalContextsTable = pgTable("instructional_contexts", {
  classId: uuid("class_id")
    .primaryKey()
    .references(() => classesTable.id, { onDelete: "cascade" }),
  unitOrProject: text("unit_or_project").notNull().default(""),
  conceptsTopics: text("concepts_topics").notNull().default(""),
  skills: text("skills").notNull().default(""),
  standardsObjectives: text("standards_objectives").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertInstructionalContextSchema = createInsertSchema(
  instructionalContextsTable,
).omit({
  updatedAt: true,
});
export type InsertInstructionalContext = z.infer<
  typeof insertInstructionalContextSchema
>;
export type InstructionalContext =
  typeof instructionalContextsTable.$inferSelect;

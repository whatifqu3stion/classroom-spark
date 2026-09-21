import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classesTable = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  subject: text("subject").notNull(),
  curriculumFramework: text("curriculum_framework"),
  programmeYear: text("programme_year"),
  curriculumDetails: text("curriculum_details"),
  generalContext: text("general_context"),
  arrivalRoutine: text("arrival_routine"),
  defaultDeviceMode: text("default_device_mode").notNull(),
  defaultDuration: integer("default_duration").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;

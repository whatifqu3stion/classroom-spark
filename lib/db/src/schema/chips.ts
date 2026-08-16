import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const chipsTable = pgTable("chips", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classesTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertChipSchema = createInsertSchema(chipsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertChip = z.infer<typeof insertChipSchema>;
export type Chip = typeof chipsTable.$inferSelect;

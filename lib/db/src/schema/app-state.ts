import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

// Single-user app: a single row (id="singleton") tracks the most recently used class.
export const appStateTable = pgTable("app_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  singletonKey: text("singleton_key").notNull().default("singleton").unique(),
  activeClassId: uuid("active_class_id").references(() => classesTable.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAppStateSchema = createInsertSchema(appStateTable).omit({
  id: true,
  singletonKey: true,
  updatedAt: true,
});
export type InsertAppState = z.infer<typeof insertAppStateSchema>;
export type AppStateRow = typeof appStateTable.$inferSelect;

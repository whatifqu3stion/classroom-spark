import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { classesTable } from "./classes";

export const homebasesTable = pgTable("homebases", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => classesTable.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  tone: text("tone").notNull().default("paper"),
  widgets: jsonb("widgets").$type<unknown[]>().notNull().default([]),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

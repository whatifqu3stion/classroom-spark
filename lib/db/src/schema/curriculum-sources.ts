import { pgTable, uuid, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { classesTable } from "./classes";
import { unitsTable } from "./units";

export type CurriculumObjective = { id: string; label: string; excerpt: string; locator: string; selected: boolean };
export type CurriculumSnapshot = {
  version: 1;
  focus: { objective: string; thinkingTask: string; responseMode: string; context: string; combinationKey: string };
  sources: Array<{ sourceId: string; version: number; title: string; kind: "manual" | "pdf" | "web"; subject: string; programmeYear: string | null; publisher: string | null; url: string | null; locator: string; excerpt: string; objective: string; retrievedAt: string | null }>;
};
export const curriculumSourcesTable = pgTable("curriculum_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classesTable.id, { onDelete: "restrict" }),
  unitId: uuid("unit_id").references(() => unitsTable.id, { onDelete: "restrict" }),
  kind: text("kind").$type<"manual" | "pdf" | "web">().notNull(),
  status: text("status").$type<"draft" | "approved" | "inactive" | "delete_failed">().notNull().default("draft"),
  version: integer("version").notNull().default(1),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  subject: text("subject").notNull(),
  framework: text("framework"),
  programmeYear: text("programme_year"),
  objectives: jsonb("objectives").$type<CurriculumObjective[]>().notNull().default([]),
  pages: jsonb("pages").$type<Array<{page: number; text: string}>>().notNull().default([]),
  objectKey: text("object_key"),
  contentHash: text("content_hash").notNull(),
  publisher: text("publisher"),
  url: text("url"),
  edition: text("edition"),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("curriculum_content_unique").on(table.classId, table.contentHash)]);
export type CurriculumSource = typeof curriculumSourcesTable.$inferSelect;
import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contextCategoriesTable = pgTable(
  "context_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("context_categories_name_idx").on(table.name)],
);

export const savedContextsTable = pgTable(
  "saved_contexts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    details: text("details"),
    categoryId: uuid("category_id").references(() => contextCategoriesTable.id, {
      onDelete: "set null",
    }),
    scope: text("scope").notNull(),
    // Keep the class id on archived class-scoped records after class deletion.
    // Selection always filters archived records, so this cannot promote them to
    // global context while preserving historical ownership information.
    classId: uuid("class_id"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (table) => [
    index("saved_contexts_class_idx").on(table.classId),
    index("saved_contexts_scope_idx").on(table.scope),
    index("saved_contexts_archived_idx").on(table.archived),
  ],
);

export const insertContextCategorySchema = createInsertSchema(
  contextCategoriesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContextCategory = z.infer<typeof insertContextCategorySchema>;
export type ContextCategory = typeof contextCategoriesTable.$inferSelect;

export const insertSavedContextSchema = createInsertSchema(savedContextsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSavedContext = z.infer<typeof insertSavedContextSchema>;
export type SavedContext = typeof savedContextsTable.$inferSelect;
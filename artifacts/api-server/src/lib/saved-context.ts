import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import {
  classesTable,
  contextCategoriesTable,
  db,
  savedContextsTable,
  type ContextCategory,
  type SavedContext,
} from "@workspace/db";

export type SavedContextScope = "class" | "global";

export type SavedContextSnapshot = {
  contextId?: string | null;
  label: string;
  category?: string | null;
  details?: string | null;
};

export type SavedContextInput = {
  label: string;
  details?: string | null;
  categoryId?: string | null;
  scope: SavedContextScope;
  classId?: string | null;
};

export class SavedContextError extends Error {
  constructor(
    readonly code: "invalid_request" | "not_found" | "conflict",
    message: string,
  ) {
    super(message);
    this.name = "SavedContextError";
  }
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized || null;
}

export function normalizeSavedContextInput(input: SavedContextInput): {
  label: string;
  details: string | null;
  categoryId: string | null;
  scope: SavedContextScope;
  classId: string | null;
} {
  const label = input.label.trim();
  const details = normalizeNullableText(input.details);
  const categoryId = normalizeNullableText(input.categoryId);
  const classId = normalizeNullableText(input.classId);

  if (characterLength(label) < 1 || characterLength(label) > 50) {
    throw new SavedContextError(
      "invalid_request",
      "Saved context labels must be 1–50 characters.",
    );
  }
  if (details && characterLength(details) > 300) {
    throw new SavedContextError(
      "invalid_request",
      "Saved context details must be at most 300 characters.",
    );
  }
  if (input.scope !== "class" && input.scope !== "global") {
    throw new SavedContextError(
      "invalid_request",
      "Saved context scope must be class or global.",
    );
  }
  if (input.scope === "class" && !classId) {
    throw new SavedContextError(
      "invalid_request",
      "Class-scoped saved context requires a classId.",
    );
  }
  if (input.scope === "global" && classId) {
    throw new SavedContextError(
      "invalid_request",
      "Global saved context cannot include a classId.",
    );
  }

  return {
    label,
    details,
    categoryId,
    scope: input.scope,
    classId,
  };
}

async function assertClassExists(classId: string): Promise<void> {
  const [row] = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.id, classId));
  if (!row) {
    throw new SavedContextError("not_found", "Class not found.");
  }
}

async function assertCategoryUsable(categoryId: string | null): Promise<void> {
  if (!categoryId) return;
  const [category] = await db
    .select({ id: contextCategoriesTable.id, archived: contextCategoriesTable.archived })
    .from(contextCategoriesTable)
    .where(eq(contextCategoriesTable.id, categoryId));
  if (!category) {
    throw new SavedContextError("not_found", "Saved context category not found.");
  }
  if (category.archived) {
    throw new SavedContextError(
      "invalid_request",
      "Archived saved context categories cannot be selected.",
    );
  }
}

export async function listSavedContextLibrary(classId: string): Promise<{
  items: Array<SavedContext & { categoryName: string | null }>;
  categories: ContextCategory[];
}> {
  await assertClassExists(classId);
  const [items, categories] = await Promise.all([
    db
      .select({
        context: savedContextsTable,
        categoryName: contextCategoriesTable.name,
      })
      .from(savedContextsTable)
      .leftJoin(
        contextCategoriesTable,
        eq(savedContextsTable.categoryId, contextCategoriesTable.id),
      )
      .where(
        and(
          eq(savedContextsTable.archived, false),
          or(
            eq(savedContextsTable.scope, "global"),
            eq(savedContextsTable.classId, classId),
          ),
        ),
      )
      .orderBy(
        asc(savedContextsTable.label),
        asc(savedContextsTable.createdAt),
      ),
    db
      .select()
      .from(contextCategoriesTable)
      .where(eq(contextCategoriesTable.archived, false))
      .orderBy(asc(contextCategoriesTable.name)),
  ]);

  return {
    items: items.map(({ context, categoryName }) => ({ ...context, categoryName })),
    categories,
  };
}

export async function createSavedContext(
  input: SavedContextInput,
): Promise<SavedContext & { categoryName: string | null }> {
  const normalized = normalizeSavedContextInput(input);
  if (normalized.classId) await assertClassExists(normalized.classId);
  await assertCategoryUsable(normalized.categoryId);

  const [created] = await db
    .insert(savedContextsTable)
    .values(normalized)
    .returning();
  return getSavedContextById(created.id);
}

export async function updateSavedContext(
  id: string,
  input: SavedContextInput,
): Promise<SavedContext & { categoryName: string | null }> {
  const normalized = normalizeSavedContextInput(input);
  if (normalized.classId) await assertClassExists(normalized.classId);
  await assertCategoryUsable(normalized.categoryId);

  const [existing] = await db
    .select()
    .from(savedContextsTable)
    .where(eq(savedContextsTable.id, id));
  if (!existing) {
    throw new SavedContextError("not_found", "Saved context not found.");
  }
  if (existing.archived) {
    throw new SavedContextError(
      "invalid_request",
      "Archived saved context cannot be edited.",
    );
  }

  const [updated] = await db
    .update(savedContextsTable)
    .set({ ...normalized, updatedAt: new Date() })
    .where(eq(savedContextsTable.id, id))
    .returning();
  return getSavedContextById(updated.id);
}

export async function archiveSavedContext(
  id: string,
): Promise<SavedContext & { categoryName: string | null }> {
  const [updated] = await db
    .update(savedContextsTable)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(savedContextsTable.id, id))
    .returning();
  if (!updated) {
    throw new SavedContextError("not_found", "Saved context not found.");
  }
  return getSavedContextById(updated.id);
}

export async function createContextCategory(
  nameInput: string,
): Promise<ContextCategory> {
  const name = nameInput.trim();
  if (characterLength(name) < 1 || characterLength(name) > 40) {
    throw new SavedContextError(
      "invalid_request",
      "Context category names must be 1–40 characters.",
    );
  }
  const [existing] = await db
    .select()
    .from(contextCategoriesTable)
    .where(sql`lower(${contextCategoriesTable.name}) = lower(${name})`);
  if (existing) {
    throw new SavedContextError(
      "conflict",
      "A context category with that name already exists.",
    );
  }
  const [created] = await db
    .insert(contextCategoriesTable)
    .values({ name })
    .returning();
  return created;
}

export async function getSavedContextById(
  id: string,
): Promise<SavedContext & { categoryName: string | null }> {
  const [row] = await db
    .select({
      context: savedContextsTable,
      categoryName: contextCategoriesTable.name,
    })
    .from(savedContextsTable)
    .leftJoin(
      contextCategoriesTable,
      eq(savedContextsTable.categoryId, contextCategoriesTable.id),
    )
    .where(eq(savedContextsTable.id, id));
  if (!row) {
    throw new SavedContextError("not_found", "Saved context not found.");
  }
  return { ...row.context, categoryName: row.categoryName };
}

export async function resolveSavedContextSnapshots(
  classId: string,
  ids: string[],
): Promise<{
  snapshots: SavedContextSnapshot[];
  ids: string[];
}> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length > 20) {
    throw new SavedContextError(
      "invalid_request",
      "Select no more than 20 saved context items.",
    );
  }
  if (uniqueIds.length !== ids.length) {
    throw new SavedContextError(
      "invalid_request",
      "Saved context selections must not contain duplicate ids.",
    );
  }
  if (!uniqueIds.length) return { snapshots: [], ids: [] };

  await assertClassExists(classId);
  const rows = await db
    .select({
      context: savedContextsTable,
      categoryName: contextCategoriesTable.name,
    })
    .from(savedContextsTable)
    .leftJoin(
      contextCategoriesTable,
      eq(savedContextsTable.categoryId, contextCategoriesTable.id),
    )
    .where(inArray(savedContextsTable.id, uniqueIds));
  const byId = new Map(rows.map((row) => [row.context.id, row]));
  for (const id of uniqueIds) {
    const row = byId.get(id);
    if (
      !row ||
      row.context.archived ||
      (row.context.scope === "class" && row.context.classId !== classId) ||
      (row.context.scope !== "class" && row.context.scope !== "global")
    ) {
      throw new SavedContextError(
        "not_found",
        "One or more selected saved context items are no longer available for this class.",
      );
    }
  }

  return {
    ids: uniqueIds,
    snapshots: uniqueIds.map((id) => {
      const row = byId.get(id)!;
      return {
        contextId: row.context.id,
        label: row.context.label,
        category: row.categoryName,
        details: row.context.details,
      };
    }),
  };
}

export async function markSavedContextsUsed(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await db
    .update(savedContextsTable)
    .set({ lastUsedAt: new Date() })
    .where(inArray(savedContextsTable.id, ids));
}
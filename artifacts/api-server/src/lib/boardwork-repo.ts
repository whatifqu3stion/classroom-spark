import { eq } from "drizzle-orm";
import {
  db,
  classesTable,
  instructionalContextsTable,
  chipsTable,
  activitiesTable,
  appStateTable,
  type Class,
  type InstructionalContext,
  type Chip,
  type Activity,
  type InsertClass,
  unitsTable,
  type Unit,
} from "@workspace/db";
import { getActivityCompatibilityTitle } from "./activity-title";
import {
  getCanonicalPresentationVisuals,
  getLegacyPresentationVisualFields,
} from "./presentation-visuals";

const APP_STATE_KEY = "singleton";

/**
 * Returns the singleton app-state row, creating it if it does not exist.
 */
export async function ensureAppStateRow(): Promise<{
  id: string;
  activeClassId: string | null;
}> {
  const [row] = await db
    .insert(appStateTable)
    .values({ singletonKey: APP_STATE_KEY })
    .onConflictDoUpdate({
      target: appStateTable.singletonKey,
      set: { singletonKey: APP_STATE_KEY },
    })
    .returning();
  return { id: row.id, activeClassId: row.activeClassId };
}

export async function getActiveClassId(): Promise<string | null> {
  const row = await ensureAppStateRow();
  return row.activeClassId;
}

export async function setActiveClassId(
  classId: string | null,
): Promise<string | null> {
  const [updated] = await db
    .insert(appStateTable)
    .values({ singletonKey: APP_STATE_KEY, activeClassId: classId })
    .onConflictDoUpdate({
      target: appStateTable.singletonKey,
      set: { activeClassId: classId },
    })
    .returning();
  return updated.activeClassId;
}

/**
 * Atomically create a class, seed its instructional context, and make it the
 * most recently used class.
 */
export async function createClassWithContext(
  input: InsertClass,
): Promise<Class> {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(classesTable)
      .values(input)
      .returning();

    await tx
      .insert(instructionalContextsTable)
      .values({ classId: created.id });

    await tx
      .insert(appStateTable)
      .values({
        singletonKey: APP_STATE_KEY,
        activeClassId: created.id,
      })
      .onConflictDoUpdate({
        target: appStateTable.singletonKey,
        set: { activeClassId: created.id },
      });

    return created;
  });
}

export async function loadAppState(): Promise<{
  classes: Class[];
  instructionalContexts: InstructionalContext[];
  units: Unit[];
  chips: Chip[];
  activities: Activity[];
  activeClassId: string | null;
}> {
  const activeClassId = await getActiveClassId();
  await ensureLegacyUnits();
  const [classes, instructionalContexts, units, chips, activities] = await Promise.all([
    db.select().from(classesTable).orderBy(classesTable.name),
    db.select().from(instructionalContextsTable),
    db.select().from(unitsTable).orderBy(unitsTable.name),
    db.select().from(chipsTable).orderBy(chipsTable.createdAt),
    db.select().from(activitiesTable).orderBy(activitiesTable.createdAt),
  ]);
  return { classes, instructionalContexts, units, chips, activities, activeClassId };
}

/**
 * Older versions stored the current unit and its notes on a class-scoped
 * instructional context. Copy non-empty legacy records into the reusable unit
 * library once, while leaving the old columns in place for compatibility.
 */
async function ensureLegacyUnits(): Promise<void> {
  await db.transaction(async (tx) => {
    const [state] = await tx
      .insert(appStateTable)
      .values({ singletonKey: APP_STATE_KEY })
      .onConflictDoUpdate({
        target: appStateTable.singletonKey,
        set: { singletonKey: APP_STATE_KEY },
      })
      .returning({
        id: appStateTable.id,
        legacyUnitsMigratedAt: appStateTable.legacyUnitsMigratedAt,
      });

    if (state.legacyUnitsMigratedAt) return;

    const [legacyContexts, existingUnits] = await Promise.all([
      tx.select().from(instructionalContextsTable),
      tx.select().from(unitsTable),
    ]);
    const existingKeys = new Set(
      existingUnits.map((unit) =>
        [unit.name, unit.conceptsTopics, unit.skills, unit.standardsObjectives].join("\u0000"),
      ),
    );

    for (const context of legacyContexts) {
      const name = context.unitOrProject.trim();
      if (!name) continue;
      const values = {
        name,
        conceptsTopics: context.conceptsTopics,
        skills: context.skills,
        standardsObjectives: context.standardsObjectives,
      };
      const key = [
        values.name,
        values.conceptsTopics,
        values.skills,
        values.standardsObjectives,
      ].join("\u0000");
      if (existingKeys.has(key)) continue;
      await tx.insert(unitsTable).values(values);
      existingKeys.add(key);
    }

    await tx
      .update(appStateTable)
      .set({ legacyUnitsMigratedAt: new Date() })
      .where(eq(appStateTable.id, state.id));
  });
}

/**
 * Atomically delete a class. FK ON DELETE CASCADE removes instructional
 * context, chips, and activities. Within the same transaction, if the deleted
 * class was the active (most recently used) class, reassign the active class to
 * the next remaining class (alphabetical) or null.
 */
export async function deleteClassCascade(classId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(classesTable)
      .where(eq(classesTable.id, classId))
      .returning({ id: classesTable.id });

    if (!deleted) {
      return false;
    }

    const [state] = await tx
      .insert(appStateTable)
      .values({ singletonKey: APP_STATE_KEY })
      .onConflictDoUpdate({
        target: appStateTable.singletonKey,
        set: { singletonKey: APP_STATE_KEY },
      })
      .returning();

    if (state.activeClassId === classId) {
      const [next] = await tx
        .select({ id: classesTable.id })
        .from(classesTable)
        .orderBy(classesTable.name)
        .limit(1);
      await tx
        .update(appStateTable)
        .set({ activeClassId: next?.id ?? null })
        .where(eq(appStateTable.id, state.id));
    }

    return true;
  });
}

/**
 * Removes every non-favorited activity in one database operation. Favorites
 * are protected by the database predicate rather than the client selection.
 */
export async function deleteNonFavoriteActivities(): Promise<number> {
  const deleted = await db
    .delete(activitiesTable)
    .where(eq(activitiesTable.favorite, false))
    .returning({ id: activitiesTable.id });

  return deleted.length;
}

/**
 * Duplicate an activity as a new editable record. The original is not mutated.
 * The copy sets duplicatedFrom to the source id and resets favorite to false.
 */
export async function duplicateActivity(
  activityId: string,
): Promise<Activity | null> {
  const [source] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, activityId));

  if (!source) {
    return null;
  }

  const visuals = getCanonicalPresentationVisuals(source);
  const [copy] = await db
    .insert(activitiesTable)
    .values({
      classId: source.classId,
      eyebrow: source.eyebrow,
      title: getActivityCompatibilityTitle(source.task),
      task: source.task,
      prompts: source.prompts,
      durationMinutes: source.durationMinutes,
      deviceMode: source.deviceMode,
      technologyMode: source.technologyMode,
      arrivalInstructions: source.arrivalInstructions,
      resourceUrl: source.resourceUrl,
      resourceNote: source.resourceNote,
      visuals,
      ...getLegacyPresentationVisualFields(visuals),
      materials: source.materials,
      teacherNote: source.teacherNote,
      sourceTopic: source.sourceTopic,
      sourceGoal: source.sourceGoal,
      sourceUnitId: source.sourceUnitId,
      sourceUnitName: source.sourceUnitName,
      sourceChipIds: source.sourceChipIds,
      style: source.style,
      presentationTheme: source.presentationTheme,
      favorite: false,
      duplicatedFrom: source.id,
    })
    .returning();

  return copy;
}

import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  activitiesTable,
  appStateTable,
  classesTable,
  db,
  instructionalContextsTable,
  unitsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { loadAppState } from "./boardwork-repo";

describe.sequential("legacy reusable-unit migration", () => {
  let classId: string;
  let unitName: string;
  let originalMigrationTimestamp: Date | null | undefined;

  beforeEach(async () => {
    classId = randomUUID();
    unitName = `Legacy unit ${randomUUID()}`;

    const [state] = await db
      .select({ id: appStateTable.id, legacyUnitsMigratedAt: appStateTable.legacyUnitsMigratedAt })
      .from(appStateTable)
      .limit(1);
    originalMigrationTimestamp = state?.legacyUnitsMigratedAt;

    await db
      .insert(appStateTable)
      .values({ singletonKey: "singleton" })
      .onConflictDoUpdate({
        target: appStateTable.singletonKey,
        set: { legacyUnitsMigratedAt: null },
      });
    await db.insert(classesTable).values({
      id: classId,
      name: `Migration test ${classId.slice(0, 6)}`,
      grade: "5",
      subject: "Science",
      defaultDeviceMode: "off",
      defaultDuration: 7,
    });
    await db.insert(instructionalContextsTable).values({
      classId,
      unitOrProject: unitName,
      conceptsTopics: "legacy concepts",
      skills: "legacy skills",
      standardsObjectives: "legacy objectives",
    });
  });

  afterEach(async () => {
    await db.delete(classesTable).where(eq(classesTable.id, classId));
    await db.delete(unitsTable).where(eq(unitsTable.name, unitName));
    const [state] = await db
      .select({ id: appStateTable.id })
      .from(appStateTable)
      .limit(1);
    if (state) {
      await db
        .update(appStateTable)
        .set({ legacyUnitsMigratedAt: originalMigrationTimestamp ?? null })
        .where(eq(appStateTable.id, state.id));
    }
  });

  it("does not recreate a migrated unit after edit or removal", async () => {
    const migrated = (await loadAppState()).units.find((unit) => unit.name === unitName);
    expect(migrated).toBeDefined();

    const editedName = `${unitName} edited`;
    await db.update(unitsTable).set({ name: editedName }).where(eq(unitsTable.id, migrated!.id));
    expect((await loadAppState()).units.filter((unit) => unit.name === unitName)).toHaveLength(0);
    expect((await loadAppState()).units.some((unit) => unit.name === editedName)).toBe(true);

    await db.delete(unitsTable).where(eq(unitsTable.id, migrated!.id));
    const afterRemoval = await loadAppState();
    expect(afterRemoval.units.some((unit) => unit.name === unitName || unit.name === editedName)).toBe(false);
  });

  it("keeps an activity source name after its reusable unit is removed", async () => {
    const [unit] = await db
      .insert(unitsTable)
      .values({ name: unitName })
      .returning();
    const [activity] = await db
      .insert(activitiesTable)
      .values({
        classId,
        title: "Snapshot test",
        task: "Use the saved context.",
        durationMinutes: 5,
        deviceMode: "off",
        sourceUnitId: unit.id,
        sourceUnitName: unit.name,
      })
      .returning();

    await db.delete(unitsTable).where(eq(unitsTable.id, unit.id));
    const [preserved] = await db
      .select({
        sourceUnitId: activitiesTable.sourceUnitId,
        sourceUnitName: activitiesTable.sourceUnitName,
      })
      .from(activitiesTable)
      .where(eq(activitiesTable.id, activity.id));

    expect(preserved).toEqual({ sourceUnitId: null, sourceUnitName: unitName });
  });
});
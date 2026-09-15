import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  activitiesTable,
  appStateTable,
  classesTable,
  contextCategoriesTable,
  db,
  savedContextsTable,
} from "@workspace/db";
import {
  archiveSavedContext,
  createSavedContext,
  listSavedContextLibrary,
  resolveSavedContextSnapshots,
  SavedContextError,
  updateSavedContext,
} from "./saved-context";
import {
  deleteClassCascade,
  setActiveClassId,
} from "./boardwork-repo";
import { generateAndSaveActivity } from "../services/ai/generation-service";
import {
  GenerationError,
  type BoardworkGenerationProvider,
  type GeneratedActivity,
} from "../services/ai/types";

const generatedActivity: GeneratedActivity = {
  eyebrow: "DO NOW",
  task: "Explain one observation using evidence.",
  prompts: ["Name the evidence.", "Explain what it supports."],
  durationMinutes: 7,
  deviceMode: "off",
  materials: ["notebook"],
  resourceUrl: null,
  teacherNote: null,
  activityStyle: "Explain / Reason",
};

describe.sequential("saved context persistence", () => {
  let classId: string;
  let categoryId: string;
  let originalActiveClassId: string | null = null;
  let fixtureContextIds: string[] = [];

  beforeEach(async () => {
    classId = randomUUID();
    categoryId = randomUUID();
    fixtureContextIds = [];
    const [state] = await db
      .select({ activeClassId: appStateTable.activeClassId })
      .from(appStateTable)
      .limit(1);
    originalActiveClassId = state?.activeClassId ?? null;

    await db.insert(classesTable).values({
      id: classId,
      name: `Saved context test ${classId.slice(0, 6)}`,
      grade: "5",
      subject: "Science",
      defaultDeviceMode: "off",
      defaultDuration: 7,
    });
    await db.insert(contextCategoriesTable).values({
      id: categoryId,
      name: `Test category ${classId.slice(0, 6)}`,
    });
  });

  afterEach(async () => {
    await db.delete(activitiesTable).where(eq(activitiesTable.classId, classId));
    if (fixtureContextIds.length) {
      await db
        .delete(savedContextsTable)
        .where(inArray(savedContextsTable.id, fixtureContextIds));
    }
    await db
      .delete(contextCategoriesTable)
      .where(eq(contextCategoriesTable.id, categoryId));
    await db.delete(classesTable).where(eq(classesTable.id, classId));
    await setActiveClassId(originalActiveClassId);
  });

  it("trims bounded multilingual fields and rejects invalid scope", async () => {
    const context = await createSavedContext({
      label: "  e\u0301vidence • 根拠  ",
      details: "  اشرح بالدليل  ",
      categoryId,
      scope: "class",
      classId,
    });
    fixtureContextIds.push(context.id);

    expect(context).toMatchObject({
      label: "e\u0301vidence • 根拠",
      details: "اشرح بالدليل",
      categoryId,
      classId,
      scope: "class",
    });
    await expect(
      createSavedContext({
        label: "Global with class",
        scope: "global",
        classId,
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
    });
    await expect(
      createSavedContext({
        label: "x".repeat(51),
        scope: "global",
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
    });
  });

  it("lists class and global records, then removes archived records", async () => {
    const classContext = await createSavedContext({
      label: "Class-only",
      categoryId,
      scope: "class",
      classId,
    });
    fixtureContextIds.push(classContext.id);
    const globalContext = await createSavedContext({
      label: "All classes",
      scope: "global",
    });
    fixtureContextIds.push(globalContext.id);

    const initial = await listSavedContextLibrary(classId);
    expect(initial.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([classContext.id, globalContext.id]),
    );
    expect(initial.categories.some((category) => category.id === categoryId)).toBe(true);

    const updated = await updateSavedContext(classContext.id, {
      label: "Edited",
      details: null,
      categoryId: null,
      scope: "global",
      classId: null,
    });
    expect(updated).toMatchObject({
      label: "Edited",
      scope: "global",
      classId: null,
    });

    await archiveSavedContext(globalContext.id);
    const afterArchive = await listSavedContextLibrary(classId);
    expect(afterArchive.items.map((item) => item.id)).not.toContain(globalContext.id);
  });

  it("rejects stale or wrong-class selections before generation", async () => {
    const context = await createSavedContext({
      label: "Only this class",
      scope: "class",
      classId,
    });
    fixtureContextIds.push(context.id);
    await archiveSavedContext(context.id);

    await expect(resolveSavedContextSnapshots(classId, [context.id])).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("uses selected structured context and updates recency only after success", async () => {
    const context = await createSavedContext({
      label: "Evidence first",
      details: "Use one concrete observation.",
      categoryId,
      scope: "class",
      classId,
    });
    fixtureContextIds.push(context.id);
    let capturedContext: string | undefined;
    const provider: BoardworkGenerationProvider = {
      async generate(generationContext) {
        capturedContext = JSON.stringify(generationContext.today.savedContext);
        return generatedActivity;
      },
    };

    const created = await generateAndSaveActivity(
      {
        classId,
        chipIds: [],
        savedContextIds: [context.id],
        deviceMode: "off",
        durationMinutes: 7,
        surprise: false,
      },
      provider,
    );
    expect(capturedContext).toContain("Evidence first");
    expect(capturedContext).toContain("Use one concrete observation.");

    const [used] = await db
      .select({ lastUsedAt: savedContextsTable.lastUsedAt })
      .from(savedContextsTable)
      .where(eq(savedContextsTable.id, context.id));
    expect(used.lastUsedAt).toBeInstanceOf(Date);
    expect(created.savedContextSnapshot).toEqual([
      {
        contextId: context.id,
        label: "Evidence first",
        category: `Test category ${classId.slice(0, 6)}`,
        details: "Use one concrete observation.",
      },
    ]);

    const failedContext = await createSavedContext({
      label: "Failed generation",
      scope: "class",
      classId,
    });
    fixtureContextIds.push(failedContext.id);
    await expect(
      generateAndSaveActivity(
        {
          classId,
          chipIds: [],
          savedContextIds: [failedContext.id],
          deviceMode: "off",
          durationMinutes: 7,
          surprise: false,
        },
        {
          async generate() {
            throw new GenerationError("provider", "bounded test failure");
          },
        },
      ),
    ).rejects.toMatchObject({ code: "provider" });
    const [notUsed] = await db
      .select({ lastUsedAt: savedContextsTable.lastUsedAt })
      .from(savedContextsTable)
      .where(eq(savedContextsTable.id, failedContext.id));
    expect(notUsed.lastUsedAt).toBeNull();
  });

  it("reuses historical snapshots after live context changes", async () => {
    const context = await createSavedContext({
      label: "Original label",
      details: "Original details",
      scope: "class",
      classId,
    });
    fixtureContextIds.push(context.id);
    const source = await generateAndSaveActivity(
      {
        classId,
        chipIds: [],
        savedContextIds: [context.id],
        deviceMode: "off",
        durationMinutes: 7,
        surprise: false,
      },
      { async generate() { return generatedActivity; } },
    );
    await updateSavedContext(context.id, {
      label: "Renamed live context",
      details: "Changed details",
      categoryId: null,
      scope: "class",
      classId,
    });
    await archiveSavedContext(context.id);

    let replayed: string | undefined;
    await generateAndSaveActivity(
      {
        classId,
        chipIds: [],
        sourceActivityId: source.id,
        deviceMode: "off",
        durationMinutes: 7,
        surprise: false,
      },
      {
        async generate(generationContext) {
          replayed = JSON.stringify(generationContext.today.savedContext);
          return generatedActivity;
        },
      },
    );
    expect(replayed).toContain("Original label");
    expect(replayed).toContain("Original details");
    expect(replayed).not.toContain("Renamed live context");
  });

  it("archives class-scoped records when deleting a class without promoting them", async () => {
    const context = await createSavedContext({
      label: "Class archive",
      scope: "class",
      classId,
    });
    fixtureContextIds.push(context.id);
    await setActiveClassId(classId);
    await expect(deleteClassCascade(classId)).resolves.toBe(true);

    const [archived] = await db
      .select({
        archived: savedContextsTable.archived,
        scope: savedContextsTable.scope,
        classId: savedContextsTable.classId,
      })
      .from(savedContextsTable)
      .where(eq(savedContextsTable.id, context.id));
    expect(archived).toEqual({ archived: true, scope: "class", classId });
  });
});
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { activitiesTable, classesTable, curriculumSourcesTable, db } from "@workspace/db";
import { duplicateActivity } from "../../lib/boardwork-repo";
import { generateAndSaveActivity } from "./generation-service";
import type { BoardworkGenerationContext, BoardworkGenerationProvider } from "./types";

describe.sequential("curriculum generation persistence with isolated fixtures", () => {
  let classId: string;
  let sourceId: string;
  let seen: BoardworkGenerationContext[];
  let calls: number;
  const tasks = [
    "Name one user need for an easy-grip cup.",
    "Compare two handles for someone wearing gloves.",
    "Sketch an accessible cupboard handle and explain it.",
    "Suggest a test for a handle's ease of use.",
  ];
  const provider: BoardworkGenerationProvider = {
    async generate(context) {
      seen.push(structuredClone(context));
      return { eyebrow: null, task: tasks[calls++ % tasks.length], prompts: [],
        durationMinutes: context.today.durationMinutes, deviceMode: context.today.deviceMode,
        materials: [], resourceUrl: null, teacherNote: null, activityStyle: "Explain / Reason" };
    },
  };
  const input = () => ({ classId, chipIds: [], deviceMode: "off" as const, durationMinutes: 5, surprise: false });
  beforeEach(async () => {
    vi.stubEnv("DEPLOYMENT_ACCESS_PROTECTED", "true");
    classId = randomUUID(); sourceId = randomUUID(); seen = []; calls = 0;
    await db.insert(classesTable).values({ id: classId, name: "Curriculum fixture", grade: "7", subject: "Design",
      curriculumFramework: "MYP", programmeYear: "2", defaultDeviceMode: "off", defaultDuration: 5 });
    await db.insert(curriculumSourcesTable).values({
      id: sourceId, classId, kind: "manual", status: "approved", version: 1,
      title: "Teacher design notes", subject: "Design", framework: "MYP", programmeYear: "2",
      contentHash: randomUUID(), approvedAt: new Date(),
      pages: [{ page: 1, text: "Identify and explain a user's needs." }],
      objectives: [{ id: "user-needs", label: "Identify user needs", excerpt: "Identify and explain a user's needs.",
        locator: "Paragraph 1", selected: true }],
    });
  });
  afterEach(async () => {
    await db.delete(curriculumSourcesTable).where(eq(curriculumSourcesTable.classId, classId));
    await db.delete(classesTable).where(eq(classesTable.id, classId));
    vi.unstubAllEnvs();
  });

  it("uses approved evidence, removes draft evidence from future planning, and preserves historical/duplicate/remix snapshots after deletion", async () => {
    const first = await generateAndSaveActivity(input(), provider);
    const basis = first.curriculumSnapshot;
    expect(basis?.sources[0]).toMatchObject({ sourceId, version: 1, objective: "Identify user needs", locator: "Paragraph 1" });
    expect(seen[0].curriculumPlan?.focus.objective).toBe("Identify user needs");
    await db.update(curriculumSourcesTable).set({ version: 2, status: "draft", approvedAt: null })
      .where(eq(curriculumSourcesTable.id, sourceId));
    const next = await generateAndSaveActivity(input(), provider);
    expect(next.curriculumSnapshot?.sources).toEqual([]);
    await db.delete(curriculumSourcesTable).where(eq(curriculumSourcesTable.id, sourceId));
    const [saved] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, first.id));
    expect(saved.curriculumSnapshot).toEqual(basis);
    const copied = await duplicateActivity(first.id);
    expect(copied?.curriculumSnapshot).toEqual(basis);
    const remixed = await generateAndSaveActivity({ ...input(), sourceActivityId: first.id }, provider);
    expect(remixed.curriculumSnapshot).toEqual(basis);
  });

  it("never uses an incompatible programme year or a historical private basis after access protection is disabled", async () => {
    await db.update(curriculumSourcesTable).set({ programmeYear: "3" }).where(eq(curriculumSourcesTable.id, sourceId));
    expect((await generateAndSaveActivity(input(), provider)).curriculumSnapshot?.sources).toEqual([]);
    await db.update(curriculumSourcesTable).set({ programmeYear: "2" }).where(eq(curriculumSourcesTable.id, sourceId));
    const grounded = await generateAndSaveActivity(input(), provider);
    expect(grounded.curriculumSnapshot?.sources).toHaveLength(1);
    vi.stubEnv("DEPLOYMENT_ACCESS_PROTECTED", "");
    const remixed = await generateAndSaveActivity({ ...input(), sourceActivityId: grounded.id }, provider);
    expect(remixed.curriculumSnapshot?.sources).toEqual([]);
  });
});
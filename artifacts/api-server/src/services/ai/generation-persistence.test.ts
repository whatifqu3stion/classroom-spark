import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  activitiesTable,
  chipsTable,
  classesTable,
  db,
  instructionalContextsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateAndSaveActivity } from "./generation-service";
import {
  GenerationError,
  type BoardworkGenerationContext,
  type BoardworkGenerationProvider,
  type GeneratedActivity,
} from "./types";

const validActivity: GeneratedActivity = {
  eyebrow: "DO NOW",
  title: "Use Evidence",
  task: "Study the adaptation described in the resource and explain how it helps the animal survive.",
  prompts: ["Name one detail.", "Explain what the detail shows."],
  durationMinutes: 7,
  deviceMode: "on",
  materials: ["notebook", "pencil"],
  resourceUrl: "https://example.com/adaptations",
  teacherNote: "Look for a claim supported by one concrete detail.",
  activityStyle: "Explain / Reason",
};

describe.sequential("generation persistence", () => {
  let classId: string;
  let chipId: string;

  beforeEach(async () => {
    classId = randomUUID();
    chipId = randomUUID();

    await db.insert(classesTable).values({
      id: classId,
      name: "Generation persistence test",
      grade: "5",
      subject: "Science",
      curriculumFramework: "NGSS",
      curriculumDetails: "Explain how structures support survival.",
      generalContext: "Use accessible language.",
      arrivalRoutine: "Open your notebook and begin silently.",
      defaultDeviceMode: "off",
      defaultDuration: 7,
    });
    await db.insert(instructionalContextsTable).values({
      classId,
      unitOrProject: "Animal adaptations",
      conceptsTopics: "structures and survival",
      skills: "observation and evidence",
      standardsObjectives: "Support a claim with evidence.",
    });
    await db.insert(chipsTable).values({
      id: chipId,
      classId,
      label: "explain with evidence",
    });

    for (let index = 1; index <= 4; index += 1) {
      await db.insert(activitiesTable).values({
        classId,
        title: `History ${index}`,
        task: `Historical task ${index}`,
        prompts: [],
        durationMinutes: 5,
        deviceMode: "off",
        materials: [],
        style: index % 2 ? "Quick Write" : "Observe & Notice",
        createdAt: new Date(Date.UTC(2026, 0, index)),
      });
    }
  });

  afterEach(async () => {
    await db.delete(classesTable).where(eq(classesTable.id, classId));
  });

  it("assembles canonical context and saves the validated activity once", async () => {
    let capturedContext: BoardworkGenerationContext | undefined;
    const provider: BoardworkGenerationProvider = {
      async generate(context) {
        capturedContext = context;
        return validActivity;
      },
    };

    const created = await generateAndSaveActivity(
      {
        classId,
        topic: "bird beaks",
        goal: "support a prediction with evidence",
        chipIds: [chipId],
        deviceMode: "on",
        durationMinutes: 7,
        activityStyle: "Explain / Reason",
        teacherProvidedUrl: "https://example.com/adaptations",
        teacherProvidedResourceNote: "An illustrated adaptation article.",
        surprise: false,
      },
      provider,
    );

    expect(capturedContext?.classProfile).toMatchObject({
      grade: "5",
      subject: "Science",
      arrivalRoutine: "Open your notebook and begin silently.",
    });
    expect(capturedContext?.instructionalContext).toMatchObject({
      unitOrProject: "Animal adaptations",
      skills: "observation and evidence",
    });
    expect(capturedContext?.today.focusChips).toEqual([
      "explain with evidence",
    ]);
    expect(capturedContext?.recentActivities.map((item) => item.title)).toEqual([
      "History 4",
      "History 3",
      "History 2",
    ]);
    expect(created).toMatchObject({
      classId,
      title: validActivity.title,
      resourceUrl: "https://example.com/adaptations",
      resourceNote: "An illustrated adaptation article.",
      materials: validActivity.materials,
      teacherNote: validActivity.teacherNote,
      sourceChipIds: [chipId],
    });

    const rows = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.classId, classId));
    expect(rows).toHaveLength(5);
  });

  it("does not save after both structured-output attempts are malformed", async () => {
    let calls = 0;
    const provider: BoardworkGenerationProvider = {
      async generate() {
        calls += 1;
        throw new GenerationError("malformed", "Invalid structured output");
      },
    };

    await expect(
      generateAndSaveActivity(
        {
          classId,
          chipIds: [],
          deviceMode: "off",
          durationMinutes: 7,
          surprise: false,
        },
        provider,
      ),
    ).rejects.toMatchObject({ code: "malformed" });
    expect(calls).toBe(2);

    const rows = await db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.classId, classId));
    expect(rows).toHaveLength(4);
  });

  it("rejects a chip outside the class before calling the provider", async () => {
    let calls = 0;
    const provider: BoardworkGenerationProvider = {
      async generate() {
        calls += 1;
        return { ...validActivity, deviceMode: "off", resourceUrl: null };
      },
    };

    await expect(
      generateAndSaveActivity(
        {
          classId,
          chipIds: [randomUUID()],
          deviceMode: "off",
          durationMinutes: 7,
          surprise: false,
        },
        provider,
      ),
    ).rejects.toMatchObject({ code: "not_found" });
    expect(calls).toBe(0);
  });
});
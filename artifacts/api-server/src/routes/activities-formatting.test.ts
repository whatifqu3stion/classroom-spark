import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import supertest from "supertest";
import { eq } from "drizzle-orm";
import { activitiesTable, classesTable, db } from "@workspace/db";
import app from "../app";

describe.sequential("activity inline formatting persistence", () => {
  let classId: string;
  let request: ReturnType<typeof supertest.agent>;

  beforeEach(async () => {
    request = supertest.agent(app);

    classId = randomUUID();
    await db.insert(classesTable).values({
      id: classId,
      name: `Formatting ${classId.slice(0, 6)}`,
      grade: "5",
      subject: "Science",
      defaultDeviceMode: "off",
      defaultDuration: 5,
    });
  });

  afterEach(async () => {
    await db.delete(classesTable).where(eq(classesTable.id, classId));
    vi.unstubAllEnvs();
  });

  it("round-trips formatting through create, get, app state, and duplicate", async () => {
    const contentFormatting = {
      version: 1,
      task: [
        { text: "Observe ", bold: true },
        { text: "carefully", highlight: true, underline: true },
      ],
      prompts: [[{ text: "What changed?", bold: true }]],
    };
    const created = await request.post("/api/activities").send({
      classId,
      task: "Observe carefully",
      prompts: ["What changed?"],
      contentFormatting,
      durationMinutes: 5,
      deviceMode: "off",
    });
    expect(created.status).toBe(201);
    expect(created.body.contentFormatting).toEqual(contentFormatting);

    const fetched = await request.get(
      `/api/activities/${created.body.id}`,
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body.contentFormatting).toEqual(contentFormatting);

    const state = await request.get("/api/app-state");
    expect(state.status).toBe(200);
    expect(
      state.body.activities.find(
        (activity: { id: string }) => activity.id === created.body.id,
      ).contentFormatting,
    ).toEqual(contentFormatting);

    const duplicate = await request.post(
      `/api/activities/${created.body.id}/duplicate`,
    );
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.contentFormatting).toEqual(contentFormatting);
  });

  it("rejects explicitly mismatched formatting", async () => {
    const response = await request.post("/api/activities").send({
      classId,
      task: "Canonical",
      contentFormatting: {
        version: 1,
        task: [{ text: "Different", bold: true }],
      },
      durationMinutes: 5,
      deviceMode: "off",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/canonical task/i);
  });

  it("rejects arbitrary formatting properties rather than dropping them", async () => {
    const response = await request.post("/api/activities").send({
      classId,
      task: "Canonical",
      contentFormatting: {
        version: 1,
        task: [{ text: "Canonical", color: "#ff0000" }],
      },
      durationMinutes: 5,
      deviceMode: "off",
    });
    expect(response.status).toBe(400);
  });

  it("clears stale runs for changed plaintext but preserves unchanged fields", async () => {
    const [activity] = await db
      .insert(activitiesTable)
      .values({
        classId,
        title: "Original",
        task: "Original",
        prompts: ["Prompt"],
        contentFormatting: {
          version: 1,
          task: [{ text: "Original", bold: true }],
          prompts: [[{ text: "Prompt", underline: true }]],
        },
        durationMinutes: 5,
        deviceMode: "off",
      })
      .returning();

    const taskUpdate = await request
      .patch(`/api/activities/${activity.id}`)
      .send({ task: "Replacement" });
    expect(taskUpdate.status).toBe(200);
    expect(taskUpdate.body.contentFormatting).toEqual({
      version: 1,
      prompts: [[{ text: "Prompt", underline: true }]],
    });

    const mismatchedUpdate = await request
      .patch(`/api/activities/${activity.id}`)
      .send({
        contentFormatting: {
          version: 1,
          task: [{ text: "Not Replacement", bold: true }],
        },
      });
    expect(mismatchedUpdate.status).toBe(400);

    const promptsUpdate = await request
      .patch(`/api/activities/${activity.id}`)
      .send({ prompts: ["New prompt"] });
    expect(promptsUpdate.status).toBe(200);
    expect(promptsUpdate.body.contentFormatting).toBeNull();
  });

  it("lets nullable formatting explicitly clear all marks", async () => {
    const [activity] = await db
      .insert(activitiesTable)
      .values({
        classId,
        title: "Clear",
        task: "Clear",
        contentFormatting: {
          version: 1,
          task: [{ text: "Clear", highlight: true }],
        },
        durationMinutes: 5,
        deviceMode: "off",
      })
      .returning();
    const response = await request
      .patch(`/api/activities/${activity.id}`)
      .send({ contentFormatting: null });
    expect(response.status).toBe(200);
    expect(response.body.contentFormatting).toBeNull();
  });
});
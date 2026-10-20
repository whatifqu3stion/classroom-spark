import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  selects: [] as unknown[][], writes: [] as unknown[][],
  sets: [] as unknown[], where: [] as unknown[],
  fetchReference: vi.fn(), extractObjectives: vi.fn(), deletePdf: vi.fn(), discoverReferences: vi.fn(),
}));
vi.mock("@workspace/db", async (original) => {
  const actual = await original<Record<string, unknown>>();
  return { ...actual, db: {
    select: () => {
      const rows = mocks.selects.shift() ?? [];
      const chain = { from: () => chain, where: () => chain, limit: () => chain, then: (resolve: (value: unknown) => void) => Promise.resolve(rows).then(resolve) };
      return chain;
    },
    update: () => {
      const chain = { set: (value: unknown) => { mocks.sets.push(value); return chain; }, where: (value: unknown) => { mocks.where.push(value); return chain; }, returning: async () => mocks.writes.shift() ?? [] };
      return chain;
    },
    insert: () => {
      const chain = { values: (value: unknown) => { mocks.sets.push(value); return chain; }, onConflictDoNothing: () => chain, returning: async () => mocks.writes.shift() ?? [] };
      return chain;
    },
    delete: () => ({ where: async () => undefined }),
  } };
});
vi.mock("../services/curriculum/imports", () => ({
  CurriculumImportError: class extends Error {},
  curriculumCapabilities: () => ({ accessConfigured: true }),
  extractPdf: vi.fn(), storePdf: vi.fn(), readPdf: vi.fn(),
  extractObjectives: mocks.extractObjectives, fetchReference: mocks.fetchReference,
  deletePdf: mocks.deletePdf, discoverReferences: mocks.discoverReferences,
}));
import router from "./curriculum";
import { manualObjectives, publicSource, validateObjectiveEdits, normalizeProgrammeYear, sourceHash } from "../lib/curriculum-sources";
import { redactCurriculumSnapshot } from "../lib/curriculum-privacy";

const classId = "a0000000-0000-4000-8000-000000000001";
const sourceId = "b0000000-0000-4000-8000-000000000001";
const path = `/classes/${classId}/curriculum`;
const objective = { id: "o1", label: "Identify user needs", excerpt: "Identify user needs.", locator: "Page 1", selected: true };
const source = {
  id: sourceId, classId, unitId: null, kind: "web" as const, status: "approved" as const, version: 3,
  title: "Design", subject: "Design", framework: "MYP", programmeYear: "2", summary: "Needs",
  objectives: [objective], pages: [{ page: 1, text: objective.excerpt }], objectKey: null,
  contentHash: "secret-hash", publisher: "Publisher", url: "https://ibo.org/design", edition: null,
  retrievedAt: new Date(), approvedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
};
const profile = { id: classId, subject: "Design", curriculumFramework: "MYP", programmeYear: "2" };
function app() {
  const server = express(); server.use(express.json());
  server.use((req, _res, next) => { req.log = { error: vi.fn() } as never; next(); });
  server.use(router); return server;
}
beforeEach(() => {
  vi.stubEnv("DEPLOYMENT_ACCESS_PROTECTED", "true");
  mocks.selects.length = 0; mocks.writes.length = 0; mocks.sets.length = 0; mocks.where.length = 0;
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllEnvs());
describe("protected curriculum lifecycle (isolated persistence/provider fixtures)", () => {
  it("exposes setup readiness without contents and fails closed on mutations/files", async () => {
    vi.stubEnv("DEPLOYMENT_ACCESS_PROTECTED", "");
    expect((await request(app()).get(path)).body).toEqual({ ready: false, reason: "setup_required", items: [] });
    expect((await request(app()).post(path).send({})).status).toBe(503);
    expect((await request(app()).get(`${path}/${sourceId}/file`)).status).toBe(503);
  });
  it("does not treat a BYOK key as authorization for private sources", async () => {
    vi.stubEnv("DEPLOYMENT_ACCESS_PROTECTED", "");
    expect((await request(app()).get(path).set("x-boardwork-api-key", "sk-test-only-not-a-real-key")).body.items).toEqual([]);
    expect((await request(app()).get(`${path}/${sourceId}/file`).set("x-boardwork-api-key", "sk-test-only-not-a-real-key")).status).toBe(503);
  });
  it("returns safe list metadata, never pages/storage keys/content hashes", async () => {
    mocks.selects.push([profile], [source]);
    const result = await request(app()).get(path);
    expect(result.status).toBe(200); expect(result.body.items[0].objectives).toEqual([objective]);
    for (const key of ["pages", "objectKey", "contentHash"]) expect(result.body.items[0]).not.toHaveProperty(key);
  });
  it("creates teacher-provided manual drafts without paid calls", async () => {
    mocks.selects.push([profile], []);
    mocks.writes.push([{ ...source, kind: "manual", status: "draft", publisher: "Teacher-provided" }]);
    const result = await request(app()).post(path).send({ kind: "manual", title: "My notes", text: "Identify user needs." });
    expect(result.status).toBe(201); expect(result.body.status).toBe("draft");
    expect(mocks.sets[0]).toMatchObject({ kind: "manual", publisher: "Teacher-provided" });
    expect(mocks.extractObjectives).not.toHaveBeenCalled();
  });
  it("deduplicates retries before expensive retrieval", async () => {
    mocks.selects.push([profile], [source]);
    expect((await request(app()).post(path).send({ kind: "web", title: "Design", url: source.url })).status).toBe(201);
    expect(mocks.fetchReference).not.toHaveBeenCalled();
  });
  it("rejects changed quotations and unknown input fields", async () => {
    mocks.selects.push([source]);
    const edited = await request(app()).patch(`${path}/${sourceId}`).send({ version: 3, objectives: [{ ...objective, excerpt: "Invented quotation" }] });
    expect(edited.status).toBe(400);
    const forged = await request(app()).patch(`${path}/${sourceId}`).send({ version: 3, objectKey: "secret" });
    expect(forged.status).toBe(400); expect(mocks.sets).toHaveLength(0);
  });
  it("resets approval on interpretation edit and rejects stale CAS", async () => {
    mocks.selects.push([source]); mocks.writes.push([]);
    const result = await request(app()).patch(`${path}/${sourceId}`).send({ version: 2, summary: "A correction" });
    expect(result.status).toBe(409);
    expect(mocks.sets[0]).toMatchObject({ status: "draft", approvedAt: null, version: 3 });
    expect(mocks.where).toHaveLength(1);
  });
  it("approves explicit selection and supports deactivation", async () => {
    for (const status of ["approved", "inactive"]) {
      mocks.selects.push([source]); mocks.writes.push([{ ...source, status, version: 4 }]);
      const result = await request(app()).patch(`${path}/${sourceId}`).send({ version: 3, status });
      expect(result.status).toBe(200); expect(result.body.status).toBe(status);
    }
  });
  it("disables failed document deletions durably and permits retry", async () => {
    const pdf = { ...source, kind: "pdf", objectKey: "private/test.pdf" };
    mocks.selects.push([pdf]); mocks.writes.push([{ ...pdf, status: "delete_failed", version: 4 }]);
    mocks.deletePdf.mockRejectedValueOnce(new Error("storage unavailable"));
    const failed = await request(app()).delete(`${path}/${sourceId}`);
    expect(failed.status).toBe(503); expect(mocks.sets[0]).toMatchObject({ status: "delete_failed", approvedAt: null });
    mocks.selects.push([{ ...pdf, status: "delete_failed", version: 4 }]); mocks.writes.push([{ ...pdf, version: 5 }]);
    mocks.deletePdf.mockResolvedValueOnce(undefined);
    expect((await request(app()).delete(`${path}/${sourceId}`)).status).toBe(204);
  });
  it("does not overwrite concurrent review after refresh invalidation", async () => {
    mocks.selects.push([source]); mocks.writes.push([{ ...source, status: "draft", version: 4 }], []);
    mocks.fetchReference.mockResolvedValueOnce({ pages: source.pages, title: source.title, publisher: source.publisher, url: source.url, edition: null, retrievedAt: new Date().toISOString() });
    mocks.extractObjectives.mockResolvedValueOnce({ summary: "New interpretation", objectives: [objective] });
    const result = await request(app()).post(`${path}/${sourceId}/refresh`).send({ version: 3 });
    expect(result.status).toBe(409);
    expect(mocks.sets[0]).toMatchObject({ status: "draft", approvedAt: null, version: 4 });
    expect(mocks.where).toHaveLength(2);
  });
  it("rejects unknown scoped sources without file retrieval", async () => {
    mocks.selects.push([]);
    expect((await request(app()).get(`${path}/${sourceId}/file`)).status).toBe(404);
  });
});
describe("evidence and snapshot integrity", () => {
  it("keeps manual excerpts exact and requires bounded paragraphs", () => {
    const items = manualObjectives("Identify needs.\nCompare alternatives.");
    expect(items[1].excerpt).toBe("Compare alternatives.");
    expect(items[1].locator).toBe("Paragraph 2");
    expect(() => manualObjectives("x".repeat(2001))).toThrow();
    expect(validateObjectiveEdits(items, items.map(item => ({ ...item, label: "Teacher edit" })))).toBe(true);
    expect(validateObjectiveEdits(items, [items[0], items[0]])).toBe(false);
  });
  it("normalizes explicit programme years and scopes duplicate hashes", () => {
    expect(normalizeProgrammeYear("MYP Year 2")).toBe(normalizeProgrammeYear("2"));
    expect(sourceHash("manual", null, "same")).not.toBe(sourceHash("manual", sourceId, "same"));
  });
  it("redacts historical excerpts when gate disabled without mutating stored snapshot", () => {
    const activity = { curriculumSnapshot: { source: "Private excerpt" } };
    vi.stubEnv("DEPLOYMENT_ACCESS_PROTECTED", "");
    expect(redactCurriculumSnapshot(activity).curriculumSnapshot).toBeNull();
    expect(activity.curriculumSnapshot.source).toBe("Private excerpt");
    expect(publicSource(source)).not.toHaveProperty("pages");
  });
});
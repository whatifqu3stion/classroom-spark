import { Router, raw, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db, classesTable, curriculumSourcesTable, unitsTable, type CurriculumSource } from "@workspace/db";
import { CreateCurriculumSourceBody, UpdateCurriculumSourceBody, RefreshCurriculumSourceBody } from "@workspace/api-zod";
import { deploymentAccessProtected } from "../lib/deployment-access";
import { manualObjectives, publicSource, sourceHash, validateObjectiveEdits } from "../lib/curriculum-sources";
import { extractPdf, extractObjectives, discoverReferences, fetchReference, storePdf, readPdf, deletePdf, CurriculumImportError, curriculumCapabilities } from "../services/curriculum/imports";

const router: IRouter = Router();
const base = "/classes/:classId/curriculum";
const ids = z.object({ classId: z.string().uuid(), sourceId: z.string().uuid().optional() });
const flights = new Map<string, Promise<CurriculumSource>>();
const rate = new Map<string, number[]>();
const discoveryCache = new Map<string, { until: number; results: Awaited<ReturnType<typeof discoverReferences>> }>();
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const fail = (status: number, message: string): never => { throw new HttpError(status, message); };
function paidLimit(classId: string) {
  const now = Date.now();
  const recent = (rate.get(classId) ?? []).filter(time => now - time < 60_000);
  if (recent.length >= 4) fail(429, "Please wait a minute before another import or discovery.");
  recent.push(now); rate.set(classId, recent);
  if (rate.size > 200) for (const [key, times] of rate) if (now - times.at(-1)! > 60_000) rate.delete(key);
}
const handle = (fn: (req: Request, res: Response) => Promise<void>) => async (req: Request, res: Response) => {
  try { await fn(req, res); }
  catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.message }); return; }
    if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
    if (error instanceof CurriculumImportError) { res.status(422).json({ error: error.message }); return; }
    req.log.error({ err: error }, "Curriculum operation failed");
    res.status(500).json({ error: "Curriculum operation failed. Please retry; no approval was added." });
  }
};
async function profileFor(req: Request) {
  const params = ids.parse(req.params);
  const [profile] = await db.select().from(classesTable).where(eq(classesTable.id, params.classId));
  if (!profile) return fail(404, "Class not found");
  return profile;
}
async function sourceFor(req: Request) {
  const { classId, sourceId } = ids.parse(req.params);
  if (!sourceId) return fail(400, "Source id required");
  const [source] = await db.select().from(curriculumSourcesTable).where(and(eq(curriculumSourcesTable.id, sourceId), eq(curriculumSourcesTable.classId, classId)));
  if (!source) return fail(404, "Source not found");
  return source;
}
async function checkUnit(unitId: string | null) {
  if (!unitId) return;
  const [unit] = await db.select({ id: unitsTable.id }).from(unitsTable).where(eq(unitsTable.id, unitId));
  if (!unit) fail(404, "Unit not found");
}
async function deduplicate(classId: string, hash: string, create: () => Promise<CurriculumSource>, web?: { url: string; unitId: string | null }) {
  const identity = web
    ? and(eq(curriculumSourcesTable.kind, "web"), eq(curriculumSourcesTable.url, web.url), web.unitId ? eq(curriculumSourcesTable.unitId, web.unitId) : isNull(curriculumSourcesTable.unitId))
    : eq(curriculumSourcesTable.contentHash, hash);
  const [existing] = await db.select().from(curriculumSourcesTable).where(and(eq(curriculumSourcesTable.classId, classId), identity));
  if (existing) return existing;
  const key = `${classId}:${hash}`;
  const active = flights.get(key);
  if (active) return active;
  if (flights.size >= 4) return fail(429, "Imports are busy. Please retry shortly.");
  const promise = create(); flights.set(key, promise);
  try { return await promise; } finally { flights.delete(key); }
}
async function insertSource(values: typeof curriculumSourcesTable.$inferInsert) {
  try {
    const [row] = await db.insert(curriculumSourcesTable).values(values).onConflictDoNothing().returning();
    if (row) return row;
    if (values.objectKey) await deletePdf(values.objectKey);
    const [existing] = await db.select().from(curriculumSourcesTable).where(and(eq(curriculumSourcesTable.classId, values.classId), eq(curriculumSourcesTable.contentHash, values.contentHash)));
    return existing ?? fail(409, "Source changed; retry.");
  } catch (error) {
    // Persist a retryable cleanup record if storage removal fails.
    if (values.objectKey) {
      try { await deletePdf(values.objectKey); }
      catch {
        await db.insert(curriculumSourcesTable).values({ ...values, contentHash: `${values.contentHash}:cleanup:${values.objectKey}`, status: "delete_failed" });
      }
    }
    throw error;
  }
}

router.use(base, (req, res, next) => {
  if (!deploymentAccessProtected()) {
    if (req.method === "GET" && (req.path === "/" || req.path === "")) {
      res.json({ ready: false, reason: "setup_required", items: [] }); return;
    }
    res.status(503).json({ error: "setup_required", message: "Protect this deployment with host sign-in before managing private curriculum sources." }); return;
  }
  next();
});
router.get(base, handle(async (req, res) => {
  const profile = await profileFor(req);
  const rows = await db.select().from(curriculumSourcesTable).where(eq(curriculumSourcesTable.classId, profile.id));
  res.json({ ready: true, reason: null, capabilities: curriculumCapabilities(), items: rows.map(publicSource) });
}));
router.post(`${base}/discover`, handle(async (req, res) => {
  const profile = await profileFor(req);
  const context = { subject: profile.subject, framework: profile.curriculumFramework, programmeYear: profile.programmeYear };
  const key = JSON.stringify(context);
  const cached = discoveryCache.get(key);
  if (cached && cached.until > Date.now()) { res.json(cached.results); return; }
  paidLimit(profile.id);
  const results = await discoverReferences(context);
  if (discoveryCache.size >= 100) discoveryCache.clear();
  discoveryCache.set(key, { until: Date.now() + 15 * 60_000, results }); res.json(results);
}));
router.post(base, handle(async (req, res) => {
  const input = CreateCurriculumSourceBody.strict().parse(req.body);
  const profile = await profileFor(req);
  const unitId = input.unitId ?? null; await checkUnit(unitId);
  if (!input.title.trim()) fail(400, "Title is required");
  if (input.kind === "manual" ? !input.text?.trim() || input.url !== undefined : !input.url || input.text !== undefined) fail(400, "Manual sources require text; web sources require only a public official URL.");
  const hash = sourceHash(input.kind, unitId, input.kind === "manual" ? input.text!.trim() : input.url!);
  const row = await deduplicate(profile.id, hash, async () => {
    const context = { subject: profile.subject, framework: profile.curriculumFramework, programmeYear: profile.programmeYear };
    if (input.kind === "manual") {
      let objectives;
      try { objectives = manualObjectives(input.text!.trim()); } catch (error) { return fail(400, (error as Error).message); }
      return insertSource({ classId: profile.id, unitId, kind: "manual", title: input.title.trim(), ...context,
        contentHash: hash, pages: [{ page: 1, text: input.text!.trim() }], objectives, summary: "Teacher-provided curriculum text. Review the selected objectives before approval.", publisher: "Teacher-provided" });
    }
    paidLimit(profile.id);
    const fetched = await fetchReference(input.url!);
    const extracted = await extractObjectives(fetched.pages, context);
    return insertSource({ classId: profile.id, unitId, kind: "web", ...context,
      contentHash: sourceHash("web", unitId, JSON.stringify(fetched.pages)), ...extracted, ...fetched, title: input.title.trim(), retrievedAt: new Date(fetched.retrievedAt) });
  }, input.kind === "web" ? { url: input.url!, unitId } : undefined);
  res.status(201).json(publicSource(row));
}));
router.post(`${base}/pdf`, raw({ type: "application/pdf", limit: "20mb" }), handle(async (req, res) => {
  const query = z.object({ title: z.string().trim().min(1).max(200), unitId: z.string().uuid().optional() }).strict().parse(req.query);
  if (!Buffer.isBuffer(req.body)) fail(415, "Upload a PDF using application/pdf.");
  const profile = await profileFor(req); const unitId = query.unitId ?? null; await checkUnit(unitId);
  const buffer = req.body as Buffer; const hash = sourceHash("pdf", unitId, buffer);
  const row = await deduplicate(profile.id, hash, async () => {
    paidLimit(profile.id);
    const context = { subject: profile.subject, framework: profile.curriculumFramework, programmeYear: profile.programmeYear };
    const { pages } = await extractPdf(buffer);
    const extracted = await extractObjectives(pages, context);
    const objectKey = await storePdf(buffer);
    return insertSource({ classId: profile.id, unitId, kind: "pdf", title: query.title, ...context,
      ...extracted, pages, objectKey, contentHash: hash, publisher: "Teacher-uploaded" });
  }); res.status(201).json(publicSource(row));
}));
router.get(`${base}/:sourceId`, handle(async (req, res) => { res.json(publicSource(await sourceFor(req))); }));
router.patch(`${base}/:sourceId`, handle(async (req, res) => {
  const input = UpdateCurriculumSourceBody.strict().parse(req.body);
  const source = await sourceFor(req);
  if (source.status === "delete_failed") fail(409, "Deletion is pending. Retry deleting this source.");
  if (input.objectives && !validateObjectiveEdits(source.objectives, input.objectives)) fail(400, "Source excerpts, locators, and objective identities cannot be changed. Replace the source instead.");
  if ([input.title, input.subject].some(value => value !== undefined && !value.trim())) fail(400, "Title and subject cannot be blank.");
  const { version, ...changes } = input;
  const status = changes.status ?? "draft";
  if (status === "approved" && !(changes.objectives ?? source.objectives).some(item => item.selected)) fail(400, "Select at least one objective before approval.");
  const [updated] = await db.update(curriculumSourcesTable).set({ ...changes, status, version: version + 1, approvedAt: status === "approved" ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(curriculumSourcesTable.id, source.id), eq(curriculumSourcesTable.version, version), eq(curriculumSourcesTable.status, source.status))).returning();
  if (!updated) fail(409, "Source changed. Reload before saving."); res.json(publicSource(updated));
}));
router.post(`${base}/:sourceId/refresh`, handle(async (req, res) => {
  const { version } = RefreshCurriculumSourceBody.strict().parse(req.body);
  const source = await sourceFor(req);
  if (source.kind !== "web" || !source.url || source.status === "delete_failed") fail(400, "Only available web sources can be refreshed.");
  if (source.version !== version) fail(409, "Source changed. Reload first.");
  paidLimit(source.classId);
  // Invalidate approval before retrieval; failed refresh leaves a recoverable draft.
  const [draft] = await db.update(curriculumSourcesTable).set({ status: "draft", approvedAt: null, version: version + 1, updatedAt: new Date() })
    .where(and(eq(curriculumSourcesTable.id, source.id), eq(curriculumSourcesTable.version, version))).returning();
  if (!draft) fail(409, "Source changed. Reload first.");
  const fetched = await fetchReference(source.url!);
  const extracted = await extractObjectives(fetched.pages, source);
  const [updated] = await db.update(curriculumSourcesTable).set({ ...fetched, ...extracted, contentHash: sourceHash("web", source.unitId, JSON.stringify(fetched.pages)), retrievedAt: new Date(fetched.retrievedAt), version: version + 2, updatedAt: new Date() })
    .where(and(eq(curriculumSourcesTable.id, source.id), eq(curriculumSourcesTable.version, version + 1), eq(curriculumSourcesTable.status, "draft"))).returning();
  if (!updated) fail(409, "Source changed during refresh. Reload first.");
  res.json(publicSource(updated));
}));
router.get(`${base}/:sourceId/file`, handle(async (req, res) => {
  const source = await sourceFor(req);
  if (!source.objectKey || source.status === "delete_failed") fail(404, "Document unavailable");
  const buffer = await readPdf(source.objectKey!);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"curriculum.pdf\"", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }).send(buffer);
}));
router.delete(`${base}/:sourceId`, handle(async (req, res) => {
  const source = await sourceFor(req);
  const [pending] = await db.update(curriculumSourcesTable).set({ status: "delete_failed", approvedAt: null, version: source.version + 1, updatedAt: new Date() })
    .where(and(eq(curriculumSourcesTable.id, source.id), eq(curriculumSourcesTable.version, source.version))).returning();
  if (!pending) fail(409, "Source changed. Reload before deleting.");
  if (source.objectKey) {
    try { await deletePdf(source.objectKey); }
    catch { fail(503, "Document cleanup failed. Source is disabled; retry Delete to finish cleanup."); }
  }
  await db.delete(curriculumSourcesTable).where(eq(curriculumSourcesTable.id, source.id));
  res.sendStatus(204);
}));
export default router;
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, unitsTable, curriculumSourcesTable } from "@workspace/db";
import {
  ListUnitsResponse,
  CreateUnitBody,
  CreateUnitResponse,
  UpdateUnitParams,
  UpdateUnitBody,
  UpdateUnitResponse,
  DeleteUnitParams,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/units", async (_req, res): Promise<void> => {
  const rows = await db.select().from(unitsTable).orderBy(unitsTable.name);
  res.json(ListUnitsResponse.parse(rows));
});

router.post("/units", async (req, res): Promise<void> => {
  const parsed = CreateUnitBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(unitsTable)
    .values({
      name: parsed.data.name.trim(),
      conceptsTopics: parsed.data.conceptsTopics?.trim() ?? "",
      skills: parsed.data.skills?.trim() ?? "",
      standardsObjectives: parsed.data.standardsObjectives?.trim() ?? "",
    })
    .returning();

  res.status(201).json(CreateUnitResponse.parse(created));
});

router.patch("/units/:unitId", async (req, res): Promise<void> => {
  const params = UpdateUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUnitBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(unitsTable)
    .set({
      ...(parsed.data.name === undefined
        ? {}
        : { name: parsed.data.name.trim() }),
      ...(parsed.data.conceptsTopics === undefined
        ? {}
        : { conceptsTopics: parsed.data.conceptsTopics.trim() }),
      ...(parsed.data.skills === undefined
        ? {}
        : { skills: parsed.data.skills.trim() }),
      ...(parsed.data.standardsObjectives === undefined
        ? {}
        : { standardsObjectives: parsed.data.standardsObjectives.trim() }),
      updatedAt: new Date(),
    })
    .where(eq(unitsTable.id, params.data.unitId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(UpdateUnitResponse.parse(updated));
});

router.delete("/units/:unitId", async (req, res): Promise<void> => {
  const params = DeleteUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db.select({ id: curriculumSourcesTable.id }).from(curriculumSourcesTable).where(eq(curriculumSourcesTable.unitId, params.data.unitId)).limit(1);
  if (source) {
    res.status(409).json({ error: "Delete this unit's curriculum sources first so protected documents can be cleaned up." }); return;
  }
  const [deleted] = await db
    .delete(unitsTable)
    .where(eq(unitsTable.id, params.data.unitId))
    .returning({ id: unitsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
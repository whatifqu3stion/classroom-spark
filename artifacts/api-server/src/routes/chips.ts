import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chipsTable, classesTable } from "@workspace/db";
import {
  CreateChipParams,
  CreateChipBody,
  CreateChipResponse,
  UpdateChipParams,
  UpdateChipBody,
  UpdateChipResponse,
  DeleteChipParams,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/classes/:classId/chips", async (req, res): Promise<void> => {
  const params = CreateChipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateChipBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.id, params.data.classId));
  if (!existing) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  const [created] = await db
    .insert(chipsTable)
    .values({ classId: params.data.classId, label: parsed.data.label })
    .returning();

  res.status(201).json(CreateChipResponse.parse(created));
});

router.patch("/chips/:chipId", async (req, res): Promise<void> => {
  const params = UpdateChipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateChipBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(chipsTable)
    .set({ label: parsed.data.label })
    .where(eq(chipsTable.id, params.data.chipId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Chip not found" });
    return;
  }

  res.json(UpdateChipResponse.parse(updated));
});

router.delete("/chips/:chipId", async (req, res): Promise<void> => {
  const params = DeleteChipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(chipsTable)
    .where(eq(chipsTable.id, params.data.chipId))
    .returning({ id: chipsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Chip not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

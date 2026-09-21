import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  classesTable,
  instructionalContextsTable,
  curriculumSourcesTable,
} from "@workspace/db";
import {
  ListClassesResponse,
  CreateClassBody,
  CreateClassResponse,
  UpdateClassParams,
  UpdateClassBody,
  UpdateClassResponse,
  DeleteClassParams,
  SelectClassParams,
  SelectClassResponse,
  GetInstructionalContextParams,
  GetInstructionalContextResponse,
  UpdateInstructionalContextParams,
  UpdateInstructionalContextBody,
  UpdateInstructionalContextResponse,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";
import {
  createClassWithContext,
  deleteClassCascade,
  setActiveClassId,
} from "../lib/boardwork-repo";

const router: IRouter = Router();

router.get("/classes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(classesTable).orderBy(classesTable.name);
  res.json(ListClassesResponse.parse(rows));
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid class body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const created = await createClassWithContext(parsed.data);

  res.status(201).json(CreateClassResponse.parse(created));
});

router.patch("/classes/:classId", async (req, res): Promise<void> => {
  const params = UpdateClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClassBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(classesTable)
    .set(parsed.data)
    .where(eq(classesTable.id, params.data.classId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.json(UpdateClassResponse.parse(updated));
});

router.delete("/classes/:classId", async (req, res): Promise<void> => {
  const params = DeleteClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db.select({ id: curriculumSourcesTable.id }).from(curriculumSourcesTable).where(eq(curriculumSourcesTable.classId, params.data.classId)).limit(1);
  if (source) {
    res.status(409).json({ error: "Delete this class's curriculum sources first so protected documents can be cleaned up." }); return;
  }
  const deleted = await deleteClassCascade(params.data.classId);
  if (!deleted) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/classes/:classId/select", async (req, res): Promise<void> => {
  const params = SelectClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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

  const activeClassId = await setActiveClassId(params.data.classId);
  res.json(SelectClassResponse.parse({ activeClassId }));
});

router.get(
  "/classes/:classId/instructional-context",
  async (req, res): Promise<void> => {
    const params = GetInstructionalContextParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select()
      .from(instructionalContextsTable)
      .where(eq(instructionalContextsTable.classId, params.data.classId));

    if (!row) {
      res.status(404).json({ error: "Instructional context not found" });
      return;
    }

    res.json(GetInstructionalContextResponse.parse(row));
  },
);

router.put(
  "/classes/:classId/instructional-context",
  async (req, res): Promise<void> => {
    const params = UpdateInstructionalContextParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateInstructionalContextBody.safeParse(
      sanitizeUnicodeValue(req.body),
    );
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

    const [row] = await db
      .insert(instructionalContextsTable)
      .values({ classId: params.data.classId, ...parsed.data })
      .onConflictDoUpdate({
        target: instructionalContextsTable.classId,
        set: { ...parsed.data, updatedAt: new Date() },
      })
      .returning();

    res.json(UpdateInstructionalContextResponse.parse(row));
  },
);

export default router;

import { Router, type IRouter } from "express";
import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { db, classesTable, homebasesTable } from "@workspace/db";
import {
  CreateHomebase,
  UpdateHomebase,
  HomebaseRecord,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";
import { z } from "zod/v4";

const router: IRouter = Router();
function serialize(row: typeof homebasesTable.$inferSelect) {
  return HomebaseRecord.parse({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  });
}
router.get("/homebases", async (req, res) => {
  const scope = z
    .uuid()
    .nullable()
    .safeParse(req.query.classId ?? null);
  if (!scope.success) {
    res.status(400).json({ error: "Choose a valid class." });
    return;
  }
  const rows = await db
    .select()
    .from(homebasesTable)
    .where(
      scope.data
        ? eq(homebasesTable.classId, scope.data)
        : isNull(homebasesTable.classId),
    )
    .orderBy(desc(homebasesTable.updatedAt));
  res.json(rows.map(serialize));
});
router.post("/homebases", async (req, res) => {
  const input = CreateHomebase.safeParse(sanitizeUnicodeValue(req.body));
  if (!input.success) {
    res.status(400).json({ error: "Check the board name, tools, and links." });
    return;
  }
  if (input.data.classId) {
    const [profile] = await db
      .select({ id: classesTable.id })
      .from(classesTable)
      .where(eq(classesTable.id, input.data.classId));
    if (!profile) {
      res.status(404).json({ error: "This class no longer exists." });
      return;
    }
  }
  const [row] = await db.insert(homebasesTable).values(input.data).returning();
  res.status(201).json(serialize(row));
});
router.put("/homebases/:id", async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const input = UpdateHomebase.safeParse(sanitizeUnicodeValue(req.body));
  if (!id.success || !input.success) {
    res.status(400).json({ error: "Check the board name, tools, and links." });
    return;
  }
  const { revision, ...content } = input.data;
  const [row] = await db
    .update(homebasesTable)
    .set({
      ...content,
      revision: sql`${homebasesTable.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(homebasesTable.id, id.data),
        eq(homebasesTable.revision, revision),
      ),
    )
    .returning();
  if (!row) {
    res
      .status(409)
      .json({
        error:
          "This board changed in another tab or was removed. Save your draft as a copy to keep these changes.",
      });
    return;
  }
  res.json(serialize(row));
});
router.delete("/homebases/:id", async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const revision = z.coerce.number().int().min(1).safeParse(req.query.revision);
  if (!id.success || !revision.success) {
    res.status(400).json({ error: "Choose a valid board revision." });
    return;
  }
  const [row] = await db
    .delete(homebasesTable)
    .where(
      and(
        eq(homebasesTable.id, id.data),
        eq(homebasesTable.revision, revision.data),
      ),
    )
    .returning({ id: homebasesTable.id });
  if (!row) {
    res
      .status(409)
      .json({ error: "This board changed. Refresh before removing it." });
    return;
  }
  res.sendStatus(204);
});
export default router;

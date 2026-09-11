import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, activitiesTable, classesTable } from "@workspace/db";
import {
  ListActivitiesQueryParams,
  ListActivitiesResponse,
  CreateActivityBody,
  CreateActivityResponse,
  GetActivityParams,
  GetActivityResponse,
  UpdateActivityParams,
  UpdateActivityBody,
  UpdateActivityResponse,
  DeleteActivityParams,
  DuplicateActivityParams,
  DuplicateActivityResponse,
  SetActivityFavoriteParams,
  SetActivityFavoriteBody,
  SetActivityFavoriteResponse,
  ClearNonFavoriteActivitiesResponse,
  sanitizeUnicodeValue,
} from "@workspace/api-zod";
import {
  deleteNonFavoriteActivities,
  duplicateActivity,
} from "../lib/boardwork-repo";
import {
  ActivityResourceValidationError,
  normalizeActivityResourceUrl,
} from "../lib/activity-resource";
import { normalizeActivityTechnology } from "../lib/activity-technology";
import { getActivityCompatibilityTitle } from "../lib/activity-title";
import {
  getCanonicalPresentationVisuals,
  getLegacyPresentationVisualFields,
  getPresentationVisualPayloadError,
  mergeLegacyPresentationVisualPatch,
  normalizePresentationVisuals,
  withCanonicalPresentationVisuals,
} from "../lib/presentation-visuals";

const router: IRouter = Router();

router.get("/activities", async (req, res): Promise<void> => {
  const query = ListActivitiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = query.data.classId
    ? await db
        .select()
        .from(activitiesTable)
        .where(eq(activitiesTable.classId, query.data.classId))
        .orderBy(activitiesTable.createdAt)
    : await db.select().from(activitiesTable).orderBy(activitiesTable.createdAt);

  res.json(
    ListActivitiesResponse.parse(rows.map(withCanonicalPresentationVisuals)),
  );
});

router.post("/activities", async (req, res): Promise<void> => {
  const parsed = CreateActivityBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const visuals = normalizePresentationVisuals(
    parsed.data.visuals,
    parsed.data.visualUrl,
    parsed.data.visualDescription,
  );
  const visualError = getPresentationVisualPayloadError(visuals);
  if (visualError) {
    res.status(413).json({ error: visualError });
    return;
  }

  const [existing] = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.id, parsed.data.classId));
  if (!existing) {
    res.status(400).json({ error: "Class not found" });
    return;
  }

  let deviceMode: "off" | "on";
  let technologyMode: "no_computer" | "computer_available" | "computer_required";
  try {
    ({ deviceMode, technologyMode } = normalizeActivityTechnology(
      parsed.data.deviceMode,
      parsed.data.technologyMode,
    ));
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
    return;
  }

  let resourceUrl: string | null;
  try {
    resourceUrl = normalizeActivityResourceUrl(
      parsed.data.resourceUrl,
      deviceMode,
    );
  } catch (error) {
    if (error instanceof ActivityResourceValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  const [created] = await db
    .insert(activitiesTable)
    .values({
      ...parsed.data,
      visuals,
      ...getLegacyPresentationVisualFields(visuals),
      title: getActivityCompatibilityTitle(parsed.data.task),
      deviceMode,
      resourceUrl,
      technologyMode,
    })
    .returning();

  res.status(201).json(CreateActivityResponse.parse(created));
});

router.get("/activities/:activityId", async (req, res): Promise<void> => {
  const params = GetActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, params.data.activityId));

  if (!row) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.json(GetActivityResponse.parse(withCanonicalPresentationVisuals(row)));
});

router.patch("/activities/:activityId", async (req, res): Promise<void> => {
  const params = UpdateActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateActivityBody.safeParse(sanitizeUnicodeValue(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, params.data.activityId));

  if (!existing) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  const shouldUpdateVisuals =
    parsed.data.visuals !== undefined ||
    parsed.data.visualUrl !== undefined ||
    parsed.data.visualDescription !== undefined;
  const existingVisuals = getCanonicalPresentationVisuals(existing);
  const visuals = shouldUpdateVisuals
    ? parsed.data.visuals !== undefined
      ? normalizePresentationVisuals(parsed.data.visuals)
      : mergeLegacyPresentationVisualPatch(
          existingVisuals,
          parsed.data.visualUrl,
          parsed.data.visualDescription,
          parsed.data.visualUrl !== undefined,
          parsed.data.visualDescription !== undefined,
        )
    : undefined;
  const visualError = visuals
    ? getPresentationVisualPayloadError(visuals)
    : null;
  if (visualError) {
    res.status(413).json({ error: visualError });
    return;
  }

  const deviceMode = parsed.data.deviceMode ?? existing.deviceMode;
  if (deviceMode !== "off" && deviceMode !== "on") {
    res.status(400).json({ error: "Activity has an invalid device mode." });
    return;
  }
  let technologyMode: "no_computer" | "computer_available" | "computer_required";
  try {
    ({ technologyMode } = normalizeActivityTechnology(
      deviceMode,
      parsed.data.technologyMode,
    ));
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
    return;
  }

  let resourceUrl: string | null;
  try {
    resourceUrl = normalizeActivityResourceUrl(
      parsed.data.resourceUrl === undefined
        ? existing.resourceUrl
        : parsed.data.resourceUrl,
      deviceMode,
    );
  } catch (error) {
    if (error instanceof ActivityResourceValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  const [updated] = await db
    .update(activitiesTable)
    .set({
      ...parsed.data,
      ...(visuals
        ? { visuals, ...getLegacyPresentationVisualFields(visuals) }
        : {}),
      title: getActivityCompatibilityTitle(parsed.data.task ?? existing.task),
      technologyMode,
      resourceUrl,
    })
    .where(eq(activitiesTable.id, params.data.activityId))
    .returning();

  res.json(
    UpdateActivityResponse.parse(
      updated ? withCanonicalPresentationVisuals(updated) : updated,
    ),
  );
});

router.delete("/activities/non-favorites", async (_req, res): Promise<void> => {
  const deletedCount = await deleteNonFavoriteActivities();
  res.json(ClearNonFavoriteActivitiesResponse.parse({ deletedCount }));
});

router.delete("/activities/:activityId", async (req, res): Promise<void> => {
  const params = DeleteActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(activitiesTable)
    .where(eq(activitiesTable.id, params.data.activityId))
    .returning({ id: activitiesTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.sendStatus(204);
});

router.post(
  "/activities/:activityId/duplicate",
  async (req, res): Promise<void> => {
    const params = DuplicateActivityParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const copy = await duplicateActivity(params.data.activityId);
    if (!copy) {
      res.status(404).json({ error: "Activity not found" });
      return;
    }

    res.status(201).json(DuplicateActivityResponse.parse(copy));
  },
);

router.patch(
  "/activities/:activityId/favorite",
  async (req, res): Promise<void> => {
    const params = SetActivityFavoriteParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = SetActivityFavoriteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [updated] = await db
      .update(activitiesTable)
      .set({ favorite: parsed.data.favorite })
      .where(eq(activitiesTable.id, params.data.activityId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Activity not found" });
      return;
    }

    res.json(SetActivityFavoriteResponse.parse(updated));
  },
);

export default router;

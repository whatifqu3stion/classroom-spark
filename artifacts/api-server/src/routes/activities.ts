import { Router, type IRouter } from "express";
import { redactCurriculumSnapshot } from "../lib/curriculum-privacy";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  activitiesTable,
  classesTable,
  savedContextsTable,
} from "@workspace/db";
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
  clearChangedBoardContentFormatting,
  validateBoardContentFormatting,
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
import {
  resolveSavedContextSnapshots,
  SavedContextError,
  type SavedContextSnapshot,
} from "../lib/saved-context";

const router: IRouter = Router();

function sameStrings(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

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
    ListActivitiesResponse.parse(rows.map(withCanonicalPresentationVisuals).map(redactCurriculumSnapshot)),
  );
});

router.post("/activities", async (req, res): Promise<void> => {
  const sanitizedBody = sanitizeUnicodeValue(req.body);
  const parsed = CreateActivityBody.safeParse(sanitizedBody);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rawContentFormatting =
    sanitizedBody &&
    typeof sanitizedBody === "object" &&
    "contentFormatting" in sanitizedBody
      ? sanitizedBody.contentFormatting
      : undefined;
  let contentFormatting = parsed.data.contentFormatting;
  if (contentFormatting != null) {
    try {
      contentFormatting = validateBoardContentFormatting(
        rawContentFormatting,
        parsed.data.task,
        parsed.data.prompts ?? [],
      );
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
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

  let savedContextSnapshot: SavedContextSnapshot[] = [];
  try {
    savedContextSnapshot = (
      await resolveSavedContextSnapshots(
        parsed.data.classId,
        parsed.data.savedContextIds ?? [],
      )
    ).snapshots;
  } catch (error) {
    if (error instanceof SavedContextError) {
      res
        .status(error.code === "not_found" ? 404 : 400)
        .json({ error: error.message });
      return;
    }
    throw error;
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

  const { savedContextIds: _savedContextIds, ...activityInput } = parsed.data;
  const created = await db.transaction(async (tx) => {
    const [activity] = await tx
      .insert(activitiesTable)
      .values({
        ...activityInput,
        contentFormatting,
        visuals,
        savedContextSnapshot,
        ...getLegacyPresentationVisualFields(visuals),
        title: getActivityCompatibilityTitle(parsed.data.task),
        deviceMode,
        resourceUrl,
        technologyMode,
      })
      .returning();

    if (_savedContextIds?.length) {
      await tx
        .update(savedContextsTable)
        .set({ lastUsedAt: new Date() })
        .where(inArray(savedContextsTable.id, _savedContextIds));
    }
    return activity;
  });

  res.status(201).json(CreateActivityResponse.parse(redactCurriculumSnapshot(created)));
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

  res.json(GetActivityResponse.parse(redactCurriculumSnapshot(withCanonicalPresentationVisuals(row))));
});

router.patch("/activities/:activityId", async (req, res): Promise<void> => {
  const params = UpdateActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sanitizedBody = sanitizeUnicodeValue(req.body);
  const parsed = UpdateActivityBody.safeParse(sanitizedBody);
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

  let contentFormatting;
  if (parsed.data.contentFormatting !== undefined) {
    if (parsed.data.contentFormatting === null) {
      contentFormatting = null;
    } else {
      try {
        contentFormatting = validateBoardContentFormatting(
          sanitizedBody &&
            typeof sanitizedBody === "object" &&
            "contentFormatting" in sanitizedBody
            ? sanitizedBody.contentFormatting
            : parsed.data.contentFormatting,
          parsed.data.task ?? existing.task,
          parsed.data.prompts ?? existing.prompts,
        );
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
    }
  } else {
    contentFormatting = clearChangedBoardContentFormatting(
      existing.contentFormatting,
      parsed.data.task !== undefined && parsed.data.task !== existing.task,
      parsed.data.prompts !== undefined &&
        !sameStrings(parsed.data.prompts, existing.prompts),
    );
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
      contentFormatting,
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
      updated ? redactCurriculumSnapshot(withCanonicalPresentationVisuals(updated)) : updated,
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

    res.status(201).json(DuplicateActivityResponse.parse(redactCurriculumSnapshot(copy)));
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

    res.json(SetActivityFavoriteResponse.parse(redactCurriculumSnapshot(updated)));
  },
);

export default router;

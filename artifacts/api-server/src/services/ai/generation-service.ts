import { and, desc, eq, inArray } from "drizzle-orm";
import {
  activitiesTable,
  chipsTable,
  classesTable,
  db,
  instructionalContextsTable,
  savedContextsTable,
  unitsTable,
} from "@workspace/db";
import type { GenerateActivityInput } from "@workspace/api-zod";
import {
  ActivityResourceValidationError,
  normalizeActivityResourceUrl,
} from "../../lib/activity-resource";
import {
  ActivityTechnologyValidationError,
  normalizeActivityTechnology,
} from "../../lib/activity-technology";
import { getActivityCompatibilityTitle } from "../../lib/activity-title";
import {
  generatedActivitySchema,
  generatedActivityStyles,
  GenerationError,
  type BoardworkGenerationContext,
  type BoardworkGenerationProvider,
  type GeneratedActivity,
} from "./types";
import {
  resolveSavedContextSnapshots,
  SavedContextError,
  type SavedContextSnapshot,
} from "../../lib/saved-context";
import { readApprovedCurriculumSources } from "../../lib/curriculum-sources";
import { isRepeatedActivity, planCurriculumActivity } from "./curriculum-planner";

function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeActivityStyle(
  value: string | null | undefined,
): BoardworkGenerationContext["today"]["activityStyle"] {
  const normalized = optionalText(value);
  if (!normalized) return null;
  if (
    generatedActivityStyles.includes(
      normalized as (typeof generatedActivityStyles)[number],
    )
  ) {
    return normalized as (typeof generatedActivityStyles)[number];
  }
  throw new GenerationError(
    "invalid_request",
    "Choose a supported activity style.",
  );
}

export function validateTeacherUrl(
  value: string | null | undefined,
  deviceMode: "off" | "on",
): string | null {
  try {
    return normalizeActivityResourceUrl(value, deviceMode);
  } catch (error) {
    if (error instanceof ActivityResourceValidationError) {
      throw new GenerationError("invalid_request", error.message, {
        cause: error,
      });
    }
    throw new GenerationError(
      "invalid_request",
      "Enter a valid http or https resource URL.",
      { cause: error },
    );
  }
}

async function buildGenerationContext(
  input: GenerateActivityInput,
): Promise<{
  context: BoardworkGenerationContext;
  chipIds: string[];
  savedContextIds: string[];
  savedContextSnapshot: SavedContextSnapshot[];
  sourceActivityId: string | null;
  teacherProvidedUrl: string | null;
  selectedUnit: {
    id: string;
    name: string;
    conceptsTopics: string;
    skills: string;
    standardsObjectives: string;
  } | null;
}> {
  const chipIds = [...new Set(input.chipIds)];
  const savedContextIds = input.savedContextIds ?? [];
  const sourceActivityId = input.sourceActivityId?.trim() || null;
  if (sourceActivityId && savedContextIds.length > 0) {
    throw new GenerationError(
      "invalid_request",
      "Choose saved context or a historical activity, not both.",
    );
  }
  if (new Set(savedContextIds).size !== savedContextIds.length) {
    throw new GenerationError(
      "invalid_request",
      "Saved context selections must not contain duplicate ids.",
    );
  }
  let effectiveDeviceMode: "off" | "on";
  let technologyMode: "no_computer" | "computer_available" | "computer_required";
  try {
    ({ deviceMode: effectiveDeviceMode, technologyMode } =
      normalizeActivityTechnology(input.deviceMode, input.technologyMode));
  } catch (error) {
    if (error instanceof ActivityTechnologyValidationError) {
      throw new GenerationError("invalid_request", error.message, {
        cause: error,
      });
    }
    throw error;
  }
  const teacherProvidedUrl = validateTeacherUrl(
    input.teacherProvidedUrl,
    effectiveDeviceMode,
  );

  const [classProfile, instructionalContext, selectedUnit, selectedChips, recentActivities, sourceActivity] =
    await Promise.all([
      db
        .select()
        .from(classesTable)
        .where(eq(classesTable.id, input.classId))
        .then((rows) => rows[0]),
      db
        .select()
        .from(instructionalContextsTable)
        .where(eq(instructionalContextsTable.classId, input.classId))
        .then((rows) => rows[0]),
      input.unitId
        ? db
            .select()
            .from(unitsTable)
            .where(eq(unitsTable.id, input.unitId))
            .then((rows) => rows[0])
        : Promise.resolve(undefined),
      chipIds.length
        ? db
            .select()
            .from(chipsTable)
            .where(
              and(
                eq(chipsTable.classId, input.classId),
                inArray(chipsTable.id, chipIds),
              ),
            )
        : Promise.resolve([]),
      db
        .select({
          task: activitiesTable.task,
          activityStyle: activitiesTable.style,
          curriculumSnapshot: activitiesTable.curriculumSnapshot,
        })
        .from(activitiesTable)
        .where(eq(activitiesTable.classId, input.classId))
        .orderBy(desc(activitiesTable.createdAt))
        .limit(20),
      sourceActivityId
        ? db
            .select()
            .from(activitiesTable)
            .where(eq(activitiesTable.id, sourceActivityId))
            .then((rows) => rows[0])
        : Promise.resolve(undefined),
    ]);

  if (!classProfile) {
    throw new GenerationError("not_found", "Class not found.");
  }
  if (selectedChips.length !== chipIds.length) {
    throw new GenerationError(
      "not_found",
      "One or more selected Focus chips no longer exist for this class.",
    );
  }
  if (input.unitId && !selectedUnit) {
    throw new GenerationError("not_found", "Selected unit not found.");
  }
  if (sourceActivityId && (!sourceActivity || sourceActivity.classId !== input.classId)) {
    throw new GenerationError(
      "not_found",
      "Historical activity not found for this class.",
    );
  }

  let savedContextSnapshot: SavedContextSnapshot[];
  let resolvedSavedContextIds: string[];
  if (sourceActivityId) {
    savedContextSnapshot = sourceActivity?.savedContextSnapshot ?? [];
    resolvedSavedContextIds = [];
  } else {
    try {
      const resolved = await resolveSavedContextSnapshots(
        input.classId,
        savedContextIds,
      );
      savedContextSnapshot = resolved.snapshots;
      resolvedSavedContextIds = resolved.ids;
    } catch (error) {
      if (error instanceof SavedContextError) {
        throw new GenerationError(error.code, error.message, { cause: error });
      }
      throw error;
    }
  }

  const built = {
    chipIds,
    savedContextIds: resolvedSavedContextIds,
    savedContextSnapshot,
    sourceActivityId,
    teacherProvidedUrl,
    selectedUnit: selectedUnit
      ? {
          id: selectedUnit.id,
          name: selectedUnit.name,
          conceptsTopics: selectedUnit.conceptsTopics,
          skills: selectedUnit.skills,
          standardsObjectives: selectedUnit.standardsObjectives,
        }
      : null,
    context: {
      classProfile: {
        name: classProfile.name,
        grade: classProfile.grade,
        subject: classProfile.subject,
        curriculumFramework: classProfile.curriculumFramework,
        curriculumDetails: classProfile.curriculumDetails,
        programmeYear: classProfile.programmeYear,
        generalContext: classProfile.generalContext,
        arrivalRoutine: classProfile.arrivalRoutine,
      },
      instructionalContext: selectedUnit
        ? {
            unitOrProject: selectedUnit.name,
            conceptsTopics: selectedUnit.conceptsTopics,
            skills: selectedUnit.skills,
            standardsObjectives: selectedUnit.standardsObjectives,
          }
        : {
            unitOrProject: instructionalContext?.unitOrProject ?? "",
            conceptsTopics: instructionalContext?.conceptsTopics ?? "",
            skills: instructionalContext?.skills ?? "",
            standardsObjectives: instructionalContext?.standardsObjectives ?? "",
          },
      selectedUnit: selectedUnit
        ? {
            id: selectedUnit.id,
            name: selectedUnit.name,
            conceptsTopics: selectedUnit.conceptsTopics,
            skills: selectedUnit.skills,
            standardsObjectives: selectedUnit.standardsObjectives,
          }
        : null,
      today: {
        unitId: input.unitId ?? null,
        topic: optionalText(input.topic),
        goal: optionalText(input.goal),
        studentOutput: optionalText(input.studentOutput),
        workMode: input.workMode ?? null,
        materialsAvailable: optionalText(input.materialsAvailable),
        completionSignal: optionalText(input.completionSignal),
        focusChips: selectedChips.map((chip) => chip.label),
          savedContext: savedContextSnapshot.map((item) => ({
            label: item.label,
            category: item.category ?? null,
            details: item.details ?? null,
          })),
        deviceMode: effectiveDeviceMode,
        technologyMode,
        durationMinutes: input.durationMinutes,
        activityStyle: normalizeActivityStyle(input.activityStyle),
        teacherProvidedUrl,
        teacherProvidedResourceNote: optionalText(
          input.teacherProvidedResourceNote,
        ),
        surprise: input.surprise,
      },
      recentActivities: recentActivities.map(({ curriculumSnapshot, ...activity }) => ({
        ...activity,
        curriculumSnapshot: curriculumSnapshot ? { focus: curriculumSnapshot.focus } : null,
      })),
    },
  };
  // A historical remix preserves what that board used, even after source changes.
  // Normal generation only considers the currently approved library.
  const context: BoardworkGenerationContext = built.context;
  const historicalBasisApplies = process.env.APP_PASSWORD && sourceActivity?.curriculumSnapshot &&
    (!context.today.topic || context.today.topic === optionalText(sourceActivity.sourceTopic)) &&
    (!context.today.goal || context.today.goal === optionalText(sourceActivity.sourceGoal));
  context.curriculumPlan = sourceActivityId
    ? historicalBasisApplies
      ? sourceActivity!.curriculumSnapshot
      : planCurriculumActivity(context, [])
    : planCurriculumActivity(context, await readApprovedCurriculumSources(input.classId, input.unitId ?? null));
  return { ...built, context };
}

export function validateApplicationContract(
  generated: GeneratedActivity,
  context: BoardworkGenerationContext,
): GeneratedActivity {
  const result = generatedActivitySchema.safeParse(generated);
  if (!result.success) {
    throw new GenerationError(
      "malformed",
      "The generated activity did not match Boardwork's schema.",
      { cause: result.error },
    );
  }
  const validated = result.data;

  if (validated.durationMinutes !== context.today.durationMinutes) {
    throw new GenerationError(
      "malformed",
      "The generated duration did not match the teacher's selection.",
    );
  }
  if (validated.deviceMode !== context.today.deviceMode) {
    throw new GenerationError(
      "malformed",
      "The generated device mode did not match the teacher's selection.",
    );
  }
  if (
    validated.resourceUrl &&
    validated.resourceUrl !== context.today.teacherProvidedUrl
  ) {
    throw new GenerationError(
      "malformed",
      "The generated activity included an unapproved resource URL.",
    );
  }
  if (context.today.deviceMode === "off" && validated.resourceUrl) {
    throw new GenerationError(
      "malformed",
      "Device Off activities cannot include a resource URL.",
    );
  }

  return validated;
}

export async function generateWithRepair(
  provider: BoardworkGenerationProvider,
  context: BoardworkGenerationContext,
): Promise<GeneratedActivity> {
  let generated: GeneratedActivity | null = null;
  let firstError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      generated = validateApplicationContract(
        await provider.generate(
          context,
          attempt === 1
            ? "Match the requested duration and device mode exactly. Use no URL except the exact teacher-provided URL. Stay within every schema length and item limit. Do not repeat a recent task: change the reasoning and response structure, not just a noun. Retain the requested focus and curriculum basis."
            : undefined,
        ),
        context,
      );
      if (isRepeatedActivity(generated.task, context.recentActivities)) {
        throw new GenerationError(
          "malformed",
          "This board was too similar to a recent activity. Try creating it again.",
        );
      }
      break;
    } catch (error) {
      firstError ??= error;
      if (
        !(error instanceof GenerationError) ||
        error.code !== "malformed" ||
        attempt === 1
      ) {
        throw error;
      }
    }
  }

  if (!generated) {
    throw firstError;
  }
  return generated;
}

async function generateAndSaveActivityOnce(
  input: GenerateActivityInput,
  provider: BoardworkGenerationProvider,
) {
  const {
    context,
    chipIds,
    savedContextIds,
    savedContextSnapshot,
    sourceActivityId,
    teacherProvidedUrl,
    selectedUnit,
  } =
    await buildGenerationContext(input);
  const generated = await generateWithRepair(provider, context);

  const created = await db.transaction(async (tx) => {
    const [activity] = await tx
      .insert(activitiesTable)
      .values({
        classId: input.classId,
        eyebrow: generated.eyebrow,
        title: getActivityCompatibilityTitle(generated.task),
        task: generated.task,
        prompts: generated.prompts,
        durationMinutes: generated.durationMinutes,
        deviceMode: generated.deviceMode,
        technologyMode: context.today.technologyMode,
        arrivalInstructions: context.classProfile.arrivalRoutine,
        resourceUrl: teacherProvidedUrl,
        resourceNote: context.today.teacherProvidedResourceNote,
        materials: generated.materials,
        teacherNote: generated.teacherNote,
        sourceTopic: context.today.topic,
        sourceGoal: context.today.goal,
        sourceUnitId: selectedUnit?.id ?? null,
        sourceUnitName: selectedUnit?.name ?? null,
        sourceChipIds: chipIds,
        sourceActivityId,
        savedContextSnapshot,
        curriculumSnapshot: context.curriculumPlan ?? null,
        style:
          context.today.activityStyle ??
          generated.activityStyle ??
          (input.surprise ? "Surprise Me" : null),
        presentationTheme: input.presentationTheme ?? null,
      })
      .returning();

    if (savedContextIds.length > 0) {
      await tx
        .update(savedContextsTable)
        .set({ lastUsedAt: new Date() })
        .where(inArray(savedContextsTable.id, savedContextIds));
    }
    return activity;
  });

  return created;
}

const generatingClasses = new Set<string>();

export async function generateAndSaveActivity(
  input: GenerateActivityInput,
  provider: BoardworkGenerationProvider,
) {
  if (generatingClasses.has(input.classId)) {
    throw new GenerationError("conflict", "A board is already being generated for this class. Please wait.");
  }
  generatingClasses.add(input.classId);
  try {
    return await generateAndSaveActivityOnce(input, provider);
  } finally {
    generatingClasses.delete(input.classId);
  }
}
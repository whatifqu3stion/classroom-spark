import { and, desc, eq, inArray } from "drizzle-orm";
import {
  activitiesTable,
  chipsTable,
  classesTable,
  db,
  instructionalContextsTable,
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

  const [classProfile, instructionalContext, selectedUnit, selectedChips, recentActivities] =
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
        })
        .from(activitiesTable)
        .where(eq(activitiesTable.classId, input.classId))
        .orderBy(desc(activitiesTable.createdAt))
        .limit(3),
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

  return {
    chipIds,
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
      recentActivities,
    },
  };
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
            ? "Match the requested duration and device mode exactly. Use no URL except the exact teacher-provided URL. Stay within every schema length and item limit."
            : undefined,
        ),
        context,
      );
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

export async function generateAndSaveActivity(
  input: GenerateActivityInput,
  provider: BoardworkGenerationProvider,
) {
  const { context, chipIds, teacherProvidedUrl, selectedUnit } =
    await buildGenerationContext(input);
  const generated = await generateWithRepair(provider, context);

  const [created] = await db
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
      style:
        context.today.activityStyle ??
        generated.activityStyle ??
        (input.surprise ? "Surprise Me" : null),
      presentationTheme: input.presentationTheme ?? null,
    })
    .returning();

  return created;
}
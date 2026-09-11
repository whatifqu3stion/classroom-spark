import { z } from "zod";
import { generatedActivityStyleValues } from "@workspace/api-zod";

export const generatedActivityStyles = generatedActivityStyleValues;

export const generatedActivitySchema = z.object({
  eyebrow: z.string().trim().min(1).max(30).nullable(),
  task: z.string().trim().min(1).max(500),
  prompts: z.array(z.string().trim().min(1).max(160)).max(3),
  durationMinutes: z.number().int().min(1),
  deviceMode: z.enum(["off", "on"]),
  materials: z.array(z.string().trim().min(1).max(80)).max(5),
  resourceUrl: z.string().trim().max(2000).nullable(),
  teacherNote: z.string().trim().min(1).max(500).nullable(),
  activityStyle: z.enum(generatedActivityStyles),
});

export type GeneratedActivity = z.infer<typeof generatedActivitySchema>;

export interface BoardworkGenerationContext {
  classProfile: {
    name: string;
    grade: string;
    subject: string;
    curriculumFramework: string | null;
    curriculumDetails: string | null;
    generalContext: string | null;
    arrivalRoutine: string | null;
  };
  instructionalContext: {
    unitOrProject: string;
    conceptsTopics: string;
    skills: string;
    standardsObjectives: string;
  };
  selectedUnit?: {
    id: string;
    name: string;
    conceptsTopics: string;
    skills: string;
    standardsObjectives: string;
  } | null;
  today: {
    unitId?: string | null;
    topic: string | null;
    goal: string | null;
    studentOutput?: string | null;
    workMode?: "quiet" | "think_together" | "discussion" | "teacher_check" | null;
    materialsAvailable?: string | null;
    completionSignal?: string | null;
    focusChips: string[];
    deviceMode: "off" | "on";
    technologyMode?: "no_computer" | "computer_available" | "computer_required";
    durationMinutes: number;
    activityStyle: (typeof generatedActivityStyles)[number] | null;
    teacherProvidedUrl: string | null;
    teacherProvidedResourceNote: string | null;
    surprise: boolean;
  };
  recentActivities: Array<{
    task: string;
    activityStyle: string | null;
  }>;
}

export interface BoardworkGenerationProvider {
  generate(
    context: BoardworkGenerationContext,
    repairFeedback?: string,
  ): Promise<GeneratedActivity>;
}

export type GenerationErrorCode =
  | "invalid_request"
  | "configuration"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "timeout"
  | "malformed"
  | "provider";

export class GenerationError extends Error {
  constructor(
    readonly code: GenerationErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "GenerationError";
  }
}
import { z } from "zod";
import { generatedActivityStyleValues } from "@workspace/api-zod";

export const generatedActivityStyles = generatedActivityStyleValues;

export const generatedActivitySchema = z.object({
  eyebrow: z.string().trim().min(1).max(30).nullable(),
  title: z.string().trim().min(1).max(80),
  task: z.string().trim().min(1).max(500),
  prompts: z.array(z.string().trim().min(1).max(160)).max(3),
  durationMinutes: z.number().int().min(1).max(120),
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
  today: {
    topic: string | null;
    goal: string | null;
    focusChips: string[];
    deviceMode: "off" | "on";
    durationMinutes: number;
    activityStyle: (typeof generatedActivityStyles)[number] | null;
    teacherProvidedUrl: string | null;
    teacherProvidedResourceNote: string | null;
    surprise: boolean;
  };
  recentActivities: Array<{
    title: string;
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
import { z } from "zod";
import type {
  BoardContentFormatting,
  InlineTextRun,
} from "./generated/types";

// Canonical activity text has historically been unbounded. These generous
// safety ceilings prevent pathological JSON while allowing old long boards and
// a whole field normalized into one run.
export const INLINE_FORMATTING_MAX_RUN_TEXT_LENGTH = 100_000;
export const INLINE_FORMATTING_MAX_RUNS_PER_FIELD = 10_000;
export const INLINE_FORMATTING_MAX_PROMPTS = 1_000;
export const INLINE_FORMATTING_MAX_TOTAL_RUNS = 20_000;
export const INLINE_FORMATTING_MAX_TOTAL_TEXT_LENGTH = 1_000_000;

export const InlineTextRunSchema = z
  .object({
    text: z.string().min(1).max(INLINE_FORMATTING_MAX_RUN_TEXT_LENGTH),
    bold: z.boolean().optional(),
    underline: z.boolean().optional(),
    highlight: z.boolean().optional(),
  })
  .strict();

export const BoardContentFormattingSchema = z
  .object({
    version: z.literal(1),
    task: z
      .array(InlineTextRunSchema)
      .max(INLINE_FORMATTING_MAX_RUNS_PER_FIELD)
      .optional(),
    prompts: z
      .array(
        z
          .array(InlineTextRunSchema)
          .max(INLINE_FORMATTING_MAX_RUNS_PER_FIELD),
      )
      .max(INLINE_FORMATTING_MAX_PROMPTS)
      .optional(),
  })
  .strict()
  .superRefine((formatting, context) => {
    const totalRuns =
      (formatting.task?.length ?? 0) +
      (formatting.prompts?.reduce((sum, runs) => sum + runs.length, 0) ?? 0);
    if (totalRuns > INLINE_FORMATTING_MAX_TOTAL_RUNS) {
      context.addIssue({
        code: "custom",
        message: `Formatting may contain at most ${INLINE_FORMATTING_MAX_TOTAL_RUNS} text runs.`,
      });
    }
    const totalTextLength =
      (formatting.task?.reduce((sum, run) => sum + run.text.length, 0) ?? 0) +
      (formatting.prompts?.reduce(
        (promptSum, runs) =>
          promptSum +
          runs.reduce((runSum, run) => runSum + run.text.length, 0),
        0,
      ) ?? 0);
    if (totalTextLength > INLINE_FORMATTING_MAX_TOTAL_TEXT_LENGTH) {
      context.addIssue({
        code: "custom",
        message: `Formatting text may contain at most ${INLINE_FORMATTING_MAX_TOTAL_TEXT_LENGTH} characters.`,
      });
    }
  });

function joinedText(runs: InlineTextRun[]): string {
  return runs.map((run) => run.text).join("");
}

/**
 * Strictly validates formatting and its synchronization with the canonical
 * plaintext fields. Omitted task/prompts formatting means that field is plain.
 */
export function validateBoardContentFormatting(
  formatting: unknown,
  task: string,
  prompts: string[],
): BoardContentFormatting {
  const parsed = BoardContentFormattingSchema.parse(formatting);
  if (parsed.task && joinedText(parsed.task) !== task) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["task"],
        message: "Formatted task text must match the canonical task.",
      },
    ]);
  }
  if (parsed.prompts) {
    if (parsed.prompts.length !== prompts.length) {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["prompts"],
          message: "Formatted prompts must match the canonical prompt count.",
        },
      ]);
    }
    parsed.prompts.forEach((runs, index) => {
      if (joinedText(runs) !== prompts[index]) {
        throw new z.ZodError([
          {
            code: "custom",
            path: ["prompts", index],
            message: "Formatted prompt text must match the canonical prompt.",
          },
        ]);
      }
    });
  }
  return parsed;
}

export function clearChangedBoardContentFormatting(
  existing: BoardContentFormatting | null | undefined,
  taskChanged: boolean,
  promptsChanged: boolean,
): BoardContentFormatting | null {
  if (!existing) return null;
  const next: BoardContentFormatting = {
    version: 1,
    ...(!taskChanged && existing.task ? { task: existing.task } : {}),
    ...(!promptsChanged && existing.prompts ? { prompts: existing.prompts } : {}),
  };
  return next.task || next.prompts ? next : null;
}
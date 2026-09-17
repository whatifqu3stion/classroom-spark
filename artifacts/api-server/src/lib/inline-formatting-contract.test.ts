import { describe, expect, it } from "vitest";
import {
  BoardContentFormattingSchema,
  clearChangedBoardContentFormatting,
  validateBoardContentFormatting,
} from "@workspace/api-zod";

describe("shared board inline-formatting contract", () => {
  it("accepts combined semantic marks and Unicode without changing text", () => {
    const formatting = {
      version: 1 as const,
      task: [
        { text: "اقرأ ", bold: true, highlight: true },
        { text: "日本語 👩🏽‍🔬", underline: true },
      ],
    };
    expect(
      validateBoardContentFormatting(formatting, "اقرأ 日本語 👩🏽‍🔬", []),
    ).toEqual(formatting);
  });

  it("allows a legacy long canonical field to remain a single run", () => {
    const text = "Long board content. ".repeat(400);
    expect(
      validateBoardContentFormatting(
        { version: 1, task: [{ text, bold: true }] },
        text,
        [],
      ).task,
    ).toHaveLength(1);
  });

  it("rejects unknown markup, invalid flags, empty runs, and excess runs", () => {
    expect(() =>
      BoardContentFormattingSchema.parse({
        version: 1,
        task: [{ text: "No HTML", color: "red" }],
      }),
    ).toThrow();
    expect(() =>
      BoardContentFormattingSchema.parse({
        version: 1,
        task: [{ text: "Strict", bold: "yes" }],
      }),
    ).toThrow();
    expect(() =>
      BoardContentFormattingSchema.parse({
        version: 1,
        task: [{ text: "" }],
      }),
    ).toThrow();
    expect(() =>
      BoardContentFormattingSchema.parse({
        version: 1,
        task: Array.from({ length: 10_001 }, () => ({ text: "x" })),
      }),
    ).toThrow();
  });

  it("rejects text and prompt-count mismatches", () => {
    expect(() =>
      validateBoardContentFormatting(
        { version: 1, task: [{ text: "wrong" }] },
        "canonical",
        [],
      ),
    ).toThrow(/canonical task/);
    expect(() =>
      validateBoardContentFormatting(
        { version: 1, prompts: [[{ text: "one" }]] },
        "task",
        ["one", "two"],
      ),
    ).toThrow(/prompt count/);
  });

  it("clears only runs for canonical fields that changed", () => {
    const existing = {
      version: 1 as const,
      task: [{ text: "Task", bold: true }],
      prompts: [[{ text: "Prompt", underline: true }]],
    };
    expect(clearChangedBoardContentFormatting(existing, true, false)).toEqual({
      version: 1,
      prompts: existing.prompts,
    });
    expect(clearChangedBoardContentFormatting(existing, true, true)).toBeNull();
    expect(clearChangedBoardContentFormatting(null, true, false)).toBeNull();
  });
});
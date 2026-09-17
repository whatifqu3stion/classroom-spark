import type { CSSProperties } from "react";
import type { InlineTextRun } from "@workspace/api-zod";
import { parseFormulaText } from "@/components/formula-text";
import { getThemeColors, type BoardworkPresentationTheme } from "./presentation-theme";

export function getInlineFormulaRanges(text: string) {
  let position = 0;
  return parseFormulaText(text).flatMap((segment) => {
    const from = position;
    position += segment.kind === "text" ? segment.value.length : segment.source.length;
    return segment.kind === "formula" ? [{ from, to: position }] : [];
  });
}

export function getInlineHighlightStyle(
  theme?: BoardworkPresentationTheme | null,
): CSSProperties {
  const accent = getThemeColors(theme).accent;
  const rgb = accent.slice(1).match(/.{2}/g)!.map((hex) => {
    const value = parseInt(hex, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  // Choosing the higher-contrast endpoint guarantees at least 4.5:1 for
  // every resolved accent, including custom colors near the contrast crossover.
  const foreground = (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000" : "#FFFFFF";
  return {
    "--inline-highlight-background": accent,
    "--inline-highlight-foreground": foreground,
  } as CSSProperties;
}

/** Keep formula tokens and Unicode code points whole when applying inline marks. */
export function normalizeFormulaRuns(text: string, runs?: InlineTextRun[] | null): InlineTextRun[] {
  if (!text) return [];
  if (!runs?.length || runs.map((run) => run.text).join("") !== text) return [{ text }];
  let position = 0;
  const ranges = runs.map((run) => {
    const from = position;
    position += run.text.length;
    return { ...run, from, to: position };
  });
  const result: InlineTextRun[] = [];
  let cursor = 0;
  const append = (value: string, from: number) => {
    const to = from + value.length;
    while (cursor < ranges.length && ranges[cursor].to <= from) cursor++;
    const marked: InlineTextRun = { text: value };
    for (let index = cursor; index < ranges.length && ranges[index].from < to; index++) {
      if (ranges[index].bold) marked.bold = true;
      if (ranges[index].underline) marked.underline = true;
      if (ranges[index].highlight) marked.highlight = true;
    }
    const previous = result[result.length - 1];
    if (previous && previous.bold === marked.bold && previous.underline === marked.underline &&
      previous.highlight === marked.highlight) previous.text += value;
    else result.push(marked);
  };
  position = 0;
  for (const segment of parseFormulaText(text)) {
    if (segment.kind === "formula") {
      append(segment.source, position);
      position += segment.source.length;
    } else {
      for (const character of segment.value) {
        append(character, position);
        position += character.length;
      }
    }
  }
  return result;
}
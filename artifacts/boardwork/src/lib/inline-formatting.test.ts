import { describe, expect, it } from "vitest";
import {
  getCuratedPresentationTheme, presentationAccentThemes, presentationSurfaceThemes,
} from "@workspace/api-zod";
import { getInlineFormulaRanges, getInlineHighlightStyle, normalizeFormulaRuns } from "./inline-formatting";

describe("inline formatting normalization", () => {
  it("merges adjacent equivalent runs and ignores stale marks", () => {
    expect(normalizeFormulaRuns("Hello world", [
      { text: "Hello ", bold: true }, { text: "world", bold: true },
    ])).toEqual([{ text: "Hello world", bold: true }]);
    expect(normalizeFormulaRuns("Replaced", [{ text: "Original", highlight: true }])).toEqual([{ text: "Replaced" }]);
    expect(normalizeFormulaRuns("", [])).toEqual([]);
  });

  it("makes partial formula marks atomic without changing source", () => {
    const text = "Solve \\(x^2\\) and H_2O.";
    expect(getInlineFormulaRanges(text)).toEqual([{ from: 6, to: 13 }, { from: 18, to: 21 }]);
    expect(normalizeFormulaRuns(text, [
      { text: "Solve \\(" }, { text: "x", highlight: true }, { text: "^2\\) and H_" },
      { text: "2", underline: true }, { text: "O." },
    ])).toEqual([
      { text: "Solve " }, { text: "\\(x^2\\)", highlight: true }, { text: " and " },
      { text: "H_2", underline: true }, { text: "O." },
    ]);
  });

  it("keeps emoji code points and mixed-direction text intact", () => {
    expect(normalizeFormulaRuns("Hi ✅😀 שלום", [
      { text: "Hi ✅\ud83d", bold: true }, { text: "\ude00 שלום", underline: true },
    ])).toEqual([
      { text: "Hi ✅", bold: true }, { text: "😀", bold: true, underline: true },
      { text: " שלום", underline: true },
    ]);
  });

  it("keeps unmatched delimiters and ordinary punctuation literal", () => {
    const text = "Price $oops and __notes";
    expect(getInlineFormulaRanges(text)).toEqual([]);
    expect(normalizeFormulaRuns(text, [{ text: "Price ", bold: true }, { text: "$oops and __notes" }]))
      .toEqual([{ text: "Price ", bold: true }, { text: "$oops and __notes" }]);
  });
});

function luminance(hex: string) {
  const values = hex.slice(1).match(/.{2}/g)!.map((value) => {
    const c = parseInt(value, 16) / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}

describe("presentation accent highlights", () => {
  it("uses the actual selected accent with at least 4.5:1 text contrast for every curated pairing", () => {
    for (const surface of presentationSurfaceThemes) for (const accent of presentationAccentThemes) {
      const selection = { kind: "curated" as const, themeId: surface.id, accentId: accent.id };
      const style = getInlineHighlightStyle(selection) as Record<string, string>;
      const background = style["--inline-highlight-background"];
      expect(background).toBe(getCuratedPresentationTheme(surface.id, accent.id).colors.accent);
      const l1 = luminance(background);
      const l2 = luminance(style["--inline-highlight-foreground"]);
      expect((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("follows custom and legacy colors rather than the teacher-interface accent", () => {
    for (const accent of ["#000000", "#FFFFFF", "#777777", "#8855AA"]) {
      const style = getInlineHighlightStyle({
        kind: "custom", sourceThemeId: "paper",
        anchors: { background: "#FFFFFF", text: "#171717", accent },
      }) as Record<string, string>;
      const a = luminance(style["--inline-highlight-background"]);
      const b = luminance(style["--inline-highlight-foreground"]);
      expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toBeGreaterThanOrEqual(4.5);
    }
    const legacy = getInlineHighlightStyle({ kind: "curated", themeId: "ocean" }) as Record<string, string>;
    expect(legacy["--inline-highlight-background"]).toBe(getCuratedPresentationTheme("ocean").colors.accent);
  });
});
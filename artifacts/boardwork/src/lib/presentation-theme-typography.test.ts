import { describe, expect, it } from "vitest";
import {
  getCuratedPresentationTheme,
  getPresentationThemeTypography,
} from "@workspace/api-zod";

describe("presentation typography systems", () => {
  it("keeps Boardwork as the stable default system", () => {
    const typography = getCuratedPresentationTheme("boardwork").typography;

    expect(typography.heading.family).toContain("'Inter'");
    expect(typography.body.family).toContain("'Inter'");
    expect(typography.heading.weight).toBe(700);
    expect(typography.body.weight).toBe(500);
  });

  it("maps exposed appearances to matched semantic systems", () => {
    const editorial = getCuratedPresentationTheme("paper-v2").typography;
    const structured = getCuratedPresentationTheme("charcoal-v2").typography;
    const clear = getCuratedPresentationTheme("midnight").typography;

    expect(editorial.heading.family).toContain("'DM Serif Display'");
    expect(editorial.body.family).toContain("'DM Sans'");
    expect(structured.heading.family).toContain("'IBM Plex Serif'");
    expect(structured.body.family).toContain("'IBM Plex Sans'");
    expect(clear.heading.family).toContain("'Atkinson Hyperlegible'");
    expect(clear.body.family).toContain("'Atkinson Hyperlegible'");
  });

  it("includes explicit script and system fallbacks for legacy content", () => {
    const typography = getCuratedPresentationTheme("ocean").typography;

    expect(typography.body.family).toContain("'Noto Sans Arabic'");
    expect(typography.body.family).toContain("system-ui");
    expect(typography.heading.family).toContain("sans-serif");
  });

  it("allows an explicit typography choice without changing the surface", () => {
    const typography = getPresentationThemeTypography({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
      typographyId: "clear",
    });

    expect(typography.id).toBe("clear");
    expect(getCuratedPresentationTheme("paper-v2", "sage").colors.background).toBe(
      "#F3EEE4",
    );
  });

  it("falls back to Boardwork typography for an invalid surface", () => {
    const typography = getPresentationThemeTypography({
      kind: "curated",
      themeId: "not-a-surface",
      typographyId: "clear",
    });

    expect(typography.id).toBe("boardwork");
  });

  it("keeps an explicit typography choice available for a legacy surface", () => {
    expect(
      getPresentationThemeTypography({
        kind: "curated",
        themeId: "ocean",
        typographyId: "clear",
      }).id,
    ).toBe("clear");
  });
});
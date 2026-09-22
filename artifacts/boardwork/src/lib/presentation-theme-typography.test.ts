import { beforeEach, describe, expect, it } from "vitest";
import {
  getCuratedPresentationTheme,
  getPresentationThemeTypography,
  presentationTypographySystems,
} from "@workspace/api-zod";
import {
  getLastUsedPresentationTheme,
  rememberPresentationTheme,
} from "./presentation-theme";

beforeEach(() => {
  localStorage.clear();
});

describe("presentation typography systems", () => {
  it("exposes only the fixed Boardwork presentation pairing", () => {
    expect(presentationTypographySystems.map(({ id }) => id)).toEqual([
      "boardwork",
    ]);
  });

  it("keeps Boardwork as the stable default system", () => {
    const typography = getCuratedPresentationTheme("boardwork").typography;

    expect(typography.heading.family).toContain("'Bitter'");
    expect(typography.body.family).toContain("'Open Sans'");
    expect(typography.heading.weight).toBe(600);
    expect(typography.body.weight).toBe(500);
    expect(typography.headingScale).toBe(1);
  });

  it("uses the fixed pairing for every current appearance", () => {
    const editorial = getCuratedPresentationTheme("paper-v2").typography;
    const structured = getCuratedPresentationTheme("charcoal-v2").typography;
    const clear = getCuratedPresentationTheme("midnight").typography;

    for (const typography of [editorial, structured, clear]) {
      expect(typography).toEqual(getCuratedPresentationTheme("boardwork").typography);
    }
  });

  it("includes explicit script and system fallbacks for legacy content", () => {
    const typography = getCuratedPresentationTheme("ocean").typography;

    expect(typography.body.family).toContain("'Noto Sans Arabic'");
    expect(typography.body.family).toContain("system-ui");
    expect(typography.heading.family).toContain("'Noto Sans Arabic'");
    expect(typography.heading.family).toMatch(/, serif$/);
  });

  it("ignores legacy typography choices without changing the surface", () => {
    const typography = getPresentationThemeTypography({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
      typographyId: "clear",
    });

    expect(typography.id).toBe("boardwork");
    expect(typography.heading.family).toContain("'Bitter'");
    expect(typography.body.family).toContain("'Open Sans'");
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

  it("keeps legacy appearance content readable with the fixed pairing", () => {
    expect(
      getPresentationThemeTypography({
        kind: "curated",
        themeId: "ocean",
        typographyId: "clear",
      }).id,
    ).toBe("boardwork");
  });

  it("strips an experimental typography choice from restored local preferences", () => {
    localStorage.setItem(
      "boardwork:last-presentation-theme",
      JSON.stringify({
        kind: "curated",
        themeId: "paper-v2",
        accentId: "sage",
        typographyId: "clear",
      }),
    );

    expect(getLastUsedPresentationTheme()).toEqual({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
    });
  });

  it("does not write typography choices to new local preferences", () => {
    rememberPresentationTheme({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
      typographyId: "clear",
    });

    expect(JSON.parse(localStorage.getItem("boardwork:last-presentation-theme")!)).toEqual({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
    });
  });
});
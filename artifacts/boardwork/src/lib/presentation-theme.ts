import {
  DEFAULT_PRESENTATION_THEME_ID,
  getPresentationThemeAccentId,
  getPresentationAccentName,
  getCuratedPresentationTheme,
  getPresentationThemeColors,
  getPresentationThemeTypography,
  isHexColor,
  presentationSurfaceThemes,
  type PresentationThemeColors,
  type PresentationTypography,
} from "@workspace/api-zod";
import type { PresentationThemeSelection } from "@workspace/api-client-react";

export type BoardworkPresentationTheme = PresentationThemeSelection;

const LAST_USED_THEME_KEY = "boardwork:last-presentation-theme";

export type ResolvedPresentationTheme = {
  colors: PresentationThemeColors;
  typography: PresentationTypography;
};

export function getThemeColors(
  selection: BoardworkPresentationTheme | null | undefined,
): PresentationThemeColors {
  return getPresentationThemeColors(
    selection as BoardworkPresentationTheme & {
      kind: "curated" | "custom";
    },
  );
}

export function getThemeTypography(
  selection: BoardworkPresentationTheme | null | undefined,
): PresentationTypography {
  return getPresentationThemeTypography(
    selection as BoardworkPresentationTheme & {
      kind: "curated" | "custom";
    },
  );
}

export function getResolvedPresentationTheme(
  selection: BoardworkPresentationTheme | null | undefined,
): ResolvedPresentationTheme {
  return {
    colors: getThemeColors(selection),
    typography: getThemeTypography(selection),
  };
}

export function getThemeLabel(
  selection: BoardworkPresentationTheme | null | undefined,
): string {
  if (selection?.kind === "custom") return "Custom";
  return getCuratedPresentationTheme(
    selection?.kind === "curated"
      ? selection.themeId
      : DEFAULT_PRESENTATION_THEME_ID,
  ).name;
}

export function getThemeId(
  selection: BoardworkPresentationTheme | null | undefined,
): string {
  return selection?.kind === "curated"
    ? getCuratedPresentationTheme(selection.themeId).id
    : DEFAULT_PRESENTATION_THEME_ID;
}

export function getThemeAccentId(
  selection: BoardworkPresentationTheme | null | undefined,
): string | null {
  return getPresentationThemeAccentId(
    selection as BoardworkPresentationTheme & {
      kind: "curated" | "custom";
    },
  );
}

export function getThemeTypographyId(
  selection: BoardworkPresentationTheme | null | undefined,
): string {
  return getThemeTypography(selection).id;
}

export function getThemeAccentName(
  selection: BoardworkPresentationTheme | null | undefined,
): string | null {
  if (selection?.kind === "custom") return null;
  const surface = presentationSurfaceThemes.find(
    (theme) => theme.id === getThemeId(selection),
  );
  const accentId = getThemeAccentId(selection);
  return surface && accentId
    ? getPresentationAccentName(accentId, surface.mode)
    : null;
}

export function getLastUsedPresentationTheme(): BoardworkPresentationTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(LAST_USED_THEME_KEY) ?? "null",
    );
    if (
      parsed &&
      typeof parsed === "object" &&
      "kind" in parsed &&
      parsed.kind === "curated" &&
      "themeId" in parsed &&
      typeof parsed.themeId === "string"
    ) {
      const themeId = getCuratedPresentationTheme(parsed.themeId).id;
      if (!presentationSurfaceThemes.some((theme) => theme.id === themeId)) {
        return null;
      }
      const accentId =
        "accentId" in parsed && typeof parsed.accentId === "string"
          ? getThemeAccentId({
              kind: "curated",
              themeId,
              accentId: parsed.accentId,
            })
          : null;
      return {
        kind: "curated",
        themeId,
        ...(accentId ? { accentId } : {}),
      };
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      "kind" in parsed &&
      parsed.kind === "custom" &&
      "anchors" in parsed &&
      parsed.anchors &&
      typeof parsed.anchors === "object" &&
      "background" in parsed.anchors &&
      "text" in parsed.anchors &&
      "accent" in parsed.anchors &&
      typeof parsed.anchors.background === "string" &&
      typeof parsed.anchors.text === "string" &&
      typeof parsed.anchors.accent === "string" &&
      isHexColor(parsed.anchors.background) &&
      isHexColor(parsed.anchors.text) &&
      isHexColor(parsed.anchors.accent)
    ) {
      // Custom themes remain readable on activities that already saved them,
      // but they are not a valid last-used preset for new activities now that
      // manual palette editing is no longer part of the teacher UI.
      return null;
    }
  } catch {
    // A malformed local preference should never prevent the workspace loading.
  }
  return null;
}

export function rememberPresentationTheme(
  selection: BoardworkPresentationTheme,
): void {
  if (typeof window === "undefined") return;
  if (
    selection.kind !== "curated" ||
    !presentationSurfaceThemes.some((theme) => theme.id === selection.themeId)
  ) {
    return;
  }
  try {
    window.localStorage.setItem(
      LAST_USED_THEME_KEY,
      JSON.stringify({
        kind: "curated",
        themeId: selection.themeId,
        ...(getThemeAccentId(selection)
          ? { accentId: getThemeAccentId(selection) }
          : {}),
      }),
    );
  } catch {
    // Storage can be unavailable in private browsing; the activity still saves.
  }
}

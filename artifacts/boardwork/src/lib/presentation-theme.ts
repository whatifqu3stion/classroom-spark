import {
  DEFAULT_PRESENTATION_THEME_ID,
  getCuratedPresentationTheme,
  getPresentationThemeColors,
  isHexColor,
  type PresentationThemeColors,
} from "@workspace/api-zod";
import type { PresentationThemeSelection } from "@workspace/api-client-react";

export type BoardworkPresentationTheme = PresentationThemeSelection;

const LAST_USED_THEME_KEY = "boardwork:last-presentation-theme";

export function getThemeColors(
  selection: BoardworkPresentationTheme | null | undefined,
): PresentationThemeColors {
  return getPresentationThemeColors(
    selection as BoardworkPresentationTheme & {
      kind: "curated" | "custom";
    },
  );
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
      return {
        kind: "curated",
        themeId: getCuratedPresentationTheme(parsed.themeId).id,
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
      return {
        kind: "custom",
        sourceThemeId:
          "sourceThemeId" in parsed && typeof parsed.sourceThemeId === "string"
            ? parsed.sourceThemeId
            : undefined,
        anchors: {
          background: parsed.anchors.background,
          text: parsed.anchors.text,
          accent: parsed.anchors.accent,
        },
      };
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
  try {
    window.localStorage.setItem(LAST_USED_THEME_KEY, JSON.stringify(selection));
  } catch {
    // Storage can be unavailable in private browsing; the activity still saves.
  }
}

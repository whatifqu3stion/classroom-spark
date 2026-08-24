/**
 * Only fonts used by the currently exposed appearance presets are bundled.
 * Legacy appearance families intentionally fall through to the explicit
 * system/script stacks in the theme catalog.
 */
export const PRESENTATION_FONT_REQUESTS = [
  { family: "Inter", weights: [400, 500, 600, 700] },
  { family: "DM Sans", weights: [500] },
  { family: "DM Serif Display", weights: [400] },
  { family: "Atkinson Hyperlegible", weights: [500, 700] },
  { family: "IBM Plex Sans", weights: [500] },
  { family: "IBM Plex Serif", weights: [600] },
] as const;

export const PRESENTATION_FONT_FAMILIES = PRESENTATION_FONT_REQUESTS.map(
  ({ family }) => family,
);

export const PRESENTATION_EXPORT_SIZE = {
  width: 1920,
  height: 1080,
} as const;

export function getPresentationExportOptions(backgroundColor: string) {
  return {
    ...PRESENTATION_EXPORT_SIZE,
    canvasWidth: PRESENTATION_EXPORT_SIZE.width,
    canvasHeight: PRESENTATION_EXPORT_SIZE.height,
    pixelRatio: 1,
    backgroundColor,
    cacheBust: true,
  } as const;
}

export async function waitForPresentationFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  await Promise.all([
    document.fonts.ready,
    ...PRESENTATION_FONT_REQUESTS.flatMap(({ family, weights }) =>
      weights.map((weight) =>
        document.fonts.load(`${weight} 1em "${family}"`).catch(() => []),
      ),
    ),
  ]);
}
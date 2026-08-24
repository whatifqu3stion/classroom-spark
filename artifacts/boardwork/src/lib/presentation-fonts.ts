/**
 * Fonts requested by index.html for authored classroom content. The final
 * system sans-serif fallback is intentionally not listed: it is synchronous
 * browser-provided coverage when a web font is unavailable.
 */
export const PRESENTATION_FONT_FAMILIES = [
  "Inter",
  "Atkinson Hyperlegible",
  "DM Sans",
  "DM Serif Display",
  "Fraunces",
  "IBM Plex Mono",
  "IBM Plex Sans",
  "Lora",
  "Noto Sans Arabic",
  "Noto Sans Hebrew",
  "Noto Sans Devanagari",
  "Noto Sans JP",
  "Playfair Display",
  "Plus Jakarta Sans",
  "Source Sans 3",
  "Space Grotesk",
] as const;

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
    ...PRESENTATION_FONT_FAMILIES.flatMap((family) =>
      [400, 500, 600, 700].map((weight) =>
        document.fonts.load(`${weight} 1em "${family}"`).catch(() => []),
      ),
    ),
  ]);
}
import {
  getPresentationImagePayloadError,
  type PresentationVisual,
} from "@workspace/api-zod";

export function normalizePresentationVisuals(
  visuals: PresentationVisual[] | undefined,
  legacyUrl?: string | null,
  legacyDescription?: string | null,
): PresentationVisual[] {
  if (visuals !== undefined) return visuals.slice(0, 2);
  return legacyUrl
    ? [{ url: legacyUrl, description: legacyDescription ?? null }]
    : [];
}

type PresentationVisualRecord = {
  visuals?: PresentationVisual[] | null;
  visualUrl?: string | null;
  visualDescription?: string | null;
};

export function getCanonicalPresentationVisuals(
  activity: PresentationVisualRecord,
): PresentationVisual[] {
  if (activity.visuals && activity.visuals.length > 0) {
    return activity.visuals.slice(0, 2);
  }
  return normalizePresentationVisuals(
    undefined,
    activity.visualUrl,
    activity.visualDescription,
  );
}

export function withCanonicalPresentationVisuals<
  T extends PresentationVisualRecord,
>(activity: T): T & { visuals: PresentationVisual[] } {
  const visuals = getCanonicalPresentationVisuals(activity);
  return {
    ...activity,
    visuals,
    ...getLegacyPresentationVisualFields(visuals),
  };
}

export function mergeLegacyPresentationVisualPatch(
  existingVisuals: PresentationVisual[],
  legacyUrl: string | null | undefined,
  legacyDescription: string | null | undefined,
  hasUrl: boolean,
  hasDescription: boolean,
): PresentationVisual[] {
  const nextVisuals = existingVisuals.slice(0, 2);
  if (hasUrl && legacyUrl === null) {
    return nextVisuals.slice(1);
  }

  const firstVisual = nextVisuals[0];
  const nextUrl = hasUrl ? legacyUrl : firstVisual?.url;
  if (!nextUrl) return nextVisuals;

  nextVisuals[0] = {
    url: nextUrl,
    description: hasDescription
      ? legacyDescription ?? null
      : firstVisual?.description ?? null,
  };
  return nextVisuals;
}

export function getLegacyPresentationVisualFields(visuals: PresentationVisual[]) {
  return {
    visualUrl: visuals[0]?.url ?? null,
    visualDescription: visuals[0]?.description ?? null,
  };
}

export function getPresentationVisualPayloadError(
  visuals: PresentationVisual[],
): string | null {
  for (const visual of visuals) {
    const error = getPresentationImagePayloadError(visual.url);
    if (error) return error;
  }
  return null;
}
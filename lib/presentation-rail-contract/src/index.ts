export const PRESENTATION_RAIL_INVARIANTS = {
  visualCard: "visual-card",
  intrinsicImage: "intrinsic-image",
  largeTimer: "large-timer",
  teacherControls: "teacher-controls",
} as const;

export const PRESENTATION_RAIL_CONTRACT = Object.values(
  PRESENTATION_RAIL_INVARIANTS,
).join(" ");

export type PresentationRailMode =
  | "split"
  | "timer-only"
  | "image-only"
  | "empty";

export function getPresentationRailMode({
  hasVisual,
  hasLargeTimer,
}: {
  hasVisual: boolean;
  hasLargeTimer: boolean;
}): PresentationRailMode {
  if (hasLargeTimer) return hasVisual ? "split" : "timer-only";
  return hasVisual ? "image-only" : "empty";
}
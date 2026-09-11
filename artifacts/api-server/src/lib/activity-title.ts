const GENERIC_ACTIVITY_TITLE = "Boardwork Activity";

/**
 * The database title is retained as compatibility data for older clients.
 * It is never student-facing; keep it short and derive it from the task.
 */
export function getActivityCompatibilityTitle(task: string | null | undefined): string {
  const normalized = task?.trim().replace(/\s+/gu, " ");
  if (!normalized) return GENERIC_ACTIVITY_TITLE;
  return Array.from(normalized).slice(0, 80).join("");
}
import type { CSSProperties, ReactNode, Ref } from "react";
import { ExternalLink } from "lucide-react";
import type { ActivityDraft } from "@/store/boardwork-context";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { cn } from "@/lib/utils";
import { getThemeColors, getThemeTypography } from "@/lib/presentation-theme";
import { getPresentationThemeAccentForeground } from "@workspace/api-zod";
import { FormulaText } from "./formula-text";
import type { CountdownTimerState } from "./countdown-timer";

interface PresentationCanvasProps {
  activity: ActivityDraft;
  controls?: ReactNode;
  exportLayout?: boolean;
  surfaceRef?: Ref<HTMLDivElement>;
  timer?: Pick<CountdownTimerState, "remainingSeconds" | "status"> & {
    visible: boolean;
    alarmActive?: boolean;
  };
  timerVisibilityControl?: ReactNode;
}

const testId = (enabled: boolean, value: string) =>
  enabled ? { "data-testid": value } : {};

export function PresentationCanvas({
  activity,
  controls,
  timerVisibilityControl,
  exportLayout = false,
  surfaceRef,
  timer,
}: PresentationCanvasProps) {
  const arrivalInstruction = activity.arrivalInstructions?.trim();
  const safeResourceUrl = getSafeResourceUrl(activity.resourceUrl);
  const themeColors = getThemeColors(activity.presentationTheme);
  const themeTypography = getThemeTypography(activity.presentationTheme);
  const includeTestIds = !exportLayout;
  const hasVisual = Boolean(activity.visualUrl);
  const timerCue = !exportLayout ? timer : undefined;
  const formatTimer = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const timerStatusLabel =
    timerCue?.status === "running"
      ? "Timer running"
      : timerCue?.status === "paused"
        ? "Timer paused"
        : timerCue?.status === "completed"
          ? "Timer complete"
          : "Timer ready";

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "presentation-surface",
        exportLayout && "presentation-surface--export",
      )}
      style={{
        "--presentation-bg": themeColors.background,
        "--presentation-surface": themeColors.surface,
        "--presentation-primary-text": themeColors.primaryText,
        "--presentation-secondary-text": themeColors.secondaryText,
        "--presentation-accent": themeColors.accent,
        "--presentation-accent-soft": themeColors.accentSoft,
        "--presentation-accent-foreground":
          getPresentationThemeAccentForeground(themeColors.accent),
        "--board-font-heading": themeTypography.heading.family,
        "--board-font-body": themeTypography.body.family,
        "--board-font-heading-weight": themeTypography.heading.weight,
        "--board-font-body-weight": themeTypography.body.weight,
        "--board-font-heading-letter-spacing":
          themeTypography.headingLetterSpacing,
        backgroundColor: themeColors.background,
        color: themeColors.primaryText,
        fontFamily: themeTypography.body.family,
        fontWeight: themeTypography.body.weight,
      } as CSSProperties}
      {...testId(includeTestIds, "presentation-surface")}
    >
      <div
        className={cn(
          "presentation-arrival presentation-arrival--top boardwork-user-content",
          !arrivalInstruction && "presentation-arrival--empty",
        )}
        dir="auto"
        aria-hidden={!arrivalInstruction}
        {...(arrivalInstruction ? testId(includeTestIds, "present-arrival") : {})}
      >
        {arrivalInstruction && <FormulaText>{arrivalInstruction}</FormulaText>}
      </div>

      <header className="presentation-header">
        {activity.title || activity.eyebrow ? (
          <div
            className={cn(
              "presentation-eyebrow boardwork-user-content",
              activity.title && "presentation-header-title",
            )}
            dir="auto"
            {...testId(
              includeTestIds,
              activity.title ? "present-title" : "present-eyebrow",
            )}
          >
            {activity.title || activity.eyebrow}
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        {!exportLayout && timer && !timer.visible && timerVisibilityControl
          ? timerVisibilityControl
          : (
            <div
              className={cn(
                "presentation-time",
                timerCue && "presentation-time--timer-aware",
                timerCue && `presentation-time--timer-${timerCue.status}`,
              )}
              title={timerCue ? `${timerStatusLabel} — ${activity.durationMinutes} minutes` : undefined}
              {...testId(includeTestIds, "present-time")}
            >
              {timerCue && (
                <span className="presentation-time-indicator" aria-hidden="true">
                  <span />
                </span>
              )}
              {timerCue ? formatTimer(timerCue.remainingSeconds) : `${activity.durationMinutes} MIN`}
            </div>
          )}
      </header>

      <main className={cn("presentation-main", !hasVisual && "presentation-main--content-only")}>
        <div className="presentation-content">
          {activity.task && (
            <p
              className="presentation-task boardwork-user-content"
              dir="auto"
              {...testId(includeTestIds, "present-task")}
            >
              <FormulaText>{activity.task}</FormulaText>
            </p>
          )}

          {activity.prompts.length > 0 && (
            <ul className="presentation-prompts">
              {activity.prompts.map((prompt, index) => (
                <li key={index} className="presentation-prompt">
                  <span className="presentation-prompt-marker" aria-hidden="true">
                    •
                  </span>
                  <span className="boardwork-user-content" dir="auto">
                    <FormulaText>{prompt}</FormulaText>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {activity.materials && activity.materials.length > 0 && (
            <p
              className="presentation-materials boardwork-user-content"
              dir="auto"
              {...testId(includeTestIds, "present-materials")}
            >
              <FormulaText>{`Materials: ${activity.materials.join(", ")}`}</FormulaText>
            </p>
          )}

          {safeResourceUrl && (
            <div
              className="presentation-resource"
              {...testId(includeTestIds, "present-resource")}
            >
              <a
                href={safeResourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={exportLayout ? -1 : undefined}
                className="presentation-resource-link"
                {...testId(includeTestIds, "present-resource-link")}
              >
                Open resource
                <ExternalLink className="h-[1em] w-[1em]" aria-hidden="true" />
              </a>
              {activity.resourceNote && (
                <p className="presentation-resource-note boardwork-user-content" dir="auto">
                 <FormulaText>{activity.resourceNote}</FormulaText>
                </p>
              )}
            </div>
          )}
        </div>
        {hasVisual && (
          <aside className="presentation-rail presentation-rail--image-only">
            <figure className="presentation-visual">
              <img src={activity.visualUrl ?? ""} alt={activity.visualDescription ?? ""} />
              {activity.visualDescription && (
                <figcaption className="boardwork-user-content" dir="auto">
                  {activity.visualDescription}
                </figcaption>
              )}
            </figure>
          </aside>
        )}
      </main>

      <footer className="presentation-footer">
        {controls}
      </footer>
    </div>
  );
}
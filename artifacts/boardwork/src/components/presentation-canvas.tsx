import type { CSSProperties, ReactNode, Ref } from "react";
import { ExternalLink, EyeOff } from "lucide-react";
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
  timerControls?: ReactNode;
  onShowTimer?: () => void;
  exportLayout?: boolean;
  surfaceRef?: Ref<HTMLDivElement>;
  timer?: Pick<CountdownTimerState, "remainingSeconds" | "status"> & {
    visible: boolean;
    alarmActive?: boolean;
  };
}

const testId = (enabled: boolean, value: string) =>
  enabled ? { "data-testid": value } : {};

export function PresentationCanvas({
  activity,
  controls,
  timerControls,
  onShowTimer,
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
  const showTimer = !exportLayout && timer?.visible;
  const showTimerControls = !exportLayout && Boolean(timer?.visible && timerControls);
  const showCompactTimerControls =
    !exportLayout && Boolean(timer && !timer.visible && timerControls);
  const railMode = showTimer
    ? hasVisual
      ? "split"
      : "timer-only"
    : hasVisual
      ? "image-only"
      : showTimerControls
        ? "timer-only"
        : "empty";
  const formatTimer = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

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
        "--presentation-font-heading": themeTypography.headingFamily,
        "--presentation-font-body": themeTypography.bodyFamily,
        "--presentation-heading-weight": themeTypography.headingWeight,
        "--presentation-body-weight": themeTypography.bodyWeight,
        "--presentation-heading-letter-spacing":
          themeTypography.headingLetterSpacing,
        backgroundColor: themeColors.background,
        color: themeColors.primaryText,
        fontFamily: themeTypography.bodyFamily,
        fontWeight: themeTypography.bodyWeight,
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
        <div className="presentation-header-copy">
          {activity.eyebrow && (
            <div
              className="presentation-eyebrow boardwork-user-content"
              dir="auto"
              {...testId(includeTestIds, "present-eyebrow")}
            >
              <FormulaText>{activity.eyebrow}</FormulaText>
            </div>
          )}
          {activity.title && (
            <h1
              className="presentation-header-title boardwork-user-content"
              dir="auto"
              {...testId(includeTestIds, "present-title")}
            >
              <FormulaText>{activity.title}</FormulaText>
            </h1>
          )}
        </div>
        <div
          className={cn(
            "presentation-time",
            timer &&
              !timer.visible &&
              (onShowTimer || showCompactTimerControls) &&
              "presentation-time--hidden",
          )}
          {...testId(includeTestIds, "present-time")}
        >
          {timer && !timer.visible && onShowTimer ? (
            <button
              type="button"
              className="presentation-time-toggle"
              onClick={onShowTimer}
              aria-label="Show timer to students"
              title="Show timer to students"
              data-testid={includeTestIds ? "button-show-timer" : undefined}
            >
              <span aria-hidden="true">
                <EyeOff className="presentation-time-toggle-icon" />
                {activity.durationMinutes} MIN
              </span>
            </button>
          ) : (
            `${activity.durationMinutes} MIN`
          )}
          {showCompactTimerControls && (
            <div className="presentation-time-compact-controls">
              {timerControls}
            </div>
          )}
        </div>
      </header>

      <main className="presentation-main">
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
        {(hasVisual || showTimer || showTimerControls) && (
          <aside className={cn("presentation-rail", `presentation-rail--${railMode}`)}>
            {hasVisual && (
              <figure className="presentation-visual">
                <img src={activity.visualUrl ?? ""} alt={activity.visualDescription ?? ""} />
                {activity.visualDescription && (
                  <figcaption className="boardwork-user-content" dir="auto">
                    {activity.visualDescription}
                  </figcaption>
                )}
              </figure>
            )}
            {showTimer && timer && (
              <div
                className={cn(
                  "presentation-timer",
                  timer.status === "completed" && "presentation-timer--complete",
                  timer.alarmActive && "presentation-timer--alerting",
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="presentation-timer-label">{timer.status === "completed" ? "Time is up" : "Time remaining"}</span>
                <strong>{formatTimer(timer.remainingSeconds)}</strong>
                <span className="presentation-timer-progress" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, (timer.remainingSeconds / (activity.durationMinutes * 60)) * 100))}%` }} /></span>
                {timer.alarmActive && (
                  <span className="presentation-timer-alarm-status" role="status">
                    Alarm active — dismiss when ready
                  </span>
                )}
                {timerControls}
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="presentation-footer">
        {controls}
      </footer>
    </div>
  );
}

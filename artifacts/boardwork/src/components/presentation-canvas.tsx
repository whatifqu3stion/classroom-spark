import type { CSSProperties, ReactNode, Ref } from "react";
import { ExternalLink } from "lucide-react";
import type { ActivityDraft } from "@/store/boardwork-context";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { cn } from "@/lib/utils";
import { getThemeColors } from "@/lib/presentation-theme";
import { getPresentationThemeAccentForeground } from "@workspace/api-zod";
import { FormulaText } from "./formula-text";

interface PresentationCanvasProps {
  activity: ActivityDraft;
  controls?: ReactNode;
  timerControls?: ReactNode;
  exportLayout?: boolean;
  surfaceRef?: Ref<HTMLDivElement>;
  timer?: { visible: boolean; mode: "standard" | "expanded"; remainingSeconds: number; status: "idle" | "running" | "paused" | "completed" };
}

const testId = (enabled: boolean, value: string) =>
  enabled ? { "data-testid": value } : {};

export function PresentationCanvas({
  activity,
  controls,
  timerControls,
  exportLayout = false,
  surfaceRef,
  timer,
}: PresentationCanvasProps) {
  const arrivalInstruction = activity.arrivalInstructions?.trim();
  const safeResourceUrl = getSafeResourceUrl(activity.resourceUrl);
  const themeColors = getThemeColors(activity.presentationTheme);
  const includeTestIds = !exportLayout;
  const hasVisual = Boolean(activity.visualUrl);
  const showTimer = !exportLayout && timer?.visible;
  const showTimerControls = !exportLayout && Boolean(timer && timerControls);
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
      } as CSSProperties}
      {...testId(includeTestIds, "presentation-surface")}
    >
      <header className="presentation-header">
        {activity.eyebrow ? (
          <div
            className="presentation-eyebrow boardwork-user-content"
            dir="auto"
            {...testId(includeTestIds, "present-eyebrow")}
          >
            {activity.eyebrow}
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        <div
          className="presentation-time"
          {...testId(includeTestIds, "present-time")}
        >
          {activity.durationMinutes} MIN
        </div>
      </header>

      <main className="presentation-main">
        <div className="presentation-content">
          {activity.title && (
            <h1
              className="presentation-title boardwork-user-content"
              dir="auto"
              {...testId(includeTestIds, "present-title")}
            >
              <FormulaText>{activity.title}</FormulaText>
            </h1>
          )}

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
          <aside className={cn("presentation-rail", `presentation-rail--${railMode}`, timer?.mode === "expanded" && "presentation-rail--expanded")}>
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
              <div className={cn("presentation-timer", timer.status === "completed" && "presentation-timer--complete")} aria-live="polite">
                <span className="presentation-timer-label">{timer.status === "completed" ? "Time is up" : "Time remaining"}</span>
                <strong>{formatTimer(timer.remainingSeconds)}</strong>
                <span className="presentation-timer-progress" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, (timer.remainingSeconds / (activity.durationMinutes * 60)) * 100))}%` }} /></span>
                {timerControls}
              </div>
            )}
            {showTimerControls && !showTimer && (
              <div className="presentation-timer-hidden-controls">
                <span className="presentation-timer-label">Timer hidden from students</span>
                {timerControls}
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="presentation-footer">
        {arrivalInstruction ? (
          <div
            className="presentation-arrival boardwork-user-content"
            dir="auto"
            {...testId(includeTestIds, "present-arrival")}
          >
            <FormulaText>{arrivalInstruction}</FormulaText>
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        {controls ?? <div aria-hidden="true" />}
      </footer>
    </div>
  );
}
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { Clock, ExternalLink } from "lucide-react";
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
  timerControlsOpen?: boolean;
  onToggleTimerControls?: () => void;
  onCloseTimerControls?: () => void;
  timerMinimized?: boolean;
  exportLayout?: boolean;
  editorPreview?: boolean;
  showResourceLink?: boolean;
  surfaceRef?: Ref<HTMLDivElement>;
  timer?: Pick<CountdownTimerState, "remainingSeconds" | "status"> & {
    visible: boolean;
    alarmActive?: boolean;
  };
}

const testId = (enabled: boolean, value: string) =>
  enabled ? { "data-testid": value } : {};

const DEFAULT_CONTENT_RATIO = 0.64;
const MIN_CONTENT_RATIO = 0.42;
const MAX_CONTENT_RATIO = 0.76;
const LAYOUT_STEP = 0.04;
const MIN_CONTENT_WIDTH = 280;
const MIN_RAIL_WIDTH = 240;

type LayoutRatioBounds = {
  min: number;
  max: number;
};

export function PresentationCanvas({
  activity,
  controls,
  timerControls,
  onShowTimer,
  timerControlsOpen = false,
  onToggleTimerControls,
  onCloseTimerControls,
  timerMinimized = false,
  exportLayout = false,
  editorPreview = false,
  showResourceLink = !exportLayout,
  surfaceRef,
  timer,
}: PresentationCanvasProps) {
  const [contentRatio, setContentRatio] = useState(DEFAULT_CONTENT_RATIO);
  const [layoutBounds, setLayoutBounds] = useState<LayoutRatioBounds>({
    min: MIN_CONTENT_RATIO,
    max: MAX_CONTENT_RATIO,
  });
  const [isResizing, setIsResizing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const arrivalInstruction = activity.arrivalInstructions?.trim();
  const safeResourceUrl = getSafeResourceUrl(activity.resourceUrl);
  const themeColors = getThemeColors(activity.presentationTheme);
  const themeTypography = getThemeTypography(activity.presentationTheme);
  const includeTestIds = !exportLayout;
  const hasVisual = Boolean(activity.visualUrl);
  const presentationContentLength = [
    activity.task,
    ...activity.prompts,
    activity.materials?.join(" "),
  ].reduce((total, value) => total + (value?.trim().length ?? 0), 0);
  const contentIsDense =
    presentationContentLength > 420 ||
    activity.prompts.some((prompt) => prompt.trim().length > 170);
  const showCompactTimer =
    !exportLayout && !editorPreview && Boolean(timer?.visible && timerMinimized);
  const showHiddenTimerRecovery =
    !exportLayout && !editorPreview && Boolean(timer && !timer.visible && onShowTimer);
  const showHeaderTimer = showCompactTimer || showHiddenTimerRecovery;
  const hasRightRail = hasVisual;
  const showLayoutDivider = !exportLayout && hasRightRail;
  const effectiveContentRatio = Math.max(
    layoutBounds.min,
    Math.min(layoutBounds.max, contentRatio),
  );
  const formatTimer = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const compactTimerTotalSeconds = Math.max(1, activity.durationMinutes * 60);
  const compactTimerRemainingSeconds = Math.max(0, timer?.remainingSeconds ?? 0);
  const compactTimerProgress = Math.max(
    0,
    Math.min(1, compactTimerRemainingSeconds / compactTimerTotalSeconds),
  );
  const compactTimerProgressOffset = (1 - compactTimerProgress) * 100;
  const compactTimerReading = timer
    ? formatTimer(compactTimerRemainingSeconds)
    : "";
  const compactTimerReadingScale = Math.min(
    1,
    4 / Math.max(1, compactTimerReading.length),
  );
  const getLayoutRatioBounds = (): LayoutRatioBounds => {
    const main = mainRef.current;
    if (!main) {
      return { min: MIN_CONTENT_RATIO, max: MAX_CONTENT_RATIO };
    }

    const bounds = main.getBoundingClientRect();
    const styles = window.getComputedStyle(main);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const availableWidth = bounds.width - gap * 2 - 1;
    if (availableWidth <= MIN_CONTENT_WIDTH + MIN_RAIL_WIDTH) {
      return { min: MIN_CONTENT_RATIO, max: MAX_CONTENT_RATIO };
    }

    const min = Math.max(MIN_CONTENT_RATIO, MIN_CONTENT_WIDTH / availableWidth);
    const max = Math.min(MAX_CONTENT_RATIO, 1 - MIN_RAIL_WIDTH / availableWidth);
    return min < max
      ? { min, max }
      : { min: MIN_CONTENT_RATIO, max: MAX_CONTENT_RATIO };
  };

  const clampContentRatio = (ratio: number, bounds = layoutBounds) =>
    Math.max(bounds.min, Math.min(bounds.max, ratio));

  const refreshLayoutBounds = () => {
    const nextBounds = getLayoutRatioBounds();
    setLayoutBounds(nextBounds);
    setContentRatio((ratio) => clampContentRatio(ratio, nextBounds));
  };

  useEffect(() => {
    if (!showLayoutDivider) return;
    refreshLayoutBounds();
    const main = mainRef.current;
    if (!main) return;

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(refreshLayoutBounds)
        : null;
    observer?.observe(main);
    window.addEventListener("resize", refreshLayoutBounds);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", refreshLayoutBounds);
    };
  }, [showLayoutDivider]);

  const setRatioFromPointer = (clientX: number) => {
    const main = mainRef.current;
    if (!main) return;

    const bounds = main.getBoundingClientRect();
    const styles = window.getComputedStyle(main);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const availableWidth = bounds.width - gap * 2 - 1;
    if (availableWidth <= MIN_CONTENT_WIDTH + MIN_RAIL_WIDTH) return;

    const contentWidth = clientX - bounds.left - gap;
    const nextBounds = getLayoutRatioBounds();
    setLayoutBounds(nextBounds);
    setContentRatio(clampContentRatio(contentWidth / availableWidth, nextBounds));
  };

  const handleDividerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextBounds = getLayoutRatioBounds();
      setLayoutBounds(nextBounds);
      setContentRatio((ratio) =>
        clampContentRatio(ratio + direction * LAYOUT_STEP, nextBounds),
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      const nextBounds = getLayoutRatioBounds();
      setLayoutBounds(nextBounds);
      setContentRatio(clampContentRatio(DEFAULT_CONTENT_RATIO, nextBounds));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const nextBounds = getLayoutRatioBounds();
      setLayoutBounds(nextBounds);
      setContentRatio(nextBounds.max);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const nextBounds = getLayoutRatioBounds();
      setLayoutBounds(nextBounds);
      setContentRatio(clampContentRatio(DEFAULT_CONTENT_RATIO, nextBounds));
    }
  };

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "presentation-surface",
        exportLayout && "presentation-surface--export",
        exportLayout && hasVisual && "presentation-surface--export-with-visual",
        editorPreview && "presentation-surface--editor-preview",
        contentIsDense && "presentation-surface--content-dense",
        isResizing && "presentation-surface--resizing",
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
        "--presentation-font-heading": themeTypography.heading.family,
        "--presentation-font-body": themeTypography.body.family,
        "--presentation-heading-weight": themeTypography.heading.weight,
        "--presentation-body-weight": themeTypography.body.weight,
        "--presentation-heading-letter-spacing":
          themeTypography.headingLetterSpacing,
        "--presentation-heading-scale": themeTypography.headingScale,
        "--presentation-content-flex": `${effectiveContentRatio}fr`,
        "--presentation-rail-flex": `${1 - effectiveContentRatio}fr`,
        backgroundColor: themeColors.background,
        color: themeColors.primaryText,
        fontFamily: themeTypography.body.family,
        fontWeight: themeTypography.body.weight,
      } as CSSProperties}
       {...testId(
         includeTestIds,
         editorPreview ? "presentation-preview-surface" : "presentation-surface",
       )}
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
        {showHeaderTimer && (
          <div
            className={cn(
              "presentation-time",
              showCompactTimer && "presentation-time--compact",
              showCompactTimer &&
                timerControlsOpen &&
                "presentation-time--compact-open",
              showHiddenTimerRecovery && "presentation-time--hidden",
            )}
            {...testId(includeTestIds, "present-time")}
          >
            {showHiddenTimerRecovery ? (
              <button
                type="button"
                className="presentation-time-toggle"
                onClick={onShowTimer}
                aria-label="Show timer to students"
                title="Show timer to students"
                data-testid={includeTestIds ? "button-show-timer" : undefined}
              >
                <Clock className="presentation-time-toggle-icon" aria-hidden="true" />
              </button>
            ) : (
              <div
                className={cn(
                  "presentation-time-compact-shell",
                  timer?.status === "idle" && "presentation-time-compact-shell--idle",
                  timer?.status === "running" && "presentation-time-compact-shell--running",
                  timer?.status === "paused" && "presentation-time-compact-shell--paused",
                  timer?.status === "completed" && "presentation-time-compact-shell--completed",
                )}
                data-testid={includeTestIds ? "compact-timer-progress" : undefined}
              >
                <svg
                  className="presentation-time-compact-ring"
                  viewBox="0 0 52 52"
                  role="progressbar"
                  aria-label="Time remaining"
                  aria-valuemin={0}
                  aria-valuemax={compactTimerTotalSeconds}
                  aria-valuenow={compactTimerRemainingSeconds}
                  aria-valuetext={
                    timer?.status === "completed"
                      ? "Time is up"
                      : `${formatTimer(compactTimerRemainingSeconds)} remaining`
                  }
                >
                  <circle
                    className="presentation-time-compact-ring-track"
                    cx="26"
                    cy="26"
                    r="22"
                    pathLength="100"
                  />
                  <circle
                    className="presentation-time-compact-ring-progress"
                    cx="26"
                    cy="26"
                    r="22"
                    pathLength="100"
                    style={{ strokeDashoffset: compactTimerProgressOffset }}
                  />
                </svg>
                <button
                  type="button"
                  className="presentation-time-compact-toggle"
                  onClick={onToggleTimerControls}
                  aria-expanded={timerControlsOpen}
                  aria-controls={timerControls ? "presentation-timer-controls-panel" : undefined}
                  aria-label={timerControlsOpen ? "Hide timer controls" : "Show timer controls"}
                  title={timerControlsOpen ? "Hide timer controls" : "Show timer controls"}
                  data-testid={includeTestIds ? "button-toggle-timer-controls" : undefined}
                >
                  <span
                    className="presentation-time-reading"
                    aria-live="polite"
                    aria-atomic="true"
                    style={
                      {
                        "--presentation-time-reading-scale": compactTimerReadingScale,
                      } as CSSProperties
                    }
                  >
                    {compactTimerReading}
                  </span>
                </button>
                {timerControls && (
                  <div
                    id="presentation-timer-controls-panel"
                    className={cn(
                      "presentation-time-compact-controls",
                      timerControlsOpen && "presentation-time-compact-controls--open",
                    )}
                    role="group"
                    aria-label="Timer controls"
                    aria-hidden={!timerControlsOpen}
                    {...testId(includeTestIds, "present-timer-controls-panel")}
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") return;

                      event.preventDefault();
                      onCloseTimerControls?.();
                      if (!onCloseTimerControls) onToggleTimerControls?.();
                      const compactPanel = event.currentTarget;
                      requestAnimationFrame(() => {
                        compactPanel
                          .closest(".presentation-time")
                          ?.querySelector<HTMLButtonElement>(".presentation-time-compact-toggle")
                          ?.focus();
                      });
                    }}
                  >
                    {timerControls}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <main
        ref={mainRef}
        className={cn(
          "presentation-main",
          !hasRightRail && "presentation-main--content-only",
          showLayoutDivider && "presentation-main--has-divider",
        )}
      >
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

          {(activity.materials?.length || safeResourceUrl) && (
            <div className="presentation-supporting">
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
                  {showResourceLink && (
                    <a
                      href={safeResourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="presentation-resource-link"
                      {...testId(includeTestIds, "present-resource-link")}
                    >
                      Open resource
                      <ExternalLink className="h-[1em] w-[1em]" aria-hidden="true" />
                    </a>
                  )}
                  {activity.resourceNote && (
                    <p className="presentation-resource-note boardwork-user-content" dir="auto">
                      <FormulaText>{activity.resourceNote}</FormulaText>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {showLayoutDivider && (
          <div
            className="presentation-layout-divider"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize student content and right rail"
            aria-valuemin={Math.round(layoutBounds.min * 100)}
            aria-valuemax={Math.round(layoutBounds.max * 100)}
            aria-valuenow={Math.round(effectiveContentRatio * 100)}
            aria-valuetext={`${Math.round(effectiveContentRatio * 100)}% student content, ${Math.round((1 - effectiveContentRatio) * 100)}% right rail`}
            tabIndex={0}
            onKeyDown={handleDividerKeyDown}
            onDoubleClick={() => setContentRatio(DEFAULT_CONTENT_RATIO)}
            onPointerDown={(event) => {
              event.preventDefault();
              setIsResizing(true);
              setRatioFromPointer(event.clientX);
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (isResizing) setRatioFromPointer(event.clientX);
            }}
            onPointerUp={(event) => {
              setIsResizing(false);
              event.currentTarget.releasePointerCapture?.(event.pointerId);
            }}
            onPointerCancel={() => setIsResizing(false)}
            onLostPointerCapture={() => setIsResizing(false)}
            {...testId(includeTestIds, "presentation-layout-divider")}
          >
            <span className="presentation-layout-divider-grip" aria-hidden="true" />
          </div>
        )}
        {hasVisual && (
          <aside className="presentation-rail presentation-rail--image-only">
            <figure className="presentation-visual">
              <img src={activity.visualUrl ?? ""} alt={activity.visualDescription ?? ""} />
              {activity.visualDescription && (
                <figcaption
                  className="presentation-visual-caption boardwork-user-content"
                  dir="auto"
                >
                  {activity.visualDescription}
                </figcaption>
              )}
            </figure>
          </aside>
        )}
      </main>

      <footer className="presentation-footer">
        {!editorPreview && !exportLayout && timer?.alarmActive && controls && (
          <span className="presentation-timer-alarm-status" role="status" aria-label="Timer alarm">
            Alarm active — dismiss when ready
          </span>
        )}
        {!editorPreview && !exportLayout && controls}
      </footer>
    </div>
  );
}

import React, { useState, useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { useBoardwork } from "@/store/boardwork-context";
import { Link, useLocation, useRoute } from "wouter";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { useCountdownTimer } from "@/components/countdown-timer";
import { PresentationCanvas } from "@/components/presentation-canvas";
import { getResolvedPresentationTheme } from "@/lib/presentation-theme";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Maximize,
  Minimize,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Settings2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  getGetAppStateQueryKey,
  useGenerateActivity,
  type GenerateActivityInput,
} from "@workspace/api-client-react";
import {
  getPresentationExportOptions,
  waitForPresentationFonts,
} from "@/lib/presentation-fonts";
import { PRESENTATION_RAIL_INVARIANTS } from "@workspace/presentation-rail-contract";

const getExportFilename = (title: string) => {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return `${slug || "boardwork-activity"}.png`;
};

export default function Present() {
  const [, params] = useRoute("/present/:id");
  const activityId = params?.id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { appState } = useBoardwork();
  const { toast } = useToast();
  const generateActivityMut = useGenerateActivity();

  const activeDraft = React.useMemo(() => {
    return appState?.activities.find(a => a.id === activityId);
  }, [appState, activityId]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controlsHovering, setControlsHovering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [timerVisible, setTimerVisible] = useState(true);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [timerControlsOpen, setTimerControlsOpen] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [timerOptionsOpen, setTimerOptionsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const controlsDockRef = useRef<HTMLDivElement>(null);
  const controlsToggleRef = useRef<HTMLButtonElement>(null);
  const controlsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    status: timerStatus,
    remainingSeconds,
    alarmActive,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    dismissAlarm,
  } = useCountdownTimer({
    durationMinutes: activeDraft?.durationMinutes ?? 7,
    resetKey: activeDraft?.id,
    alarmEnabled,
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsCloseTimeoutRef.current) {
        clearTimeout(controlsCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!controlsOpen && !controlsHovering) return;

    const controlsDock = controlsDockRef.current;
    if (!controlsDock || typeof controlsDock.scrollIntoView !== "function") return;

    controlsDock.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [controlsOpen, controlsHovering]);

  useEffect(() => {
    setGenerationError(null);
  }, [activityId]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err.message);
      });
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  };

  const handleControlsPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    if (controlsCloseTimeoutRef.current) {
      clearTimeout(controlsCloseTimeoutRef.current);
      controlsCloseTimeoutRef.current = null;
    }
    setControlsHovering(true);
  };

  const handleControlsPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    if (controlsCloseTimeoutRef.current) {
      clearTimeout(controlsCloseTimeoutRef.current);
    }
    controlsCloseTimeoutRef.current = setTimeout(() => {
      setControlsHovering(false);
      controlsCloseTimeoutRef.current = null;
    }, 180);
  };

  const handleControlsPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;

    if (controlsCloseTimeoutRef.current) {
      clearTimeout(controlsCloseTimeoutRef.current);
      controlsCloseTimeoutRef.current = null;
    }
    setControlsHovering(false);
  };

  const handleControlsKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;

    event.preventDefault();
    setControlsOpen(false);
    setTimerOptionsOpen(false);
    setControlsHovering(false);
    controlsToggleRef.current?.focus();
  };

  const exportPng = async () => {
    if (!exportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      await waitForPresentationFonts();
      const dataUrl = await toPng(exportRef.current, {
        ...getPresentationExportOptions(
          resolvedTheme.colors.background,
        ),
      });

      const download = document.createElement("a");
      download.download = getExportFilename(activeDraft?.title ?? "");
      download.href = dataUrl;
      download.click();
    } catch (error) {
      console.error(
        "PNG export failed",
        error instanceof Error ? error.message : "Unknown export error",
      );
      toast({
        title: "Couldn’t export PNG",
        description: "Try again. Your board is unchanged.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSurprise = async () => {
    if (!activeDraft || isGenerating) return;

    setGenerationError(null);
    setIsGenerating(true);

    const payload: GenerateActivityInput = {
      classId: activeDraft.classId,
      unitId: activeDraft.sourceUnitId ?? undefined,
      topic: activeDraft.sourceTopic ?? undefined,
      goal: activeDraft.sourceGoal ?? undefined,
      chipIds: activeDraft.sourceChipIds ?? [],
      deviceMode: activeDraft.deviceMode,
      technologyMode: activeDraft.technologyMode,
      durationMinutes: activeDraft.durationMinutes,
      activityStyle: null,
      presentationTheme: activeDraft.presentationTheme ?? null,
      teacherProvidedUrl:
        activeDraft.deviceMode === "on" ? activeDraft.resourceUrl ?? null : null,
      teacherProvidedResourceNote:
        activeDraft.deviceMode === "on" ? activeDraft.resourceNote ?? null : null,
      surprise: true,
    };

    try {
      const newActivity = await generateActivityMut.mutateAsync({ data: payload });
      queryClient.setQueryData(getGetAppStateQueryKey(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          activities: [
            newActivity,
            ...old.activities.filter((activity: any) => activity.id !== newActivity.id),
          ],
        };
      });
      setLocation(`/present/${newActivity.id}`);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "error" in error.data &&
        typeof error.data.error === "string"
          ? error.data.error
          : "Couldn’t generate a new activity. Try again.";
      setGenerationError(message);
      toast({
        title: "Couldn’t generate activity",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!activeDraft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8">
        <h2 className="text-2xl font-bold mb-4">No Active Board</h2>
        <p className="text-muted-foreground mb-8">Generate an activity before presenting.</p>
        <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Workspace
        </Link>
      </div>
    );
  }

  const resolvedTheme = getResolvedPresentationTheme(activeDraft.presentationTheme);
  const safeResourceUrl = getSafeResourceUrl(activeDraft.resourceUrl);
  const presentationPageStyle = {
    "--presentation-bg": resolvedTheme.colors.background,
    "--presentation-surface": resolvedTheme.colors.surface,
    "--presentation-primary-text": resolvedTheme.colors.primaryText,
    "--presentation-secondary-text": resolvedTheme.colors.secondaryText,
    "--presentation-accent": resolvedTheme.colors.accent,
    "--presentation-accent-soft": resolvedTheme.colors.accentSoft,
    "--presentation-font-heading": resolvedTheme.typography.heading.family,
    "--presentation-font-body": resolvedTheme.typography.body.family,
  } as CSSProperties;

  const controls = (
    <div
      ref={controlsDockRef}
      className={`presentation-controls-dock ${controlsOpen ? "presentation-controls-dock--open" : ""} ${controlsHovering ? "presentation-controls-dock--hovering" : ""}`}
      onFocusCapture={(event) => {
        if (event.target !== event.currentTarget.querySelector(".presentation-controls-toggle")) {
          setControlsOpen(true);
        }
      }}
      onKeyDown={handleControlsKeyDown}
      onPointerEnter={handleControlsPointerEnter}
      onPointerLeave={handleControlsPointerLeave}
      onPointerDown={handleControlsPointerDown}
    >
      <button
        type="button"
        ref={controlsToggleRef}
        className="presentation-controls-toggle"
        onClick={() => {
          const nextOpen = !controlsOpen;
          setControlsOpen(nextOpen);
          setTimerOptionsOpen(false);
          if (!nextOpen) controlsToggleRef.current?.focus();
        }}
        aria-expanded={controlsOpen || controlsHovering}
        aria-controls="presentation-controls-panel"
        title={controlsOpen ? "Hide teacher controls" : "Show teacher controls"}
        data-testid="button-teacher-controls"
      >
        <Settings2 className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Teacher controls</span>
      </button>
      <nav
        id="presentation-controls-panel"
        className="presentation-controls"
        aria-label="Presentation controls"
        data-rail-teacher-controls={PRESENTATION_RAIL_INVARIANTS.teacherControls}
      >
        {!timerVisible ? (
          <div className="presentation-controls-timer">
            {renderTimerControls()}
          </div>
        ) : null}
        <Link
          href={activityId ? `/activity/${activityId}` : "/"}
          className="presentation-control"
          title="Back to Workspace"
          data-testid="button-exit-present"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </Link>
        {safeResourceUrl && (
          <a
            href={safeResourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="presentation-control"
            title="Open resource in a new tab"
            data-testid="button-open-resource"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span>Open resource</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => void handleSurprise()}
          disabled={isGenerating}
          className="presentation-control"
          title={isGenerating ? "Generating a new activity" : "Generate a new activity"}
          data-testid="button-present-surprise"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Shuffle className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isGenerating ? "Generating…" : "Surprise me"}</span>
        </button>
        <button
          type="button"
          onClick={() => void exportPng()}
          disabled={isExporting}
          className="presentation-control"
          title="Export board as PNG"
          data-testid="button-export-png"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{isExporting ? "Exporting…" : "Export PNG"}</span>
        </button>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="presentation-control"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Maximize className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{isFullscreen ? "Exit" : "Full screen"}</span>
        </button>
        {generationError && (
          <div
            className="presentation-control-error"
            role="alert"
            data-testid="present-generation-error"
          >
            <span>{generationError}</span>
            <button
              type="button"
              className="presentation-control-error__retry"
              onClick={() => void handleSurprise()}
              disabled={isGenerating}
            >
              Retry
            </button>
          </div>
        )}
      </nav>
    </div>
  );
  function renderTimerControls() {
    return (
    <div className="presentation-timer-controls" aria-label="Timer controls">
      <div className="presentation-timer-actions">
        <button
          type="button"
          className="presentation-timer-action presentation-timer-action--primary"
          onClick={timerStatus === "running" ? pauseTimer : startTimer}
          disabled={timerStatus === "completed" && remainingSeconds === 0}
          aria-label={timerStatus === "running" ? "Pause timer" : "Start or resume timer"}
        >
          {timerStatus === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{timerStatus === "running" ? "Pause" : timerStatus === "idle" ? "Start" : "Resume"}</span>
        </button>
        {alarmActive && (
          <button
            type="button"
            className="presentation-timer-action presentation-timer-action--dismiss"
            onClick={dismissAlarm}
            aria-label="Dismiss alarm"
          >
            <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dismiss</span>
          </button>
        )}
        <button
          type="button"
          className="presentation-timer-options-trigger"
          onClick={() => setTimerOptionsOpen((value) => !value)}
          aria-label="Adjust timer"
          aria-expanded={timerOptionsOpen}
          aria-controls="timer-options"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Adjust</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${timerOptionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="presentation-timer-options-trigger"
          onClick={() => {
            setTimerMinimized((value) => !value);
            setTimerControlsOpen(false);
            setTimerOptionsOpen(false);
          }}
          aria-label={timerMinimized ? "Expand timer" : "Minimize timer"}
        >
          {timerMinimized ? (
            <Maximize className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Minimize className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{timerMinimized ? "Expand" : "Minimize"}</span>
        </button>
      </div>
      {timerOptionsOpen && (
        <div id="timer-options" className="presentation-timer-options">
          <div className="presentation-timer-option-row">
            <button type="button" className="presentation-timer-option" onClick={resetTimer} aria-label="Reset timer">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
            <button type="button" className="presentation-timer-option" onClick={() => adjustTimer(-60)} aria-label="Subtract one minute">
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>1 min</span>
            </button>
            <button type="button" className="presentation-timer-option" onClick={() => adjustTimer(60)} aria-label="Add one minute">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>1 min</span>
            </button>
          </div>
          <div className="presentation-timer-option-row presentation-timer-option-row--settings">
             {timerVisible && (
               <button type="button" className="presentation-timer-option" onClick={() => setTimerVisible(false)} aria-pressed={timerVisible} aria-label="Hide timer from students" data-testid="button-hide-timer">
                 <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                 <span>Visible</span>
               </button>
             )}
            <button type="button" className="presentation-timer-option" onClick={() => setAlarmEnabled((value) => !value)} aria-pressed={alarmEnabled} aria-label={alarmEnabled ? "Mute done alarm" : "Enable done alarm"}>
              {alarmEnabled ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{alarmEnabled ? "Alarm" : "Muted"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`presentation-page ${isFullscreen ? "presentation-page--fullscreen" : ""}`}
      style={presentationPageStyle}
    >
      <PresentationCanvas
        activity={activeDraft}
        controls={controls}
        timerControls={renderTimerControls()}
        showResourceLink={false}
        onShowTimer={() => {
          setTimerVisible(true);
          setTimerMinimized(true);
          setTimerControlsOpen(false);
        }}
        timerControlsOpen={timerControlsOpen}
        onToggleTimerControls={() => {
          setTimerControlsOpen((value) => !value);
        }}
        onCloseTimerControls={() => setTimerControlsOpen(false)}
        timerMinimized={timerMinimized}
        timer={{ visible: timerVisible, remainingSeconds, status: timerStatus, alarmActive }}
      />
      <div className="presentation-export-stage" aria-hidden="true">
        <PresentationCanvas
          activity={activeDraft}
          exportLayout
          showResourceLink={false}
          surfaceRef={exportRef}
        />
      </div>
    </div>
  );
}

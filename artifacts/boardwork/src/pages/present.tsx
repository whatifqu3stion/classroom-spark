import React, { useState, useEffect, useRef, type CSSProperties } from "react";
import { useBoardwork } from "@/store/boardwork-context";
import { Maximize, Minimize, ChevronLeft, Download, Loader2, Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX, Eye, EyeOff, Settings2, ChevronDown, Clock } from "lucide-react";
import { Link, useRoute } from "wouter";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { useCountdownTimer } from "@/components/countdown-timer";
import { PresentationCanvas } from "@/components/presentation-canvas";
import { getResolvedPresentationTheme } from "@/lib/presentation-theme";
import {
  getPresentationExportOptions,
  waitForPresentationFonts,
} from "@/lib/presentation-fonts";

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
  const { appState } = useBoardwork();
  const { toast } = useToast();

  const activeDraft = React.useMemo(() => {
    return appState?.activities.find(a => a.id === activityId);
  }, [appState, activityId]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [timerVisible, setTimerVisible] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [timerOptionsOpen, setTimerOptionsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err.message);
      });
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
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
  const presentationPageStyle = {
    "--presentation-bg": resolvedTheme.colors.background,
    "--presentation-surface": resolvedTheme.colors.surface,
    "--presentation-primary-text": resolvedTheme.colors.primaryText,
    "--presentation-secondary-text": resolvedTheme.colors.secondaryText,
    "--presentation-accent": resolvedTheme.colors.accent,
    "--presentation-accent-soft": resolvedTheme.colors.accentSoft,
    "--presentation-font-heading": resolvedTheme.typography.headingFamily,
    "--presentation-font-body": resolvedTheme.typography.bodyFamily,
  } as CSSProperties;

  const controls = (
    <div
      className={`presentation-controls-dock ${controlsOpen ? "presentation-controls-dock--open" : ""}`}
      onFocusCapture={() => setControlsOpen(true)}
    >
      <button
        type="button"
        className="presentation-controls-toggle"
        onClick={() => setControlsOpen((value) => !value)}
        aria-expanded={controlsOpen}
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
      >
        <Link
          href={activityId ? `/activity/${activityId}` : "/"}
          className="presentation-control"
          title="Back to Workspace"
          data-testid="button-exit-present"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </Link>
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
      </nav>
    </div>
  );
  const timerVisibilityControl = (
    <button
      type="button"
      className="presentation-time presentation-time--collapsed"
      onClick={() => setTimerVisible(true)}
      title="Show timer to students"
      aria-label="Show timer to students"
      data-testid="button-show-timer"
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{activeDraft.durationMinutes} MIN</span>
    </button>
  );
  const timerControls = (
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
          aria-expanded={timerOptionsOpen}
          aria-controls="timer-options"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Adjust</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${timerOptionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
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
            <button type="button" className="presentation-timer-option" onClick={() => setTimerVisible((value) => !value)} aria-pressed={timerVisible} aria-label={timerVisible ? "Hide timer from students" : "Show timer to students"}>
              {timerVisible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{timerVisible ? "Visible" : "Hidden"}</span>
            </button>
            <button type="button" className="presentation-timer-option" onClick={() => setAlarmEnabled((value) => !value)} aria-pressed={alarmEnabled} aria-label={alarmEnabled ? "Mute done alarm" : "Enable done alarm"}>
              {alarmEnabled ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{alarmEnabled ? "Alarm" : "Muted"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`presentation-page ${isFullscreen ? "presentation-page--fullscreen" : ""}`}
      style={presentationPageStyle}
    >
      <PresentationCanvas
        activity={activeDraft}
        controls={controls}
        timerControls={timerControls}
        timerVisibilityControl={timerVisibilityControl}
        timer={{ visible: timerVisible, remainingSeconds, status: timerStatus, alarmActive }}
      />
      <div className="presentation-export-stage" aria-hidden="true">
        <PresentationCanvas
          activity={activeDraft}
          exportLayout
          surfaceRef={exportRef}
        />
      </div>
    </div>
  );
}
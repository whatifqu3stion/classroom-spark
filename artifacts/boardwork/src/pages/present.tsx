import React, { useState, useEffect, useRef } from "react";
import { useBoardwork } from "@/store/boardwork-context";
import { Maximize, Minimize, ChevronLeft, Download, Loader2, Play, Pause, RotateCcw, Plus, Minus, Volume2, VolumeX, Eye, EyeOff, Settings2, ChevronDown } from "lucide-react";
import { Link, useRoute } from "wouter";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { PresentationCanvas } from "@/components/presentation-canvas";
import { getThemeColors } from "@/lib/presentation-theme";
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
  const [showControls, setShowControls] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  type TimerStatus = "idle" | "running" | "paused" | "completed";
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState<"standard" | "expanded">("standard");
  const [timerVisible, setTimerVisible] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [timerOptionsOpen, setTimerOptionsOpen] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const pausedSecondsRef = useRef(0);
  const alarmPlayedRef = useRef(false);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = (activeDraft?.durationMinutes ?? 7) * 60;
    setRemainingSeconds(initial);
    setTimerStatus("idle");
    pausedSecondsRef.current = initial;
    endAtRef.current = null;
    alarmPlayedRef.current = false;
  }, [activeDraft?.id, activeDraft?.durationMinutes]);

  useEffect(() => {
    if (timerStatus !== "running") return;
    const tick = () => {
      const next = Math.max(0, Math.ceil(((endAtRef.current ?? Date.now()) - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0) {
        setTimerStatus("completed");
        endAtRef.current = null;
        if (alarmEnabled && !alarmPlayedRef.current) {
          alarmPlayedRef.current = true;
          const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const audio = new AudioContextClass();
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.frequency.value = 660;
            gain.gain.value = 0.08;
            oscillator.connect(gain).connect(audio.destination);
            oscillator.start();
            oscillator.stop(audio.currentTime + 0.22);
          }
        }
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timerStatus, alarmEnabled]);

  const startTimer = () => {
    if (remainingSeconds <= 0) return;
    endAtRef.current = Date.now() + remainingSeconds * 1000;
    alarmPlayedRef.current = false;
    setTimerStatus("running");
  };
  const pauseTimer = () => {
    if (endAtRef.current) pausedSecondsRef.current = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
    endAtRef.current = null;
    setRemainingSeconds(pausedSecondsRef.current);
    setTimerStatus("paused");
  };
  const resetTimer = () => {
    const initial = (activeDraft?.durationMinutes ?? 7) * 60;
    endAtRef.current = null;
    pausedSecondsRef.current = initial;
    alarmPlayedRef.current = false;
    setRemainingSeconds(initial);
    setTimerStatus("idle");
  };
  const adjustTimer = (delta: number) => {
    const current = endAtRef.current ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000)) : remainingSeconds;
    const next = Math.max(0, current + delta);
    pausedSecondsRef.current = next;
    setRemainingSeconds(next);
    if (timerStatus === "running") endAtRef.current = Date.now() + next * 1000;
    if (next > 0 && timerStatus === "completed") setTimerStatus("paused");
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 2500);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
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
          getThemeColors(activeDraft?.presentationTheme).background,
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

  const controls = (
    <nav
      className={`presentation-controls ${showControls ? "presentation-controls--visible" : ""}`}
      aria-label="Presentation controls"
      onMouseEnter={() => setShowControls(true)}
      onFocusCapture={() => setShowControls(true)}
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
            <label className="presentation-timer-option">
              <span className="sr-only">Timer display mode</span>
              <select value={timerMode} onChange={(event) => setTimerMode(event.target.value as "standard" | "expanded")} aria-label="Timer display mode">
                <option value="standard">Standard</option>
                <option value="expanded">Expanded</option>
              </select>
            </label>
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
      onMouseEnter={() => setShowControls(true)}
    >
      <PresentationCanvas activity={activeDraft} controls={controls} timerControls={timerControls} timer={{ visible: timerVisible, mode: timerMode, remainingSeconds, status: timerStatus }} />
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
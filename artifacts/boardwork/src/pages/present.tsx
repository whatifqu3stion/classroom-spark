import React, { useState, useEffect, useRef } from "react";
import { useBoardwork } from "@/store/boardwork-context";
import { Maximize, Minimize, ChevronLeft, Download, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { PresentationCanvas } from "@/components/presentation-canvas";

const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;

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
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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
      await document.fonts?.ready;
      const dataUrl = await toPng(exportRef.current, {
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        canvasWidth: EXPORT_WIDTH,
        canvasHeight: EXPORT_HEIGHT,
        pixelRatio: 1,
        backgroundColor: "#fafafa",
        cacheBust: true,
        skipFonts: true,
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

  return (
    <div
      ref={containerRef}
      className={`presentation-page ${isFullscreen ? "presentation-page--fullscreen" : ""}`}
      onMouseEnter={() => setShowControls(true)}
    >
      <PresentationCanvas activity={activeDraft} controls={controls} />
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
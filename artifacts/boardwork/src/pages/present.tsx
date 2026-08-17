import React, { useState, useEffect, useRef } from "react";
import { useBoardwork } from "@/store/boardwork-context";
import { Maximize, Minimize, ChevronLeft, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { getSafeResourceUrl } from "@/lib/resource-url";

export default function Present() {
  const [, params] = useRoute("/present/:id");
  const activityId = params?.id;
  const { appState } = useBoardwork();

  const activeDraft = React.useMemo(() => {
    return appState?.activities.find(a => a.id === activityId);
  }, [appState, activityId]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const arrivalInstruction = activeDraft.arrivalInstructions?.trim();
  const safeResourceUrl = getSafeResourceUrl(activeDraft.resourceUrl);
  return (
    <div
      ref={containerRef}
      className={`presentation-page ${isFullscreen ? "presentation-page--fullscreen" : ""}`}
      onMouseEnter={() => setShowControls(true)}
    >
      <div className="presentation-surface">
        <header className="presentation-header">
          {activeDraft.eyebrow ? (
            <div className="presentation-eyebrow" data-testid="present-eyebrow">
              {activeDraft.eyebrow}
            </div>
          ) : (
            <div aria-hidden="true" />
          )}
          <div className="presentation-time" data-testid="present-time">
            {activeDraft.durationMinutes} MIN
          </div>
        </header>

        <main className="presentation-main">
          <div className="presentation-content">
            {activeDraft.title && (
              <h1 className="presentation-title" data-testid="present-title">
                {activeDraft.title}
              </h1>
            )}

            {activeDraft.task && (
              <p className="presentation-task" data-testid="present-task">
                {activeDraft.task}
              </p>
            )}

            {activeDraft.prompts && activeDraft.prompts.length > 0 && (
              <ul className="presentation-prompts">
                {activeDraft.prompts.map((prompt, idx) => (
                  <li key={idx} className="presentation-prompt">
                    <span className="presentation-prompt-marker" aria-hidden="true">•</span>
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeDraft.materials && activeDraft.materials.length > 0 && (
              <p
                className="mt-6 text-[clamp(0.9rem,1.4vw,1.35rem)] font-medium text-muted-foreground"
                data-testid="present-materials"
              >
                Materials: {activeDraft.materials.join(", ")}
              </p>
            )}

            {safeResourceUrl && (
              <div className="mt-6" data-testid="present-resource">
                <a
                  href={safeResourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[clamp(0.9rem,1.3vw,1.2rem)] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  data-testid="present-resource-link"
                >
                  Open resource
                  <ExternalLink className="h-[1em] w-[1em]" aria-hidden="true" />
                </a>
                {activeDraft.resourceNote && (
                  <p className="mt-2 text-[clamp(0.8rem,1.1vw,1rem)] text-muted-foreground">
                    {activeDraft.resourceNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="presentation-footer">
          {arrivalInstruction ? (
            <div
              className="presentation-arrival"
              data-testid="present-arrival"
            >
              {arrivalInstruction}
            </div>
          ) : (
            <div aria-hidden="true" />
          )}

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
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <button
              onClick={toggleFullscreen}
              className="presentation-control"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              data-testid="button-fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span>{isFullscreen ? "Exit" : "Full screen"}</span>
            </button>
          </nav>
        </footer>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { useBoardwork } from "@/store/boardwork-context";
import { Maximize, Minimize, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function Present() {
  const { activeDraft } = useBoardwork();
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
  const footerText = arrivalInstruction
    ? arrivalInstruction
    : activeDraft.deviceMode === "off"
      ? "Notebook • Work independently"
      : "Device on • Open the provided resource";

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[#FAFAFA] text-[#171717] overflow-hidden flex flex-col items-center justify-center font-sans
        ${isFullscreen ? 'w-screen h-screen' : 'min-h-[100dvh] w-full'}
      `}
      onMouseEnter={() => setShowControls(true)}
    >
      {/* 16:9 Aspect Ratio Container for Presentation Content */}
      <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video flex flex-col px-[clamp(3rem,7vw,8.5rem)] py-[clamp(2.25rem,5vh,4.5rem)]">
        
        {/* Header: Eyebrow + Time */}
        <header className="flex items-start justify-between shrink-0">
          {activeDraft.eyebrow ? (
            <div className="font-semibold tracking-[0.2em] text-[clamp(0.72rem,1.1vw,1rem)] uppercase leading-none text-[#171717]/58" data-testid="present-eyebrow">
              {activeDraft.eyebrow}
            </div>
          ) : (
            <div />
          )}
          <div className="font-semibold tracking-[0.16em] text-[clamp(0.8rem,1.25vw,1.1rem)] text-[#171717]/58 uppercase leading-none" data-testid="present-time">
            {activeDraft.durationMinutes} MIN
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 flex flex-col justify-start pt-[clamp(2.75rem,7vh,6rem)] min-h-0">
          <div className="max-w-[82%] space-y-[clamp(1.35rem,2.7vh,2.6rem)]">
            {activeDraft.title && (
              <h1 className="font-bold tracking-[-0.045em] text-[clamp(2.8rem,5.5vw,5.8rem)] leading-[1.02] text-[#171717]" data-testid="present-title">
                {activeDraft.title}
              </h1>
            )}
            
            {activeDraft.task && (
              <p className="font-medium text-[clamp(1.55rem,3.05vw,3rem)] leading-[1.26] text-[#171717]/88 max-w-[38ch]" data-testid="present-task">
                {activeDraft.task}
              </p>
            )}

            {activeDraft.prompts.length > 0 && (
              <ul className="space-y-[clamp(0.55rem,1.25vh,1rem)] pt-[clamp(0.25rem,0.8vh,0.75rem)]">
                {activeDraft.prompts.map((prompt, idx) => (
                  <li key={idx} className="flex gap-[clamp(0.8rem,1.4vw,1.4rem)] items-start font-medium text-[clamp(1.15rem,2vw,2rem)] leading-[1.28] text-[#171717]/76 max-w-[44ch]">
                    <span className="text-primary shrink-0 font-bold" aria-hidden="true">•</span>
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        {/* Footer: one clear arrival or material instruction */}
        <footer className="shrink-0 min-h-[clamp(3.5rem,7vh,5.25rem)] pr-[clamp(8.5rem,16vw,15rem)] flex items-end border-t border-[#171717]/10 pt-[clamp(1rem,2.2vh,1.6rem)]">
          <div
            className="font-medium text-[clamp(0.95rem,1.35vw,1.35rem)] text-[#171717]/52 max-w-[52ch] leading-snug"
            data-testid={arrivalInstruction ? "present-arrival" : "present-device-mode"}
          >
            {footerText}
          </div>
        </footer>
      </div>

      {/* Teacher controls live in a reserved footer-safe corner. */}
      <div 
        className={`fixed z-50 bottom-[clamp(1.25rem,3vw,3rem)] right-[clamp(1.25rem,3vw,3rem)] flex items-center gap-1.5 rounded-lg bg-[#FAFAFA]/92 p-1 shadow-sm ring-1 ring-[#171717]/10 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none
          ${showControls ? 'opacity-100' : 'opacity-25'}
        `}
        onMouseEnter={() => setShowControls(true)}
        onFocusCapture={() => setShowControls(true)}
      >
        <Link 
          href="/" 
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[#171717]/65 transition-colors hover:bg-[#171717]/6 hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Back to Workspace"
          data-testid="button-exit-present"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <button
          onClick={toggleFullscreen}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-[#171717]/65 transition-colors hover:bg-[#171717]/6 hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          <span>{isFullscreen ? "Exit" : "Full screen"}</span>
        </button>
      </div>

    </div>
  );
}

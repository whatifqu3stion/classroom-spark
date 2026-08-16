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

  return (
    <div 
      ref={containerRef}
      className={`relative bg-[#FAFAFA] text-[#111111] overflow-hidden flex flex-col items-center justify-center font-sans
        ${isFullscreen ? 'w-screen h-screen' : 'min-h-[100dvh] w-full'}
      `}
      style={{
        cursor: showControls ? 'auto' : 'none'
      }}
    >
      {/* 16:9 Aspect Ratio Container for Presentation Content */}
      <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video flex flex-col justify-between p-[5vw] sm:p-[6vw] md:p-[8vw]">
        
        {/* Header: Eyebrow + Time */}
        <header className="flex items-start justify-between shrink-0 mb-8 sm:mb-12">
          {activeDraft.eyebrow ? (
            <div className="px-4 py-1.5 sm:px-6 sm:py-2 border-2 border-[#111111] rounded-full text-[#111111] font-bold tracking-[0.2em] text-[clamp(0.7rem,1.5vw,1.25rem)] uppercase leading-none" data-testid="present-eyebrow">
              {activeDraft.eyebrow}
            </div>
          ) : (
            <div />
          )}
          <div className="font-bold tracking-widest text-[clamp(1rem,2vw,1.75rem)] text-[#111111]/60 uppercase leading-none" data-testid="present-time">
            {activeDraft.durationMinutes} MIN
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 flex flex-col justify-center">
          <div className="max-w-[85%] sm:max-w-[75%] space-y-6 sm:space-y-10">
            {activeDraft.title && (
              <h1 className="font-extrabold tracking-tight text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05] text-[#111111]" data-testid="present-title">
                {activeDraft.title}
              </h1>
            )}
            
            {activeDraft.task && (
              <p className="font-medium text-[clamp(1.5rem,3.5vw,3rem)] leading-[1.3] text-[#111111]/90 max-w-[40ch]" data-testid="present-task">
                {activeDraft.task}
              </p>
            )}

            {activeDraft.prompts.length > 0 && (
              <ul className="space-y-3 sm:space-y-5 mt-4 sm:mt-8">
                {activeDraft.prompts.map((prompt, idx) => (
                  <li key={idx} className="flex gap-4 sm:gap-6 items-start font-medium text-[clamp(1.25rem,2.5vw,2.25rem)] leading-snug text-[#111111]/80 max-w-[45ch]">
                    <span className="text-[#3b5998] shrink-0 font-bold">•</span>
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        {/* Footer: Context & Arrival */}
        <footer className="shrink-0 mt-8 sm:mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t-2 border-[#111111]/10">
          <div className="flex items-center gap-3 sm:gap-4 font-semibold text-[clamp(1rem,2vw,1.5rem)] text-[#111111]/70 tracking-tight" data-testid="present-device-mode">
            {activeDraft.deviceMode === "off" ? (
              <>Notebook • Work independently</>
            ) : (
              <>Device On • See teacher link</>
            )}
          </div>
          
          {activeDraft.arrivalInstructions && (
            <div className="font-medium text-[clamp(0.875rem,1.5vw,1.25rem)] text-[#111111]/50 max-w-[35ch] text-left sm:text-right leading-snug" data-testid="present-arrival">
              {activeDraft.arrivalInstructions}
            </div>
          )}
        </footer>
      </div>

      {/* Floating Controls Overlay */}
      <div 
        className={`fixed bottom-6 right-6 flex items-center gap-3 transition-opacity duration-500
          ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <Link 
          href="/" 
          className="flex items-center justify-center w-12 h-12 rounded-full bg-black/80 text-white backdrop-blur-md hover:bg-black transition-colors"
          title="Back to Workspace"
          data-testid="button-exit-present"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-black/80 text-white backdrop-blur-md hover:bg-black transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

    </div>
  );
}

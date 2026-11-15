import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Layers, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bridgeLesson } from "@/features/homebase/bridge-lesson";
import { TimedAgenda } from "@/features/homebase/timed-agenda";
import { getWorkspaceEntry } from "@/lib/workspace-entry";
import "@/index.css";
import "@/features/homebase/homebase.css";

function BridgeWarmup() {
  const [projecting, setProjecting] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!projecting) return;
    const end = () => {
      setProjecting(false);
      requestAnimationFrame(() => trigger.current?.focus());
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
    };
    const onFull = () => {
      if (!document.fullscreenElement) end();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, [projecting]);
  const entry = getWorkspaceEntry(
    import.meta.env.VITE_PUBLIC_SITE === "true",
    import.meta.env.VITE_WORKSPACE_URL,
  );
  const adaptUrl =
    import.meta.env.VITE_PUBLIC_SITE === "true"
      ? new URL(
          "/homebase?template=bridge",
          entry.available
            ? entry.href
            : "https://boardwork-preview-2fhh.onrender.com",
        ).href
      : import.meta.env.BASE_URL + "homebase?template=bridge";
  return (
    <main className={"bw-bridge" + (projecting ? " is-projecting" : "")}>
      <nav aria-label="Warm-up actions">
        {projecting ? (
          <Button
            variant="outline"
            onClick={() => {
              setProjecting(false);
              if (document.fullscreenElement) void document.exitFullscreen();
              trigger.current?.focus();
            }}
          >
            <Minimize size={16} />
            Exit presentation
          </Button>
        ) : (
          <>
            <a className="bw-bridge-brand" href={import.meta.env.BASE_URL}>
              <ArrowLeft size={16} />
              Boardwork
            </a>
            <div>
              <Button asChild variant="outline">
                <a href={adaptUrl}>
                  <Layers size={16} />
                  Adapt for my class
                </a>
              </Button>
              <Button
                ref={trigger}
                onClick={() => {
                  setProjecting(true);
                  void document.documentElement
                    .requestFullscreen?.()
                    .catch(() => {});
                }}
              >
                <Maximize size={16} />
                Project warm-up
              </Button>
            </div>
          </>
        )}
      </nav>
      <article className="bw-bridge-layout">
        <div className="bw-bridge-text">
          <h1>{bridgeLesson.question}</h1>
          <p>{bridgeLesson.prompt}</p>
        </div>
        <figure>
          <img src={bridgeLesson.photo} alt={bridgeLesson.alt} />
          <figcaption>
            Flat sheet <span>Accordion fold</span>
          </figcaption>
        </figure>
        <section className="bw-bridge-routine" aria-label="Five-minute routine">
          <TimedAgenda
            sessionId="sample-paper-bridges-v1"
            stages={bridgeLesson.stages}
          />
        </section>
      </article>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<BridgeWarmup />);

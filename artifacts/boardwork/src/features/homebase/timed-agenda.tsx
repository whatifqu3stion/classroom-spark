import { useEffect, useState } from "react";
import { ArrowRight, Check, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSeconds } from "./catalog";

export type Stage = { label: string; minutes: number };
type Run = { index: number; seconds: number; deadline: number | null };

function readRun(key: string, stages: Stage[], signature: string): Run {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    const r = saved?.run;
    if (
      saved?.signature === signature &&
      r &&
      Number.isInteger(r.index) &&
      r.index >= 0 &&
      r.index <= stages.length &&
      Number.isFinite(r.seconds) &&
      r.seconds >= 0 &&
      (r.deadline === null || Number.isFinite(r.deadline))
    )
      return r;
  } catch {
    /* Session storage is optional. */
  }
  return { index: 0, seconds: stages[0].minutes * 60, deadline: null };
}

export function TimedAgenda({
  stages,
  sessionId,
}: {
  stages: Stage[];
  sessionId: string;
}) {
  const key = "boardwork:agenda:" + sessionId;
  const signature = JSON.stringify(stages);
  const [run, setRun] = useState(() => readRun(key, stages, signature));
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ signature, run }));
    } catch {
      /* Works in memory. */
    }
  }, [key, signature, run]);
  useEffect(() => {
    const deadline = run.deadline;
    if (deadline === null) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline)
        setRun((prev) =>
          prev.deadline === run.deadline
            ? { ...prev, seconds: 0, deadline: null }
            : prev,
        );
    };
    tick();
    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [run.deadline]);
  const current = stages[run.index];
  const next = stages[run.index + 1];
  const remaining =
    run.deadline === null
      ? run.seconds
      : Math.max(0, Math.ceil((run.deadline - now) / 1000));
  const restart = () =>
    setRun({ index: 0, seconds: stages[0].minutes * 60, deadline: null });
  if (!current)
    return (
      <div className="hb-stage-done">
        <Check aria-hidden="true" />
        <h3>Routine complete</h3>
        <Button variant="outline" onClick={restart}>
          <RotateCcw size={16} />
          Start again
        </Button>
      </div>
    );
  return (
    <div className="hb-stages">
      <div className="hb-stage-position">
        <strong>Now</strong>
        <span>
          {run.index + 1} of {stages.length}
        </span>
      </div>
      <div className="hb-stage-current">
        <h3 aria-live="polite">{current.label}</h3>
        <time role="timer" aria-label="Stage time remaining">
          {formatSeconds(remaining)}
        </time>
      </div>
      <p className="hb-stage-next">
        <strong>Next</strong> {next?.label || "Finish the routine"}
      </p>
      {remaining === 0 && (
        <p className="hb-small" role="status">
          Time’s up. Continue when ready.
        </p>
      )}
      <div className="hb-stage-controls">
        {remaining > 0 && (
          <Button
            size="sm"
            onClick={() => {
              const time = Date.now();
              setNow(time);
              setRun((prev) =>
                prev.deadline === null
                  ? { ...prev, deadline: time + prev.seconds * 1000 }
                  : {
                      ...prev,
                      seconds: Math.max(
                        0,
                        Math.ceil((prev.deadline - time) / 1000),
                      ),
                      deadline: null,
                    },
              );
            }}
          >
            {run.deadline ? <Pause size={15} /> : <Play size={15} />}{" "}
            {run.deadline ? "Pause" : "Start"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setRun((prev) => ({
              ...prev,
              seconds: prev.seconds + 60,
              deadline:
                prev.deadline === null
                  ? null
                  : Math.max(Date.now(), prev.deadline) + 60000,
            }))
          }
        >
          <Plus size={14} />1 min
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const seconds = (next?.minutes || 0) * 60;
            const time = Date.now();
            setNow(time);
            setRun({
              index: run.index + 1,
              seconds,
              deadline:
                next && run.deadline !== null ? time + seconds * 1000 : null,
            });
          }}
        >
          {next ? "Next stage" : "Finish"}
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

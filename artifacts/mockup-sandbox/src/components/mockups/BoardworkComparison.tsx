import { useState } from "react";
import { ExternalLink, Eye, EyeOff, Pause, Play, RotateCcw } from "lucide-react";

type Presence = "present" | "absent";

const copy = {
  arrival: "As you arrive: settle in, collect a whiteboard, and begin with the question below.",
  eyebrow: "NUMBER TALKS",
  title: "Notice what changes — and what stays the same.",
  task: "Work with your partner to compare the two representations. Be ready to explain your thinking.",
  prompts: [
    "What do you notice first?",
    "How could you prove your observation?",
    "Where do you see the same idea in another form?",
  ],
  materials: "Whiteboard · marker · partner",
  resourceNote: "Open the reference image when you are ready.",
};

function Timer({ running, onToggle }: { running: boolean; onToggle: () => void }) {
  return (
    <div className="timer">
      <small>{running ? "Time remaining" : "Timer paused"}</small>
      <strong>08:42</strong>
      <div className="progress" aria-label="42 percent of timer remaining"><i /></div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={running ? "Pause timer" : "Start timer"}
        style={{ marginTop: 9, border: 0, background: "transparent", color: "var(--ink-soft)", fontSize: 11, padding: 0 }}
      >
        {running ? <><Pause size={11} /> pause</> : <><Play size={11} /> start</>}
      </button>
    </div>
  );
}

function Board({
  refined,
  arrival,
  visual,
  timer,
  running,
  onTimerToggle,
}: {
  refined: boolean;
  arrival: Presence;
  visual: Presence;
  timer: Presence;
  running: boolean;
  onTimerToggle: () => void;
}) {
  return (
    <article className={`board ${refined ? "refined" : "current"}`} data-arrival={arrival} data-visual={visual} data-timer={timer}>
      <div className={`arrival ${arrival === "absent" ? "empty" : ""}`}>{copy.arrival}</div>
      <header className="board-header">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h2>{copy.title}</h2>
        </div>
        <div className="duration">{timer === "present" ? "12 MIN" : "12 MIN"}</div>
      </header>
      <main className="board-main">
        <section>
          <p className="task">{copy.task}</p>
          <ul className="prompts">
            {copy.prompts.map((prompt) => <li key={prompt}><span>{prompt}</span></li>)}
          </ul>
          <p className="materials">Materials: {copy.materials}</p>
          <div style={{ marginTop: 16 }}>
            <a className="resource" href="https://example.com" target="_blank" rel="noreferrer">
              Open resource <ExternalLink size={12} />
            </a>
            <div className="caption">{copy.resourceNote}</div>
          </div>
        </section>
        <aside className="rail">
          {visual === "present" && <figure className="visual">
            <div className="visual-art" role="img" aria-label="Abstract reference visual" />
            <figcaption className="caption">Two ways to show the same relationship.</figcaption>
          </figure>}
          {timer === "present" && <Timer running={running} onToggle={onTimerToggle} />}
        </aside>
      </main>
      <footer className="footer">
        {refined ? <><span><span className="status-dot" />Ready for the room</span><span>Boardwork · 01</span></> : " " }
      </footer>
    </article>
  );
}

export function BoardworkComparison() {
  const [arrival, setArrival] = useState<Presence>("present");
  const [visual, setVisual] = useState<Presence>("present");
  const [timer, setTimer] = useState<Presence>("present");
  const [running, setRunning] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const reset = () => {
    setArrival("present"); setVisual("present"); setTimer("present"); setRunning(true);
  };
  const Toggle = ({ label, value, setValue }: { label: string; value: Presence; setValue: (v: Presence) => void }) => (
    <div className="mode-switch" aria-label={label}>
      <span style={{ padding: "8px 8px 8px 12px", color: "var(--ink-soft)", fontSize: 11, fontWeight: 700 }}>{label}</span>
      {(["present", "absent"] as Presence[]).map((option) => (
        <button key={option} className={value === option ? "active" : ""} onClick={() => setValue(option)} type="button">
          {option === "present" ? "On" : "Off"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mockup-shell">
      <header className="masthead">
        <div><div className="kicker">Boardwork · presentation study</div><h1>Make the room feel ready.</h1></div>
        <p>A side-by-side exploration of the existing classroom board and a quieter, clearer arrangement for projection.</p>
      </header>
      <div className="toolbar">
        {showControls ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Toggle label="Arrival" value={arrival} setValue={setArrival} />
          <Toggle label="Visual" value={visual} setValue={setVisual} />
          <Toggle label="Timer" value={timer} setValue={setTimer} />
        </div> : <span className="toolbar-note">Click the eye to restore comparison controls</span>}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="toolbar-note">{showControls ? "Presence controls visible" : "Clean comparison view"}</span>
          <button type="button" onClick={() => setShowControls(!showControls)} aria-label="Toggle controls" style={{ border: 0, background: "transparent", color: "var(--ink-soft)" }}>{showControls ? <Eye size={16} /> : <EyeOff size={16} />}</button>
          <button type="button" onClick={reset} aria-label="Reset comparison" style={{ border: 0, background: "transparent", color: "var(--ink-soft)" }}><RotateCcw size={16} /></button>
        </div>
      </div>
      <div className="comparison">
        <div className="frame-wrap"><div className="frame-label"><strong>Current</strong><span>Existing composition</span></div><Board refined={false} arrival={arrival} visual={visual} timer={timer} running={running} onTimerToggle={() => setRunning(!running)} /></div>
        <div className="frame-wrap"><div className="frame-label"><strong>Refined</strong><span>Same content · clearer rhythm</span></div><Board refined arrival={arrival} visual={visual} timer={timer} running={running} onTimerToggle={() => setRunning(!running)} /></div>
      </div>
      <div className="annotations">
        <div className="annotation"><b>Current</b><br />Faithful to the source: arrival instruction, header, task stack, resource, visual rail, countdown, and footer controls follow the original reading order.</div>
        <div className="annotation"><b>Refined</b><br />The same classroom content gets a stronger editorial title, numbered prompts, a contained visual/timer rail, and a calmer bottom edge that survives absent/present states.</div>
      </div>
    </div>
  );
}

export default BoardworkComparison;
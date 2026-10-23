import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  CalendarDays,
  ExternalLink,
  Focus,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  UserRound,
  MessagesSquare,
  Pencil,
  Hand,
  Loader2,
} from "lucide-react";
import type { HomebaseWidget } from "@workspace/api-zod";
import { useCountdownTimer } from "@/components/countdown-timer";
import { Button } from "@/components/ui/button";
import { embedUrl, formatSeconds, shuffle } from "./catalog";

export type WidgetProps = {
  widget: HomebaseWidget;
  update: (patch: Partial<HomebaseWidget>) => void;
  focus: () => void;
  editing: boolean;
};
function ResourceLink({
  url,
  children,
}: {
  url: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hb-resource-link"
    >
      {children || "Open resource"}
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  );
}
function useAmbient() {
  const current = useRef<AudioContext | null>(null);
  const [error, setError] = useState("");
  const stop = () => {
    const audio = current.current;
    current.current = null;
    if (audio && audio.state !== "closed") void audio.close().catch(() => {});
  };
  useEffect(() => stop, []);
  async function start(mode: string) {
    stop();
    setError("");
    if (mode === "off") return;
    try {
      const audio = new AudioContext();
      current.current = audio;
      await audio.resume();
      if (current.current !== audio || audio.state === "closed") return;
      const gain = audio.createGain();
      gain.gain.value = 0.025;
      gain.connect(audio.destination);
      if (mode === "noise") {
        const buffer = audio.createBuffer(
          1,
          audio.sampleRate * 4,
          audio.sampleRate,
        );
        const data = buffer.getChannelData(0);
        let previous = 0;
        for (let i = 0; i < data.length; i++) {
          previous = (previous + (Math.random() * 2 - 1) * 0.02) / 1.02;
          data[i] = previous * 3;
        }
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
      } else {
        [196, 246.94, 293.66].forEach((frequency) => {
          const oscillator = audio.createOscillator();
          oscillator.frequency.value = frequency;
          oscillator.connect(gain);
          oscillator.start();
        });
      }
    } catch {
      stop();
      setError("Sound couldn't start. You can keep using the timer.");
    }
  }
  return { start, stop, error };
}
function TimerWidget({ widget, focus }: WidgetProps) {
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [sound, setSound] = useState("off");
  const audio = useAmbient();
  const timer = useCountdownTimer({
    durationMinutes: widget.minutes,
    resetKey: widget.id,
    alarmEnabled,
  });
  const stopAudio = useRef(audio.stop);
  stopAudio.current = audio.stop;
  useEffect(() => {
    if (timer.status !== "running") stopAudio.current();
  }, [timer.status]);
  const start = () => {
    void audio.start(sound);
    timer.startTimer();
  };
  const fraction = Math.min(1, timer.remainingSeconds / (widget.minutes * 60));
  return (
    <div className="hb-timer">
      <div className="hb-timer-face">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="hb-timer-track" cx="50" cy="50" r="45" />
          <circle
            className="hb-timer-progress"
            cx="50"
            cy="50"
            r="45"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - fraction)}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div>
          <span
            className="hb-timer-reading"
            role="timer"
            aria-label={`${timer.remainingSeconds} seconds remaining`}
          >
            {formatSeconds(timer.remainingSeconds)}
          </span>
        </div>
      </div>
      <span className="hb-timer-status" aria-live="polite">
        {timer.status === "completed"
          ? "Time to wrap up"
          : timer.status === "paused"
            ? "Paused"
            : timer.status === "running"
              ? "Focus time"
              : "Ready when you are"}
      </span>
      <div className="hb-widget-actions">
        {timer.alarmActive ? (
          <Button size="sm" onClick={timer.dismissAlarm}>
            Dismiss alarm
          </Button>
        ) : timer.status === "running" ? (
          <Button size="sm" onClick={timer.pauseTimer}>
            <Pause size={16} />
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={start}
            disabled={timer.status === "completed"}
          >
            <Play size={16} />
            {timer.status === "paused" ? "Resume" : "Start"}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Reset timer"
          onClick={timer.resetTimer}
        >
          <RotateCcw size={16} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Focus on timer"
          onClick={focus}
        >
          <Focus size={17} />
        </Button>
      </div>
      <div className="hb-timer-options">
        <label>
          <span className="sr-only">Timer sound</span>
          <select
            aria-label="Timer sound"
            value={sound}
            onChange={(event) => {
              setSound(event.target.value);
              if (timer.status === "running")
                void audio.start(event.target.value);
            }}
          >
            <option value="off">No background sound</option>
            <option value="tones">Soft tones</option>
            <option value="noise">Soft noise</option>
          </select>
        </label>
        <button
          type="button"
          aria-label={alarmEnabled ? "Mute end alarm" : "Enable end alarm"}
          aria-pressed={alarmEnabled}
          onClick={() => setAlarmEnabled(!alarmEnabled)}
        >
          {alarmEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
      </div>
      {audio.error ? (
        <p role="status" className="hb-small">
          {audio.error}
        </p>
      ) : null}
    </div>
  );
}
function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startAt = useRef(0);
  const accumulated = useRef(0);
  useEffect(() => {
    if (!running) return;
    const tick = () =>
      setElapsed(accumulated.current + Date.now() - startAt.current);
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [running]);
  return (
    <div className="hb-centered">
      <span className="hb-large-number" role="timer">
        {formatSeconds(elapsed / 1000)}
      </span>
      <div className="hb-widget-actions">
        <Button
          size="sm"
          onClick={() => {
            if (running) {
              accumulated.current += Date.now() - startAt.current;
              setElapsed(accumulated.current);
            } else startAt.current = Date.now();
            setRunning(!running);
          }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset stopwatch"
          onClick={() => {
            setRunning(false);
            accumulated.current = 0;
            setElapsed(0);
          }}
        >
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  );
}
function Clock({ calendar = false }: { calendar?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!calendar)
    return (
      <div className="hb-centered">
        <time className="hb-clock" dateTime={now.toISOString()}>
          {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </time>
        <p className="hb-small">
          {now.toLocaleDateString([], {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    );
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (
    <div className="hb-calendar">
      <p>{now.toLocaleDateString([], { month: "long", year: "numeric" })}</p>
      <div className="hb-month" aria-label="Current month">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <b key={`day-${index}`} aria-hidden="true">
            {label}
          </b>
        ))}
        {Array.from({ length: start }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={i + 1 === now.getDate() ? "hb-today" : ""}
            aria-label={`${i + 1}${i + 1 === now.getDate() ? ", today" : ""}`}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
function EventCountdown({ widget }: WidgetProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!widget.target)
    return (
      <p className="hb-placeholder">
        <CalendarDays size={28} />
        Choose a date in Edit tool.
      </p>
    );
  const today = new Date(now);
  const target = new Date(`${widget.target}T00:00:00`);
  // Calendar-day arithmetic avoids a one-day jump around daylight saving transitions.
  const days = Math.round(
    (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );
  return (
    <div className="hb-centered">
      <span className="hb-large-number">{Math.abs(days)}</span>
      <span>
        {days === 0 ? "Today!" : days < 0 ? "days ago" : "days to go"}
      </span>
      <p className="hb-small">
        {target.toLocaleDateString([], {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
function Picker({ widget }: WidgetProps) {
  const [used, setUsed] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const key = widget.items.join("\n");
  useEffect(() => {
    setUsed([]);
    setPicked(null);
  }, [key]);
  if (!widget.items.length)
    return (
      <p className="hb-placeholder">Add one name per line in Edit tool.</p>
    );
  const done = used.length >= widget.items.length;
  return (
    <div className="hb-centered">
      <p className="hb-picked" aria-live="polite">
        {picked === null ? "Whose turn?" : widget.items[picked]}
      </p>
      <Button
        onClick={() => {
          const pool = widget.items
            .map((_, i) => i)
            .filter((i) => !used.includes(i));
          const next = pool[Math.floor(Math.random() * pool.length)];
          setPicked(next);
          setUsed([...used, next]);
        }}
        disabled={done}
      >
        {done ? "Everyone had a turn" : "Pick a name"}
      </Button>
      <div className="hb-widget-actions">
        <span className="hb-small">
          {used.length} of {widget.items.length} picked
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setUsed([]);
            setPicked(null);
          }}
        >
          Reset round
        </Button>
      </div>
    </div>
  );
}
function Groups({ widget }: WidgetProps) {
  const [groups, setGroups] = useState<string[][]>([]);
  const key = `${widget.items.join("\n")}:${widget.number}`;
  useEffect(() => setGroups([]), [key]);
  return (
    <div className="hb-groups">
      {widget.items.length ? (
        <>
          <div className="hb-widget-actions">
            <Button
              size="sm"
              onClick={() => {
                const names = shuffle(widget.items);
                const count = Math.ceil(names.length / widget.number);
                const next = Array.from(
                  { length: count },
                  () => [] as string[],
                );
                names.forEach((name, i) => next[i % count].push(name));
                setGroups(next);
              }}
            >
              Make groups
            </Button>
            <span className="hb-small">Up to {widget.number} per group</span>
          </div>
          <div className="hb-group-list" aria-live="polite">
            {groups.map((group, i) => (
              <section key={i}>
                <h3>Group {i + 1}</h3>
                <p>{group.join(", ")}</p>
              </section>
            ))}
          </div>
        </>
      ) : (
        <p className="hb-placeholder">
          Add names in Edit tool, then make groups.
        </p>
      )}
    </div>
  );
}
function Dice({ widget }: WidgetProps) {
  const [rolls, setRolls] = useState<number[]>([]);
  return (
    <div className="hb-centered">
      <div className="hb-dice" aria-live="polite">
        {rolls.length ? (
          rolls.map((roll, i) => (
            <span key={i} aria-label={`Die ${i + 1}: ${roll}`}>
              {roll}
            </span>
          ))
        ) : (
          <p className="hb-small">Ready to roll</p>
        )}
      </div>
      <Button
        onClick={() =>
          setRolls(
            Array.from(
              { length: Math.min(6, widget.number) },
              () => Math.floor(Math.random() * 6) + 1,
            ),
          )
        }
      >
        Roll {widget.number === 1 ? "die" : "dice"}
      </Button>
      {rolls.length > 1 ? (
        <span className="hb-small">
          Total: {rolls.reduce((sum, roll) => sum + roll, 0)}
        </span>
      ) : null}
    </div>
  );
}
function Score({ widget, update }: WidgetProps) {
  const vote = widget.kind === "poll";
  function change(index: number, delta: number) {
    update({
      values: widget.items.map((_, i) =>
        Math.max(
          vote ? 0 : -999,
          Math.min(9999, (widget.values[i] || 0) + (index === i ? delta : 0)),
        ),
      ),
    });
  }
  return (
    <div className="hb-scoreboard">
      {vote ? (
        <p className="hb-small">Show of hands. Record votes here.</p>
      ) : null}
      <div className="hb-scores">
        {widget.items.map((item, i) => (
          <div key={i}>
            <span className="hb-score-label">{item}</span>
            <strong aria-live="polite">{widget.values[i] || 0}</strong>
            <div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Subtract from ${item}`}
                onClick={() => change(i, -1)}
              >
                −
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Add to ${item}`}
                onClick={() => change(i, 1)}
              >
                +
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => update({ values: widget.items.map(() => 0) })}
      >
        Reset {vote ? "votes" : "scores"}
      </Button>
    </div>
  );
}
const workModes = [
  { value: "solo", label: "Independent work", icon: UserRound },
  { value: "partner", label: "Work with a partner", icon: Users },
  { value: "group", label: "Group work", icon: Users },
  { value: "discussion", label: "Class discussion", icon: MessagesSquare },
];
function Work({ widget, update }: WidgetProps) {
  const mode =
    workModes.find((item) => item.value === widget.mode) || workModes[0];
  const Icon = mode.icon;
  return (
    <div className="hb-centered">
      <Icon className="hb-work-icon" aria-hidden="true" />
      <strong className="hb-work-label">{mode.label}</strong>
      <select
        aria-label="Work mode"
        value={mode.value}
        onChange={(event) => update({ mode: event.target.value })}
      >
        {workModes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
function Traffic({ widget, update }: WidgetProps) {
  return (
    <div className="hb-centered">
      <div className="hb-traffic" aria-label="Classroom signal">
        {[
          { value: "stop", label: "Stop", tone: "red" },
          { value: "ready", label: "Get ready", tone: "amber" },
          { value: "go", label: "Go", tone: "green" },
        ].map((signal) => (
          <button
            type="button"
            key={signal.value}
            aria-pressed={widget.mode === signal.value}
            onClick={() => update({ mode: signal.value })}
          >
            <span
              className={`hb-light ${signal.tone} ${widget.mode === signal.value ? "active" : ""}`}
            />
            {signal.label}
          </button>
        ))}
      </div>
    </div>
  );
}
function Draw({ widget, update }: WidgetProps) {
  const [color, setColor] =
    useState<HomebaseWidget["strokes"][number]["color"]>("#20302f");
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);
  const live = useRef(points);
  function point(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000),
      ),
      y: Math.max(
        0,
        Math.min(600, ((event.clientY - rect.top) / rect.height) * 600),
      ),
    };
  }
  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    if (live.current.length)
      update({
        strokes: [...widget.strokes, { color, points: live.current }].slice(
          -100,
        ),
      });
    live.current = [];
    setPoints([]);
  }
  return (
    <div className="hb-draw">
      <div className="hb-widget-actions">
        {(["#20302f", "#654fa3", "#a33c35", "#27684f"] as const).map(
          (value, index) => (
            <button
              key={value}
              type="button"
              className="hb-pen"
              style={{ color: value }}
              aria-label={`${["Charcoal", "Purple", "Red", "Green"][index]} pen`}
              aria-pressed={color === value}
              onClick={() => setColor(value)}
            >
              <Pencil size={18} />
            </button>
          ),
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={!widget.strokes.length}
          onClick={() => update({ strokes: widget.strokes.slice(0, -1) })}
        >
          Undo stroke
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!widget.strokes.length}
          onClick={() => update({ strokes: [] })}
        >
          Clear
        </Button>
      </div>
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        role="img"
        aria-label="Drawing board. Use a mouse, pen, or touch to draw."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
          live.current = [point(event)];
          setPoints(live.current);
        }}
        onPointerMove={(event) => {
          if (!drawing.current || live.current.length >= 1200) return;
          live.current = [...live.current, point(event)];
          setPoints(live.current);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {[...widget.strokes, ...(points.length ? [{ color, points }] : [])].map(
          (stroke, i) => (
            <path
              key={i}
              d={`M${stroke.points.map((p) => `${p.x},${p.y}`).join(" L")} l0.01,0.01`}
              fill="none"
              stroke={stroke.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ),
        )}
      </svg>
    </div>
  );
}
function Resource({ widget }: WidgetProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setReady(false);
  }, [widget.url]);
  if (!widget.url)
    return <p className="hb-placeholder">Add a resource link in Edit tool.</p>;
  if (widget.kind === "link")
    return (
      <div className="hb-resource">
        <p>{widget.text}</p>
        <ResourceLink url={widget.url}>
          {new URL(widget.url).hostname}
        </ResourceLink>
      </div>
    );
  const url =
    widget.kind === "image" ? widget.url : embedUrl(widget.kind, widget.url);
  if (!url)
    return (
      <div className="hb-resource">
        <p>
          This link can open in a new tab. To show it here, use a supported
          player, published document, or direct PDF link.
        </p>
        <ResourceLink url={widget.url} />
      </div>
    );
  if (!loaded)
    return (
      <div className="hb-resource">
        <p>
          {widget.text ||
            (widget.kind === "embed"
              ? "Published documents, sheets, slides, and Spotify players can appear here."
              : `Load this ${widget.kind} when you're ready.`)}
        </p>
        <Button variant="outline" onClick={() => setLoaded(true)}>
          Load {widget.kind === "embed" ? "resource" : widget.kind}
        </Button>
        <p className="hb-small">Loads content from {new URL(url).hostname}.</p>
        <ResourceLink url={widget.url} />
      </div>
    );
  if (failed)
    return (
      <div className="hb-resource">
        <p>
          The resource couldn't load. Check the link or open it in a new tab.
        </p>
        <ResourceLink url={widget.url} />
        <Button
          variant="outline"
          onClick={() => {
            setFailed(false);
            setLoaded(false);
          }}
        >
          Try again
        </Button>
      </div>
    );
  return (
    <div className="hb-media">
      {widget.kind === "image" ? (
        <img
          src={url}
          alt={widget.text || widget.title}
          referrerPolicy="no-referrer"
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <iframe
          title={widget.title}
          src={url}
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="fullscreen; encrypted-media"
          referrerPolicy="no-referrer"
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!ready ? (
        <Loader2
          className="hb-media-loading animate-spin"
          aria-label="Loading resource"
        />
      ) : null}
      <ResourceLink url={widget.url}>Open in new tab</ResourceLink>
    </div>
  );
}
export function WidgetContent(props: WidgetProps) {
  const { widget, update } = props;
  switch (widget.kind) {
    case "timer":
      return <TimerWidget {...props} />;
    case "stopwatch":
      return <Stopwatch />;
    case "clock":
      return <Clock />;
    case "calendar":
      return <Clock calendar />;
    case "countdown":
      return <EventCountdown {...props} />;
    case "randomizer":
      return <Picker {...props} />;
    case "groups":
      return <Groups {...props} />;
    case "dice":
      return <Dice {...props} />;
    case "scoreboard":
    case "poll":
      return <Score {...props} />;
    case "traffic":
      return <Traffic {...props} />;
    case "work":
      return <Work {...props} />;
    case "draw":
      return <Draw {...props} />;
    case "image":
    case "link":
    case "embed":
    case "video":
    case "pdf":
      return <Resource {...props} />;
    case "agenda":
      return widget.items.length ? (
        <ol className="hb-agenda">
          {widget.items.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                className={widget.values[i] ? "done" : ""}
                aria-pressed={!!widget.values[i]}
                onClick={() =>
                  update({
                    values: widget.items.map((_, index) =>
                      index === i
                        ? widget.values[i]
                          ? 0
                          : 1
                        : widget.values[index] || 0,
                    ),
                  })
                }
              >
                <span className="hb-agenda-marker">
                  {widget.values[i] ? <Hand size={16} /> : i + 1}
                </span>
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="hb-placeholder">Add the lesson steps in Edit tool.</p>
      );
    default:
      return (
        <div className={`hb-note ${widget.kind === "task" ? "hb-task" : ""}`}>
          <p>{widget.text || "Add your instructions in Edit tool."}</p>
          {widget.items.length ? (
            <ul>
              {widget.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : null}
          {widget.url ? <ResourceLink url={widget.url} /> : null}
        </div>
      );
  }
}

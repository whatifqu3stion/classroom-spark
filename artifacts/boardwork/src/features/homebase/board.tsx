import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  Copy,
  Grip,
  LockKeyhole,
  Maximize,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  RotateCcw,
  Scaling,
  Trash2,
  Undo2,
  UnlockKeyhole,
  X,
} from "lucide-react";
import {
  HomebaseWidget,
  type HomebaseContent,
  type HomebaseRecord,
  type WidgetKind,
} from "@workspace/api-zod";
import type { ActivityDraft } from "@/store/boardwork-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { activityWidget, makeWidget, tools } from "./catalog";
import { WidgetContent } from "./widgets";
import { WidgetEditor } from "./widget-editor";
import { arrangeWidgets } from "./layout";
import { useHomebaseDraft } from "./use-homebase";

type Props = {
  board: HomebaseRecord;
  activities: ActivityDraft[];
  saved: (board: HomebaseRecord) => void;
  copy: (content: HomebaseContent) => Promise<void>;
  remove: (revision: number) => Promise<void>;
};
export function HomebaseBoard({
  board,
  activities,
  saved,
  copy,
  remove,
}: Props) {
  const draft = useHomebaseDraft(board, saved);
  const { content, setContent } = draft;
  const [toolbox, setToolbox] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [announcement, announce] = useState("");
  const [past, setPast] = useState<HomebaseContent[]>([]);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activityId, setActivityId] = useState(activities[0]?.id || "");
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const focusTrigger = useRef<HTMLElement | null>(null);
  const editing = !locked && !presenting && !focused;
  function commit(next: HomebaseContent) {
    setPast((values) => [...values, content].slice(-25));
    setContent(next);
  }
  function update(id: string, patch: Partial<HomebaseWidget>, history = true) {
    const geometry = ["x", "y", "w", "h"].some((key) => key in patch);
    const widgets = geometry
      ? arrangeWidgets(content.widgets, id, patch)
      : content.widgets.map((widget) =>
          widget.id === id ? { ...widget, ...patch } : widget,
        );
    if (!widgets) {
      announce(
        "There is no room below this tool. Move it higher or start another board.",
      );
      return;
    }
    const next = { ...content, widgets };
    if (history) commit(next);
    else setContent(next);
  }
  function add(kind: WidgetKind) {
    if (content.widgets.length >= 40) {
      announce("This board has 40 tools. Remove one before adding another.");
      return;
    }
    const widget = makeWidget(kind, content.widgets);
    if (widget.y > 200) {
      announce(
        "This board is full. Start another board or move a tool higher.",
      );
      return;
    }
    commit({ ...content, widgets: [...content.widgets, widget] });
    setToolbox(false);
    setEditId(widget.id);
    announce(`${widget.title} added.`);
  }
  function addActivity() {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity || content.widgets.length >= 40) return;
    const widget = activityWidget(activity, content.widgets);
    if (widget.y > 200) return;
    commit({ ...content, widgets: [...content.widgets, widget] });
    setToolbox(false);
    announce(
      "Activity added. This is an editable copy; the original stays in History.",
    );
  }
  function exit() {
    if (focused) {
      setFocused(null);
      window.setTimeout(() => focusTrigger.current?.focus(), 0);
    } else {
      setPresenting(false);
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    }
  }
  useEffect(() => {
    if (!focused && !presenting) return;
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") exit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused, presenting]);
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  async function action(task: () => Promise<void>) {
    setActionError("");
    setBusy(true);
    try {
      await task();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Couldn't finish. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const editWidget =
    content.widgets.find((widget) => widget.id === editId) || null;
  return (
    <div
      ref={root}
      className={`hb-board-root ${presenting ? "hb-presenting" : ""} ${focused ? "hb-focusing" : ""}`}
    >
      <div className="hb-board-toolbar">
        <div className="hb-board-identity">
          <input
            className="hb-board-name"
            aria-label="Homebase name"
            key={`${board.id}:${content.name}`}
            defaultValue={content.name}
            maxLength={100}
            onBlur={(event) => {
              const name = event.target.value.trim() || content.name;
              event.target.value = name;
              if (name !== content.name) commit({ ...content, name });
            }}
          />
          <span className="hb-save-state" role="status">
            {draft.error
              ? "Changes need attention"
              : draft.saving
                ? "Saving…"
                : draft.dirty
                  ? "Waiting to save…"
                  : "Saved"}
          </span>
        </div>
        <div className="hb-toolbar-actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Undo board change"
            disabled={!past.length || busy}
            onClick={() => {
              const previous = past[past.length - 1];
              if (previous) {
                setContent(previous);
                setPast(past.slice(0, -1));
              }
            }}
          >
            <Undo2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={locked ? "Unlock layout" : "Lock layout"}
            aria-pressed={locked}
            onClick={() => setLocked(!locked)}
          >
            {locked ? <LockKeyhole size={18} /> : <UnlockKeyhole size={18} />}
          </Button>
          <Button
            variant="outline"
            onClick={() => setToolbox(true)}
            disabled={busy}
          >
            <Plus size={17} />
            Add tool
          </Button>
          <Button
            onClick={() => {
              setPresenting(true);
              setToolbox(false);
              setEditId(null);
            }}
          >
            <Presentation size={17} />
            Present
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Board options">
                <MoreHorizontal size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={busy}
                onSelect={() => void action(() => copy(content))}
              >
                <Copy size={16} />
                Save as a copy
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setContent((value) => ({
                    ...value,
                    tone:
                      value.tone === "paper"
                        ? "sage"
                        : value.tone === "sage"
                          ? "lavender"
                          : value.tone === "lavender"
                            ? "butter"
                            : "paper",
                  }));
                }}
              >
                Change board color
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busy || draft.saving || draft.dirty}
                onSelect={() => setDeleteConfirm(true)}
              >
                <Trash2 size={16} />
                Remove board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {draft.error || draft.backupError || actionError ? (
        <div className="hb-save-error" role="alert">
          <p>
            {actionError ||
              draft.error ||
              "Your browser couldn't keep a local draft. Keep this tab open until the board says Saved."}
          </p>
          {draft.error ? (
            <>
              <Button variant="outline" size="sm" onClick={draft.retry}>
                Retry save
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void action(() => copy(content))}
              >
                Save draft as a copy
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      {deleteConfirm ? (
        <div className="hb-save-error" role="alert">
          <p>Remove “{content.name}” and its saved tools?</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirm(false)}
          >
            Keep board
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={() => void action(() => remove(draft.revision))}
          >
            Remove board
          </Button>
        </div>
      ) : null}
      <div className="hb-board-hint">
        <span>
          {locked
            ? "Layout locked. Your tools still work."
            : "Drag a tool by its handle. Arrow keys move it; Shift + arrows move further."}
        </span>
        <span>{content.widgets.length} / 40 tools</span>
      </div>
      <div
        ref={canvas}
        className={`hb-canvas hb-tone-${content.tone}`}
        data-testid="homebase-canvas"
        style={
          {
            "--hb-rows": Math.max(
              7,
              ...content.widgets.map((widget) => widget.y + widget.h),
            ),
          } as CSSProperties
        }
      >
        {content.widgets.length ? (
          content.widgets
            .toSorted((a, b) => a.y - b.y || a.x - b.x)
            .map((widget) => (
              <WidgetFrame
                key={widget.id}
                widget={widget}
                canvas={canvas}
                editing={editing}
                focused={focused === widget.id}
                hidden={!!focused && focused !== widget.id}
                update={(patch, history) => update(widget.id, patch, history)}
                announce={announce}
                edit={() => setEditId(widget.id)}
                remove={() => {
                  commit({
                    ...content,
                    widgets: content.widgets.filter(
                      (item) => item.id !== widget.id,
                    ),
                  });
                  announce(`${widget.title} removed. Undo to bring it back.`);
                }}
                duplicate={() => {
                  if (content.widgets.length >= 40) return;
                  const next = {
                    ...widget,
                    id: crypto.randomUUID(),
                    y: Math.max(
                      ...content.widgets.map((item) => item.y + item.h),
                    ),
                  };
                  if (next.y > 200) return;
                  commit({ ...content, widgets: [...content.widgets, next] });
                }}
                focus={() => {
                  focusTrigger.current = document.activeElement as HTMLElement;
                  setFocused(widget.id);
                }}
              />
            ))
        ) : (
          <div className="hb-empty-board">
            <h2>Make room for your class.</h2>
            <p>
              Add a task, a timer, or a reminder. Build the board you want
              students to see.
            </p>
            <Button onClick={() => setToolbox(true)}>
              <Plus size={17} />
              Add your first tool
            </Button>
          </div>
        )}
      </div>
      {presenting || focused ? (
        <div className="hb-presentation-controls">
          <Button variant="outline" onClick={exit}>
            <X size={17} />
            {focused ? "Back to board" : "Exit presentation"}
          </Button>
          {presenting && !focused ? (
            <Button
              variant="outline"
              aria-label="Enter fullscreen"
              onClick={() => {
                void root.current
                  ?.requestFullscreen?.()
                  .catch(() =>
                    announce("Fullscreen isn't available in this browser."),
                  );
              }}
            >
              <Maximize size={17} />
            </Button>
          ) : null}
        </div>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <WidgetEditor
        widget={editWidget}
        close={() => setEditId(null)}
        save={(next) => update(next.id, next)}
      />
      <Sheet open={toolbox} onOpenChange={setToolbox}>
        <SheetContent className="hb-sheet hb-toolbox">
          <SheetHeader>
            <SheetTitle>Add a tool</SheetTitle>
            <SheetDescription>
              A few useful things, ready for your room.
            </SheetDescription>
          </SheetHeader>
          <input
            className="hb-search"
            aria-label="Search tools"
            placeholder="Find a tool…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {activities.length &&
          (!search || "activity boardwork".includes(search.toLowerCase())) ? (
            <div className="hb-saved-activity">
              <label htmlFor="homebase-activity">
                From your saved activities
              </label>
              <select
                id="homebase-activity"
                value={activityId}
                onChange={(event) => setActivityId(event.target.value)}
              >
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={addActivity}
                disabled={!activityId || content.widgets.length >= 40}
              >
                Add activity
              </Button>
            </div>
          ) : null}
          {["Teach", "Time", "Participate", "Routines", "Resources"].map(
            (group) => {
              const matches = tools.filter(
                (tool) =>
                  tool.group === group &&
                  tool.kind !== "task" &&
                  `${tool.title} ${tool.description}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              );
              return matches.length ? (
                <section className="hb-tool-group" key={group}>
                  <h3>{group}</h3>
                  {matches.map((tool) => (
                    <button
                      type="button"
                      key={tool.kind}
                      className="hb-tool-option"
                      onClick={() => add(tool.kind)}
                      disabled={content.widgets.length >= 40}
                    >
                      <span>
                        <strong>{tool.title}</strong>
                        <span>{tool.description}</span>
                      </span>
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  ))}
                </section>
              ) : null;
            },
          )}
          {search &&
          !tools.some(
            (tool) =>
              tool.kind !== "task" &&
              `${tool.title} ${tool.description}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          ) ? (
            <p className="hb-small">
              No matching tools. Try “timer”, “note”, or “link”.
            </p>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

type FrameProps = {
  widget: HomebaseWidget;
  canvas: React.RefObject<HTMLDivElement | null>;
  editing: boolean;
  focused: boolean;
  hidden: boolean;
  update: (patch: Partial<HomebaseWidget>, history?: boolean) => void;
  announce: (text: string) => void;
  edit: () => void;
  remove: () => void;
  duplicate: () => void;
  focus: () => void;
};
function WidgetFrame({
  widget,
  canvas,
  editing,
  focused,
  hidden,
  update,
  announce,
  edit,
  remove,
  duplicate,
  focus,
}: FrameProps) {
  const [preview, setPreview] = useState<Partial<HomebaseWidget> | null>(null);
  const gesture = useRef<{
    pointer: number;
    clientX: number;
    clientY: number;
    mode: "move" | "resize";
    cell: number;
    original: HomebaseWidget;
    latest: Partial<HomebaseWidget>;
  } | null>(null);
  const shown = { ...widget, ...preview };
  function clamp(patch: Partial<HomebaseWidget>) {
    const w = Math.min(12, Math.max(2, patch.w ?? widget.w));
    return {
      x: Math.max(0, Math.min(12 - w, patch.x ?? widget.x)),
      y: Math.max(0, Math.min(200, patch.y ?? widget.y)),
      w,
      h: Math.max(2, Math.min(16, patch.h ?? widget.h)),
    };
  }
  function pointerDown(
    event: PointerEvent<HTMLButtonElement>,
    mode: "move" | "resize",
  ) {
    if (
      event.button !== 0 ||
      !canvas.current ||
      matchMedia("(max-width: 700px)").matches
    )
      return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const cell = (canvas.current.clientWidth - 32 - 11 * 16) / 12;
    gesture.current = {
      pointer: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      mode,
      cell,
      original: widget,
      latest: {},
    };
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (!active || active.pointer !== event.pointerId) return;
    const dx = Math.round(
      (event.clientX - active.clientX) / (active.cell + 16),
    );
    const dy = Math.round((event.clientY - active.clientY) / 80);
    const next =
      active.mode === "move"
        ? clamp({ x: active.original.x + dx, y: active.original.y + dy })
        : clamp({
            w: Math.min(12 - widget.x, active.original.w + dx),
            h: active.original.h + dy,
          });
    active.latest = next;
    setPreview(next);
  }
  function finish(cancel = false) {
    const active = gesture.current;
    gesture.current = null;
    setPreview(null);
    if (!cancel && active && Object.keys(active.latest).length) {
      update(active.latest);
      announce(
        `${widget.title}: column ${(active.latest.x ?? widget.x) + 1}, row ${(active.latest.y ?? widget.y) + 1}, width ${active.latest.w ?? widget.w}.`,
      );
    }
  }
  function keyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    mode: "move" | "resize",
  ) {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    event.preventDefault();
    const step = event.shiftKey ? 3 : 1;
    const dx =
      event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
    const dy =
      event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
    const next =
      mode === "move"
        ? clamp({ x: widget.x + dx, y: widget.y + dy })
        : clamp({
            w: Math.min(12 - widget.x, widget.w + dx),
            h: widget.h + dy,
          });
    update(next);
    announce(
      `${widget.title}: column ${next.x + 1}, row ${next.y + 1}, width ${next.w}, height ${next.h}.`,
    );
  }
  return (
    <article
      className={`hb-widget hb-tone-${widget.tone} ${focused ? "hb-widget-focused" : ""} ${hidden ? "hb-widget-hidden" : ""}`}
      aria-label={widget.title}
      style={{
        gridColumn: `${shown.x + 1} / span ${shown.w}`,
        gridRow: `${shown.y + 1} / span ${shown.h}`,
      }}
      data-widget-id={widget.id}
    >
      <header className="hb-widget-header">
        <h2>{widget.title}</h2>
        {editing ? (
          <div className="hb-frame-controls">
            <button
              type="button"
              className="hb-move-handle"
              aria-label={`Move ${widget.title}`}
              title="Drag or use arrow keys to move"
              onPointerDown={(event) => pointerDown(event, "move")}
              onPointerMove={pointerMove}
              onPointerUp={() => finish()}
              onPointerCancel={() => finish(true)}
              onKeyDown={(event) => keyboard(event, "move")}
            >
              <Grip size={17} />
            </button>
            <button
              type="button"
              aria-label={`Edit ${widget.title}`}
              onClick={edit}
            >
              <Pencil size={16} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Options for ${widget.title}`}
                >
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={duplicate}>
                  <Copy size={15} />
                  Duplicate tool
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    update({ y: 0, x: 0 });
                  }}
                >
                  Move to top
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={remove}>
                  <Trash2 size={15} />
                  Remove tool
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </header>
      <div className="hb-widget-content">
        <WidgetContent
          widget={widget}
          update={(patch) => update(patch, false)}
          focus={focus}
          editing={editing}
        />
      </div>
      {editing ? (
        <button
          type="button"
          className="hb-resize-handle"
          aria-label={`Resize ${widget.title}`}
          title="Drag or use arrow keys to resize"
          onPointerDown={(event) => pointerDown(event, "resize")}
          onPointerMove={pointerMove}
          onPointerUp={() => finish()}
          onPointerCancel={() => finish(true)}
          onKeyDown={(event) => keyboard(event, "resize")}
        >
          <Scaling size={16} />
        </button>
      ) : null}
    </article>
  );
}

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HomebaseRecord, type HomebaseContent } from "@workspace/api-zod";
import {
  Loader2,
  Plus,
  Presentation,
  Timer,
  PanelsTopLeft,
} from "lucide-react";
import { Link } from "wouter";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useBoardwork } from "@/store/boardwork-context";
import { homebaseRequest } from "@/features/homebase/use-homebase";
import { HomebaseBoard } from "@/features/homebase/board";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import bridgePhoto from "@/assets/paper-bridges.jpg";
import { bridgeBoard } from "@/features/homebase/bridge-lesson";
import { adaptBoard, template } from "@/features/homebase/catalog";
import "@/features/homebase/homebase.css";

export default function Homebase() {
  const { appState, activeClassId } = useBoardwork();
  const [scope, setScope] = useState(activeClassId || "general");
  const [selected, setSelected] = useState<string | null>(null);
  const [adaptSource, setAdaptSource] = useState<HomebaseContent | null>(() =>
    new URLSearchParams(window.location.search).get("template") === "bridge" ? bridgeBoard() : null);
  const [destination,setDestination] = useState(activeClassId || "general");
  const [copyName,setCopyName] = useState("Paper bridge warm-up");
  function openAdapt(content: HomebaseContent, target: string) {
    setDestination(target); setCopyName(content.name); setAdaptSource(content); setError("");
  }
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["homebases", scope];
  const classId = scope === "general" ? null : scope;
  const boards = useQuery({
    queryKey,
    queryFn: async () =>
      HomebaseRecord.array().parse(
        await homebaseRequest(
          classId ? `?classId=${encodeURIComponent(classId)}` : "",
        ),
      ),
  });
  const board =
    boards.data?.find((item) => item.id === selected) || boards.data?.[0];
  async function create(content: HomebaseContent, target = scope) {
    setCreating(true);
    setError("");
    try {
      const next = HomebaseRecord.parse(
        await homebaseRequest("", {
          method: "POST",
          body: JSON.stringify({ ...content, classId: target === "general" ? null : target }),
        }),
      );
      queryClient.setQueryData<HomebaseRecord[]>(["homebases",target], (values) => [
        next,
        ...(values || []),
      ]);
      setScope(target);
      setSelected(next.id);
      setShowCreate(false);
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Couldn't create a board. Try again.";
      setError(message);
      throw cause;
    } finally {
      setCreating(false);
    }
  }
  const activities =
    appState?.activities.filter(
      (activity) => !classId || activity.classId === classId,
    ) || [];
  return (
    <Shell>
      <div className="hb-page">
        <div className="hb-page-header">
          <div>
            <h1>Homebase</h1>
            <p>Your task, timer, and classroom tools. One place to look.</p>
          </div>
          <div className="hb-scope-controls">
            <label>
              <span className="sr-only">Class for homebase</span>
              <select
                aria-label="Class for homebase"
                value={scope}
                onChange={(event) => {
                  setScope(event.target.value);
                  setSelected(null);
                  setError("");
                }}
              >
                <option value="general">General boards</option>
                {appState?.classes.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>
            {board ? (
              <label>
                <span className="sr-only">Saved homebase</span>
                <select
                  aria-label="Saved homebase"
                  value={board.id}
                  onChange={(event) => setSelected(event.target.value)}
                >
                  {boards.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Button
              variant="outline"
              disabled={creating || boards.isLoading}
              onClick={() => setShowCreate(!showCreate)}
              aria-expanded={showCreate}
            >
              <Plus size={17} />
              New board
            </Button>
          </div>
        </div>
        {error ? (
          <div className="hb-save-error" role="alert">
            {error}
          </div>
        ) : null}
        {boards.isLoading ? (
          <div className="hb-loading" role="status">
            <Loader2 className="animate-spin" />
            Opening your boards…
          </div>
        ) : boards.isError ? (
          <div className="hb-save-error" role="alert">
            <p>
              Your boards couldn't load. Check the connection, then try again.
            </p>
            <Button variant="outline" onClick={() => void boards.refetch()}>
              Retry
            </Button>
          </div>
        ) : !board || showCreate ? (
          <div className="hb-create">
            <div>
              <h2>
                {board ? "Start another board." : "Your room, ready to begin."}
              </h2>
              <p>
                Choose a starting point, then add the tools your class needs.
                Keep boards for a class or use General boards across your day.
              </p>
            </div>
            <div className="hb-start-options">
              <button className="hb-bridge-option" disabled={creating} onClick={()=>openAdapt(bridgeBoard(),scope)}>
                <img src={bridgePhoto} alt=""/><strong>Paper bridge warm-up</strong>
                <span>Predict, compare, and share with a five-minute timed agenda.</span>
                <span className="hb-start-link">Use warm-up <Plus size={16}/></span>
              </button>
              {[
                {
                  kind: "arrival",
                  title: "Class arrival",
                  text: "A welcome note, visual timer, agenda, and clock.",
                  icon: Presentation,
                },
                {
                  kind: "focus",
                  title: "Focus time",
                  text: "A timer and work mode for quiet, independent work.",
                  icon: Timer,
                },
                {
                  kind: "blank",
                  title: "Blank board",
                  text: "An open canvas. Add just the tools you need.",
                  icon: PanelsTopLeft,
                },
              ].map(({ kind, title, text, icon: Icon }) => (
                <button
                  type="button"
                  key={kind}
                  disabled={creating}
                  onClick={() =>
                    void create(
                      template(kind as "arrival" | "focus" | "blank"),
                    ).catch(() => {})
                  }
                >
                  <Icon size={26} />
                  <strong>{title}</strong>
                  <span>{text}</span>
                  <span className="hb-start-link">
                    {creating ? "Creating…" : "Create board"}
                    <Plus size={16} />
                  </span>
                </button>
              ))}
            </div>
            <p className="hb-small">
              Your tools and layout are saved here. Timers and random picks restart
              when you reopen a board.
            </p>
            {board ? (
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Back to your board
              </Button>
            ) : (
              <Link href="/app" className="hb-resource-link">
                Prepare a classroom activity
              </Link>
            )}
          </div>
        ) : (
          <HomebaseBoard
            key={board.id}
            board={board}
            activities={activities}
            adapt={content=>openAdapt(content,appState?.classes.find(c=>c.id!==classId)?.id || "general")}
            saved={(next) =>
              queryClient.setQueryData<HomebaseRecord[]>(
                queryKey,
                (values) =>
                  values?.map((item) =>
                    item.id === next.id ? next : item,
                  ) || [next],
              )
            }
            copy={(content) =>
              create({
                ...content,
                name: `${content.name.slice(0, 90)} (copy)`,
              })
            }
            remove={async (revision) => {
              await homebaseRequest(`/${board.id}?revision=${revision}`, {
                method: "DELETE",
              });
              try {
                localStorage.removeItem(`boardwork:homebase:v1:${board.id}`);
              } catch {
                /* Browser storage may be disabled. */
              }
              queryClient.setQueryData<HomebaseRecord[]>(
                queryKey,
                (values) =>
                  values?.filter((item) => item.id !== board.id) || [],
              );
              setSelected(null);
            }}
          />
        )}
        <Sheet open={!!adaptSource} onOpenChange={open=>{if(!open && !creating)setAdaptSource(null)}}>
          <SheetContent className="hb-sheet"><SheetHeader><SheetTitle>Use for another class</SheetTitle>
            <SheetDescription>Keep the lesson, tools, and layout. Your copy starts with fresh timing, scores, and name lists.</SheetDescription>
          </SheetHeader>
          <form className="hb-edit-form" onSubmit={async e=>{e.preventDefault();if(!adaptSource || creating)return;
            try {await create(adaptBoard(adaptSource,copyName.trim()),destination); setAdaptSource(null);
              if(new URLSearchParams(location.search).has("template")) window.history.replaceState(window.history.state,"",location.pathname);
            } catch { /* The form displays the server error. */ }
          }}>
            <label>Destination class<select value={destination} onChange={e=>setDestination(e.target.value)}>
              <option value="general">General boards</option>{appState?.classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label>Board name<Input required maxLength={100} value={copyName} onChange={e=>setCopyName(e.target.value)}/></label>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={creating || !copyName.trim()}>{creating ? "Creating…" : "Create class copy"}</Button>
          </form></SheetContent>
        </Sheet>
      </div>
    </Shell>
  );
}

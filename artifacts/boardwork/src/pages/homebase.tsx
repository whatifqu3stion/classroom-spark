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
import { template } from "@/features/homebase/catalog";
import "@/features/homebase/homebase.css";

export default function Homebase() {
  const { appState, activeClassId } = useBoardwork();
  const [scope, setScope] = useState(activeClassId || "general");
  const [selected, setSelected] = useState<string | null>(null);
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
  async function create(content: HomebaseContent) {
    setCreating(true);
    setError("");
    try {
      const next = HomebaseRecord.parse(
        await homebaseRequest("", {
          method: "POST",
          body: JSON.stringify({ ...content, classId }),
        }),
      );
      queryClient.setQueryData<HomebaseRecord[]>(queryKey, (values) => [
        next,
        ...(values || []),
      ]);
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
            <p>A familiar start. Everything your room needs, in one place.</p>
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
                Keep the task, timer, and daily reminders together. Saved
                separately for each class.
              </p>
            </div>
            <div className="hb-start-options">
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
              Boards save on this installation. Timers and random picks restart
              when you reopen a board.
            </p>
            {board ? (
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Back to your board
              </Button>
            ) : (
              <Link href="/app" className="hb-resource-link">
                Create a Boardwork activity first
              </Link>
            )}
          </div>
        ) : (
          <HomebaseBoard
            key={board.id}
            board={board}
            activities={activities}
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
      </div>
    </Shell>
  );
}

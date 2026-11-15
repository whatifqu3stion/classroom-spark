import { useEffect, useRef, useState } from "react";
import { HomebaseContent, HomebaseRecord } from "@workspace/api-zod";

const endpoint = `${import.meta.env.BASE_URL}api/homebases`;
export async function homebaseRequest(
  path = "",
  options?: RequestInit,
): Promise<unknown> {
  const response = await fetch(`${endpoint}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (response.status === 204) return null;
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "The board couldn't save. Try again.");
  return value;
}
const contentOf = (board: HomebaseRecord): HomebaseContent => ({
  name: board.name,
  tone: board.tone,
  widgets: board.widgets,
});
function readDraft(board: HomebaseRecord) {
  try {
    const draft = JSON.parse(
      localStorage.getItem(`boardwork:homebase:v1:${board.id}`) || "null",
    );
    const parsed = HomebaseContent.safeParse(draft?.content);
    if (
      draft?.version === 1 &&
      Number.isInteger(draft.revision) &&
      parsed.success
    )
      return { content: parsed.data, revision: draft.revision as number };
  } catch {
    /* A malformed browser backup never replaces a saved board. */
  }
  return null;
}
export function useHomebaseDraft(
  board: HomebaseRecord,
  saved: (board: HomebaseRecord) => void,
) {
  const [initial] = useState(() => readDraft(board));
  const [content, setContent] = useState<HomebaseContent>(
    () => initial?.content || contentOf(board),
  );
  const [revision, setRevision] = useState(initial?.revision || board.revision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(
    initial && initial.revision !== board.revision
      ? "A recovered draft is older than the saved board. Save it as a copy to keep both versions."
      : "",
  );
  const [backupError, setBackupError] = useState(false);
  const [savedHash, setSavedHash] = useState(JSON.stringify(contentOf(board)));
  const hash = JSON.stringify(content);
  const dirty = hash !== savedHash;
  const latest = useRef(content);
  latest.current = content;
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const onSaved = useRef(saved);
  onSaved.current = saved;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    try {
      localStorage.setItem(
        `boardwork:homebase:v1:${board.id}`,
        JSON.stringify({ version: 1, revision, content }),
      );
      setBackupError(false);
    } catch {
      setBackupError(true);
    }
  }, [hash, revision, dirty, board.id]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    if (!dirty || saving || error) return;
    const timeout = window.setTimeout(() => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSaving(true);
      const sent = latest.current;
      const sentHash = JSON.stringify(sent);
      void homebaseRequest(`/${board.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...sent, revision }),
      })
        .then((value) => {
          const next = HomebaseRecord.parse(value);
          if (!mounted.current) return;
          setRevision(next.revision);
          setSavedHash(sentHash);
          onSaved.current(next);
          if (JSON.stringify(latest.current) === sentHash) {
            try {
              localStorage.removeItem(`boardwork:homebase:v1:${board.id}`);
            } catch {
              /* Saved on the server even if browser storage is blocked. */
            }
          }
        })
        .catch((cause) => {
          if (mounted.current)
            setError(
              cause instanceof Error
                ? cause.message
                : "Couldn't save. Try again.",
            );
        })
        .finally(() => {
          inFlight.current = false;
          if (mounted.current) setSaving(false);
        });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [hash, dirty, revision, saving, error, board.id]);
  return {
    content,
    setContent,
    revision,
    dirty,
    saving,
    error,
    backupError,
    retry: () => setError(""),
  };
}

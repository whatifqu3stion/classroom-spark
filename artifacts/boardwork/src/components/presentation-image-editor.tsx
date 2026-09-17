import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Check, ImagePlus, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import {
  estimatePresentationImageDataUrlBytes,
  getPresentationImagePayloadError,
  PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES,
  PRESENTATION_IMAGE_FILE_LIMIT_BYTES,
  PRESENTATION_IMAGE_SIZE_ERROR,
} from "@workspace/api-zod";
import { getPresentationVisuals, type ActivityDraft, type PresentationVisual } from "@/store/boardwork-context";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface PresentationImageEditorProps {
  draft: ActivityDraft;
  onChange: (updates: Partial<ActivityDraft>) => void;
}

export function PresentationImageEditor({ draft, onChange }: PresentationImageEditorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const helperId = useId();
  const errorId = useId();
  const firstSelector = useRef<HTMLButtonElement>(null);
  const pendingReader = useRef<FileReader | null>(null);
  const identity = useRef({ id: draft.id, classId: draft.classId });
  const latest = useRef({ draft, onChange });
  latest.current = { draft, onChange };
  const visuals = getPresentationVisuals(draft);
  const selectedIndex = visuals.length === 0 ? 0 : activeIndex;
  const visual = visuals[selectedIndex];
  const busy = pendingIndex !== null;

  useEffect(() => {
    const previous = identity.current;
    // First autosave assigns an ID to this same draft; don't reset its selection.
    if (previous.classId !== draft.classId || (previous.id != null && previous.id !== draft.id)) {
      const reader = pendingReader.current;
      pendingReader.current = null;
      if (reader?.readyState === FileReader.LOADING) reader.abort();
      setActiveIndex(0);
      setPendingIndex(null);
      setError(null);
    }
    identity.current = { id: draft.id, classId: draft.classId };
  }, [draft.id, draft.classId]);

  useEffect(() => () => {
    const reader = pendingReader.current;
    pendingReader.current = null;
    if (reader?.readyState === FileReader.LOADING) reader.abort();
  }, []);

  const updateVisuals = (next: PresentationVisual[]) => {
    const updates = {
      visuals: next,
      visualUrl: next[0]?.url ?? null,
      visualDescription: next[0]?.description ?? null,
    };
    latest.current = { ...latest.current, draft: { ...latest.current.draft, ...updates } };
    latest.current.onChange(updates);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || pendingReader.current) return;
    if (file.size > PRESENTATION_IMAGE_FILE_LIMIT_BYTES ||
      estimatePresentationImageDataUrlBytes(file.size, file.type) > PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES) {
      setError(PRESENTATION_IMAGE_SIZE_ERROR);
      return;
    }
    const index = selectedIndex;
    const reader = new FileReader();
    pendingReader.current = reader;
    setPendingIndex(index);
    setError(null);
    const finish = () => {
      pendingReader.current = null;
      setPendingIndex(null);
    };
    reader.onerror = () => {
      if (pendingReader.current !== reader) return;
      finish();
      setError("This image could not be read. Choose another image and try again.");
    };
    reader.onload = () => {
      if (pendingReader.current !== reader) return;
      finish();
      const url = String(reader.result ?? "");
      const payloadError = getPresentationImagePayloadError(url);
      if (payloadError) {
        setError(payloadError);
        return;
      }
      // Selection and descriptions can change while reading; commit to the
      // original slot using current data, never the upload handler's snapshot.
      const next = [...getPresentationVisuals(latest.current.draft)];
      next[index] = { url, description: next[index]?.description ?? null };
      updateVisuals(next.slice(0, 2));
      setActiveIndex(index);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-w-0 space-y-3" data-testid="image-workspace">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Presentation images">
        {[0, 1].map((index) => {
          const filled = Boolean(visuals[index]);
          const unavailable = index === 1 && visuals.length === 0;
          return (
            <button
              key={index}
              ref={index === 0 ? firstSelector : undefined}
              type="button"
              aria-label={`Image ${index + 1}, ${filled ? "Added" : "Empty"}`}
              aria-pressed={selectedIndex === index}
              aria-disabled={unavailable}
              aria-describedby={unavailable ? helperId : undefined}
              data-testid={`image-selector-${index + 1}`}
              onClick={() => { if (!unavailable) setActiveIndex(index); }}
              className={cn(
                "flex min-h-11 min-w-0 flex-col items-start justify-center gap-1 rounded-lg border px-3 py-2 text-left text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedIndex === index ? "border-foreground/25 bg-foreground/10 dark:bg-foreground/15" : "border-input bg-card hover:bg-muted/70",
                unavailable && "cursor-not-allowed opacity-50",
              )}
            >
              <span>Image {index + 1}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-hidden="true">
                <Check className={cn("h-3 w-3 shrink-0", !filled && "invisible")} />
                {filled ? "Added" : "Empty"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex h-32 w-full items-center justify-center rounded-lg border bg-muted/30">
        {visual ? (
          <img src={visual.url} alt={`Image ${selectedIndex + 1} preview`} className="h-full w-full rounded-lg object-contain" data-testid="visual-preview" />
        ) : (
          <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
            <ImageIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Choose an image below</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={cn(
          "relative flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-input bg-card px-2 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-ring",
          busy ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-muted/70",
        )}>
          {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <span className="min-w-0 text-center">{busy ? "Reading image…" : visual ? "Replace image" : "Add image"}</span>
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            className="sr-only"
            aria-label={`${visual ? "Replace" : "Add"} image ${selectedIndex + 1}`}
            aria-describedby={error ? `${helperId} ${errorId}` : helperId}
            onChange={handleFile}
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          disabled={!visual || busy}
          aria-label={`Remove image ${selectedIndex + 1}`}
          className="h-auto min-h-11 min-w-0 gap-2 whitespace-normal px-2 py-2 shadow-none"
          onClick={() => {
            setError(null);
            updateVisuals(getPresentationVisuals(latest.current.draft).filter((_, index) => index !== selectedIndex));
            setActiveIndex(0);
            firstSelector.current?.focus();
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Remove image</span>
        </Button>
      </div>
      <Input
        aria-label={`Visual description ${selectedIndex + 1}`}
        disabled={!visual}
        value={visual?.description ?? ""}
        placeholder="Optional description for students"
        onChange={(event) => {
          const next = [...getPresentationVisuals(latest.current.draft)];
          if (!next[selectedIndex]) return;
          next[selectedIndex] = { ...next[selectedIndex], description: event.target.value };
          updateVisuals(next);
        }}
      />
      <div className="sr-only" role="status">{busy ? `Reading image ${pendingIndex! + 1}` : ""}</div>
      {error && <p id={errorId} role="alert" className="text-xs text-destructive" data-testid="visual-upload-error">{error}</p>}
      <p id={helperId} className="text-xs text-muted-foreground">
        Add up to 2 local images, up to 5 MB each. Add Image 1 before Image 2.
        They appear in Present and PNG export without cropping. Two images keep
        the timer small so both visuals stay readable.
      </p>
    </div>
  );
}
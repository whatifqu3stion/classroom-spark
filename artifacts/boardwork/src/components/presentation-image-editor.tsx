import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Image as ImageIcon, Loader2, X } from "lucide-react";
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
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const helperId = useId();
  const errorId = useId();
  const addInput = useRef<HTMLInputElement>(null);
  const descriptionInputs = useRef<(HTMLInputElement | null)[]>([]);
  const focusAfterChange = useRef<"add" | number | null>(null);
  const pendingReader = useRef<FileReader | null>(null);
  const identity = useRef({ id: draft.id, classId: draft.classId });
  const latest = useRef({ draft, onChange });
  latest.current = { draft, onChange };
  const visuals = getPresentationVisuals(draft);
  const busy = pendingIndex !== null;

  useEffect(() => {
    const previous = identity.current;
    // First autosave assigns an ID to this same draft; keep its pending upload.
    if (previous.classId !== draft.classId || (previous.id != null && previous.id !== draft.id)) {
      const reader = pendingReader.current;
      pendingReader.current = null;
      if (reader?.readyState === FileReader.LOADING) reader.abort();
      focusAfterChange.current = null;
      setPendingIndex(null);
      setError(null);
    }
    identity.current = { id: draft.id, classId: draft.classId };
  }, [draft.id, draft.classId]);

  useEffect(() => {
    const target = focusAfterChange.current;
    if (target === null) return;
    const input = target === "add" ? addInput.current : descriptionInputs.current[target];
    if (input && !input.disabled) {
      input.focus();
      focusAfterChange.current = null;
    }
  }, [visuals.length, busy]);

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
    if (!file || pendingReader.current || getPresentationVisuals(latest.current.draft).length >= 2) return;
    if (file.size > PRESENTATION_IMAGE_FILE_LIMIT_BYTES ||
      estimatePresentationImageDataUrlBytes(file.size, file.type) > PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES) {
      setError(PRESENTATION_IMAGE_SIZE_ERROR);
      return;
    }
    const index = getPresentationVisuals(latest.current.draft).length;
    const source = { id: latest.current.draft.id, classId: latest.current.draft.classId };
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
      const current = latest.current.draft;
      if (source.classId !== current.classId || (source.id != null && source.id !== current.id)) return;
      const url = String(reader.result ?? "");
      const payloadError = getPresentationImagePayloadError(url);
      if (payloadError) {
        setError(payloadError);
        return;
      }
      // Append to current data so edits to existing descriptions survive the read.
      const next = [...getPresentationVisuals(latest.current.draft)];
      if (next.length >= 2) return;
      next.push({ url, description: null });
      if (next.length === 2) focusAfterChange.current = 1;
      updateVisuals(next);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-w-0 space-y-3" data-testid="image-workspace">
      <div
        className="grid min-w-0 gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))" }}
        role="group"
        aria-label="Presentation images"
      >
        {visuals.map((visual, index) => (
          <div key={index} className="min-w-0 space-y-2">
            <div className="relative flex h-32 w-full items-center justify-center rounded-lg border bg-muted/30">
              <img src={visual.url} alt={`Image ${index + 1} preview`} className="h-full w-full rounded-lg object-contain" data-testid="visual-preview" />
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-0 top-0 h-11 w-11 rounded-full p-2 shadow-none hover:bg-muted/70 focus-visible:ring-offset-2"
                onClick={() => {
                  if (pendingReader.current) return;
                  setError(null);
                  focusAfterChange.current = "add";
                  updateVisuals(getPresentationVisuals(latest.current.draft).filter((_, currentIndex) => currentIndex !== index));
                }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm">
                  <X className="h-4 w-4" aria-hidden="true" />
                </span>
              </Button>
            </div>
            <Input
              ref={(element) => { descriptionInputs.current[index] = element; }}
              aria-label={`Visual description ${index + 1}`}
              value={visual.description ?? ""}
              placeholder="Optional description for students"
              onChange={(event) => {
                const next = [...getPresentationVisuals(latest.current.draft)];
                if (!next[index]) return;
                next[index] = { ...next[index], description: event.target.value };
                updateVisuals(next);
              }}
            />
          </div>
        ))}
        {visuals.length === 0 && (
          <div className="flex h-32 w-full items-center justify-center rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
              <ImageIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Choose an image below</span>
            </div>
          </div>
        )}
      </div>
      {visuals.length < 2 && (
        <label className={cn(
          "relative flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-input bg-card px-2 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
          busy ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-muted/70",
        )}>
          {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <span className="min-w-0 text-center">Add image</span>
          <input
            ref={addInput}
            type="file"
            accept="image/*"
            disabled={busy}
            className="sr-only"
            aria-label="Add image"
            aria-describedby={error ? `${helperId} ${errorId}` : helperId}
            onChange={handleFile}
          />
        </label>
      )}
      <div className={busy ? "text-xs text-muted-foreground" : "sr-only"} role="status">{busy ? `Reading image ${pendingIndex! + 1}…` : ""}</div>
      {error && <p id={errorId} role="alert" className="text-xs text-destructive" data-testid="visual-upload-error">{error}</p>}
      <p id={helperId} className="text-xs text-muted-foreground">
        Add up to 2 local images, up to 5 MB each.
        They appear in Present and PNG export without cropping. Two images keep
        the timer small so both visuals stay readable.
      </p>
    </div>
  );
}
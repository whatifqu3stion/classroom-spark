import React, { useRef, useEffect } from "react";
import { ActivityDraft, Duration } from "@/store/boardwork-context";
import { Button } from "./ui/button";
import { Plus, X, Monitor, Clock, FileText, Loader2, CheckCircle2, AlertCircle, ExternalLink, ImagePlus } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { PresentationThemePicker } from "@/components/presentation-theme-picker";

interface BoardEditorProps {
  draft: ActivityDraft;
  onChange: (updates: Partial<ActivityDraft>) => void;
  onPresent?: (e: React.MouseEvent) => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  isMeaningful?: boolean;
}

function EditableText({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    onChange(e.currentTarget.textContent || "");
  };

  const Component = multiline ? "div" : "span";

  return (
    <Component
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      data-placeholder={placeholder}
      role="textbox"
      aria-label={placeholder}
      aria-multiline={multiline}
      className={cn(
        "outline-none cursor-text transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 hover:bg-muted/40 focus:bg-muted/20 focus:ring-2 focus:ring-primary/20 rounded-md px-1.5 -mx-1.5 py-0.5 -my-0.5",
        className
      )}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
        }
      }}
    />
  );
}

export function BoardEditor({ draft, onChange, onPresent, saveStatus = "idle", isMeaningful = true }: BoardEditorProps) {
  const safeResourceUrl = getSafeResourceUrl(draft.resourceUrl);
  const addPrompt = () => {
    if (draft.prompts.length < 3) {
      onChange({ prompts: [...draft.prompts, ""] });
    }
  };

  const updatePrompt = (index: number, val: string) => {
    const newPrompts = [...draft.prompts];
    newPrompts[index] = val;
    onChange({ prompts: newPrompts });
  };

  const removePrompt = (index: number) => {
    const newPrompts = [...draft.prompts];
    newPrompts.splice(index, 1);
    onChange({ prompts: newPrompts });
  };

  const disablePresent = !draft.id && !isMeaningful;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-xl border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="text-sm font-medium text-foreground flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
              Edit your board
          </div>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[80px]" data-testid="text-save-status">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Saved
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="w-3 h-3 text-destructive" />
                Save failed
              </>
            )}
            {saveStatus === "idle" && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {draft.id ? "Saved" : "Draft"}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {disablePresent ? (
            <span className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-muted px-3 text-sm font-medium text-muted-foreground gap-1.5 cursor-not-allowed opacity-50" data-testid="button-present-disabled">
              <Monitor className="w-4 h-4" />
              Present Screen
            </span>
          ) : (
            <Link href={`/present/${draft.id || ''}`} onClick={onPresent} className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring gap-1.5 cursor-pointer" data-testid="button-present">
              <Monitor className="w-4 h-4" />
              Present Screen
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <EditableText
                value={draft.eyebrow || ""}
                onChange={(val) => onChange({ eyebrow: val })}
                placeholder="EYEBROW (OPTIONAL)"
                className="text-xs font-bold tracking-widest text-muted-foreground uppercase min-w-[200px] inline-block"
              />
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <EditableText
                  value={String(draft.durationMinutes)}
                  onChange={(val) => {
                    const num = parseInt(val);
                     if (!isNaN(num)) onChange({ durationMinutes: num as Duration });
                  }}
                  placeholder="7"
                  className="font-medium text-foreground min-w-[1ch] text-center inline-block"
                />
                <span className="font-medium">MIN</span>
              </div>
            </div>

            <EditableText
              value={draft.title}
              onChange={(val) => onChange({ title: val })}
              placeholder="Enter a short title..."
              className="text-3xl md:text-4xl font-bold tracking-tight text-foreground block w-full"
            />
          </div>

          <EditableText
            multiline
            value={draft.task}
            onChange={(val) => onChange({ task: val })}
            placeholder="Describe the main task for students..."
            className="text-lg md:text-xl leading-relaxed text-foreground block w-full"
          />

          {draft.prompts.length > 0 && (
            <ul className="space-y-3 list-none p-0 m-0">
              {draft.prompts.map((prompt, idx) => (
                <li key={idx} className="flex gap-3 group relative text-lg md:text-xl text-foreground">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <EditableText
                    multiline
                    value={prompt}
                    onChange={(val) => updatePrompt(idx, val)}
                    placeholder="Enter prompt..."
                    className="flex-1 leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => removePrompt(idx)}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1.5 hover:bg-muted rounded-md absolute -left-10 top-1 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Remove prompt"
                    aria-label={`Remove prompt ${idx + 1}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {draft.prompts.length < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addPrompt}
              className="text-muted-foreground hover:text-foreground gap-1.5 -ml-3"
            >
              <Plus className="w-4 h-4" />
              Add Prompt
            </Button>
          )}

          {safeResourceUrl && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <a
                href={safeResourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                data-testid="activity-resource-link"
              >
                Open student resource
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              {draft.resourceNote && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {draft.resourceNote}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Materials
            </div>
            <EditableText
              value={(draft.materials ?? []).join(", ")}
              onChange={(value) =>
                onChange({
                  materials: value
                    .split(",")
                    .map((material) => material.trim())
                    .filter(Boolean)
                    .slice(0, 5),
                })
              }
              placeholder="Optional materials, separated by commas..."
              className="block w-full text-sm text-foreground"
            />
          </div>

          <div className="space-y-5 pt-8 mt-8 border-t">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Presentation visual
              </div>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {draft.visualUrl ? "Replace image" : "Add image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      window.alert("Choose an image smaller than 5 MB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => onChange({ visualUrl: String(reader.result) });
                    reader.readAsDataURL(file);
                    event.target.value = "";
                  }}
                />
              </label>
              {draft.visualUrl && (
                <>
                  <img src={draft.visualUrl} alt="" className="h-24 w-full rounded-md border object-contain bg-muted/30" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ visualUrl: null, visualDescription: null })}>
                    Remove image
                  </Button>
                  <input
                    aria-label="Visual description"
                    value={draft.visualDescription ?? ""}
                    onChange={(event) => onChange({ visualDescription: event.target.value })}
                    placeholder="Optional description for students"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </>
              )}
              <p className="text-xs text-muted-foreground">Local image only. It will be shown without cropping in Present and PNG export.</p>
            </div>
            <PresentationThemePicker
              value={draft.presentationTheme}
              onChange={(presentationTheme) => onChange({ presentationTheme })}
              preview={{
                title: draft.title,
                task: draft.task,
                prompt: draft.prompts[0],
              }}
            />
            {draft.teacherNote != null && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Teacher note
                </div>
                <EditableText
                  multiline
                  value={draft.teacherNote}
                  onChange={(val) => onChange({ teacherNote: val || null })}
                  placeholder="Optional note for the teacher..."
                  className="text-muted-foreground text-sm block w-full"
                />
              </div>
            )}
            <EditableText
              multiline
              value={draft.arrivalInstructions || ""}
              onChange={(val) => onChange({ arrivalInstructions: val })}
              placeholder="Arrival instructions (optional footer)..."
              className="text-muted-foreground text-sm block w-full"
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
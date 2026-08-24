import React, { useRef, useEffect, useState } from "react";
import { ActivityDraft, Duration } from "@/store/boardwork-context";
import { Button } from "./ui/button";
import { Plus, X, Monitor, Clock, FileText, Loader2, CheckCircle2, AlertCircle, ExternalLink, ImagePlus, ChevronDown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { PresentationThemePicker } from "@/components/presentation-theme-picker";
import { FormulaPreview, FormulaText } from "@/components/formula-text";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
      dir="auto"
      className={cn(
        "boardwork-user-content outline-none cursor-text transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 hover:bg-muted/40 focus:bg-muted/20 focus:ring-2 focus:ring-primary/20 rounded-md px-1.5 -mx-1.5 py-0.5 -my-0.5",
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
  const [presentationVisualOpen, setPresentationVisualOpen] = useState(false);
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
            <div className="flex items-center justify-end">
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
            <FormulaPreview>{draft.title}</FormulaPreview>
          </div>

          <EditableText
            multiline
            value={draft.task}
            onChange={(val) => onChange({ task: val })}
            placeholder="Describe the main task for students..."
            className="text-lg md:text-xl leading-relaxed text-foreground block w-full"
          />
          <FormulaPreview>{draft.task}</FormulaPreview>

          {draft.prompts.length > 0 && (
            <ul className="space-y-3 list-none p-0 m-0">
              {draft.prompts.map((prompt, idx) => (
                <li key={idx} className="flex gap-3 group relative text-lg md:text-xl text-foreground">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <div className="flex-1 min-w-0">
                    <EditableText
                      multiline
                      value={prompt}
                      onChange={(val) => updatePrompt(idx, val)}
                      placeholder="Enter prompt..."
                      className="leading-relaxed"
                    />
                    <FormulaPreview>{prompt}</FormulaPreview>
                  </div>
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
                  <FormulaText>{draft.resourceNote}</FormulaText>
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
            <FormulaPreview>{(draft.materials ?? []).join(", ")}</FormulaPreview>
          </div>

          <div className="mt-8 border-t pt-8">
            <Collapsible
              open={presentationVisualOpen}
              onOpenChange={setPresentationVisualOpen}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                presentationVisualOpen
                  ? "border-primary/30 bg-card shadow-sm"
                  : "border-border hover:border-primary/30",
              )}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  data-testid="toggle-presentation-visual"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
                        presentationVisualOpen && "bg-primary/10 text-primary",
                      )}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        Presentation appearance
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {draft.visualUrl ? "Image added" : "Choose a look for this board"}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                      {presentationVisualOpen ? "Close" : "Open"}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-colors group-hover:bg-muted">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          presentationVisualOpen && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent
                id="presentation-visual-settings"
                className="border-t data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1"
                data-testid="presentation-visual-settings"
              >
                <div className="space-y-7 px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Board image
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Add an optional image for Present and PNG export.
                      </p>
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
                      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        <img src={draft.visualUrl} alt="" className="h-24 w-full rounded-md border object-contain bg-background" />
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
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Local image only. It will be shown without cropping in Present and PNG export.
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <PresentationThemePicker
                      value={draft.presentationTheme}
                      onChange={(presentationTheme) => onChange({ presentationTheme })}
                    />
                  </div>

                  {draft.teacherNote != null && (
                    <div className="border-t pt-6">
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
                      <FormulaPreview>{draft.teacherNote}</FormulaPreview>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
        </div>
      </div>
    </div>
  );
}
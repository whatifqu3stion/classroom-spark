import React, { useRef, useEffect, useState } from "react";
import {
  ActivityDraft,
  Duration,
} from "@/store/boardwork-context";
import { Button } from "./ui/button";
import { Plus, X, Monitor, Clock, FileText, Loader2, CheckCircle2, AlertCircle, ExternalLink, Palette, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { PresentationThemePicker } from "@/components/presentation-theme-picker";
import { PresentationImageEditor } from "@/components/presentation-image-editor";
import { SavedContextSnapshotDetails } from "@/components/saved-context/saved-context-snapshot-details";
import { CurriculumSnapshotDetails } from "@/components/curriculum/curriculum-snapshot-details";
import { FormulaPreview, FormulaText } from "@/components/formula-text";
import { FormattedFormulaPreview } from "@/components/formatted-board-text";
import { normalizeFormulaRuns } from "@/lib/inline-formatting";
import { HelpTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InlineEditor } from "@/components/inline-editor";
import type { InlineTextRun } from "@workspace/api-zod";

interface BoardEditorProps {
  draft: ActivityDraft;
  onChange: (updates: Partial<ActivityDraft>) => void;
  onPresent?: (e: React.MouseEvent) => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  saveError?: string | null;
  onRetrySave?: () => void;
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
        "boardwork-user-content outline-none cursor-text transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground hover:bg-muted/50 focus:bg-muted/30 focus:ring-2 focus:ring-ring rounded-lg px-1.5 -mx-1.5 py-0.5 -my-0.5",
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

export function BoardEditor({
  draft,
  onChange,
  onPresent,
  saveStatus = "idle",
  saveError,
  onRetrySave,
  isMeaningful = true,
}: BoardEditorProps) {
  const [presentationVisualOpen, setPresentationVisualOpen] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const safeResourceUrl = getSafeResourceUrl(draft.resourceUrl);
  const editorIdentity = useRef({ id: draft.id, classId: draft.classId, key: 0 });
  if (editorIdentity.current.classId !== draft.classId ||
    (editorIdentity.current.id !== undefined && editorIdentity.current.id !== draft.id)) {
    editorIdentity.current.key += 1;
  }
  // The first autosave assigns an ID to the same draft; keep its selection/history.
  editorIdentity.current.id = draft.id;
  editorIdentity.current.classId = draft.classId;

  const promptFormatting = () => draft.prompts.map((prompt, index) =>
    normalizeFormulaRuns(prompt, draft.contentFormatting?.prompts?.[index]));

  useEffect(() => {
    setDurationError(null);
  }, [draft.id, draft.durationMinutes]);

  const addPrompt = () => {
    if (draft.prompts.length < 3) {
      const newPrompts = [...draft.prompts, ""];
      const currentFormatting = draft.contentFormatting || { version: 1 as const };
      const newPromptsFormatting = promptFormatting();
      newPromptsFormatting.push([]);

      onChange({
        prompts: newPrompts,
        contentFormatting: { ...currentFormatting, prompts: newPromptsFormatting }
      });
    }
  };

  const updatePrompt = (index: number, val: string, runs?: InlineTextRun[]) => {
    const newPrompts = [...draft.prompts];
    newPrompts[index] = val;

    const currentFormatting = draft.contentFormatting || { version: 1 as const };
    const newPromptsFormatting = promptFormatting();
    newPromptsFormatting[index] = normalizeFormulaRuns(val, runs);

    onChange({
      prompts: newPrompts,
      contentFormatting: { ...currentFormatting, prompts: newPromptsFormatting }
    });
  };

  const removePrompt = (index: number) => {
    const newPrompts = [...draft.prompts];
    newPrompts.splice(index, 1);

    const currentFormatting = draft.contentFormatting || { version: 1 as const };
    const newPromptsFormatting = promptFormatting();
    if (newPromptsFormatting.length > index) {
      newPromptsFormatting.splice(index, 1);
    }

    onChange({
      prompts: newPrompts,
      contentFormatting: { ...currentFormatting, prompts: newPromptsFormatting }
    });
  };

  const disablePresent = (!draft.id && !isMeaningful) || Boolean(durationError);
  const disabledPresentHint = durationError
    ? "Fix the duration before presenting."
    : "Add a task before presenting.";

  return (
    <div className="flex min-h-0 min-w-0 flex-auto flex-col overflow-hidden bg-card" data-testid="board-editor">
      <div
        className="flex shrink-0 flex-col gap-3 border-b bg-[var(--workspace-chrome)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6"
        data-testid="board-editor-header"
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold text-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              Edit your board
            </div>
            <div className="mx-1 h-4 w-px shrink-0 bg-border" />
            <div className="flex min-w-[80px] items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-save-status">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  Saving...
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                  Saved
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle className="h-3 w-3 shrink-0 text-destructive" />
                  Save failed
                  {onRetrySave && (
                    <button
                      type="button"
                      onClick={onRetrySave}
                      className="ml-1 font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                      data-testid="button-retry-activity-save"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}
              {saveStatus === "idle" && (
                <>
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                  {draft.id ? "Saved" : "Draft"}
                </>
              )}
            </div>
          </div>
          {saveStatus === "error" && saveError && (
            <p className="mt-1 text-left text-xs text-destructive sm:text-right" role="alert" data-testid="activity-save-error">
              {saveError}
            </p>
          )}
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          {disablePresent ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border/60 bg-muted px-4 text-sm font-semibold text-muted-foreground opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                  data-testid="button-present-disabled"
                  aria-label={`Present Screen unavailable: ${disabledPresentHint}`}
                >
                  <Monitor className="w-4 h-4" aria-hidden="true" />
                  Present Screen
                </span>
              </TooltipTrigger>
              <TooltipContent>{disabledPresentHint}</TooltipContent>
            </Tooltip>
          ) : (
            <Link href={`/present/${draft.id || ''}`} onClick={onPresent} className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/20 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary/80 hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto" data-testid="button-present">
              <Monitor className="w-4 h-4" />
              Present Screen
            </Link>
          )}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-auto overflow-x-hidden overflow-y-auto p-3 sm:p-6 md:p-10" data-testid="board-editor-content">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="space-y-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 group">
              <EditableText
                value={draft.eyebrow || ""}
                onChange={(val) => onChange({ eyebrow: val })}
                placeholder="EYEBROW (OPTIONAL)"
                className="inline-block min-w-0 max-w-full flex-1 text-xs font-bold tracking-widest text-muted-foreground"
              />
              
              <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <EditableText
                  value={String(draft.durationMinutes)}
                  onChange={(val) => {
                    if (!/^\d+$/.test(val)) {
                      setDurationError("Enter a whole number of minutes.");
                      return;
                    }
                    const num = Number(val);
                    if (!Number.isSafeInteger(num) || num < 1) {
                      setDurationError("Enter a whole number of minutes.");
                      return;
                    }
                    setDurationError(null);
                    onChange({ durationMinutes: num as Duration });
                  }}
                  placeholder="7"
                  className={cn(
                    "font-medium text-foreground min-w-[1ch] text-center inline-block",
                    durationError && "text-destructive",
                  )}
                />
                <span className="font-medium">MIN</span>
              </div>
              {durationError && (
                <p className="basis-full text-right text-xs text-destructive" role="alert" data-testid="duration-error">
                  {durationError}
                </p>
              )}
            </div>

          </div>

          <InlineEditor
            key={`task-${editorIdentity.current.key}`}
            multiline
            value={draft.task}
            runs={draft.contentFormatting?.task}
            onChange={(val, runs) => {
              onChange({
                task: val,
                contentFormatting: {
                  ...draft.contentFormatting, version: 1,
                  task: normalizeFormulaRuns(val, runs),
                },
              });
            }}
            placeholder="Describe the main task for students..."
            className="text-xl md:text-2xl leading-relaxed text-foreground block w-full"
            presentationTheme={draft.presentationTheme}
            aria-label="Describe the main task for students..."
          />
          <FormattedFormulaPreview runs={draft.contentFormatting?.task} theme={draft.presentationTheme}>{draft.task}</FormattedFormulaPreview>

          {draft.prompts.length > 0 && (
            <ul className="space-y-3 list-none p-0 m-0">
              {draft.prompts.map((prompt, idx) => (
                <li key={`${editorIdentity.current.key}-${idx}`} className="group relative flex min-w-0 gap-3 pr-8 text-lg text-foreground sm:pr-0 md:text-xl">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <div className="flex-1 min-w-0">
                    <InlineEditor
                      multiline
                      value={prompt}
                      runs={draft.contentFormatting?.prompts?.[idx]}
                      onChange={(val, runs) => updatePrompt(idx, val, runs)}
                      placeholder="Enter prompt..."
                      className="leading-relaxed block w-full"
                      presentationTheme={draft.presentationTheme}
                      aria-label={`Prompt ${idx + 1}`}
                    />
                    <FormattedFormulaPreview runs={draft.contentFormatting?.prompts?.[idx]} theme={draft.presentationTheme}>{prompt}</FormattedFormulaPreview>
                  </div>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <button
                         type="button"
                         onClick={() => removePrompt(idx)}
                          className="absolute right-0 top-1 rounded-md p-1.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-auto sm:-left-10"
                         aria-label={`Remove prompt ${idx + 1}`}
                       >
                         <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                       </button>
                     </TooltipTrigger>
                     <TooltipContent>Remove this prompt.</TooltipContent>
                   </Tooltip>
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

          <SavedContextSnapshotDetails
            key={draft.id ?? "unsaved"}
            snapshot={draft.savedContextSnapshot}
          />

          <CurriculumSnapshotDetails
            key={(draft.id ?? "unsaved") + "-curriculum"}
            snapshot={draft.curriculumSnapshot}
            classId={draft.classId}
          />

            <section className="presentation-visual-editor-section mt-8 border-t pt-6" data-testid="presentation-visual-section">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    presentationVisualOpen && "bg-muted/70",
                  )}
                  aria-label={
                    presentationVisualOpen
                      ? "Close presentation settings"
                      : "Open presentation settings"
                  }
                  aria-expanded={presentationVisualOpen}
                  aria-controls="presentation-visual-editor"
                  onClick={() => setPresentationVisualOpen((value) => !value)}
                  data-testid="button-toggle-presentation-visual"
                >
                  <Palette className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">Presentation settings</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
                      presentationVisualOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                    data-testid="presentation-settings-chevron"
                  />
                </button>
                 <HelpTooltip label="About presentation settings">
                   Shape how this board appears in Present and PNG export: add up to two local images, choose presentation colors, and add a teacher note. Images are shown without cropping.
                </HelpTooltip>
              </div>
              <div
                id="presentation-visual-editor"
                className={cn(
                  "presentation-visual-editor",
                  presentationVisualOpen && "presentation-visual-editor--open",
                )}
                data-state={presentationVisualOpen ? "open" : "closed"}
                aria-hidden={!presentationVisualOpen}
                inert={!presentationVisualOpen ? true : undefined}
                data-testid="presentation-visual-editor"
              >
                <div
                  className={cn("space-y-6", presentationVisualOpen && "pt-5")}
                  data-testid="presentation-visual-editor-content"
                >
                  <PresentationImageEditor draft={draft} onChange={onChange} />

                  <div className="border-t pt-5">
                    <PresentationThemePicker
                      value={draft.presentationTheme}
                      onChange={(presentationTheme) => onChange({ presentationTheme })}
                    />
                  </div>

                  <div className="border-t pt-5">
                    <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-medium text-foreground">
                        Teacher note
                      </div>
                      {draft.teacherNote == null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto min-h-11 text-sm hover:bg-muted/70 hover:text-foreground focus-visible:ring-offset-2"
                          onClick={() => onChange({ teacherNote: "" })}
                          data-testid="button-add-teacher-note"
                        >
                          Add note
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto min-h-11 text-sm text-muted-foreground hover:bg-muted/70 hover:text-foreground focus-visible:ring-offset-2"
                          onClick={() => onChange({ teacherNote: null })}
                          data-testid="button-remove-teacher-note"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {draft.teacherNote != null && (
                      <div className="space-y-2">
                        <EditableText
                          multiline
                          value={draft.teacherNote}
                          onChange={(val) => onChange({ teacherNote: val || null })}
                          placeholder="Optional note for the teacher..."
                          className="block w-full min-h-20 rounded-lg border border-input bg-muted/50 px-3 py-2.5 mx-0 my-0 text-sm text-foreground hover:bg-muted/70 focus:bg-background focus:ring-offset-2"
                        />
                        <FormulaPreview>{draft.teacherNote}</FormulaPreview>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          
        </div>
      </div>
    </div>
  );
}

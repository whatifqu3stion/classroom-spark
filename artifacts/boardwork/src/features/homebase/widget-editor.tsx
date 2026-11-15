import { useState } from "react";
import { prepareHomebasePhoto } from "./prepare-photo";
import { embedUrl } from "./catalog";
import { InlineEditor } from "@/components/inline-editor";
import { HomebaseWidget } from "@workspace/api-zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function WidgetEditor({
  widget,
  widgets,
  save,
  close,
}: {
  widget: HomebaseWidget | null;
  widgets: HomebaseWidget[];
  save: (widget: HomebaseWidget) => void;
  close: () => void;
}) {
  return (
    <Sheet
      open={!!widget}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent className="hb-sheet">
        <SheetHeader>
          <SheetTitle>Edit tool</SheetTitle>
          <SheetDescription>
            Keep instructions short and easy to read across the room.
          </SheetDescription>
        </SheetHeader>
        {widget ? (
          <EditorForm
            key={widget.id}
            widget={widget}
            widgets={widgets}
            save={save}
            close={close}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
function EditorForm({
  widget,
  widgets,
  save,
  close,
}: {
  widget: HomebaseWidget;
  widgets: HomebaseWidget[];
  save: (widget: HomebaseWidget) => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState(widget);
  const [items, setItems] = useState(widget.items.join("\n"));
  const [error, setError] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const patch = (value: Partial<HomebaseWidget>) =>
    setDraft((current) => ({ ...current, ...value }));
  const hasText = [
    "task",
    "note",
    "link",
    "image",
    "embed",
    "video",
    "pdf",
  ].includes(widget.kind);
  const hasItems = [
    "task",
    "agenda",
    "randomizer",
    "groups",
    "scoreboard",
    "poll",
  ].includes(widget.kind);
  const hasUrl = ["task", "link", "qr", "embed", "video", "pdf"].includes(
    widget.kind,
  );
  const linkOnly = ["pdf", "video", "embed"].includes(widget.kind) && draft.url.startsWith("https://") && !embedUrl(widget.kind, draft.url);
  const names = ["groups", "randomizer"].includes(widget.kind);
  const nameLists = names ? widgets.filter((item) => item.id !== widget.id &&
    ["groups", "randomizer"].includes(item.kind) && item.items.length) : [];
  return (
    <form
      className="hb-edit-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (readingPhoto) return;
        const result = HomebaseWidget.safeParse({
          ...draft,
          items: draft.kind === "agenda" && draft.mode === "timed" ? draft.stages?.map(stage => stage.label.trim()) : hasItems
            ? items
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
            : draft.items,
          values: items === widget.items.join("\n") ? draft.values : [],
        });
        if (!result.success) {
          setError(result.error.issues[0]?.message || "Check these fields.");
          return;
        }
        save(result.data);
        close();
      }}
    >
      <label>
        Title
        <Input
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          maxLength={100}
          required
          autoFocus
        />
      </label>
      {widget.kind === "image" && (
        <div className="hb-photo-picker">
          {draft.photo && <img className="hb-photo-preview" src={draft.photo} alt="Selected photo preview" />}
          <div className="hb-photo-actions">
            <label className="hb-choose-photo">
              {draft.photo ? "Replace photo" : "Choose photo"}
              <input type="file" accept="image/*" className="sr-only" disabled={readingPhoto}
                aria-describedby="hb-photo-help"
                onChange={async event => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (!file) return;
                  setReadingPhoto(true);
                  setPhotoError("");
                  try {
                    const photo = await prepareHomebasePhoto(file);
                    patch({ photo, url: "" });
                  } catch (cause) {
                    setPhotoError(cause instanceof Error ? cause.message : "Choose another photo and try again.");
                  } finally {
                    setReadingPhoto(false);
                  }
                }}
              />
            </label>
            {draft.photo && <Button type="button" variant="ghost" disabled={readingPhoto}
              onClick={() => { patch({ photo: undefined }); setPhotoError(""); }}>Remove photo</Button>}
          </div>
          <p className="hb-small" id="hb-photo-help">Choose a photo up to 20 MB from this device.</p>
          {readingPhoto && <p role="status" className="hb-small">Preparing photo…</p>}
          {photoError && <p role="alert" className="hb-error">{photoError}</p>}
          {!draft.photo && <label>Or paste an image link
            <Input aria-label="Resource link" type="url" placeholder="https://" maxLength={2000}
              disabled={readingPhoto} value={draft.url} onChange={event => patch({ url: event.target.value })} />
          </label>}
        </div>
      )}
      {hasText ? (
        <fieldset className="hb-writing-panel">
          <legend>{widget.kind === "image" ? "Image description" : "Text"}</legend>
          <div className="hb-font-choice">
            <label htmlFor="hb-text-font">Font</label>
            <select id="hb-text-font" value={draft.font || ""} onChange={event => patch({ font: (event.target.value || undefined) as HomebaseWidget["font"] })}>
              <option value="">Tool default</option>
              <option value="sans">Sans serif · Inter</option>
              <option value="serif">Serif · Bitter</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
          <div data-hb-font={draft.font}>
            <InlineEditor multiline toolbar="fixed" aria-label={widget.kind === "image" ? "Image description" : "Text"}
              className="hb-writing-area" value={draft.text} runs={draft.textRuns}
              onChange={(text, runs) => patch({ text, textRuns: runs?.some(run => run.bold || run.underline || run.highlight) ? runs : undefined })} />
          </div>
        </fieldset>
      ) : null}
      {nameLists.length > 0 && !items.trim() && (
        <label>
          Use names already on this board
          <select value="" onChange={(event) => {
            const source = nameLists.find((item) => item.id === event.target.value);
            if (source) setItems(source.items.join("\n"));
          }}>
            <option value="">Choose a name list…</option>
            {nameLists.map((item) => <option key={item.id} value={item.id}>{item.title} ({item.items.length})</option>)}
          </select>
        </label>
      )}
      {widget.kind === "agenda" && <label>Agenda style
        <select value={draft.mode === "timed" ? "timed" : "checklist"} onChange={event => {
          if (event.target.value === "timed") {
            const labels = items.split("\n").map(s => s.trim()).filter(Boolean);
            patch({ mode: "timed", stages: (labels.length ? labels : ["First stage"]).map((label, i) => ({
              label, minutes: draft.stages?.[i]?.minutes || 2,
            })) });
          } else {
            setItems(draft.stages?.map(stage => stage.label).join("\n") || items);
            patch({ mode: "", stages: undefined });
          }
        }}>
          <option value="checklist">Checklist</option><option value="timed">Timed · Now / Next</option>
        </select>
      </label>}
      {widget.kind === "agenda" && draft.mode === "timed" && <fieldset className="hb-stage-editor"><legend>Stages</legend>
        {draft.stages?.map((stage,i,all) => <div className="hb-edit-stage" key={i}>
          <label>Stage {i + 1}<Input required maxLength={200} value={stage.label} onChange={e => patch({stages: all.map((s,j)=>j===i ? {...s,label:e.target.value} : s)})}/></label>
          <label>Minutes<Input aria-label={`Minutes for stage ${i+1}`} type="number" min={1} max={120} required value={stage.minutes || ""} onChange={e=>patch({stages:all.map((s,j)=>j===i ? {...s,minutes:Number(e.target.value)} : s)})}/></label>
          {all.length > 1 && <Button type="button" variant="ghost" size="sm" aria-label={`Remove stage ${i+1}`} onClick={()=>patch({stages:all.filter((_,j)=>j!==i)})}>×</Button>}
        </div>)}
        <Button type="button" variant="outline" disabled={(draft.stages?.length || 0) >= 100} onClick={()=>patch({stages:[...(draft.stages || []),{label:"",minutes:2}]})}>Add stage</Button>
      </fieldset>}
      {hasItems && !(widget.kind === "agenda" && draft.mode === "timed") ? (
        <label>
          {names
            ? "Names, one per line"
            : widget.kind === "scoreboard"
              ? "Teams, one per line"
              : widget.kind === "poll"
                ? "Vote options, one per line"
                : "Steps or prompts, one per line"}
          <Textarea
            rows={7}
            value={items}
            onChange={(e) => setItems(e.target.value)}
            maxLength={15000}
          />
          <span className="hb-small">
            {names
              ? "Use first names or classroom aliases. Lists are saved on this shared installation."
              : "Up to 100 entries."}
          </span>
        </label>
      ) : null}
      {hasUrl ? (
        <label>
          Resource link
          <Input
            aria-label="Resource link"
            type="url"
            value={draft.url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="https://"
            maxLength={2000}
          />
          <span className="hb-small">
            {linkOnly && "This link will open in a new tab. "}
            {widget.kind === "embed"
              ? "Paste a published Google document/sheet link, Google Slides embed URL, or Spotify embed URL. Private account imports aren't connected."
              : widget.kind === "qr"
                ? "Students can scan this HTTPS link from the board."
              : widget.kind === "video"
                ? "Paste a YouTube watch, share, or embed link."
                : widget.kind === "pdf"
                  ? "Use a direct HTTPS link ending in .pdf."
                  : "Use an HTTPS link. Resources load only when you choose."}
          </span>
        </label>
      ) : null}
      {widget.kind === "timer" ? (
        <label>
          Minutes
          <Input
            aria-label="Minutes"
            type="number"
            min="0.05"
            max="1440"
            step="0.05"
            value={draft.minutes}
            onChange={(e) => patch({ minutes: Number(e.target.value) })}
          />
          <span className="hb-small">
            Changing the duration resets this timer.
          </span>
        </label>
      ) : null}
      {widget.kind === "countdown" ? (
        <label>
          Event date
          <Input
            type="date"
            value={draft.target}
            onChange={(e) => patch({ target: e.target.value })}
            required
          />
        </label>
      ) : null}
      {["groups", "dice"].includes(widget.kind) ? (
        <label>
          {widget.kind === "groups" ? "Maximum group size" : "Number of dice"}
          <Input
            type="number"
            min="1"
            max={widget.kind === "dice" ? 6 : 100}
            value={draft.number}
            onChange={(e) => patch({ number: Number(e.target.value) })}
          />
        </label>
      ) : null}
      <label>
        Paper color
        <select
          value={draft.tone}
          onChange={(e) =>
            patch({ tone: e.target.value as HomebaseWidget["tone"] })
          }
        >
          <option value="paper">Paper</option>
          <option value="lavender">Lavender</option>
          <option value="sage">Sage</option>
          <option value="butter">Butter</option>
        </select>
      </label>
      {error ? (
        <p role="alert" className="hb-error">
          {error}
        </p>
      ) : null}
      <div className="hb-edit-actions">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={readingPhoto}>Apply changes</Button>
      </div>
    </form>
  );
}

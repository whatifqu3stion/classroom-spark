import { useState } from "react";
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
  save,
  close,
}: {
  widget: HomebaseWidget | null;
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
  save,
  close,
}: {
  widget: HomebaseWidget;
  save: (widget: HomebaseWidget) => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState(widget);
  const [items, setItems] = useState(widget.items.join("\n"));
  const [error, setError] = useState("");
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
  const hasUrl = ["task", "link", "image", "embed", "video", "pdf"].includes(
    widget.kind,
  );
  const names = ["groups", "randomizer"].includes(widget.kind);
  return (
    <form
      className="hb-edit-form"
      onSubmit={(event) => {
        event.preventDefault();
        const result = HomebaseWidget.safeParse({
          ...draft,
          items: hasItems
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
      {hasText ? (
        <label>
          {widget.kind === "image" ? "Image description" : "Text"}
          <Textarea
            aria-label={widget.kind === "image" ? "Image description" : "Text"}
            rows={5}
            value={draft.text}
            onChange={(e) => patch({ text: e.target.value })}
            maxLength={8000}
          />
        </label>
      ) : null}
      {hasItems ? (
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
            {widget.kind === "embed"
              ? "Paste a published Google document/sheet link, Google Slides embed URL, or Spotify embed URL. Private account imports aren't connected."
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
        <Button type="submit">Apply changes</Button>
      </div>
    </form>
  );
}

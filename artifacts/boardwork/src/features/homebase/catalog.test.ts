import { describe, expect, it } from "vitest";
import {
  HomebaseContent,
  HomebaseWidget,
  HomebaseUrl,
  HOMEBASE_PHOTO_DATA_LIMIT,
} from "@workspace/api-zod";
import {
  activityWidget,
  adaptBoard,
  embedUrl,
  makeWidget,
  template,
  tools,
} from "./catalog";

describe("classroom board content and resources", () => {
  it("creates valid, independently identified tools and non-overlapping starting layouts", () => {
    const ids = tools.map((tool) => makeWidget(tool.kind).id);
    expect(new Set(ids).size).toBe(tools.length);
    for (const name of ["arrival", "focus", "blank"] as const) {
      const content = HomebaseContent.parse(template(name));
      for (const a of content.widgets)
        for (const b of content.widgets) {
          if (a.id === b.id) continue;
          expect(
            a.x + a.w <= b.x ||
              b.x + b.w <= a.x ||
              a.y + a.h <= b.y ||
              b.y + b.h <= a.y,
          ).toBe(true);
        }
    }
  });
  it("keeps the lesson when adapting and resets class-specific lists and results", () => {
    const source = {...template("blank"), widgets:[
      {...makeWidget("randomizer"),items:["Sam"]},
      {...makeWidget("poll"),items:["Flat","Folded"],values:[2,12]},
      {...makeWidget("agenda"),mode:"timed",stages:[{label:"Predict",minutes:2}],values:[1]},
    ]};
    const next = HomebaseContent.parse(adaptBoard(source, "Period two"));
    expect(next.widgets[0].items).toEqual([]);
    expect(next.widgets[1].items).toEqual(["Flat","Folded"]);
    expect(next.widgets[1].values).toEqual([]);
    expect(next.widgets[2].stages).toEqual(source.widgets[2].stages);
    expect(next.widgets[2].id).not.toBe(source.widgets[2].id);
    expect(source.widgets[0].items).toEqual(["Sam"]);
    expect(source.widgets[1].values).toEqual([2,12]);
  });
  it("rejects code URLs, credentials, duplicate IDs, and tools outside the board", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "http://example.com",
      "https://user:password@example.com",
    ])
      expect(HomebaseUrl.safeParse(url).success).toBe(false);
    const widget = makeWidget("note");
    expect(HomebaseWidget.safeParse({ ...widget, x: 11, w: 4 }).success).toBe(
      false,
    );
    expect(
      HomebaseContent.safeParse({
        name: "Test",
        tone: "paper",
        widgets: [widget, widget],
      }).success,
    ).toBe(false);
    expect(
      HomebaseWidget.safeParse({
        ...makeWidget("countdown"),
        target: "2026-02-31",
      }).success,
    ).toBe(false);
  });
  it("keeps device photos scoped to image tools and separate from external links", () => {
    const image = { ...makeWidget("image"), photo: "data:image/jpeg;base64,/9j/2Q==" };
    expect(HomebaseWidget.safeParse(image).success).toBe(true);
    for (const changes of [
      { kind: "note" },
      { url: "https://example.org/photo.jpg" },
      { photo: "data:image/svg+xml;base64,PHN2Zz4=" },
      { photo: image.photo.slice(0, -2) + "A".repeat(HOMEBASE_PHOTO_DATA_LIMIT) },
    ]) {
      expect(HomebaseWidget.safeParse({ ...image, ...changes }).success).toBe(false);
    }
  });
  it("validates formatting against the saved text and limits QR data by encoded size", () => {
    const note = { ...makeWidget("note"), text: "Read this" };
    expect(HomebaseWidget.safeParse({ ...note, textRuns: [{ text: note.text, bold: true }] }).success).toBe(true);
    for (const textRuns of [[null], [{ text: "stale" }], [{ text: note.text, bold: "yes" }]]) {
      expect(HomebaseWidget.safeParse({ ...note, textRuns }).success).toBe(false);
    }
    expect(HomebaseWidget.safeParse({ ...makeWidget("qr"), url: "https://example.org/" + "語".repeat(700) }).success).toBe(false);
  });
  it("limits embedding to supported provider paths and uses the privacy-enhanced video player", () => {
    expect(embedUrl("video", "https://youtu.be/abcdefghijk")).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk",
    );
    expect(
      embedUrl(
        "embed",
        "https://docs.google.com/spreadsheets/d/e/abc-123/pubhtml",
      ),
    ).toBeTruthy();
    for (const url of [
      "https://docs.google.com.evil.example/document/d/abc/pub",
      "https://docs.google.com/document/d/abc/edit",
      "https://example.com/embed",
      "https://open.spotify.com/playlist/abc",
    ])
      expect(embedUrl("embed", url)).toBeNull();
    expect(
      embedUrl("pdf", "https://school.example/resource.pdf?version=2"),
    ).toBeTruthy();
    expect(embedUrl("pdf", "https://school.example/login")).toBeNull();
  });
  it("copies student task content without leaking teacher notes or altering the activity", () => {
    const source = {
      classId: "class",
      title: "Observe",
      task: "Draw two patterns.",
      prompts: ["Label a difference."],
      durationMinutes: 7,
      deviceMode: "off" as const,
      teacherNote: "Private expected response",
    };
    const widget = activityWidget(source, []);
    expect(widget.text).toBe(source.task);
    expect(widget.items).toEqual(source.prompts);
    expect(JSON.stringify(widget)).not.toContain(source.teacherNote);
    widget.text = "Changed";
    expect(source.task).toBe("Draw two patterns.");
  });
});

import { describe, expect, it } from "vitest";
import {
  HomebaseContent,
  HomebaseWidget,
  HomebaseUrl,
} from "@workspace/api-zod";
import {
  activityWidget,
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

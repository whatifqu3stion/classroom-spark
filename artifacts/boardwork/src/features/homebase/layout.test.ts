import { describe, expect, it } from "vitest";
import { template } from "./catalog";
import { arrangeWidgets } from "./layout";

describe("making room for a moved tool", () => {
  it("keeps the timer at the requested position and moves the clock clear of its controls", () => {
    const { widgets } = template("arrival");
    const timer = widgets.find((widget) => widget.kind === "timer")!;
    const result = arrangeWidgets(widgets, timer.id, { y: 2, h: 5 })!;
    expect(result.find((widget) => widget.id === timer.id)).toMatchObject({
      y: 2,
      h: 5,
    });
    expect(result.find((widget) => widget.kind === "clock")!.y).toBe(7);
    expect(result.find((widget) => widget.kind === "note")!.y).toBe(0);
    expect(widgets.find((widget) => widget.kind === "clock")!.y).toBe(4);
  });
});

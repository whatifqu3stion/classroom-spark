import { describe, expect, it } from "vitest";
import { template } from "./catalog";
import { arrangeWidgets, moveInReadingOrder } from "./layout";

describe("making room for a moved tool", () => {
  it("keeps a full row and its neighboring tools intact after a phone reorder", () => {
    const [a, b, c] = template("arrival").widgets;
    const ordered = [{ ...a, x: 0, w: 5 }, { ...b, x: 5, w: 4 }, { ...c, x: 9, y: 0, w: 3 }];
    const moved = moveInReadingOrder(ordered, 1, -1)!;
    expect(moved.map(({ id, x, y, w }) => [id, x, y, w])).toEqual([
      [b.id, 0, 0, 4], [a.id, 4, 0, 5], [c.id, 9, 0, 3],
    ]);
  });
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

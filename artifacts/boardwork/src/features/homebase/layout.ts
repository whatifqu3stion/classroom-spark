import type { HomebaseWidget } from "@workspace/api-zod";
function overlaps(a: HomebaseWidget, b: HomebaseWidget) {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}
/** Keep the moved tool where it was placed, and make room below it. */
export function arrangeWidgets(
  widgets: HomebaseWidget[],
  id: string,
  patch: Partial<HomebaseWidget>,
): HomebaseWidget[] | null {
  const moving = widgets.find((widget) => widget.id === id);
  if (!moving) return widgets;
  const placed = [{ ...moving, ...patch }];
  for (const original of widgets
    .filter((widget) => widget.id !== id)
    .toSorted((a, b) => a.y - b.y || a.x - b.x)) {
    const next = { ...original };
    let collision = placed.find((widget) => overlaps(widget, next));
    while (collision) {
      next.y = collision.y + collision.h;
      collision = placed.find((widget) => overlaps(widget, next));
    }
    if (next.y > 200) return null;
    placed.push(next);
  }
  const positions = new Map(placed.map((widget) => [widget.id, widget]));
  return widgets.map((widget) => positions.get(widget.id)!);
}

import type { HomebaseWidget } from "@workspace/api-zod";
function overlaps(a: HomebaseWidget, b: HomebaseWidget) {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}
/** Exchange reading-order slots, retaining every tool's size and unaffected placements. */
export function moveInReadingOrder(ordered: HomebaseWidget[], index: number, direction: -1 | 1) {
  const neighbor = index + direction;
  if (!ordered[index] || !ordered[neighbor]) return ordered;
  const result: HomebaseWidget[] = [];
  for (const [i, slot] of ordered.entries()) {
    const widget = ordered[i === index ? neighbor : i === neighbor ? index : i];
    const previous = result.at(-1);
    let x = Math.min(slot.x, 12 - widget.w);
    if (i === Math.max(index, neighbor) && previous && slot.y === ordered[i - 1].y) {
      const oldGap = slot.x - (ordered[i - 1].x + ordered[i - 1].w);
      x = Math.min(12 - widget.w, previous.x + previous.w + oldGap);
    }
    const y = previous ? Math.max(slot.y, previous.y + Number(x <= previous.x)) : slot.y;
    const next = { ...widget, x, y };
    // Move down only when the exchanged tools no longer fit their original slots.
    while (result.some((placed) => overlaps(next, placed))) next.y++;
    if (next.y > 200) return null;
    result.push(next);
  }
  return result;
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

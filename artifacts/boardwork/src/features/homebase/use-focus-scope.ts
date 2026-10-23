import { useEffect, type RefObject } from "react";

/** A projected board keeps its live tools mounted while the covered workspace is inert. */
export function useFocusScope(
  root: RefObject<HTMLDivElement | null>,
  active: boolean,
  focusedId: string | null,
) {
  useEffect(() => {
    const scope = root.current;
    if (!scope || !active) return;
    const shellHeader = scope
      .closest(".workspace-shell")
      ?.querySelector<HTMLElement>(".workspace-header");
    const covered = Array.from(scope.parentElement?.children || []).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== scope,
    );
    if (shellHeader) covered.push(shellHeader);
    const originals = covered.map((element) => ({
      element,
      inert: element.inert,
    }));
    originals.forEach(({ element }) => {
      element.inert = true;
    });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function controls() {
      return Array.from(
        scope!.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.matches(":disabled") &&
          !element.closest("[inert]") &&
          element.getClientRects().length > 0,
      );
    }
    function enter() {
      const target = focusedId
        ? scope!.querySelector<HTMLElement>(".hb-widget-focused button")
        : scope!.querySelector<HTMLElement>(".hb-presentation-controls button");
      (target || controls()[0] || scope)!.focus();
    }
    const frame = requestAnimationFrame(enter);
    function keydown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const elements = controls();
      if (!elements.length) {
        event.preventDefault();
        scope!.focus();
        return;
      }
      const index = elements.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey
        ? index <= 0
          ? elements.length - 1
          : index - 1
        : index < 0 || index === elements.length - 1
          ? 0
          : index + 1;
      event.preventDefault();
      elements[next].focus();
    }
    function focusin(event: FocusEvent) {
      if (event.target instanceof Node && !scope!.contains(event.target))
        enter();
    }
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin);
    return () => {
      cancelAnimationFrame(frame);
      originals.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin);
    };
  }, [root, active, focusedId]);
}

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  choosePresentationTextFit,
  getPresentationTextFitMetrics,
  presentationTextFitConstants,
  usePresentationTextFit,
} from "./use-presentation-text-fit";

describe("presentation text fit", () => {
  it("measures distinct CSS-variable candidates on an intrinsic, disposable probe", () => {
    vi.useFakeTimers();
    const surface = document.createElement("div");
    surface.className = "presentation-surface";
    surface.innerHTML = '<main class="presentation-main"><div class="presentation-content">A readable board</div></main><footer class="presentation-footer" style="min-height:60px"></footer>';
    document.body.append(surface);
    const main = surface.querySelector<HTMLElement>("main")!;
    const content = surface.querySelector<HTMLDivElement>(".presentation-content")!;
    const sizes = new Set<number>();
    const dimensions = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const isContent = this.classList.contains("presentation-content");
        const probe = this.closest<HTMLElement>('[aria-hidden="true"]');
        const taskSize = Number.parseFloat(probe?.style.getPropertyValue("--presentation-text-fit-task-size") ?? "");
        if (isContent && probe && Number.isFinite(taskSize)) sizes.add(taskSize);
        return DOMRect.fromRect({
          x: 0, y: this.classList.contains("presentation-main") ? 40 : 0,
          width: isContent ? 620 : 1280,
          height: isContent && probe ? 80 + (taskSize || 0) * 8 : 720,
        });
      });
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal("innerHeight", 720);
    const hook = renderHook(() => usePresentationTextFit({
      surfaceRef: { current: surface },
      mainRef: { current: main },
      contentRef: { current: content },
      exportLayout: false, editorPreview: false,
      hasAuthoredStudentContent: true,
      contentVersion: "unchanged", hasRightRail: false,
    }));
    try {
      act(() => vi.advanceTimersByTime(100));
      expect(sizes.size).toBeGreaterThan(2);
      expect(hook.result.current.active).toBe(true);
      expect(hook.result.current.scale).toBeGreaterThan(1);
      expect(hook.result.current.taskSize).toBeLessThan(62);
      expect(document.querySelectorAll('.presentation-surface[aria-hidden="true"]')).toHaveLength(0);
    } finally {
      hook.unmount();
      dimensions.mockRestore();
      surface.remove();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("keeps a projector-readable baseline and caps type by pane width", () => {
    const narrowBaseline = getPresentationTextFitMetrics(280, 1);
    const narrowMaximum = getPresentationTextFitMetrics(280, 4);

    expect(narrowBaseline.taskSize).toBeGreaterThanOrEqual(24);
    expect(narrowBaseline.promptSize).toBeGreaterThanOrEqual(24);
    expect(narrowMaximum.taskSize).toBeLessThanOrEqual(30);
    expect(narrowMaximum.promptSize).toBeLessThanOrEqual(28);
  });

  it("grows continuously into unused vertical room", () => {
    const result = choosePresentationTextFit({
      paneWidth: 620,
      viewportWidth: 1280,
      viewportHeight: 720,
      usableHeight: 560,
      measure: ({ taskSize, promptSize, contentGap, promptGap }) =>
        taskSize * 2 + promptSize * 3 + contentGap + promptGap,
    });

    expect(result.active).toBe(true);
    expect(result.scale).toBeGreaterThan(1);
    expect(result.scale * 50).toBe(Math.round(result.scale * 50));
    expect(result.taskSize).toBeGreaterThanOrEqual(24);
    expect(result.promptSize).toBeGreaterThanOrEqual(24);
    expect(result.roomState).not.toBe("constrained");
  });

  it("keeps the readable baseline when long content exceeds the budget", () => {
    const result = choosePresentationTextFit({
      paneWidth: 620,
      viewportWidth: 1024,
      viewportHeight: 768,
      usableHeight: 220,
      measure: () => 500,
    });

    expect(result.active).toBe(true);
    expect(result.scale).toBe(1);
    expect(result.taskSize).toBeGreaterThanOrEqual(
      presentationTextFitConstants.minTaskSize,
    );
    expect(result.promptSize).toBeGreaterThanOrEqual(
      presentationTextFitConstants.minPromptSize,
    );
  });

  it("does not activate below the landscape projector viewport", () => {
    const measure = () => 1;
    expect(
      choosePresentationTextFit({
        paneWidth: 620,
        viewportWidth: 699,
        viewportHeight: 768,
        usableHeight: 560,
        measure,
      }).active,
    ).toBe(false);
    expect(
      choosePresentationTextFit({
        paneWidth: 620,
        viewportWidth: 700,
        viewportHeight: 499,
        usableHeight: 560,
        measure,
      }).active,
    ).toBe(false);
    expect(
      choosePresentationTextFit({
        paneWidth: 620,
        viewportWidth: 700,
        viewportHeight: 800,
        usableHeight: 560,
        measure,
      }).active,
    ).toBe(false);
  });
});
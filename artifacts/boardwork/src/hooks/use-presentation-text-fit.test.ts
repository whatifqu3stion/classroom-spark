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
    let probes = 0;
    let markedProbes = 0;
    const dimensions = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const isContent = this.classList.contains("presentation-content");
        const probe = this.closest<HTMLElement>('[aria-hidden="true"]');
        const taskSize = Number.parseFloat(probe?.style.getPropertyValue("--presentation-text-fit-task-size") ?? "");
        if (isContent && probe && Number.isFinite(taskSize)) {
          sizes.add(taskSize);
          probes++;
          if (this.querySelector("mark strong")) markedProbes++;
        }
        return DOMRect.fromRect({
          x: 0, y: this.classList.contains("presentation-main") ? 40 : 0,
          width: isContent ? 620 : 1280,
          height: isContent && probe ? 80 + (taskSize || 0) * 8 : 720,
        });
      });
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal("innerHeight", 720);
    const refs = {
      surfaceRef: { current: surface },
      mainRef: { current: main },
      contentRef: { current: content },
    };
    const hook = renderHook(({ contentVersion }) => usePresentationTextFit({
      ...refs,
      exportLayout: false, editorPreview: false,
      hasAuthoredStudentContent: true,
      contentVersion, hasRightRail: false,
    }), { initialProps: { contentVersion: "plain" } });
    try {
      act(() => vi.advanceTimersByTime(100));
      expect(sizes.size).toBeGreaterThan(2);
      expect(hook.result.current.active).toBe(true);
      expect(hook.result.current.scale).toBeGreaterThan(1);
      expect(80 + hook.result.current.taskSize * 8).toBeLessThanOrEqual(620 * 0.96);
      expect(hook.result.current.taskSize).toBeLessThan(77.5);
      expect(document.querySelectorAll('.presentation-surface[aria-hidden="true"]')).toHaveLength(0);
      const plainProbes = probes;
      hook.rerender({ contentVersion: "plain" });
      act(() => vi.advanceTimersByTime(100));
      expect(probes).toBe(plainProbes);
      content.innerHTML = "<mark><strong>A readable board</strong></mark>";
      hook.rerender({ contentVersion: "bold-highlight" });
      act(() => vi.advanceTimersByTime(100));
      expect(probes).toBeGreaterThan(plainProbes);
      expect(markedProbes).toBeGreaterThan(0);
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
    expect(narrowMaximum.taskSize).toBeLessThanOrEqual(35);
    expect(narrowMaximum.promptSize).toBeLessThanOrEqual(28);
  });

  it("keeps live hierarchy spacing inside the measured balance budget", () => {
    const baseline = getPresentationTextFitMetrics(620, 1);
    const maximum = getPresentationTextFitMetrics(620, 4);

    expect(baseline.contentGap).toBeGreaterThanOrEqual(24);
    expect(baseline.contentGap).toBeLessThanOrEqual(40);
    expect(baseline.promptPadding).toBeGreaterThanOrEqual(12);
    expect(baseline.promptPadding).toBeLessThanOrEqual(22);
    expect(maximum.contentGap).toBeLessThanOrEqual(44);
    expect(maximum.promptPadding).toBeLessThanOrEqual(24);
    expect(maximum.contentGap).toBe(baseline.contentGap);
    expect(maximum.promptPadding).toBe(baseline.promptPadding);
    expect(maximum.promptGap).toBe(baseline.promptGap);
  });

  it("spends capacity on type before bounded residual whitespace", () => {
    const candidates: ReturnType<typeof getPresentationTextFitMetrics>[] = [];
    const height = (metrics: ReturnType<typeof getPresentationTextFitMetrics>) =>
      metrics.taskSize * 2 + metrics.promptSize * 4 +
      metrics.contentGap + metrics.promptGap * 2 + metrics.promptPadding;
    const result = choosePresentationTextFit({
      paneWidth: 700, viewportWidth: 1280, viewportHeight: 720, usableHeight: 550,
      measure: (metrics) => { candidates.push(metrics); return height(metrics); },
    });
    expect(height(result)).toBeLessThanOrEqual(550 - 22);
    expect(result.promptSize).toBeGreaterThan(55);
    const baseline = getPresentationTextFitMetrics(700, 1);
    const firstSpacingGrowth = candidates.findIndex((candidate) =>
      candidate.contentGap > baseline.contentGap);
    expect(firstSpacingGrowth).toBeGreaterThanOrEqual(2);
    expect(candidates.slice(0, firstSpacingGrowth).every((candidate) =>
      candidate.promptGap === baseline.promptGap)).toBe(true);
    expect(result.contentGap).toBeLessThanOrEqual(36);
    expect(result.promptGap).toBeLessThanOrEqual(28);
    expect(result.promptPadding).toBeLessThanOrEqual(20);
    expect(candidates.length).toBeLessThanOrEqual(14);
  });

  it("does not let the task cap prevent prompt growth", () => {
    const result = choosePresentationTextFit({
      paneWidth: 1200, viewportWidth: 1920, viewportHeight: 1080,
      usableHeight: 850, measure: ({ taskSize, promptSize }) => taskSize + promptSize,
    });
    expect(result.taskSize).toBe(86);
    expect(result.promptSize).toBe(72);
    expect(result.contentGap).toBe(36);
    expect(result.promptGap).toBe(28);
  });

  it("measures marked/wrapped content rather than using character density", () => {
    const fit = (richLineCount: number) => choosePresentationTextFit({
      paneWidth: 640, viewportWidth: 1280, viewportHeight: 720,
      usableHeight: 500,
      measure: ({ taskSize, promptSize, contentGap, promptGap, promptPadding }) =>
        taskSize * 2.56 + promptSize * richLineCount * 1.35 +
        contentGap + promptGap * 2 + promptPadding,
    });
    expect(fit(6).promptSize).toBeLessThan(fit(3).promptSize);
    expect(fit(6).promptSize).toBeGreaterThanOrEqual(24);
    expect(fit(6)).toEqual(fit(6));
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

  it("keeps editor preview and fixed export layouts outside live text fitting", () => {
    const surface = document.createElement("div");
    const main = document.createElement("main");
    const content = document.createElement("div");
    surface.append(main);
    main.append(content);
    document.body.append(surface);
    const dimensions = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(() => DOMRect.fromRect({ width: 1280, height: 720 }));

    const baseOptions = {
      surfaceRef: { current: surface },
      mainRef: { current: main },
      contentRef: { current: content },
      hasAuthoredStudentContent: true,
      contentVersion: "unchanged",
      hasRightRail: true,
    };
    const { result, rerender } = renderHook(
      ({ exportLayout, editorPreview }) =>
        usePresentationTextFit({
          ...baseOptions,
          exportLayout,
          editorPreview,
        }),
      {
        initialProps: { exportLayout: false, editorPreview: true },
      },
    );

    try {
      expect(result.current.active).toBe(false);
      expect(result.current.scale).toBe(1);
      expect(result.current.roomState).toBe("constrained");
      expect(dimensions).not.toHaveBeenCalled();

      rerender({ exportLayout: true, editorPreview: false });

      expect(result.current.active).toBe(false);
      expect(result.current.scale).toBe(1);
      expect(result.current.roomState).toBe("constrained");
      expect(dimensions).not.toHaveBeenCalled();
    } finally {
      dimensions.mockRestore();
      surface.remove();
    }
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
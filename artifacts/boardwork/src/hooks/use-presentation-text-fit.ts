import { useLayoutEffect, useRef, useState } from "react";

export type PresentationTextFitRoomState =
  | "constrained"
  | "comfortable"
  | "roomy";

export type PresentationTextFitMetrics = {
  taskSize: number;
  promptSize: number;
  contentGap: number;
  promptGap: number;
  promptPadding: number;
};

export type PresentationTextFitResult = PresentationTextFitMetrics & {
  active: boolean;
  scale: number;
  roomState: PresentationTextFitRoomState;
};

export type PresentationTextFitMeasurement = {
  paneWidth: number;
  viewportWidth: number;
  viewportHeight: number;
  usableHeight: number;
  measure: (metrics: PresentationTextFitMetrics) => number;
};

const MIN_DESKTOP_WIDTH = 700;
const MIN_DESKTOP_HEIGHT = 500;
const MIN_TASK_SIZE = 24;
const MIN_PROMPT_SIZE = 24;
const MAX_TASK_SIZE = 86;
const MAX_PROMPT_SIZE = 72;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const VERTICAL_RESERVE = 0.04;
const FIT_ITERATIONS = 7;
const SCALE_QUANTUM = 0.02;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const finiteOr = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

const quantizeScale = (scale: number) =>
  Math.round(scale / SCALE_QUANTUM) * SCALE_QUANTUM;

/**
 * Grow type, not gaps. Broad width guardrails avoid huge words in a manually
 * narrowed pane; actual rich-text wrapping decides the fit inside those limits.
 * Task and prompt caps are independent, with a modest task-first hierarchy.
 */
export function getPresentationTextFitMetrics(
  paneWidth: number,
  scale: number,
): PresentationTextFitMetrics {
  const width = Math.max(0, finiteOr(paneWidth, 0));
  const safeScale = Math.max(MIN_SCALE, finiteOr(scale, MIN_SCALE));
  const taskBase = clamp(width * 0.05, MIN_TASK_SIZE, 44);
  const promptBase = clamp(width * 0.042, MIN_PROMPT_SIZE, 36);
  const taskWidthCeiling = clamp(width / 8, 30, MAX_TASK_SIZE);
  const promptWidthCeiling = clamp(width / 10, 28, MAX_PROMPT_SIZE);

  return {
    taskSize: Math.min(taskWidthCeiling, taskBase * safeScale, MAX_TASK_SIZE),
    promptSize: Math.min(
      promptWidthCeiling,
      promptBase * safeScale,
      MAX_PROMPT_SIZE,
    ),
    contentGap: clamp(width * 0.035, 24, 32),
    promptGap: clamp(width * 0.025, 14, 22),
    promptPadding: clamp(width * 0.02, 12, 18),
  };
}

export function isPresentationTextFitViewport(
  viewportWidth: number,
  viewportHeight: number,
) {
  return (
    viewportWidth >= MIN_DESKTOP_WIDTH &&
    viewportHeight >= MIN_DESKTOP_HEIGHT &&
    viewportWidth >= viewportHeight
  );
}

const roomStateForScale = (
  scale: number,
): PresentationTextFitRoomState => {
  if (scale < 1.08) return "constrained";
  if (scale < 1.38) return "comfortable";
  return "roomy";
};

const inactiveResult = (): PresentationTextFitResult => ({
  active: false,
  scale: 1,
  roomState: "constrained",
  ...getPresentationTextFitMetrics(0, 1),
});

/**
 * Choose the largest readable candidate using a fixed number of measurements.
 * `usableHeight` is supplied by the caller from viewport/layout reserves; it
 * must not be derived from the candidate's live content height.
 */
export function choosePresentationTextFit(
  input: PresentationTextFitMeasurement,
): PresentationTextFitResult {
  const {
    paneWidth,
    viewportWidth,
    viewportHeight,
    usableHeight,
    measure,
  } = input;

  if (
    !isPresentationTextFitViewport(viewportWidth, viewportHeight) ||
    paneWidth < MIN_TASK_SIZE ||
    usableHeight <= 0
  ) {
    return inactiveResult();
  }

  const taskBase = getPresentationTextFitMetrics(paneWidth, 1);
  const maximum = getPresentationTextFitMetrics(paneWidth, MAX_SCALE);
  // One reaching its cap must not prevent the other from continuing to grow.
  const maxScale = Math.min(MAX_SCALE, Math.max(
    maximum.taskSize / taskBase.taskSize,
    maximum.promptSize / taskBase.promptSize,
  ));
  // Layout already charges outer padding, header, footer baseline and main
  // padding. Keep a small, bounded additional breathing room, not another 18%.
  const targetHeight = Math.max(0, usableHeight - clamp(usableHeight * VERTICAL_RESERVE, 12, 28));
  const fits = (metrics: PresentationTextFitMetrics) => {
    const height = measure(metrics);
    return Number.isFinite(height) && height <= targetHeight;
  };

  // Growth-only: if the authored stack is already longer than the minimum
  // budget, retain the readable baseline and let the surface flow/scroll.
  if (!fits(taskBase)) {
    return {
      active: true,
      scale: MIN_SCALE,
      roomState: roomStateForScale(MIN_SCALE),
      ...taskBase,
    };
  }

  let lower = MIN_SCALE;
  let upper = maxScale;
  let best = MIN_SCALE;

  if (fits(maximum)) {
    best = maxScale;
  } else for (let step = 0; step < FIT_ITERATIONS; step += 1) {
    const candidate = quantizeScale((lower + upper) / 2);
    if (candidate <= lower || candidate >= upper) {
      break;
    }

    if (fits(getPresentationTextFitMetrics(paneWidth, candidate))) {
      best = candidate;
      lower = candidate;
    } else {
      upper = candidate;
    }
  }

  const scale = clamp(
    Math.floor((Math.max(MIN_SCALE, best) + 1e-9) / SCALE_QUANTUM) * SCALE_QUANTUM,
    MIN_SCALE,
    maxScale,
  );
  const typeMetrics = getPresentationTextFitMetrics(paneWidth, scale);
  // Only spend room left AFTER type fitting on whitespace, and never stretch
  // rows to fill the board. Re-measure because marker spacing affects wrapping.
  const withSpacing = (amount: number): PresentationTextFitMetrics => ({
    ...typeMetrics,
    contentGap: typeMetrics.contentGap + (36 - typeMetrics.contentGap) * amount,
    promptGap: typeMetrics.promptGap + (28 - typeMetrics.promptGap) * amount,
    promptPadding: typeMetrics.promptPadding + (20 - typeMetrics.promptPadding) * amount,
  });
  let spacing = 0;
  let spacingUpper = 1;
  if (fits(withSpacing(1))) spacing = 1;
  else for (let step = 0; step < 4; step += 1) {
    const candidate = (spacing + spacingUpper) / 2;
    if (fits(withSpacing(candidate))) spacing = candidate;
    else spacingUpper = candidate;
  }
  return {
    active: true,
    scale,
    roomState: roomStateForScale(scale),
    ...withSpacing(spacing),
  };
}

type PresentationTextFitRefs = {
  surfaceRef: { current: HTMLDivElement | null };
  mainRef: { current: HTMLElement | null };
  contentRef: { current: HTMLDivElement | null };
};

type UsePresentationTextFitOptions = PresentationTextFitRefs & {
  exportLayout: boolean;
  editorPreview: boolean;
  hasAuthoredStudentContent: boolean;
  contentVersion: string;
  hasRightRail: boolean;
};

const parsePixels = (value: string | undefined) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const boxVerticalPadding = (styles: CSSStyleDeclaration) =>
  parsePixels(styles.paddingTop) + parsePixels(styles.paddingBottom);

/**
 * Derive the vertical budget from fixed/layout regions only. In particular,
 * never use the live student stack height: doing so would create positive
 * feedback as type grows. Footer content above its min-height is normalized
 * away so materials and resource notes cannot change student type.
 */
function getUsablePresentationHeight(
  surface: HTMLDivElement,
  main: HTMLElement,
): number {
  const viewportHeight = window.innerHeight;
  const surfaceStyles = window.getComputedStyle(surface);
  const mainStyles = window.getComputedStyle(main);
  const footer = surface.querySelector<HTMLElement>(".presentation-footer");
  const footerStyles = footer ? window.getComputedStyle(footer) : null;
  const surfaceBounds = surface.getBoundingClientRect();
  const mainBounds = main.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const viewportBottom = visualViewport
    ? visualViewport.offsetTop + visualViewport.height
    : viewportHeight;
  const surfaceHeight = Math.min(
    Math.max(0, viewportHeight),
    Math.max(0, viewportBottom - surfaceBounds.top),
    Math.max(0, surfaceBounds.height || viewportHeight),
  );
  const footerBaseline = footerStyles
    ? parsePixels(footerStyles.minHeight)
    : 0;
  // Use a surface-relative main offset rather than a document coordinate.
  // This remains stable when a long board is scrolled and a later font/load
  // event asks for another bounded fit.
  const mainOffset = Math.max(0, mainBounds.top - surfaceBounds.top);

  // The live footer's minimum height includes its safe-area padding. Its
  // content-only excess is deliberately not charged to this budget.
  const reserved = [
    mainOffset,
    boxVerticalPadding(mainStyles),
    footerBaseline,
    parsePixels(surfaceStyles.paddingBottom),
  ].reduce((total, value) => total + value, 0);

  return Math.max(0, surfaceHeight - reserved);
}

const requestFrame = (callback: FrameRequestCallback) => {
  if (typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(() => callback(performance.now()), 0);
};

const cancelFrame = (frame: number) => {
  if (typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(frame);
  } else {
    window.clearTimeout(frame);
  }
};

export function usePresentationTextFit(
  options: UsePresentationTextFitOptions,
): PresentationTextFitResult {
  const {
    surfaceRef,
    mainRef,
    contentRef,
    exportLayout,
    editorPreview,
    hasAuthoredStudentContent,
    contentVersion,
    hasRightRail,
  } = options;
  const [result, setResult] =
    useState<PresentationTextFitResult>(inactiveResult);
  const previousGeometry = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const main = mainRef.current;
    const content = contentRef.current;
    if (
      !surface ||
      !main ||
      !content ||
      exportLayout ||
      editorPreview ||
      !hasAuthoredStudentContent
    ) {
      previousGeometry.current = undefined;
      setResult((current) => {
        if (!current.active && current.scale === 1) return current;
        return inactiveResult();
      });
      return;
    }

    let frame = 0;
    let pendingForce = false;
    let disposed = false;
    previousGeometry.current = undefined;

    const getGeometryKey = () => {
      const arrival = surface.querySelector<HTMLElement>(".presentation-arrival");
      const header = surface.querySelector<HTMLElement>(".presentation-header");
      const surfaceBounds = surface.getBoundingClientRect();
      const mainBounds = main.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();
      return [
        window.innerWidth,
        window.innerHeight,
        window.visualViewport?.height ?? 0,
        window.visualViewport?.offsetTop ?? 0,
        surfaceBounds.width,
        mainBounds.width,
        contentBounds.width,
        arrival?.getBoundingClientRect().height ?? 0,
        header?.getBoundingClientRect().height ?? 0,
      ].join("|");
    };

    const measure = (force = false) => {
      if (disposed) return;
      const geometryKey = getGeometryKey();
      if (!force && geometryKey === previousGeometry.current) return;
      previousGeometry.current = geometryKey;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (!isPresentationTextFitViewport(viewportWidth, viewportHeight)) {
        setResult((current) =>
          current.active || current.scale !== 1
            ? inactiveResult()
            : current,
        );
        return;
      }

      const paneWidth = content.getBoundingClientRect().width;
      const usableHeight = getUsablePresentationHeight(surface, main);
      const surfaceBounds = surface.getBoundingClientRect();
      if (paneWidth <= 0 || surfaceBounds.width <= 0) {
        setResult((current) =>
          current.active || current.scale !== 1
            ? inactiveResult()
            : current,
        );
        return;
      }

      // Preserve query-container widths, but not the rail's height or controls.
      // A fresh intrinsic stack per candidate ensures query-container styles
      // resolve together, even when offscreen subtree invalidation is deferred.
      const measureCandidate = (metrics: PresentationTextFitMetrics) => {
      const measurementSurface = surface.cloneNode(false) as HTMLDivElement;
      const measurementMain = main.cloneNode(false) as HTMLElement;
      const measurementContent = content.cloneNode(true) as HTMLDivElement;
      measurementSurface.dataset.textFitActive = "true";
      measurementSurface.setAttribute("aria-hidden", "true");
      measurementSurface.inert = true;
      measurementSurface.removeAttribute("data-testid");
      Object.assign(measurementSurface.style, {
        position: "fixed",
        left: "-100000px",
        top: "0",
        display: "block",
        width: `${surfaceBounds.width}px`,
        height: "auto",
        minHeight: "0",
        maxHeight: "none",
        visibility: "hidden",
        pointerEvents: "none",
        overflow: "visible",
      });
      measurementMain.style.paddingBlock = "0";
      measurementContent.style.alignSelf = "start";
      measurementMain.append(measurementContent);
      measurementSurface.append(measurementMain);
      measurementSurface.querySelectorAll("[id], [data-testid]").forEach((node) => {
        node.removeAttribute("id");
        node.removeAttribute("data-testid");
      });
      const measurementTask = measurementContent.querySelector<HTMLElement>(".presentation-task");
      const measurementPrompts = measurementContent.querySelector<HTMLElement>(".presentation-prompts");
      const measurementRows = measurementContent.querySelectorAll<HTMLElement>(".presentation-prompt");
        const variables = {
          "--presentation-text-fit-task-size": `${metrics.taskSize}px`,
          "--presentation-text-fit-prompt-size": `${metrics.promptSize}px`,
          "--presentation-text-fit-content-gap": `${metrics.contentGap}px`,
          "--presentation-text-fit-prompt-gap": `${metrics.promptGap}px`,
          "--presentation-text-fit-prompt-padding": `${metrics.promptPadding}px`,
        };
        for (const [name, value] of Object.entries(variables)) {
          measurementSurface.style.setProperty(name, value);
        }
        // Inline probe dimensions avoid deferred inherited-variable invalidation
        // beneath query containers between synchronous candidate measurements.
        measurementContent.style.gap = `${metrics.contentGap}px`;
        if (measurementTask) measurementTask.style.fontSize = `${metrics.taskSize}px`;
        if (measurementPrompts) {
          measurementPrompts.style.gap = `${metrics.promptGap}px`;
          measurementPrompts.style.paddingTop = `${metrics.promptPadding}px`;
        }
        measurementRows.forEach((row) => {
          row.style.fontSize = `${metrics.promptSize}px`;
          row.style.gap = `${Math.min(22, metrics.promptGap)}px`;
        });
        document.body.append(measurementSurface);
        try {
          return measurementContent.scrollWidth <= measurementContent.clientWidth + 1
            ? measurementContent.getBoundingClientRect().height
            : Number.POSITIVE_INFINITY;
        } finally {
          measurementSurface.remove();
        }
      };

      const next = choosePresentationTextFit({
          paneWidth,
          viewportWidth,
          viewportHeight,
          usableHeight,
          measure: measureCandidate,
      });
      setResult((current) =>
        current.scale === next.scale &&
        current.active === next.active &&
        current.taskSize === next.taskSize &&
        current.promptSize === next.promptSize &&
        current.contentGap === next.contentGap &&
        current.promptGap === next.promptGap &&
        current.promptPadding === next.promptPadding
          ? current
          : next,
      );
    };

    const schedule = (force = false) => {
      if (disposed) return;
      pendingForce ||= force;
      cancelFrame(frame);
      frame = requestFrame(() => {
        const forceFit = pendingForce;
        pendingForce = false;
        measure(forceFit);
      });
    };

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => schedule())
        : null;
    observer?.observe(surface);
    observer?.observe(main);
    observer?.observe(content);
    const arrival = surface.querySelector<HTMLElement>(".presentation-arrival");
    const header = surface.querySelector<HTMLElement>(".presentation-header");
    if (arrival) observer?.observe(arrival);
    if (header) observer?.observe(header);

    const fontSet = document.fonts;
    const onFontReady = () => schedule(true);
    fontSet?.addEventListener("loadingdone", onFontReady);
    fontSet?.addEventListener("loadingerror", onFontReady);
    window.addEventListener("load", onFontReady);
    window.addEventListener("resize", onFontReady);
    document.addEventListener("fullscreenchange", onFontReady);
    window.visualViewport?.addEventListener("resize", onFontReady);
    if (fontSet?.ready) {
      void fontSet.ready.then(onFontReady).catch(onFontReady);
    } else {
      schedule(true);
    }

    return () => {
      disposed = true;
      cancelFrame(frame);
      observer?.disconnect();
      fontSet?.removeEventListener("loadingdone", onFontReady);
      fontSet?.removeEventListener("loadingerror", onFontReady);
      window.removeEventListener("load", onFontReady);
      window.removeEventListener("resize", onFontReady);
      document.removeEventListener("fullscreenchange", onFontReady);
      window.visualViewport?.removeEventListener("resize", onFontReady);
    };
  }, [
    contentRef,
    contentVersion,
    editorPreview,
    exportLayout,
    hasAuthoredStudentContent,
    hasRightRail,
    mainRef,
    surfaceRef,
  ]);

  return result;
}

export const presentationTextFitConstants = {
  minDesktopWidth: MIN_DESKTOP_WIDTH,
  minDesktopHeight: MIN_DESKTOP_HEIGHT,
  minTaskSize: MIN_TASK_SIZE,
  minPromptSize: MIN_PROMPT_SIZE,
  maxTaskSize: MAX_TASK_SIZE,
  maxPromptSize: MAX_PROMPT_SIZE,
  verticalReserve: VERTICAL_RESERVE,
  fitIterations: FIT_ITERATIONS,
};
import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { installReadingCapacityFixture } from "../test/fixtures/reading-capacity-fixture";

const viewports = [
  { width: 1024, height: 525 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
  { width: 800, height: 600 },
  { width: 390, height: 844 },
] as const;
const themes = ["charcoal-v2", "paper-v2"] as const;
const beforeTaskSizes = new Map([
  ["timer-1024x525", 29.59],
  ["timer-1280x720", 40.4976],
  ["timer-1920x1080", 57.6],
  ["visual-timer-1024x525", 29.59],
  ["visual-timer-1280x720", 40.4976],
  ["visual-timer-1920x1080", 57.6],
]);

async function settle(page: Page) {
  await expect(page.getByTestId("presentation-surface")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolveImage) => {
            image.addEventListener("load", () => resolveImage(), { once: true });
            image.addEventListener("error", () => resolveImage(), { once: true });
          }),
    ));
    await new Promise<void>((resolveFrame) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())),
    );
  });
}

async function readGeometry(page: Page) {
  return page.getByTestId("presentation-surface").evaluate((surface) => {
    const read = (selector: string) => {
      const element = surface.matches(selector)
        ? surface as HTMLElement
        : surface.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        right: bounds.right,
        bottom: bounds.bottom,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        maxWidth: styles.maxWidth,
        gap: styles.gap,
        columnGap: styles.columnGap,
        padding: styles.padding,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      textFitScale: surface.dataset.textFitScale,
      roomState: surface.dataset.roomState,
      surface: read(".presentation-surface"),
      main: read(".presentation-main"),
      content: read(".presentation-content"),
      task: read(".presentation-task"),
      prompts: read(".presentation-prompts"),
      firstPrompt: read(".presentation-prompt"),
      rail: read(".presentation-rail"),
      visual: read(".presentation-visual img"),
      timer: read(".presentation-timer"),
      divider: read(".presentation-layout-divider"),
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
    };
  });
}

// Keep independent fixtures running even if a single browser/viewport fails.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = { probes: 0, unsafeProbes: 0 };
    Object.assign(window, { __readingCapacitySafety: state });
    const appendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function <T extends Node>(child: T): T {
      const result = appendChild.call(this, child) as T;
      if (child instanceof HTMLElement &&
          child.matches('.presentation-surface[aria-hidden="true"]')) {
        // Inspect synchronously: the fitter removes probes before observers run.
        state.probes += 1;
        const style = getComputedStyle(child);
        const bounds = child.getBoundingClientRect();
        if (style.visibility !== "hidden" || !child.inert ||
            bounds.right > 0 || child.querySelector("[data-testid], [id]")) {
          state.unsafeProbes += 1;
        }
      }
      return result;
    };
  });
});

test.afterEach(async ({ page }) => {
  const safety = await page.evaluate(() => (window as typeof window & {
    __readingCapacitySafety: { probes: number; unsafeProbes: number };
  }).__readingCapacitySafety);
  expect(safety.unsafeProbes, "candidate probes stay hidden, inert, and offscreen").toBe(0);
  await expect(page.locator('.presentation-surface[aria-hidden="true"]')).toHaveCount(0);
});

for (const theme of themes) {
  for (const withVisual of [false, true]) {
    const mode = withVisual ? "visual-timer" : "timer";
    for (const viewport of viewports) {
      test(`Design Critique after ${theme} ${mode} ${viewport.width}x${viewport.height}`, async ({
        page,
      }, testInfo) => {
       const evidenceDir = resolve("evidence/reading-capacity/after", testInfo.project.name);
      await mkdir(evidenceDir, { recursive: true });
      const { activityId } = await installReadingCapacityFixture(page, withVisual, theme);
      await page.setViewportSize(viewport);
      await page.goto(`/present/${activityId}`);
      await settle(page);

      const liveSurface = page.getByTestId("presentation-surface");
      await expect(liveSurface.locator(".presentation-task strong")).toHaveText("Choose");
      await expect(liveSurface.locator(".presentation-prompt mark")).toHaveText("does");
      await expect(liveSurface.locator(".presentation-prompt u")).toHaveText("frustration");
      const geometry = await readGeometry(page);
      expect(geometry.document.scrollWidth).toBeLessThanOrEqual(viewport.width);
       const overflow = await liveSurface.locator(
         ".presentation-task, .presentation-prompts, .presentation-prompt",
       ).evaluateAll((elements) => elements.some((element) =>
         element.scrollWidth > element.clientWidth + 1 ||
         element.scrollHeight > element.clientHeight + 1,
       ));
       expect(overflow, "authored marked text must not clip").toBe(false);
      if (viewport.width >= 1280) {
        expect(geometry.document.scrollHeight).toBeLessThanOrEqual(viewport.height);
        expect(geometry.content!.bottom).toBeLessThan(viewport.height - 24);
      }
      expect(geometry.task!.fontFamily).toContain("Inter");
      if (viewport.width >= 700 && viewport.width >= viewport.height) {
        expect(Number.parseFloat(geometry.task!.fontSize)).toBeGreaterThanOrEqual(24);
        expect(Number.parseFloat(geometry.firstPrompt!.fontSize)).toBeGreaterThanOrEqual(24);
        const surfaceGutter = geometry.main!.x - geometry.surface!.x;
        expect(surfaceGutter).toBeGreaterThanOrEqual(23);
        expect(surfaceGutter).toBeLessThanOrEqual(65);
        expect(Number.parseFloat(geometry.main!.columnGap)).toBeGreaterThanOrEqual(23);
        expect(Number.parseFloat(geometry.main!.columnGap)).toBeLessThanOrEqual(49);
        expect(geometry.content!.maxWidth).toBe("none");
        if (viewport.width >= 1024) {
          const trackRatio =
            geometry.content!.width /
            (geometry.content!.width + geometry.rail!.width);
          expect(trackRatio).toBeCloseTo(withVisual ? 0.64 : 0.72, 1);
        }
        const beforeSize = beforeTaskSizes.get(
          `${mode}-${viewport.width}x${viewport.height}`,
        );
        if (theme === "charcoal-v2" && beforeSize) {
          expect(Number.parseFloat(geometry.task!.fontSize)).toBeGreaterThan(
            beforeSize,
          );
          const before = JSON.parse(await readFile(resolve(
            "evidence/reading-capacity/before",
            `${mode}-${viewport.width}x${viewport.height}.json`,
          ), "utf8"));
          expect(Number.parseFloat(geometry.firstPrompt!.fontSize)).toBeGreaterThan(
            Number.parseFloat(before.firstPrompt.fontSize),
          );
        }
      }
      if (geometry.rail) expect(geometry.rail.width).toBeGreaterThanOrEqual(239);
      const stem = `${theme}-${mode}-${viewport.width}x${viewport.height}`;
      if (
        theme === "charcoal-v2" &&
        (
          (viewport.width === 1024 && viewport.height === 525) ||
          viewport.width === 1280 ||
          viewport.width === 1920
        )
      ) {
        await page.screenshot({ path: resolve(evidenceDir, `${stem}.png`) });
      }
      await writeFile(
        resolve(evidenceDir, `${stem}.json`),
        `${JSON.stringify(geometry, null, 2)}\n`,
      );
    });
  }
  }
}

test("converges bounded probes across split, mode, font, and fullscreen changes", async ({
  page,
}) => {
  const { activityId } = await installReadingCapacityFixture(page, true);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/present/${activityId}`);
  await settle(page);
  await page.evaluate(() => {
    const state = { count: 0 };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.matches('.presentation-surface[aria-hidden="true"]')
          ) {
            state.count += 1;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true });
    Object.assign(window, {
      __readingCapacityProbeState: state,
      __readingCapacityProbeObserver: observer,
    });
  });
  const probeCount = () => page.evaluate(
    () => (window as typeof window & {
      __readingCapacityProbeState: { count: number };
    }).__readingCapacityProbeState.count,
  );
  const resetProbes = () => page.evaluate(() => {
    (window as typeof window & {
      __readingCapacityProbeState: { count: number };
    }).__readingCapacityProbeState.count = 0;
  });
  const expectBoundedAndQuiet = async (maximum = 20, minimum = 1) => {
    await page.waitForTimeout(250);
    const count = await probeCount();
    expect(count).toBeGreaterThanOrEqual(minimum);
    expect(count).toBeLessThanOrEqual(maximum);
    await page.waitForTimeout(350);
    expect(await probeCount()).toBe(count);
  };

  await page.waitForTimeout(500);
  expect(await probeCount()).toBe(0);
  const runningTimer = page.getByTestId("presentation-surface").locator(".presentation-timer");
  await runningTimer.hover();
  await runningTimer.getByRole("button", { name: "Start or resume timer" }).click();
  await expect(runningTimer.locator(".presentation-timer-reading")).not.toHaveText("5:00");
  await page.waitForTimeout(1100);
  expect(await probeCount()).toBe(0);
  await runningTimer.getByRole("button", { name: "Pause timer" }).click();

  const divider = page.getByTestId("presentation-layout-divider");
  await divider.press("Home");
  await divider.press("ArrowLeft");
  await expect(divider).toHaveAttribute("aria-valuenow", "60");
  await expectBoundedAndQuiet();
  const preferredSplit = await divider.getAttribute("aria-valuenow");

  await resetProbes();
  await page.setViewportSize({ width: 800, height: 600 });
  await settle(page);
  await expectBoundedAndQuiet(40);
  await resetProbes();
  await page.setViewportSize({ width: 1280, height: 720 });
  await settle(page);
  await expect(divider).toHaveAttribute("aria-valuenow", preferredSplit!);
  await expectBoundedAndQuiet(40);

  await resetProbes();
  await page.getByTestId("button-teacher-controls").click();
  // Opening the dock, removing the large timer and opening compact controls
  // are separate layout transitions, not one measurement pass. Assert each
  // settles independently rather than adding their budgets across actions.
  await expectBoundedAndQuiet(40, 0);
  await resetProbes();
  const timer = page.getByTestId("presentation-surface").locator(".presentation-timer");
  await timer.hover();
  await timer.getByRole("button", { name: "Adjust" }).click();
  await timer.getByRole("button", { name: "Hide timer from students" }).click();
  const liveSurface = page.getByTestId("presentation-surface");
  await expect(liveSurface.locator(".presentation-rail--image-only")).toBeVisible();
  await expect(page.getByTestId("button-show-timer")).toBeVisible();
  await expectBoundedAndQuiet(40);
  await resetProbes();
  await page.getByTestId("button-show-timer").click();
  await expect(liveSurface.locator(".presentation-rail--image-only")).toBeVisible();
  await expect(page.getByTestId("button-toggle-timer-controls")).toBeVisible();
  await expectBoundedAndQuiet(40, 0);

  await resetProbes();
  await page.evaluate(() => document.fonts.dispatchEvent(new Event("loadingdone")));
  await expectBoundedAndQuiet();

  await resetProbes();
  await page.getByTestId("button-fullscreen").click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);
  // Firefox emits fullscreen and viewport resize in separate frames. Like a
  // normal resize, allow two bounded fits and still require complete quiet.
  await expectBoundedAndQuiet(40);
  await resetProbes();
  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(false);
  await expectBoundedAndQuiet(40);
  await expect(page.locator(
    '.presentation-surface[aria-hidden="true"]',
  )).toHaveCount(0);
});

test("fixed editor-preview and PNG-export baseline geometry", async ({ page }, testInfo) => {
  const evidenceDir = resolve("evidence/reading-capacity/after", testInfo.project.name);
  await mkdir(evidenceDir, { recursive: true });
  const { activityId, activity } = await installReadingCapacityFixture(page, true);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.evaluate(async (fixtureActivity) => {
    const reactPath = "/node_modules/.vite/deps/react.js";
    const reactDomPath = "/node_modules/.vite/deps/react-dom_client.js";
    const canvasPath = "/src/components/presentation-canvas.tsx";
    const React = (await import(reactPath)).default;
    const ReactDom = (await import(reactDomPath)).default;
    const { PresentationCanvas } = await import(canvasPath);
    const host = document.createElement("div");
    host.id = "reading-capacity-editor-preview-host";
    host.style.cssText = "position:fixed;inset:0;width:1280px;height:720px;background:white;z-index:99999";
    const frame = document.createElement("div");
    frame.className = "presentation-preview-frame";
    frame.style.cssText = "width:960px;height:540px;margin:40px";
    host.append(frame);
    document.body.append(host);
    ReactDom.createRoot(frame).render(
      React.createElement(PresentationCanvas, {
        activity: fixtureActivity,
        editorPreview: true,
      }),
    );
  }, activity);
  const editorPreview = page.getByTestId("presentation-preview-surface");
  await expect(editorPreview).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const editorGeometry = await editorPreview.evaluate((surface) => {
    const task = surface.querySelector<HTMLElement>(".presentation-task")!;
    const content = surface.querySelector<HTMLElement>(".presentation-content")!;
    return {
      surface: surface.getBoundingClientRect().toJSON(),
      content: content.getBoundingClientRect().toJSON(),
      task: task.getBoundingClientRect().toJSON(),
      taskFontSize: getComputedStyle(task).fontSize,
      textFitActive: surface.dataset.textFitActive,
      textFitScale: surface.dataset.textFitScale,
    };
  });
  await editorPreview.screenshot({
    path: resolve(evidenceDir, "editor-preview-1280x720.png"),
  });

  await page.goto(`/present/${activityId}`);
  await settle(page);
  const exportSurface = page.locator(".presentation-surface--export");
  await expect(exportSurface).toHaveCount(1);
  const exportGeometry = await exportSurface.evaluate((surface) => {
    const task = surface.querySelector<HTMLElement>(".presentation-task")!;
    const content = surface.querySelector<HTMLElement>(".presentation-content")!;
    return {
      surface: surface.getBoundingClientRect().toJSON(),
      content: content.getBoundingClientRect().toJSON(),
      task: task.getBoundingClientRect().toJSON(),
      taskFontSize: getComputedStyle(task).fontSize,
      textFitActive: surface.dataset.textFitActive,
      textFitScale: surface.dataset.textFitScale,
    };
  });
  const fixedBaseline = JSON.parse(await readFile(
    resolve("evidence/reading-capacity/before/fixed-layouts-1280x720.json"),
    "utf8",
  ));
  const actual = { editorPreview: editorGeometry, export: exportGeometry };
  for (const name of ["editorPreview", "export"] as const) {
    const measured = actual[name];
    const baseline = fixedBaseline[name];
    // The historical Inter baseline still owns fixed frame geometry and size,
    // not intrinsic line boxes: Bitter/Open Sans intentionally change wrapping.
    expect(measured.surface).toEqual(baseline.surface);
    expect(measured.taskFontSize).toBe(baseline.taskFontSize);
    expect(measured.textFitActive).toBe("false");
    expect(measured.textFitScale).toBe("1");
    expect(measured.task.left).toBeGreaterThanOrEqual(measured.content.left - 0.1);
    expect(measured.task.right).toBeLessThanOrEqual(measured.content.right + 0.1);
    expect(measured.task.top).toBeGreaterThanOrEqual(measured.content.top - 0.1);
    expect(measured.task.bottom).toBeLessThanOrEqual(measured.content.bottom + 0.1);
    expect(measured.content.bottom).toBeLessThanOrEqual(measured.surface.bottom + 0.1);
  }
  await writeFile(
    resolve(evidenceDir, "fixed-layouts-1280x720.json"),
    `${JSON.stringify(actual, null, 2)}\n`,
  );
});
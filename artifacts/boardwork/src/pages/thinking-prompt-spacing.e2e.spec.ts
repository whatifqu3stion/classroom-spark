import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  installThinkingPromptSpacingFixture,
} from "../test/fixtures/thinking-prompt-spacing-fixture";

type MountOptions = {
  marked?: boolean;
  noPrompts?: boolean;
  wrapped?: boolean;
  preview?: boolean;
  exportLayout?: boolean;
};

async function settleLayout(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve()))),
  ));
}

async function mountThinkingPrompt(page: Page, options: MountOptions = {}) {
  const { activity } = await installThinkingPromptSpacingFixture(page, {
    marked: options.marked,
    noPrompts: options.noPrompts,
    wrapped: options.wrapped,
    visual: true,
  });
  await page.goto("/app");
  await page.evaluate(async ({ activity, options }) => {
    const reactPath = "/node_modules/.vite/deps/react.js";
    const domPath = "/node_modules/.vite/deps/react-dom_client.js";
    const canvasPath = "/src/components/presentation-canvas.tsx";
    const React = (await import(reactPath)).default;
    const { createRoot } = (await import(domPath)).default;
    const { PresentationCanvas } = await import(canvasPath);
    const host = document.createElement("div");
    host.id = "thinking-prompt-spacing-fixture";
    host.style.cssText =
      "position:absolute;inset:0;z-index:99999;background:#232323";
    const frame = document.createElement("div");
    if (options.preview) {
      frame.className = "presentation-preview-frame";
      frame.style.cssText = "width:960px;height:540px;margin:24px";
    }
    host.append(frame);
    document.body.append(host);
    createRoot(frame).render(React.createElement(PresentationCanvas, {
      activity,
      editorPreview: options.preview,
      exportLayout: options.exportLayout,
      timer: { visible: true, remainingSeconds: 300, status: "idle" },
    }));
  }, { activity, options });
  const surface = page.locator(
    "#thinking-prompt-spacing-fixture .presentation-surface",
  );
  await expect(surface).toBeVisible();
  await page.evaluate(async () => {
    const fontsPath = "/src/lib/presentation-fonts.ts";
    const { waitForPresentationFonts } = await import(fontsPath);
    await waitForPresentationFonts();
  });
  await settleLayout(page);
  return surface;
}

type PromptGeometry = {
  paddingTop: number;
  rowGap: number;
  listTop: number;
  listBottom: number;
  rowRects: Array<{ top: number; bottom: number; left: number; right: number }>;
  markerRects: Array<{ top: number; left: number; right: number }>;
  textRects: Array<{ top: number; left: number; right: number }>;
  promptWeight: string;
  promptLeading: number;
  taskWeight: string;
  taskLeading: number;
  promptFontSize: number;
  fit: string | undefined;
  clipped: boolean;
  overflowDetails: Array<{ name: string; width: number; clientWidth: number; height: number; clientHeight: number }>;
  surfaceBottom: number;
  markClearance: number | null;
};

async function getPromptGeometry(surface: Locator): Promise<PromptGeometry> {
  return surface.evaluate((element) => {
    const list = element.querySelector<HTMLElement>(".presentation-prompts")!;
    const task = element.querySelector<HTMLElement>(".presentation-task")!;
    const rows = [...element.querySelectorAll<HTMLElement>(".presentation-prompt")];
    const markers = rows.map((row) =>
      row.querySelector<HTMLElement>(".presentation-prompt-marker")!);
    const texts = rows.map((row) =>
      row.querySelector<HTMLElement>(".boardwork-user-content")!);
    const rect = (node: HTMLElement) => {
      const box = node.getBoundingClientRect();
      return {
        top: box.top,
        bottom: box.bottom,
        left: box.left,
        right: box.right,
      };
    };
    const listRect = list.getBoundingClientRect();
    const promptStyle = getComputedStyle(rows[0]);
    const taskStyle = getComputedStyle(task);
    const listStyle = getComputedStyle(list);
    const checked = [task, list, ...rows, ...markers, ...texts];
    // The enlarged bullet's font box extends a few pixels beyond its line box
    // with visible overflow. That is not clipped text; check prose height and
    // every horizontal bound, then check the group against its surface below.
    const prose = [task, ...texts];
    const isClipped = (node: HTMLElement) =>
      node.scrollWidth > node.clientWidth + 1 ||
      (prose.includes(node) && node.scrollHeight > node.clientHeight + 1);
    const overflowDetails = checked.filter(isClipped).map((node) => ({
        name: node.className, width: node.scrollWidth, clientWidth: node.clientWidth,
        height: node.scrollHeight, clientHeight: node.clientHeight,
      }));
    const mark = list.querySelector("mark");
    return {
      paddingTop: parseFloat(listStyle.paddingTop),
      rowGap: parseFloat(listStyle.rowGap),
      listTop: listRect.top,
      listBottom: listRect.bottom,
      rowRects: rows.map(rect),
      markerRects: markers.map(rect),
      textRects: texts.map(rect),
      promptWeight: promptStyle.fontWeight,
      promptLeading:
        parseFloat(promptStyle.lineHeight) / parseFloat(promptStyle.fontSize),
      taskWeight: taskStyle.fontWeight,
      taskLeading:
        parseFloat(taskStyle.lineHeight) / parseFloat(taskStyle.fontSize),
      promptFontSize: parseFloat(promptStyle.fontSize),
      fit: (element as HTMLElement).dataset.textFitActive,
      overflowDetails,
      surfaceBottom: element.getBoundingClientRect().bottom,
      markClearance: mark ? mark.getBoundingClientRect().top - listRect.top : null,
      clipped: checked.some(isClipped),
    };
  });
}

function assertPromptGeometry(geometry: PromptGeometry) {
  expect(geometry.paddingTop).toBeGreaterThanOrEqual(geometry.rowGap * 1.5);
  expect(geometry.rowRects[0].top - geometry.listTop)
    .toBeGreaterThanOrEqual(geometry.paddingTop - 1);
  expect(geometry.markerRects[0].top).toBeGreaterThan(geometry.listTop);
  expect(geometry.promptWeight).toBe("500");
  expect(geometry.taskWeight).toBe("600");
  expect(geometry.promptLeading).toBeCloseTo(1.35, 2);
  expect(geometry.taskLeading).toBeCloseTo(1.18, 2);
  expect(geometry.clipped, JSON.stringify(geometry.overflowDetails)).toBe(false);
  expect(geometry.listBottom).toBeLessThanOrEqual(geometry.surfaceBottom);
  if (geometry.markClearance !== null) {
    expect(geometry.markClearance).toBeGreaterThan(geometry.rowGap);
  }
  for (const [index, text] of geometry.textRects.entries()) {
    expect(Math.abs(text.left - geometry.textRects[0].left)).toBeLessThan(1);
    expect(Math.abs(text.top - geometry.markerRects[index].top))
      .toBeLessThanOrEqual(geometry.promptFontSize * 0.2);
    expect(geometry.rowRects[index].bottom)
      .toBeLessThanOrEqual(geometry.listBottom + 1);
    if (index > 0) {
      expect(geometry.rowRects[index].top - geometry.rowRects[index - 1].bottom)
        .toBeCloseTo(geometry.rowGap, 1);
    }
  }
}

test("thinking prompt spacing stays distinct and aligned across live classroom sizes", async ({
  page,
}, testInfo) => {
  const cases = [
    { width: 1280, height: 720, marked: true },
    { width: 1920, height: 1080, marked: false },
    { width: 1640, height: 1020, marked: true },
    { width: 390, height: 844, marked: false, wrapped: true },
  ];
  for (const sample of cases) {
    await page.setViewportSize(sample);
    const surface = await mountThinkingPrompt(page, sample);
    const before = await getPromptGeometry(surface);
    assertPromptGeometry(before);
    await expect(surface.locator(".presentation-timer-reading")).toHaveText("5:00");
    await expect(surface.locator(".presentation-eyebrow"))
      .toHaveText("Observe & Notice");
    await expect(surface.locator(".presentation-visual img")).toBeVisible();
    await expect(surface.locator(".boardwork-inline-bold"))
      .toHaveCount(sample.marked ? 1 : 0);
    await expect(surface.locator(".boardwork-inline-highlight"))
      .toHaveCount(sample.marked ? 2 : 0);
    if (sample.marked) {
      await expect(
        surface.locator(".presentation-task .boardwork-inline-highlight"),
      ).toHaveText("object");
      await expect(
        surface.locator(".presentation-prompt .boardwork-inline-highlight"),
      ).toHaveText("do you");
      await expect(
        surface.locator(".presentation-prompt .boardwork-inline-bold"),
      ).toHaveText("What");
    }
    await settleLayout(page);
    const after = await getPromptGeometry(surface);
    expect(after.paddingTop).toBeCloseTo(before.paddingTop, 4);
    expect(after.rowGap).toBeCloseTo(before.rowGap, 4);
    expect(after.promptFontSize).toBeCloseTo(before.promptFontSize, 4);
    expect(after.fit).toBe(before.fit);
    expect(before.promptFontSize).toBeGreaterThanOrEqual(sample.width >= 700 ? 24 : 20);
    expect(before.fit).toBe(sample.width >= 700 ? "true" : "false");
    expect(await surface.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
      .toBe(true);
    await surface.screenshot({ path: testInfo.outputPath(`live-${sample.width}.png`) });
    await writeFile(testInfo.outputPath(`live-${sample.width}.json`), JSON.stringify(after, null, 2));
  }
});

test("an activity without thinking prompts keeps a stable unclipped content fit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const surface = await mountThinkingPrompt(page, { noPrompts: true });
  await expect(surface.locator(".presentation-prompts")).toHaveCount(0);
  const before = await surface.evaluate((element) => {
    const task = element.querySelector<HTMLElement>(".presentation-task")!;
    const style = getComputedStyle(task);
    return {
      fit: (element as HTMLElement).dataset.textFitActive,
      fontSize: style.fontSize,
      clipped: task.scrollWidth > task.clientWidth + 1 ||
        task.scrollHeight > task.clientHeight + 1,
    };
  });
  expect(before.clipped).toBe(false);
  await settleLayout(page);
  expect(await surface.evaluate((element) => ({
    fit: (element as HTMLElement).dataset.textFitActive,
    fontSize: getComputedStyle(
      element.querySelector<HTMLElement>(".presentation-task")!,
    ).fontSize,
  }))).toEqual({ fit: before.fit, fontSize: before.fontSize });
});

test("preview and fixed PNG export preserve deliberate prompt spacing", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const preview = await mountThinkingPrompt(page, {
    marked: true,
    preview: true,
    wrapped: true,
  });
  await expect(preview).toHaveClass(/presentation-surface--editor-preview/);
  assertPromptGeometry(await getPromptGeometry(preview));
  await expect(preview).toHaveAttribute("data-text-fit-active", "false");
  await preview.screenshot({ path: testInfo.outputPath("editor-preview.png") });

  await page.setViewportSize({ width: 1920, height: 1080 });
  const exported = await mountThinkingPrompt(page, {
    exportLayout: true,
    marked: true,
    wrapped: true,
  });
  await expect(exported).toHaveClass(/presentation-surface--export/);
  const exportGeometry = await getPromptGeometry(exported);
  assertPromptGeometry(exportGeometry);
  expect(exportGeometry.paddingTop).toBe(32);
  expect(exportGeometry.rowGap).toBe(14);
  const dataUrl = await page.evaluate(async () => {
    const imagePath = "/node_modules/.vite/deps/html-to-image.js";
    const fontsPath = "/src/lib/presentation-fonts.ts";
    const { toPng } = await import(imagePath);
    const {
      getPresentationExportOptions,
      waitForPresentationFonts,
    } = await import(fontsPath);
    await waitForPresentationFonts();
    return toPng(
      document.querySelector(
        "#thinking-prompt-spacing-fixture .presentation-surface",
      ),
      getPresentationExportOptions("#232323"),
    );
  });
  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  expect(bytes.readUInt32BE(16)).toBe(1920);
  expect(bytes.readUInt32BE(20)).toBe(1080);
  await writeFile(testInfo.outputPath("thinking-prompt-spacing.png"), bytes);
});
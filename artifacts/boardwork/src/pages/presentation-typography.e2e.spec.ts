import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { installReadingCapacityFixture } from "../test/fixtures/reading-capacity-fixture";

// Isolated, synthetic API data only: these checks never read the protected
// teacher's boards or credentials.
async function mount(page: Page, options: {
  visual: boolean;
  timer?: boolean;
  preview?: boolean;
  export?: boolean;
  task?: string;
}) {
  const { activity } = await installReadingCapacityFixture(page, options.visual);
  await page.goto("/app");
  await expect(page.getByTestId("presentation-preview-surface")).toHaveCount(0);
  const shellFamily = await page.locator("body").evaluate((body) => getComputedStyle(body).fontFamily);
  expect(shellFamily).toContain("Inter");
  await page.evaluate(async ({ activity, options }) => {
    const reactPath = "/node_modules/.vite/deps/react.js";
    const domPath = "/node_modules/.vite/deps/react-dom_client.js";
    const canvasPath = "/src/components/presentation-canvas.tsx";
    const React = (await import(reactPath)).default;
    const { createRoot } = (await import(domPath)).default;
    const { PresentationCanvas } = await import(canvasPath);
    const host = document.createElement("div");
    host.id = "typography-fixture";
    host.style.cssText = "position:absolute;inset:0;z-index:99999;background:#232323";
    const frame = document.createElement("div");
    if (options.preview) {
      frame.className = "presentation-preview-frame";
      frame.style.cssText = "width:960px;height:540px;margin:24px";
    }
    host.append(frame);
    document.body.append(host);
    createRoot(frame).render(React.createElement(PresentationCanvas, {
      activity: options.task ? { ...activity, task: options.task, contentFormatting: undefined } : activity,
      editorPreview: options.preview,
      exportLayout: options.export,
      timer: options.timer ? { visible: true, remainingSeconds: 300, status: "idle" } : undefined,
    }));
  }, { activity, options });
  const surface = page.locator("#typography-fixture .presentation-surface");
  await expect(surface).toBeVisible();
  await page.evaluate(async () => {
    const fontPath = "/src/lib/presentation-fonts.ts";
    await (await import(fontPath)).waitForPresentationFonts();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  return surface;
}

async function assertRenderedFamily(page: Page, selector: string, family: string) {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    const { root } = await client.send("DOM.getDocument");
    // CDP reports fonts for the node's text, not arbitrarily deep wrappers.
    const { nodeId } = await client.send("DOM.querySelector", {
      nodeId: root.nodeId, selector: `${selector} .formula-text`,
    });
    const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
    // Variable faces expose their default-instance name (e.g. Bitter Thin)
    // through CDP even when CSS selects a semibold axis value.
    expect(fonts.some((font) => font.isCustomFont && font.glyphCount > 0 &&
      (font.familyName === family || font.familyName.startsWith(`${family} `))),
      `Rendered fonts for ${selector}: ${JSON.stringify(fonts)}`).toBe(true);
  } finally {
    await client.detach();
  }
}

test("real Bitter and Open Sans glyphs retain tight leading across classroom layouts", async ({ page }, testInfo) => {
  const cases = [
    { width: 1920, height: 1080, visual: true, timer: true },
    { width: 1920, height: 1080, visual: false },
    { width: 1366, height: 768, visual: true, timer: true },
    { width: 1366, height: 768, visual: false, task: "Observe carefully." },
    { width: 390, height: 844, visual: true, timer: true },
    {
      width: 1366, height: 768, visual: false,
      task: "Compare these explanations carefully. Explain how each observation supports your conclusion. " +
        "À bientôt — naïve, façade, gyp. שלום עולם. مرحبا بالعالم.\n" +
        "Use $x^2 + y^2 = z^2$ and $\\frac{1}{2}$ in your explanation.\n" +
        "Explain which evidence is most convincing, and why. ".repeat(8),
    },
  ];
  for (const [index, sample] of cases.entries()) {
    await page.setViewportSize(sample);
    const surface = await mount(page, sample);
    const task = surface.locator(".presentation-task");
    await expect(task).toHaveCSS("font-weight", "600");
    await expect(surface.locator(".presentation-prompt").first()).toHaveCSS("font-weight", "500");
    await expect(surface.locator(".presentation-eyebrow")).toHaveCSS("font-weight", "700");
    const geometry = await surface.evaluate((surface) => {
      const task = surface.querySelector<HTMLElement>(".presentation-task")!;
      const prompt = surface.querySelector<HTMLElement>(".presentation-prompt")!;
      const t = getComputedStyle(task);
      const p = getComputedStyle(prompt);
      return {
        taskSize: parseFloat(t.fontSize),
        taskLeading: parseFloat(t.lineHeight) / parseFloat(t.fontSize),
        promptLeading: parseFloat(p.lineHeight) / parseFloat(p.fontSize),
        overflow: [task, prompt].some((element) => element.scrollWidth > element.clientWidth + 1),
        fit: (surface as HTMLElement).dataset.textFitActive,
      };
    });
    expect(geometry.taskLeading).toBeCloseTo(1.18, 2);
    expect(geometry.promptLeading).toBeCloseTo(1.35, 2);
    expect(geometry.overflow).toBe(false);
    if (sample.width >= 700) expect(geometry.taskSize).toBeGreaterThanOrEqual(24);
    await assertRenderedFamily(page, "#typography-fixture .presentation-task", "Bitter");
    await assertRenderedFamily(page, "#typography-fixture .presentation-prompt", "Open Sans");
    if (!sample.task) {
      await expect(task.locator(".boardwork-inline-bold")).toHaveCSS("font-weight", "700");
      await expect(surface.locator(".boardwork-inline-highlight")).toHaveCount(1);
      await expect(surface.locator(".boardwork-inline-underline")).toHaveCount(1);
    }
    const sizeBefore = await task.evaluate((element) => getComputedStyle(element).fontSize);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve()))));
    expect(await task.evaluate((element) => getComputedStyle(element).fontSize)).toBe(sizeBefore);
    if (index === 0 || index === 4 || index === 5) {
      await page.screenshot({ path: testInfo.outputPath(`layout-${sample.width}-${index}.png`), fullPage: true });
    }
  }
});

test("preview and actual PNG embed the same pairing and instruction leading", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  for (const variant of ["preview", "export"] as const) {
    const surface = await mount(page, { visual: true, [variant]: true });
    await expect(surface).toHaveAttribute("data-text-fit-active", "false");
    expect(await surface.locator(".presentation-task").evaluate((element) => {
      const style = getComputedStyle(element);
      return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
    })).toBeCloseTo(1.18, 2);
    await assertRenderedFamily(page, "#typography-fixture .presentation-task", "Bitter");
    await assertRenderedFamily(page, "#typography-fixture .presentation-prompt", "Open Sans");
    if (variant === "preview") {
      await surface.screenshot({ path: testInfo.outputPath("editor-preview.png") });
    } else {
      const dataUrl = await page.evaluate(async () => {
        const imagePath = "/node_modules/.vite/deps/html-to-image.js";
        const fontsPath = "/src/lib/presentation-fonts.ts";
        const { toPng } = await import(imagePath);
        const { waitForPresentationFonts, getPresentationExportOptions } = await import(fontsPath);
        await waitForPresentationFonts();
        return toPng(document.querySelector("#typography-fixture .presentation-surface"),
          getPresentationExportOptions("#232323"));
      });
      const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
      expect(bytes.readUInt32BE(16)).toBe(1920);
      expect(bytes.readUInt32BE(20)).toBe(1080);
      await writeFile(testInfo.outputPath("board-export.png"), bytes);
    }
  }
});
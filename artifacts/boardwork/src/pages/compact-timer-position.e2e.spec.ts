import { expect, test, type Locator } from "@playwright/test";
import { installThinkingPromptSpacingFixture } from "../test/fixtures/thinking-prompt-spacing-fixture";

async function positions(surface: Locator) {
  return surface.evaluate((element) => {
    const top = (selector: string) =>
      element.querySelector(selector)!.getBoundingClientRect().top -
      element.getBoundingClientRect().top;
    return {
      task: top(".presentation-task"),
      image: top(".presentation-visual img"),
      rail: top(".presentation-rail"),
    };
  });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test(`minimizing the clock keeps visuals stationary at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const fixture = await installThinkingPromptSpacingFixture(page);
    await page.goto(`/present/${fixture.activity.id}`);
    const surface = page.getByTestId("presentation-surface");
    await expect(surface).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const card = surface.locator(".presentation-timer");
    await card.hover();
    const before = await positions(surface);
    await card.getByRole("button", { name: "Minimize timer" }).click();
    const toggle = surface.getByRole("button", { name: "Show timer controls" });
    await expect(toggle).toBeVisible();
    await expect(surface.locator(".presentation-header .presentation-time--compact"))
      .toHaveCount(0);
    await expect(surface.locator(".presentation-rail .presentation-time--compact"))
      .toHaveCount(1);
    const after = await positions(surface);
    for (const key of ["task", "image", "rail"] as const) {
      if (viewport.width >= 760 || key === "task") {
        expect(after[key]).toBeCloseTo(before[key], 0);
      } else {
        // Narrow layouts change from a side-by-side image/clock to stacked
        // content; the larger image may move up, but never gets pushed down.
        expect(after[key]).toBeLessThanOrEqual(before[key] + 1);
      }
    }
    await toggle.click();
    const panel = page.getByTestId("present-timer-controls-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("button", { name: "Start or resume timer" }))
      .toBeVisible();
    await panel.getByRole("button", { name: "Start or resume timer" }).focus();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
    await surface.screenshot({ path: testInfo.outputPath("compact-timer.png") });
    await toggle.click();
    await panel.getByRole("button", { name: "Expand timer" }).click();
    await expect(card).toBeVisible();
    const expanded = await positions(surface);
    if (viewport.width >= 760) {
      expect(expanded.image).toBeCloseTo(before.image, 0);
    } else {
      expect(expanded.image).toBeLessThanOrEqual(before.image + 1);
    }
  });
}
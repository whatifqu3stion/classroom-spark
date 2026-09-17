import { expect, test } from "@playwright/test";
import type { ActivityDraft } from "@/store/boardwork-context";

const svgFile = (name: string, width: number, height: number) => ({
  name, mimeType: "image/svg+xml",
  buffer: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#b3c7b3"/><circle cx="${width / 2}" cy="${height / 2}" r="20" fill="#34495e"/></svg>`),
});

for (const width of [1280, 390, 287]) {
  for (const dark of [false, true]) {
    test(`shared image workspace stays fixed at ${width}px ${dark ? "dark" : "light"}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      let saved: ActivityDraft = {
        id: "image-board", classId: "image-class", title: "", task: "Compare the two diagrams.",
        durationMinutes: 5, deviceMode: "off", prompts: [], visuals: [],
      };
      let writes = 0;
      await page.route("**/api/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (route.request().method() === "PATCH" && path.endsWith("/activities/image-board")) {
          saved = { ...saved, ...route.request().postDataJSON() };
          writes++;
          return route.fulfill({ json: saved });
        }
        if (!["GET", "HEAD"].includes(route.request().method())) return route.abort();
        return route.fulfill({ json: path.endsWith("/app-state") ? {
          activeClassId: "image-class",
          classes: [{ id: "image-class", name: "Science", subject: "Science", defaultDuration: 5, defaultDeviceMode: "off", arrivalRoutine: null }],
          activities: [saved], units: [], instructionalContexts: [], chips: [],
        } : path.endsWith("/auth/status") ? { authenticated: true, authEnabled: false } : { items: [], categories: [] } });
      });
      await page.goto("/activity/image-board");
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      const toggle = page.getByTestId("button-toggle-presentation-visual");
      await toggle.click();
      const area = page.getByTestId("image-workspace");
      const first = page.getByTestId("image-selector-1");
      const second = page.getByTestId("image-selector-2");
      await area.scrollIntoViewIfNeeded();
      const size = () => area.evaluate((el) => el.getBoundingClientRect().height);
      const emptyHeight = await size();
      await expect(second).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByLabel("Visual description 1", { exact: true })).toBeDisabled();
      await page.getByLabel("Add image 1", { exact: true }).setInputFiles(svgFile("wide.svg", 400, 100));
      await expect(first).toHaveAccessibleName("Image 1, Added");
      await page.getByLabel("Visual description 1", { exact: true }).fill("Wide diagram");
      expect(await size()).toBeCloseTo(emptyHeight, 0);
      await expect(second).toHaveAttribute("aria-disabled", "false");
      await second.focus();
      await page.keyboard.press("Space");
      await expect(second).toHaveAttribute("aria-pressed", "true");
      expect(await size()).toBeCloseTo(emptyHeight, 0);
      await page.getByLabel("Add image 2", { exact: true }).setInputFiles(svgFile("tall.svg", 100, 400));
      await expect(second).toHaveAccessibleName("Image 2, Added");
      await page.getByLabel("Visual description 2", { exact: true }).fill("Tall diagram");
      expect(await size()).toBeCloseTo(emptyHeight, 0);
      await expect(area.locator('input[type="file"]')).toHaveCount(1);
      await expect(area.getByRole("textbox")).toHaveCount(1);
      await expect(area.getByRole("img")).toHaveCount(1);
      await expect(area.getByRole("img")).toHaveCSS("object-fit", "contain");
      await expect.poll(() => saved.visuals?.[1]?.description).toBe("Tall diagram");
      expect(saved.visualUrl).toBe(saved.visuals![0].url);
      expect(saved.visualDescription).toBe("Wide diagram");
      const writesBeforeSwitching = writes;
      await first.click();
      await expect(page.getByLabel("Visual description 1", { exact: true })).toHaveValue("Wide diagram");
      await toggle.click();
      await toggle.click();
      await expect(first).toHaveAttribute("aria-pressed", "true");
      await second.click();
      await expect(page.getByLabel("Visual description 2", { exact: true })).toHaveValue("Tall diagram");
      await page.waitForTimeout(900);
      expect(writes).toBe(writesBeforeSwitching);
      expect(await size()).toBeCloseTo(emptyHeight, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await area.screenshot({ path: testInfo.outputPath("shared-images.png") });

      await page.reload();
      await toggle.click();
      await expect(first).toHaveAccessibleName("Image 1, Added");
      await expect(second).toHaveAccessibleName("Image 2, Added");
      await expect(page.getByLabel("Visual description 1", { exact: true })).toHaveValue("Wide diagram");
      await page.getByRole("button", { name: "Remove image 1", exact: true }).click();
      await expect(first).toBeFocused();
      await expect(page.getByLabel("Visual description 1", { exact: true })).toHaveValue("Tall diagram");
      await expect(second).toHaveAccessibleName("Image 2, Empty");
      await page.getByRole("button", { name: "Remove image 1", exact: true }).click();
      await expect(first).toBeFocused();
      await expect(second).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByLabel("Add image 1", { exact: true })).toBeEnabled();
      expect(await size()).toBeCloseTo(emptyHeight, 0);
    });
  }
}